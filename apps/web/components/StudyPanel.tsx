"use client";

import React, { useState, useEffect } from "react";
import {
  Trash2,
} from "lucide-react";

interface StudyPanelProps {
  topic: string;
  goal: string;
  focusDuration: number;
  breakDuration: number;
  sessions: number;
  currentSession: number;
  phase: "idle" | "focus" | "break" | "completed";
  timeLeft: number;
  isRunning: boolean;
  notes: string;
  onUpdateConfig: (config: {
    topic?: string;
    goal?: string;
    sessions?: number;
    focusDuration?: number;
    breakDuration?: number;
    timeLeft?: number;
  }) => void;
  onTimerAction: (action: "start" | "pause" | "reset" | "skip" | "end") => void;
  onNotesChange: (notes: string) => void;
}

export function StudyPanel({
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
  onUpdateConfig,
  onTimerAction,
  onNotesChange,
}: StudyPanelProps) {
  const [editMode, setEditMode] = useState(false);
  const [editTopic, setEditTopic] = useState(topic || "");
  const [editGoal, setEditGoal] = useState(goal || "");
  const [editSessions, setEditSessions] = useState(sessions || 4);
  const [syncStatus, setSyncStatus] = useState("Synced");

  useEffect(() => {
    setEditTopic(topic || "");
    setEditGoal(goal || "");
    setEditSessions(sessions || 4);
  }, [topic, goal, sessions]);

  const handleSaveConfig = () => {
    onUpdateConfig({
      topic: editTopic.trim() || "Focus Study Session",
      goal: editGoal.trim() || "Achieve daily goals",
      sessions: Number(editSessions) || 4,
    });
    setEditMode(false);
  };

  const handleNotesInput = (val: string) => {
    setSyncStatus("Syncing...");
    onNotesChange(val);
    setTimeout(() => setSyncStatus("Synced"), 500);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const isBreak = phase === "break";
  const isPaused = !isRunning && (phase === "focus" || phase === "break");
  const isReady = !isRunning && (phase === "idle" || phase === "completed");

  const displaySeconds =
    phase === "idle"
      ? (focusDuration || 25) * 60
      : phase === "completed"
      ? 0
      : typeof timeLeft === "number"
      ? timeLeft
      : (focusDuration || 25) * 60;

  const currentSessionNumber = Math.min(currentSession || 1, sessions || 4);
  const completedSessionsCount = Math.max(
    0,
    currentSession - (phase === "completed" ? 0 : 1)
  );

  return (
    <div className="productivityGrid">
      {/* ---- Card 1: Session Info / Progress ---- */}
      <div className="productivityCard">
        <div className="productivityCardHeader">
          <h3 className="productivityCardTitle">Session Progress</h3>
          {!editMode ? (
            <button
              type="button"
              onClick={() => setEditMode(true)}
              className="btn-outline"
              style={{ padding: "4px 12px", fontSize: "0.78rem" }}
            >
              ✏️ Edit Goal
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSaveConfig}
              className="btn-lime"
              style={{ padding: "4px 12px", fontSize: "0.78rem" }}
            >
              Save
            </button>
          )}
        </div>

        {!editMode ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", textAlign: "left" }}>
            <div className="infoCardRow">
              <span className="infoCardRowLabel">SHARED TOPIC</span>
              <span className="infoCardRowValue">{topic || "Focus Study Session"}</span>
            </div>

            <div className="infoCardRow">
              <span className="infoCardRowLabel">SHARED GOAL</span>
              <span className="infoCardRowValue">{goal || "Achieve daily goals"}</span>
            </div>

            <div className="infoCardRow">
              <span className="infoCardRowLabel">POMODORO PROGRESS</span>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "4px" }}>
                <span className="infoCardRowValue">
                  {completedSessionsCount} / {sessions} Sessions Completed
                </span>
                <span style={{ fontSize: "0.82rem", color: "#10B981", fontWeight: "700" }}>
                  Session {currentSessionNumber}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", textAlign: "left" }}>
            <div>
              <label className="infoCardRowLabel" style={{ display: "block", marginBottom: "4px" }}>
                SHARED TOPIC
              </label>
              <input
                type="text"
                className="ramain-capsule-input"
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  background: "#1E293B",
                  border: "1.5px solid rgba(255,255,255,0.15)",
                  borderRadius: "10px",
                  color: "#FFFFFF",
                }}
                value={editTopic}
                onChange={(e) => setEditTopic(e.target.value)}
                placeholder="e.g. Focus Study Session"
              />
            </div>
            <div>
              <label className="infoCardRowLabel" style={{ display: "block", marginBottom: "4px" }}>
                SHARED GOAL
              </label>
              <input
                type="text"
                className="ramain-capsule-input"
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  background: "#1E293B",
                  border: "1.5px solid rgba(255,255,255,0.15)",
                  borderRadius: "10px",
                  color: "#FFFFFF",
                }}
                value={editGoal}
                onChange={(e) => setEditGoal(e.target.value)}
                placeholder="e.g. Achieve daily goals"
              />
            </div>
            <div className="peerspace-glider-box" style={{ padding: "12px 14px", borderRadius: "14px", background: "#1E293B", borderColor: "rgba(255,255,255,0.15)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                <label className="infoCardRowLabel" style={{ display: "flex", alignItems: "center", gap: "6px", margin: 0, color: "#E2E8F0" }}>
                  <span className="vector-pulse-dot" style={{ width: "6px", height: "6px", backgroundColor: "#3B82F6" }} />
                  Total Sessions (1 — 10)
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  className="vector-glider-input"
                  style={{ width: "56px", padding: "4px 6px", fontSize: "0.88rem", background: "#0F172A", color: "#FFFFFF", borderColor: "rgba(255,255,255,0.2)" }}
                  value={editSessions}
                  onChange={(e) => {
                    let val = parseInt(e.target.value, 10);
                    if (isNaN(val) || val < 1) val = 1;
                    if (val > 10) val = 10;
                    setEditSessions(val);
                  }}
                />
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={editSessions}
                onChange={(e) => setEditSessions(parseInt(e.target.value, 10))}
                className="peerspace-vector-glider"
                style={{
                  margin: "6px 0 4px",
                  background: `linear-gradient(to right, #3B82F6 0%, #3B82F6 ${((editSessions - 1) / 9) * 100}%, rgba(255,255,255,0.15) ${((editSessions - 1) / 9) * 100}%, rgba(255,255,255,0.15) 100%)`,
                }}
              />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.68rem", color: "#94A3B8", fontWeight: 600 }}>
                <span>1</span>
                <span>3</span>
                <span>5</span>
                <span>7</span>
                <span>10</span>
              </div>
            </div>
          </div>
        )}

        <div className="tipCard" style={{ textAlign: "left", marginTop: "auto" }}>
          <span className="vector-pulse-dot" />
          <span>
            <strong>StudySphere Tip:</strong> Take notes in real time with your study partner below.
          </span>
        </div>
      </div>

      {/* ---- Card 2: Shared Pomodoro Ring ---- */}
      <div className="productivityCard">
        <div className="productivityCardHeader">
          <h3 className="productivityCardTitle">Pomodoro Timer</h3>
          <span
            className="cardSyncedIndicator"
            style={{
              background: isBreak ? "rgba(96, 165, 250, 0.15)" : "rgba(197, 255, 74, 0.15)",
              borderColor: isBreak ? "rgba(96, 165, 250, 0.4)" : "rgba(197, 255, 74, 0.4)",
              color: isBreak ? "#93C5FD" : "var(--accent-lime, #C5FF4A)",
            }}
          >
            <span
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: isBreak ? "#93C5FD" : "var(--accent-lime, #C5FF4A)",
              }}
            />
            {isBreak ? "Break Mode" : isRunning ? "Focusing..." : isPaused ? "Paused" : "Ready"}
          </span>
        </div>

        <div className="pomodoroTabs">
          <span className={!isBreak ? "pomodoroTabActive" : "pomodoroTabInactive"}>
            Focus Time ({focusDuration}m)
          </span>
          <span className={isBreak ? "pomodoroTabActive" : "pomodoroTabInactive"}>
            Break Time ({breakDuration}m)
          </span>
        </div>

        <div className={`timerCircleWrap ${isBreak ? "timerCircleWrapBreak" : ""}`}>
          <div className="timerCircleContent">
            <div className="timerMainClock">{formatTime(displaySeconds)}</div>
            <div className="timerSubtext">
              Session {currentSessionNumber} of {sessions}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: "10px", marginTop: "auto" }}>
          {isReady ? (
            <button
              className="btn-lime"
              style={{ flex: 1, padding: "10px", fontWeight: "700" }}
              onClick={() => onTimerAction("start")}
              type="button"
            >
              Start Focus
            </button>
          ) : null}

          {isRunning ? (
            <button
              style={{
                flex: 1,
                padding: "10px",
                fontWeight: "700",
                background: "#F59E0B",
                color: "#111827",
                borderRadius: "10px",
                border: "none",
                cursor: "pointer",
              }}
              onClick={() => onTimerAction("pause")}
              type="button"
            >
              Pause
            </button>
          ) : null}

          {isPaused ? (
            <button
              className="btn-lime"
              style={{ flex: 1, padding: "10px", fontWeight: "700" }}
              onClick={() => onTimerAction("start")}
              type="button"
            >
              Resume
            </button>
          ) : null}

          <button
            style={{
              padding: "10px 16px",
              fontWeight: "700",
              background: "transparent",
              color: "#E5E7EB",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              borderRadius: "10px",
              cursor: "pointer",
            }}
            onClick={() => onTimerAction("reset")}
            type="button"
          >
            Reset
          </button>
          <button
            style={{
              padding: "10px 16px",
              fontWeight: "700",
              background: "transparent",
              color: "#E5E7EB",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              borderRadius: "10px",
              cursor: "pointer",
            }}
            onClick={() => onTimerAction("end")}
            type="button"
          >
            End
          </button>
        </div>
      </div>

      {/* ---- Card 3: Shared Realtime Collaborative Notes ---- */}
      <div className="productivityCard">
        <div className="productivityCardHeader">
          <h3 className="productivityCardTitle">Shared Notes</h3>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {notes && (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm("Clear all shared notes in this study session?")) {
                    handleNotesInput("");
                  }
                }}
                title="Clear shared notes"
                style={{
                  background: "rgba(239, 68, 68, 0.12)",
                  border: "1px solid rgba(239, 68, 68, 0.25)",
                  color: "#EF4444",
                  fontSize: "0.74rem",
                  fontWeight: "700",
                  padding: "4px 8px",
                  borderRadius: "6px",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <Trash2 size={12} />
                Clear
              </button>
            )}
            <span className="cardSyncedIndicator">
              <span className="vector-pulse-dot" />
              {syncStatus}
            </span>
          </div>
        </div>

        <textarea
          className="notesArea"
          style={{ flex: 1, minHeight: "190px" }}
          value={notes}
          onChange={(e) => handleNotesInput(e.target.value)}
          placeholder="Type notes collaboratively with your friend — synced in real time across both screens..."
        />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.74rem", color: "#9CA3AF", margin: 0 }}>
          <span>✨ Live keystroke sync via Socket.IO</span>
          <span>No save required</span>
        </div>
      </div>
    </div>
  );
}
