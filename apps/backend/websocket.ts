import type { WebSocket } from "ws";
import type {
  MessageType,
  RoomState,
  Participant,
  SignalingPayload,
} from "@repo/zod/zod";
import {
  studyUpdateSchema,
  studyTimerSchema,
  studyNotesSchema,
  chatMessageSchema,
  participantToggleSchema,
} from "@repo/zod/zod";

interface Client {
  socket: WebSocket;
  userId: string;
  username: string;
  roomId: string | null;
}

interface InternalRoomState extends RoomState {
  timerStartedAt?: number | null;
  timerInitialTimeLeft?: number;
}

// In-memory room and client state
const rooms = new Map<string, InternalRoomState>();
const clients = new Map<WebSocket, Client>();

function createDefaultRoomState(roomId = ""): InternalRoomState {
  return {
    topic: roomId,
    goal: "",
    focusDuration: 25,
    breakDuration: 5,
    sessions: 4,
    currentSession: 1,
    phase: "idle",
    timeLeft: 25 * 60,
    isRunning: false,
    notes: "",
    participants: [],
    hostId: "",
    timerStartedAt: null,
    timerInitialTimeLeft: 25 * 60,
  };
}

// Computes exact remaining time based on server timestamp for any joining or syncing peer
function getEffectiveRoomState(state: InternalRoomState): RoomState {
  const copy: RoomState = {
    topic: state.topic,
    goal: state.goal,
    focusDuration: state.focusDuration,
    breakDuration: state.breakDuration,
    sessions: state.sessions,
    currentSession: state.currentSession,
    phase: state.phase,
    timeLeft: state.timeLeft,
    isRunning: state.isRunning,
    notes: state.notes,
    participants: state.participants,
    hostId: state.hostId,
  };

  if (state.isRunning && state.timerStartedAt && state.timerInitialTimeLeft !== undefined) {
    const elapsedSeconds = Math.floor((Date.now() - state.timerStartedAt) / 1000);
    const computedTimeLeft = Math.max(0, state.timerInitialTimeLeft - elapsedSeconds);
    copy.timeLeft = computedTimeLeft;
  }

  return copy;
}

// Send message to all participants in a room (optionally exclude sender)
function broadcast(roomId: string, message: object, excludeSocket?: WebSocket) {
  const messageString = JSON.stringify(message);

  for (const client of clients.values()) {
    if (client.roomId === roomId && client.socket !== excludeSocket) {
      if (client.socket.readyState === 1) {
        client.socket.send(messageString);
      }
    }
  }
}

// Send message to a single socket
function sendTo(socket: WebSocket, message: object) {
  if (socket.readyState === 1) {
    socket.send(JSON.stringify(message));
  }
}

// Helper to find target peer in a room
function findClientInRoom(roomId: string, userId: string): Client | undefined {
  for (const client of clients.values()) {
    if (client.roomId === roomId && client.userId === userId) {
      return client;
    }
  }
  return undefined;
}

// Entry point for new WebSocket client connection
export function handleConnection(
  socket: WebSocket,
  userId: string,
  username = "Student",
) {
  clients.set(socket, { socket, userId, username, roomId: null });

  socket.on("message", (rawData) => {
    try {
      const data = JSON.parse(rawData.toString()) as {
        type: MessageType;
        payload: unknown;
      };
      handleMessage(socket, data);
    } catch {
      sendTo(socket, { type: "error", payload: "Invalid message format" });
    }
  });

  socket.on("close", () => {
    handleDisconnect(socket);
  });

  socket.on("error", (err) => {
    console.error("[WebSocket] Socket error:", err);
    handleDisconnect(socket);
  });
}

function handleMessage(
  socket: WebSocket,
  data: { type: MessageType; payload: unknown },
) {
  const client = clients.get(socket);
  if (!client) return;

  switch (data.type) {
    case "join-room": {
      const { roomId, username, userId } = (data.payload || {}) as {
        roomId: string;
        username?: string;
        userId?: string;
      };
      if (!roomId) {
        sendTo(socket, { type: "error", payload: "Room ID is required" });
        return;
      }

      if (username) {
        client.username = username;
      }
      if (userId) {
        client.userId = userId;
      }

      client.roomId = roomId;

      let isFirst = false;
      if (!rooms.has(roomId)) {
        isFirst = true;
        const state = createDefaultRoomState(roomId);
        state.hostId = client.userId;
        rooms.set(roomId, state);
      }

      const roomState = rooms.get(roomId)!;

      const existingIdx = roomState.participants.findIndex(
        (p) => p.userId === client.userId,
      );
      const participant: Participant = {
        userId: client.userId,
        username: client.username || "Student",
        isHost: isFirst || roomState.hostId === client.userId,
        isCameraOn: true,
        isMicOn: true,
        isScreenSharing: false,
        joinedAt: new Date().toISOString(),
      };

      if (existingIdx >= 0) {
        roomState.participants[existingIdx] = participant;
      } else {
        roomState.participants.push(participant);
      }

      // Sync room state to the newly joined client with exact elapsed time
      sendTo(socket, { type: "study-sync", payload: getEffectiveRoomState(roomState) });

      // Notify existing room participants
      broadcast(
        roomId,
        {
          type: "user-joined",
          payload: {
            userId: client.userId,
            username: client.username,
            participant,
            participants: roomState.participants,
            participantCount: roomState.participants.length,
          },
        },
        socket,
      );
      break;
    }

    case "leave-room": {
      handleDisconnect(socket);
      break;
    }

    case "offer":
    case "answer":
    case "ice-candidate": {
      const { roomId, targetId, sdp, candidate } =
        (data.payload || {}) as SignalingPayload;
      const target = findClientInRoom(roomId, targetId || "");
      if (target) {
        sendTo(target.socket, {
          type: data.type,
          payload: {
            senderId: client.userId,
            senderUsername: client.username,
            ...(data.type === "ice-candidate" ? { candidate } : { sdp }),
          },
        });
      }
      break;
    }

    case "participant-toggle": {
      const parsed = participantToggleSchema.safeParse(data.payload);
      if (!parsed.success) {
        sendTo(socket, { type: "error", payload: "Invalid toggle data" });
        return;
      }

      const { roomId, isCameraOn, isMicOn, isScreenSharing } = parsed.data;
      const userId = client.userId;
      const state = rooms.get(roomId);
      if (!state) return;

      const p = state.participants.find((item) => item.userId === userId);
      if (p) {
        if (isCameraOn !== undefined) p.isCameraOn = isCameraOn;
        if (isMicOn !== undefined) p.isMicOn = isMicOn;
        if (isScreenSharing !== undefined) p.isScreenSharing = isScreenSharing;

        broadcast(
          roomId,
          {
            type: "participant-toggle",
            payload: {
              userId,
              isCameraOn: p.isCameraOn,
              isMicOn: p.isMicOn,
              isScreenSharing: p.isScreenSharing,
              participants: state.participants,
            },
          },
          socket,
        );
      }
      break;
    }

    case "study-update": {
      const parsed = studyUpdateSchema.safeParse(data.payload);
      if (!parsed.success) {
        sendTo(socket, { type: "error", payload: "Invalid study update data" });
        return;
      }

      const { roomId, ...updateData } = parsed.data;
      const state = rooms.get(roomId);
      if (!state) return;

      Object.assign(state, updateData);
      if (updateData.focusDuration !== undefined && (state.phase === "idle" || !state.isRunning)) {
        state.timeLeft = updateData.timeLeft ?? updateData.focusDuration * 60;
        state.timerStartedAt = null;
        state.timerInitialTimeLeft = state.timeLeft;
      }

      broadcast(roomId, { type: "study-update", payload: getEffectiveRoomState(state) });
      break;
    }

    case "study-timer": {
      const parsed = studyTimerSchema.safeParse(data.payload);
      if (!parsed.success) {
        sendTo(socket, { type: "error", payload: "Invalid timer data" });
        return;
      }

      const { roomId, ...timerData } = parsed.data;
      const state = rooms.get(roomId);
      if (!state) return;

      Object.assign(state, timerData);

      if (timerData.isRunning) {
        state.timerStartedAt = Date.now();
        state.timerInitialTimeLeft = timerData.timeLeft;
      } else {
        state.timerStartedAt = null;
        state.timerInitialTimeLeft = timerData.timeLeft;
      }

      broadcast(roomId, { type: "study-timer", payload: timerData }, socket);
      break;
    }

    case "study-notes": {
      const parsed = studyNotesSchema.safeParse(data.payload);
      if (!parsed.success) {
        sendTo(socket, { type: "error", payload: "Invalid notes data" });
        return;
      }

      const { roomId, notes } = parsed.data;
      const state = rooms.get(roomId);
      if (!state) return;

      state.notes = notes;
      broadcast(roomId, { type: "study-notes", payload: { notes } }, socket);
      break;
    }

    case "chat-message": {
      const parsed = chatMessageSchema.safeParse(data.payload);
      if (!parsed.success) {
        sendTo(socket, { type: "error", payload: "Invalid chat data" });
        return;
      }

      const { roomId, message, sender } = parsed.data;
      broadcast(
        roomId,
        {
          type: "chat-message",
          payload: {
            message,
            sender: sender || client.username,
            timestamp: new Date().toISOString(),
          },
        },
        socket,
      );
      break;
    }

    case "call-ended": {
      const { roomId } = (data.payload || {}) as { roomId: string };
      broadcast(roomId, {
        type: "call-ended",
        payload: { userId: client.userId, username: client.username },
      });
      handleDisconnect(socket);
      break;
    }

    case "room-state-request": {
      const { roomId } = (data.payload || {}) as { roomId: string };
      const state = rooms.get(roomId);
      if (state) {
        sendTo(socket, { type: "study-sync", payload: getEffectiveRoomState(state) });
      }
      break;
    }

    default:
      sendTo(socket, {
        type: "error",
        payload: `Unknown message type: ${data.type}`,
      });
  }
}

function handleDisconnect(socket: WebSocket) {
  const client = clients.get(socket);
  if (!client || !client.roomId) {
    clients.delete(socket);
    return;
  }

  const roomId = client.roomId;
  const state = rooms.get(roomId);

  if (state) {
    state.participants = state.participants.filter(
      (p) => p.userId !== client.userId,
    );

    if (state.participants.length === 0) {
      rooms.delete(roomId);
    } else {
      if (state.hostId === client.userId) {
        state.hostId = state.participants[0]!.userId;
        state.participants[0]!.isHost = true;
      }

      broadcast(roomId, {
        type: "user-left",
        payload: {
          userId: client.userId,
          username: client.username,
          participants: state.participants,
          participantCount: state.participants.length,
          hostId: state.hostId,
        },
      });
    }
  }

  client.roomId = null;
  clients.delete(socket);
}
