import type { StudyPhase } from "./study";

export type MessageType =
  | "join-room"
  | "leave-room"
  | "offer"
  | "answer"
  | "ice-candidate"
  | "study-update"
  | "study-timer"
  | "study-sync"
  | "study-notes"
  | "whiteboard-update"
  | "whiteboard-clear"
  | "call-ended"
  | "room-state-request"
  | "chat-message"
  | "participant-toggle"
  | "participants-update"
  | "user-joined"
  | "user-left"
  | "error";

export interface Participant {
  userId: string;
  username: string;
  isHost: boolean;
  isCameraOn: boolean;
  isMicOn: boolean;
  isScreenSharing: boolean;
  joinedAt: string;
}

export interface RoomState {
  topic: string;
  goal: string;
  focusDuration: number;
  breakDuration: number;
  sessions: number;
  currentSession: number;
  phase: StudyPhase;
  timeLeft: number;
  isRunning: boolean;
  notes: string;
  whiteboard?: string;
  participants: Participant[];
  hostId: string;
}

export interface RTCSessionDescriptionInit {
  type: "answer" | "offer" | "pranswer" | "rollback";
  sdp?: string;
}

export interface RTCIceCandidateInit {
  candidate?: string;
  sdpMLineIndex?: number | null;
  sdpMid?: string | null;
  usernameFragment?: string | null;
}

export interface SignalingPayload {
  roomId: string;
  targetId?: string;
  senderId?: string;
  senderUsername?: string;
  sdp?: RTCSessionDescriptionInit;
  candidate?: RTCIceCandidateInit;
}

export interface WebSocketMessage<T = unknown> {
  type: MessageType;
  payload: T;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
