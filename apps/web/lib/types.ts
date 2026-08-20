export type {
  MessageType,
  Participant,
  RoomState,
  SignalingPayload,
  StudyPhase,
  StudyUpdateInput,
  StudyTimerInput,
  StudyNotesInput,
  CallEndedInput,
  HistoryCreateInput,
  ChatMessageInput,
  ParticipantToggleInput,
  RegisterInput,
  LoginInput,
  ApiResponse,
  WebSocketMessage,
} from "@repo/zod/zod";

export interface User {
  id: string;
  username: string;
  createdAt: string;
}

export interface HistoryEntry {
  id: string;
  userId: string;
  topic: string;
  goal: string;
  duration: number;
  notes: string | null;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  sender: string;
  message: string;
  timestamp: string;
  isMe?: boolean;
}

export interface WebRTCState {
  localStream: MediaStream | null;
  remoteStreams: Map<string, MediaStream>;
  screenStream: MediaStream | null;
  isCameraOn: boolean;
  isMicOn: boolean;
  isScreenSharing: boolean;
}
