import { z } from "zod";

export const studyPhaseSchema = z.enum(["idle", "focus", "break", "completed"]);
export type StudyPhase = z.infer<typeof studyPhaseSchema>;

export const studyUpdateSchema = z.object({
  roomId: z.string(),
  topic: z.string().optional(),
  goal: z.string().optional(),
  focusDuration: z.number().min(1).max(90).optional(),
  breakDuration: z.number().min(1).max(30).optional(),
  sessions: z.number().min(1).max(20).optional(),
  timeLeft: z.number().min(0).optional(),
  phase: studyPhaseSchema.optional(),
});

export const studyTimerSchema = z.object({
  roomId: z.string(),
  phase: studyPhaseSchema,
  timeLeft: z.number().min(0),
  currentSession: z.number().min(1),
  isRunning: z.boolean(),
});

export const studyNotesSchema = z.object({
  roomId: z.string(),
  notes: z.string().max(10000),
});

export const callEndedSchema = z.object({
  roomId: z.string(),
  topic: z.string(),
  goal: z.string(),
  duration: z.number().min(0),
  notes: z.string().optional(),
});

export const historyCreateSchema = z.object({
  topic: z.string().optional().default("Study Session"),
  goal: z.string().optional().default("Focus Goal"),
  duration: z.number().min(0).default(5),
  notes: z.string().nullable().optional(),
});

export const chatMessageSchema = z.object({
  roomId: z.string(),
  message: z.string().min(1),
  sender: z.string().optional(),
  timestamp: z.string().optional(),
});

export const participantToggleSchema = z.object({
  roomId: z.string(),
  isCameraOn: z.boolean().optional(),
  isMicOn: z.boolean().optional(),
  isScreenSharing: z.boolean().optional(),
});

export const whiteboardUpdateSchema = z.object({
  roomId: z.string(),
  elements: z.string(),
  senderId: z.string().optional(),
});

export type StudyUpdateInput = z.infer<typeof studyUpdateSchema>;
export type StudyTimerInput = z.infer<typeof studyTimerSchema>;
export type StudyNotesInput = z.infer<typeof studyNotesSchema>;
export type CallEndedInput = z.infer<typeof callEndedSchema>;
export type HistoryCreateInput = z.infer<typeof historyCreateSchema>;
export type ChatMessageInput = z.infer<typeof chatMessageSchema>;
export type ParticipantToggleInput = z.infer<typeof participantToggleSchema>;
export type WhiteboardUpdateInput = z.infer<typeof whiteboardUpdateSchema>;
