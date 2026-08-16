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

// In-memory room and client state
const rooms = new Map<string, RoomState>();
const clients = new Map<WebSocket, Client>();

function createDefaultRoomState(): RoomState {
  return {
    topic: "",
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
  };
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
      const { roomId, username } = (data.payload || {}) as {
        roomId: string;
        username?: string;
      };
      if (!roomId) {
        sendTo(socket, { type: "error", payload: "Room ID is required" });
        return;
      }

      if (username) {
        client.username = username;
      }

      client.roomId = roomId;

      let isFirst = false;
      if (!rooms.has(roomId)) {
        isFirst = true;
        const state = createDefaultRoomState();
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

      // Sync room state to the newly joined client
      sendTo(socket, { type: "study-sync", payload: roomState });

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
      if (!parsed.success) return;

      const { roomId, isCameraOn, isMicOn, isScreenSharing } = parsed.data;
      const state = rooms.get(roomId);
      if (!state) return;

      const participant = state.participants.find(
        (p) => p.userId === client.userId,
      );
      if (participant) {
        if (typeof isCameraOn === "boolean") participant.isCameraOn = isCameraOn;
        if (typeof isMicOn === "boolean") participant.isMicOn = isMicOn;
        if (typeof isScreenSharing === "boolean")
          participant.isScreenSharing = isScreenSharing;

        broadcast(roomId, {
          type: "participant-toggle",
          payload: {
            userId: client.userId,
            username: client.username,
            isCameraOn: participant.isCameraOn,
            isMicOn: participant.isMicOn,
            isScreenSharing: participant.isScreenSharing,
            participants: state.participants,
          },
        });
      }
      break;
    }

    case "study-update": {
      const parsed = studyUpdateSchema.safeParse(data.payload);
      if (!parsed.success) {
        sendTo(socket, { type: "error", payload: "Invalid study update data" });
        return;
      }

      const { roomId, ...updates } = parsed.data;
      const state = rooms.get(roomId);
      if (!state) return;

      Object.assign(state, updates);

      if (
        updates.focusDuration &&
        (state.phase === "idle" || !state.isRunning) &&
        updates.timeLeft === undefined
      ) {
        state.timeLeft = updates.focusDuration * 60;
      }

      broadcast(roomId, { type: "study-update", payload: state });
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
      if (!parsed.success) return;

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
        sendTo(socket, { type: "study-sync", payload: state });
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

  clients.delete(socket);
}
