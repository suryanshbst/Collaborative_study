"use client";

import React, { useState } from "react";
import {
  Check,
  Download,
  Copy,
  Sparkles,
  Clock,
  Target,
  BookOpen,
  FileText,
} from "lucide-react";

export interface SummaryData {
  topic?: string;
  goal?: string;
  completedSessions?: number;
  totalSessions?: number;
  totalStudyMs?: number;
  notes?: string;
}

interface SessionSummaryModalProps {
  data: SummaryData | null;
  onClose: () => void;
  onExit: () => void;
}

export function SessionSummaryModal({ data, onClose, onExit }: SessionSummaryModalProps) {
  const [copied, setCopied] = useState(false);
  if (!data) return null;

  const formatClock = (ms?: number) => {
    if (!ms || ms <= 0) return "00:00";
    const totalSecs = Math.floor(ms / 1000);
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const downloadNotes = () => {
    const content = `# StudySphere Study Session Notes\n\n**Topic:** ${data.topic || "—"}\n**Goal:** ${data.goal || "—"}\n**Date:** ${new Date().toLocaleDateString()}\n**Pomodoros Completed:** ${data.completedSessions || 0} / ${data.totalSessions || 4}\n\n---\n\n## Shared Notes\n\n${data.notes || "No notes recorded."}\n`;
    const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${(data.topic || "StudySphere").replace(/[^a-zA-Z0-9]/g, "_")}_Study_Notes.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const copyNotes = () => {
    if (!data.notes) return;
    navigator.clipboard?.writeText(data.notes);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="summaryOverlay">
      <div className="summaryCard" style={{ maxWidth: "560px", padding: "36px", background: "#FFFFFF", color: "#111827", borderRadius: "24px" }}>
        <span className="summaryBadge" style={{ background: "var(--accent-lime, #C5FF4A)", color: "#111827", border: "none", fontWeight: "800", display: "inline-flex", alignItems: "center", gap: "6px" }}>
          <Check size={14} />
          Study Session Complete
        </span>
        <h2 className="summaryTitle" style={{ color: "#111827", fontSize: "1.8rem", fontWeight: "800", margin: "12px 0 20px" }}>
          Amazing Work — Study Summary
        </h2>

        <div className="summaryGrid" style={{ gap: "12px", marginBottom: "20px" }}>
          <div className="summaryStat" style={{ background: "#F8FAFC", border: "1px solid #E2E8F0" }}>
            <div className="summaryStatLabel" style={{ color: "#64748B", display: "flex", alignItems: "center", gap: "4px" }}>
              <Clock size={12} />
              Study Time
            </div>
            <div className="summaryStatValue" style={{ color: "#0F172A", fontSize: "1.4rem" }}>
              {formatClock(data.totalStudyMs)}
            </div>
          </div>
          <div className="summaryStat" style={{ background: "#F8FAFC", border: "1px solid #E2E8F0" }}>
            <div className="summaryStatLabel" style={{ color: "#64748B", display: "flex", alignItems: "center", gap: "4px" }}>
              <Target size={12} />
              Completed Pomodoros
            </div>
            <div className="summaryStatValue" style={{ color: "#0F172A", fontSize: "1.2rem" }}>
              {data.completedSessions || 0} / {data.totalSessions || 4} Sessions
            </div>
          </div>
          <div className="summaryStat" style={{ background: "#F8FAFC", border: "1px solid #E2E8F0" }}>
            <div className="summaryStatLabel" style={{ color: "#64748B", display: "flex", alignItems: "center", gap: "4px" }}>
              <BookOpen size={12} />
              Topic
            </div>
            <div className="summaryStatValueSm" style={{ color: "#0F172A", fontWeight: "700" }}>
              {data.topic || "—"}
            </div>
          </div>
          <div className="summaryStat" style={{ background: "#F8FAFC", border: "1px solid #E2E8F0" }}>
            <div className="summaryStatLabel" style={{ color: "#64748B", display: "flex", alignItems: "center", gap: "4px" }}>
              <Target size={12} />
              Goal
            </div>
            <div className="summaryStatValueSm" style={{ color: "#0F172A", fontWeight: "700" }}>
              {data.goal || "—"}
            </div>
          </div>
        </div>

        {/* Collaborative Notes Preview Box */}
        <div
          style={{
            background: "#F8FAFC",
            border: "1px solid #E2E8F0",
            borderRadius: "16px",
            padding: "16px",
            margin: "20px 0",
            textAlign: "left",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
            <span style={{ fontSize: "0.8rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "#64748B", display: "flex", alignItems: "center", gap: "6px" }}>
              <FileText size={14} />
              Collaborative Study Notes Preview
            </span>
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                type="button"
                onClick={copyNotes}
                disabled={!data.notes}
                style={{
                  background: "#FFFFFF",
                  border: "1px solid #CBD5E1",
                  padding: "4px 10px",
                  borderRadius: "8px",
                  fontSize: "0.78rem",
                  fontWeight: "600",
                  color: "#334155",
                  cursor: data.notes ? "pointer" : "not-allowed",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                {copied ? <Check size={13} color="#10B981" /> : <Copy size={13} />}
                {copied ? "Copied!" : "Copy Text"}
              </button>
              <button
                type="button"
                onClick={downloadNotes}
                style={{
                  background: "var(--accent-lime, #C5FF4A)",
                  border: "1px solid #B6F03C",
                  padding: "4px 12px",
                  borderRadius: "8px",
                  fontSize: "0.78rem",
                  fontWeight: "700",
                  color: "#111827",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                }}
              >
                <Download size={13} />
                Download (.md)
              </button>
            </div>
          </div>
          <div
            style={{
              background: "#FFFFFF",
              border: "1px solid #F1F5F9",
              borderRadius: "10px",
              padding: "12px",
              maxHeight: "140px",
              overflowY: "auto",
              fontSize: "0.9rem",
              color: data.notes ? "#1F2937" : "#94A3B8",
              whiteSpace: "pre-wrap",
              fontFamily: data.notes ? "monospace" : "inherit",
              lineHeight: "1.5",
            }}
          >
            {data.notes || "No notes recorded during this session. Anything you or your friend type in the Shared Notes card will appear right here automatically!"}
          </div>
        </div>

        <div
          style={{
            background: "rgba(16, 185, 129, 0.1)",
            border: "1px solid rgba(16, 185, 129, 0.3)",
            borderRadius: "12px",
            padding: "12px 16px",
            margin: "16px 0 24px",
            color: "#059669",
            fontSize: "0.86rem",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontWeight: "600",
            textAlign: "left",
          }}
        >
          <Sparkles size={16} />
          Notes Auto-Saved — Your session notes & summary have been automatically saved to your history!
        </div>

        <div className="summaryActions" style={{ display: "flex", gap: "12px" }}>
          <button
            type="button"
            className="btn-outline"
            style={{ flex: 1, padding: "12px", borderRadius: "12px", fontWeight: "700" }}
            onClick={onClose}
          >
            Keep Studying
          </button>
          <button
            type="button"
            className="btn-lime"
            style={{ flex: 1, padding: "12px", borderRadius: "12px", fontWeight: "700" }}
            onClick={onExit}
          >
            Leave Room
          </button>
        </div>
      </div>
    </div>
  );
}
