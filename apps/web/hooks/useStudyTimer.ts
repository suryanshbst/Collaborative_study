"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import confetti from "canvas-confetti";
import type { StudyPhase, RoomState, MessageType } from "@/lib/types";

interface UseStudyTimerProps {
  roomId: string;
  isHost: boolean;
  send: (type: MessageType, payload: any) => void;
  on: (type: MessageType, handler: (payload: any) => void) => () => void;
  onSessionComplete?: (stats: {
    topic: string;
    goal: string;
    duration: number;
    notes: string;
  }) => void;
}

// Sound effects using Web Audio API
function playChime(type: "focus" | "break" | "complete") {
  if (typeof window === "undefined") return;
  try {
    const AudioContext =
      window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    if (type === "focus") {
      // Ascending pleasant double-tone
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc2.frequency.setValueAtTime(659.25, ctx.currentTime + 0.12); // E5

      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(ctx.currentTime);
      osc1.stop(ctx.currentTime + 0.15);
      osc2.start(ctx.currentTime + 0.12);
      osc2.stop(ctx.currentTime + 0.5);
    } else if (type === "break") {
      // Calming low triple chime
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.frequency.setValueAtTime(440, ctx.currentTime); // A4
      osc.frequency.setValueAtTime(392, ctx.currentTime + 0.15); // G4

      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.6);
    } else if (type === "complete") {
      // Victory chord
      const freqs = [523.25, 659.25, 783.99, 1046.5]; // C E G C
      freqs.forEach((f, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.setValueAtTime(f, ctx.currentTime + i * 0.08);
        gain.gain.setValueAtTime(0.2, ctx.currentTime + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(
          0.001,
          ctx.currentTime + i * 0.08 + 0.8,
        );
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + i * 0.08);
        osc.stop(ctx.currentTime + i * 0.08 + 0.8);
      });
    }
  } catch (e) {
    // AudioContext blocked or not allowed by browser autoplay policy
  }
}

export function useStudyTimer({
  roomId,
  isHost,
  send,
  on,
  onSessionComplete,
}: UseStudyTimerProps) {
  const [topic, setTopic] = useState("Focus Study Session");
  const [goal, setGoal] = useState("Achieve daily goals");
  const [focusDuration, setFocusDuration] = useState(25); // minutes
  const [breakDuration, setBreakDuration] = useState(5); // minutes
  const [sessions, setSessions] = useState(4);
  const [currentSession, setCurrentSession] = useState(1);
  const [phase, setPhase] = useState<StudyPhase>("idle");
  const [timeLeft, setTimeLeft] = useState(25 * 60); // seconds
  const [isRunning, setIsRunning] = useState(false);
  const [notes, setNotes] = useState("");

  const totalFocusSecondsRef = useRef<number>(0);
  const focusDurationRef = useRef(focusDuration);
  focusDurationRef.current = focusDuration;

  // Sync state from server broadcasts
  useEffect(() => {
    const unsubSync = on("study-sync", (state: RoomState) => {
      if (state.topic !== undefined) setTopic(state.topic);
      if (state.goal !== undefined) setGoal(state.goal);
      if (state.focusDuration !== undefined) {
        setFocusDuration(state.focusDuration);
        if (state.phase === "idle" || !state.isRunning) {
          setTimeLeft(state.timeLeft !== undefined ? state.timeLeft : state.focusDuration * 60);
        }
      }
      if (state.breakDuration !== undefined)
        setBreakDuration(state.breakDuration);
      if (state.sessions !== undefined) setSessions(state.sessions);
      if (state.currentSession !== undefined)
        setCurrentSession(state.currentSession);
      if (state.phase !== undefined) setPhase(state.phase);
      if (state.timeLeft !== undefined) setTimeLeft(state.timeLeft);
      if (state.isRunning !== undefined) setIsRunning(state.isRunning);
      if (state.notes !== undefined) setNotes(state.notes);
    });

    const unsubUpdate = on("study-update", (state: Partial<RoomState>) => {
      if (state.topic !== undefined) setTopic(state.topic);
      if (state.goal !== undefined) setGoal(state.goal);
      if (state.focusDuration !== undefined) {
        setFocusDuration(state.focusDuration);
        if (state.phase === "idle" || !state.isRunning) {
          setTimeLeft(state.timeLeft !== undefined ? state.timeLeft : state.focusDuration * 60);
        }
      }
      if (state.breakDuration !== undefined)
        setBreakDuration(state.breakDuration);
      if (state.sessions !== undefined) setSessions(state.sessions);
      if (state.phase !== undefined) setPhase(state.phase);
      if (state.timeLeft !== undefined) setTimeLeft(state.timeLeft);
      if (state.notes !== undefined) setNotes(state.notes);
    });

    const unsubTimer = on(
      "study-timer",
      (timerData: {
        phase: StudyPhase;
        timeLeft: number;
        currentSession: number;
        isRunning: boolean;
      }) => {
        if (timerData.phase !== undefined) setPhase(timerData.phase);
        if (timerData.timeLeft !== undefined) setTimeLeft(timerData.timeLeft);
        if (timerData.currentSession !== undefined)
          setCurrentSession(timerData.currentSession);
        if (timerData.isRunning !== undefined) setIsRunning(timerData.isRunning);
      },
    );

    const unsubNotes = on("study-notes", (data: { notes: string }) => {
      setNotes(data.notes);
    });

    return () => {
      unsubSync();
      unsubUpdate();
      unsubTimer();
      unsubNotes();
    };
  }, [on]);

  const handlePhaseTransition = useCallback(() => {
    if (phase === "focus") {
      if (currentSession >= sessions) {
        // All sessions completed!
        setPhase("completed");
        setIsRunning(false);
        playChime("complete");
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 },
        });

        const stats = {
          topic,
          goal,
          duration: Math.max(
            1,
            Math.round(totalFocusSecondsRef.current / 60) || focusDuration * sessions,
          ),
          notes,
        };

        if (onSessionComplete) onSessionComplete(stats);

        send("study-timer", {
          roomId,
          phase: "completed",
          timeLeft: 0,
          currentSession,
          isRunning: false,
        });
      } else {
        // Transition to Break
        const nextTime = breakDuration * 60;
        setPhase("break");
        setTimeLeft(nextTime);
        playChime("break");
        send("study-timer", {
          roomId,
          phase: "break",
          timeLeft: nextTime,
          currentSession,
          isRunning: true,
        });
      }
    } else if (phase === "break") {
      // Break over -> Next Focus Session
      const nextSession = currentSession + 1;
      const nextTime = focusDuration * 60;
      setCurrentSession(nextSession);
      setPhase("focus");
      setTimeLeft(nextTime);
      playChime("focus");
      send("study-timer", {
        roomId,
        phase: "focus",
        timeLeft: nextTime,
        currentSession: nextSession,
        isRunning: true,
      });
    }
  }, [
    breakDuration,
    currentSession,
    focusDuration,
    goal,
    notes,
    onSessionComplete,
    phase,
    roomId,
    send,
    sessions,
    topic,
  ]);

  // Local interval timer ticking
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isRunning) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setTimeout(() => {
              handlePhaseTransition();
            }, 0);
            return 0;
          }
          if (phase === "focus") {
            totalFocusSecondsRef.current += 1;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, phase, handlePhaseTransition]);

  // Host periodic synchronization heartbeat to prevent client drift
  useEffect(() => {
    if (!isHost || !isRunning || phase === "idle" || phase === "completed") return;

    const syncInterval = setInterval(() => {
      send("study-timer", {
        roomId,
        phase,
        timeLeft,
        currentSession,
        isRunning: true,
      });
    }, 10000);

    return () => clearInterval(syncInterval);
  }, [isHost, isRunning, phase, timeLeft, currentSession, roomId, send]);

  // Controls: Start / Resume
  const startTimer = useCallback(() => {
    const isStartingFromIdle = phase === "idle" || phase === "completed";
    const nextPhase = isStartingFromIdle ? "focus" : phase;
    const nextTime = isStartingFromIdle
      ? focusDuration * 60
      : timeLeft > 0
      ? timeLeft
      : focusDuration * 60;

    setPhase(nextPhase);
    setTimeLeft(nextTime);
    setIsRunning(true);
    playChime("focus");

    send("study-timer", {
      roomId,
      phase: nextPhase,
      timeLeft: nextTime,
      currentSession: isStartingFromIdle ? 1 : currentSession,
      isRunning: true,
    });
  }, [currentSession, focusDuration, phase, roomId, send, timeLeft]);

  // Controls: Pause
  const pauseTimer = useCallback(() => {
    setIsRunning(false);
    send("study-timer", {
      roomId,
      phase,
      timeLeft,
      currentSession,
      isRunning: false,
    });
  }, [currentSession, phase, roomId, send, timeLeft]);

  // Controls: Reset
  const resetTimer = useCallback(() => {
    const initialTime = focusDuration * 60;
    setPhase("idle");
    setTimeLeft(initialTime);
    setIsRunning(false);
    setCurrentSession(1);

    send("study-timer", {
      roomId,
      phase: "idle",
      timeLeft: initialTime,
      currentSession: 1,
      isRunning: false,
    });
  }, [focusDuration, roomId, send]);

  // Controls: Skip phase
  const skipPhase = useCallback(() => {
    handlePhaseTransition();
  }, [handlePhaseTransition]);

  // Update study goals / timing config
  const updateStudyConfig = useCallback(
    (updates: {
      topic?: string;
      goal?: string;
      focusDuration?: number;
      breakDuration?: number;
      sessions?: number;
      timeLeft?: number;
    }) => {
      if (updates.topic !== undefined) setTopic(updates.topic);
      if (updates.goal !== undefined) setGoal(updates.goal);
      if (updates.focusDuration !== undefined) {
        setFocusDuration(updates.focusDuration);
        if (phase === "idle" || !isRunning) {
          const newTime = updates.timeLeft !== undefined ? updates.timeLeft : updates.focusDuration * 60;
          setTimeLeft(newTime);
        }
      }
      if (updates.breakDuration !== undefined)
        setBreakDuration(updates.breakDuration);
      if (updates.sessions !== undefined) setSessions(updates.sessions);

      send("study-update", {
        roomId,
        ...updates,
      });
    },
    [isRunning, phase, roomId, send],
  );

  // Sync notes
  const updateNotes = useCallback(
    (newNotes: string) => {
      setNotes(newNotes);
      send("study-notes", { roomId, notes: newNotes });
    },
    [roomId, send],
  );

  return {
    topic,
    goal,
    focusDuration,
    breakDuration,
    sessions,
    currentSession,
    phase,
    timeLeft,
    isRunning,
    notes,
    startTimer,
    pauseTimer,
    resetTimer,
    skipPhase,
    updateStudyConfig,
    updateNotes,
  };
}
