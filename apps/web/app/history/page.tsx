"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import type { HistoryEntry } from "@/lib/types";
import {
  BookOpen,
  Target,
  Clock,
  RotateCcw,
  Trash2,
  Download,
  Copy,
  Check,
  FileText,
  Calendar,
  ArrowLeft,
  Sparkles,
} from "lucide-react";

interface LocalSavedNote {
  id?: number;
  topic?: string;
  goal?: string;
  notes?: string;
  date?: string;
  durationMin?: number;
  completedSessions?: number;
  totalSessions?: number;
}

export default function HistoryPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [localNotes, setLocalNotes] = useState<LocalSavedNote[]>([]);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const fetchHistory = async () => {
    if (!isAuthenticated) {
      setIsLoading(false);
      return;
    }

    try {
      const res = await api.get<{ history: HistoryEntry[] }>("/api/history");
      setEntries(res.data.history || []);
    } catch (err) {
      console.error("Failed to load history:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      fetchHistory();
    }
    try {
      const saved = JSON.parse(
        localStorage.getItem("studysphere_saved_notes") ||
        localStorage.getItem("peerspace_saved_notes") ||
        "[]"
      );
      setLocalNotes(saved);
    } catch (e) {
      console.error("Failed to load local saved notes:", e);
    }
  }, [isAuthenticated, authLoading]);

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this study session history?")) return;
    try {
      await api.delete(`/api/history/${id}`);
      fetchHistory();
    } catch (err) {
      console.error("Failed to delete entry:", err);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    const time = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    return `${day}/${month}/${year} at ${time}`;
  };

  const handleDeleteLocalNote = (index: number) => {
    if (window.confirm("Delete this saved note from your device?")) {
      const updated = localNotes.filter((_, i) => i !== index);
      setLocalNotes(updated);
      try {
        localStorage.setItem("studysphere_saved_notes", JSON.stringify(updated));
      } catch (e) {
        console.error("Failed to update saved notes:", e);
      }
    }
  };

  const handleClearAllNotes = () => {
    if (window.confirm("Are you sure you want to delete all auto-saved session notes?")) {
      setLocalNotes([]);
      try {
        localStorage.removeItem("studysphere_saved_notes");
        localStorage.removeItem("peerspace_saved_notes");
      } catch (e) {
        console.error("Failed to clear saved notes:", e);
      }
    }
  };

  const handleCopyNote = (text: string, idx: number) => {
    if (!text) return;
    try {
      if (navigator?.clipboard?.writeText) {
        navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }
    setCopiedId(idx);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleDownloadNote = (item: LocalSavedNote) => {
    const content = `# StudySphere Study Session Notes\n\n**Topic:** ${item.topic || "—"}\n**Goal:** ${item.goal || "—"}\n**Date:** ${item.date || new Date().toLocaleDateString()}\n**Pomodoros Completed:** ${item.completedSessions || 0} / ${item.totalSessions || 4}\n\n---\n\n## Shared Notes\n\n${item.notes || "No notes recorded."}\n`;
    const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${(item.topic || "StudySphere").replace(/[^a-zA-Z0-9]/g, "_")}_Notes.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ minHeight: "100vh", paddingBottom: "80px", background: "#F8F9FA" }}>
      {/* Unified Navbar */}
      <Navbar />

      {/* Header Box */}
      <div className="ramain-hero-container" style={{ padding: "40px 48px", marginBottom: "32px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "20px" }}>
          <div>
            <h1 style={{ fontFamily: "var(--font-display)", fontSize: "2.4rem", fontWeight: "800", letterSpacing: "-0.03em", margin: 0 }}>
              Study <span className="lime-highlight">History</span>
            </h1>
            <p style={{ color: "var(--text-secondary)", marginTop: "8px", fontSize: "1rem" }}>
              A complete log of all peer-to-peer study rooms you have joined and collaborative notes saved.
            </p>
          </div>

          <button
            onClick={() => router.push("/")}
            className="btn-dark"
            style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "10px 20px" }}
          >
            <ArrowLeft size={16} />
            Back to Dashboard
          </button>
        </div>
      </div>

      {/* History List Container */}
      <div style={{ maxWidth: "1160px", margin: "0 auto", padding: "0 20px" }}>
        {isLoading ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "var(--text-muted)", fontSize: "1.1rem", fontWeight: "500" }}>
            Loading your past study sessions...
          </div>
        ) : entries.length === 0 ? (
          <div style={{
            background: "#FFFFFF",
            border: "1px dashed var(--border-medium)",
            borderRadius: "20px",
            padding: "60px 40px",
            textAlign: "center"
          }}>
            <div style={{ marginBottom: "16px", display: "flex", justifyContent: "center" }}>
              <Clock size={48} color="var(--text-muted)" />
            </div>
            <h3 style={{ fontSize: "1.4rem", fontWeight: "700", marginBottom: "8px" }}>No study session activity yet</h3>
            <p style={{ color: "var(--text-secondary)", marginBottom: "24px", maxWidth: "440px", margin: "0 auto 24px" }}>
              When you join a study room from the dashboard and complete sessions, your room records and goals will show up here.
            </p>
            <button onClick={() => router.push("/")} className="btn-lime">
              Join First Study Hall
            </button>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "20px" }}>
            {entries.map((e, i) => (
              <div
                key={e.id || i}
                className="ramain-feature-card"
                style={{ padding: "24px 28px", background: "#FFFFFF", borderRadius: "18px", position: "relative" }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                  <div style={{
                    background: "#F3F4F6",
                    color: "#111827",
                    fontWeight: "700",
                    fontSize: "0.85rem",
                    padding: "4px 10px",
                    borderRadius: "8px",
                    border: "1px solid var(--border-light)",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px"
                  }}>
                    <BookOpen size={13} />
                    Session #{i + 1}
                  </div>
                  <span style={{ fontSize: "0.82rem", color: "var(--text-muted)", fontWeight: "500", display: "flex", alignItems: "center", gap: "4px" }}>
                    <Calendar size={12} />
                    {formatDate(e.createdAt)}
                  </span>
                </div>

                <h3 style={{ fontSize: "1.35rem", fontWeight: "800", color: "#111827", marginBottom: "8px", wordBreak: "break-all", textAlign: "left" }}>
                  /{e.topic || "study"}
                </h3>

                {e.goal && (
                  <p style={{ fontSize: "0.90rem", color: "var(--text-secondary)", textAlign: "left", marginBottom: "10px", display: "flex", alignItems: "center", gap: "6px" }}>
                    <Target size={14} color="#3B82F6" />
                    Goal: {e.goal}
                  </p>
                )}

                {e.duration && (
                  <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", textAlign: "left", marginBottom: "14px", display: "flex", alignItems: "center", gap: "6px" }}>
                    <Clock size={14} color="#10B981" />
                    Duration: {e.duration} mins
                  </p>
                )}

                <div style={{ display: "flex", gap: "10px", marginTop: "auto", paddingTop: "16px", borderTop: "1px solid var(--border-light)" }}>
                  <button
                    onClick={() => router.push(`/room/${encodeURIComponent(e.topic || "study")}`)}
                    className="btn-lime"
                    style={{ flex: 1, padding: "8px 14px", fontSize: "0.88rem", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
                  >
                    <RotateCcw size={14} />
                    Rejoin Room →
                  </button>
                  <button
                    onClick={() => handleDelete(e.id)}
                    style={{
                      background: "#FEE2E2",
                      border: "1px solid #FECACA",
                      color: "#EF4444",
                      padding: "8px 12px",
                      borderRadius: "10px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "all 0.2s ease",
                    }}
                    title="Delete session history"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Saved Collaborative Session Notes Section */}
        <div style={{ marginTop: "64px", borderTop: "2px dashed var(--border-light)", paddingTop: "48px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "12px" }}>
            <div style={{ textAlign: "left" }}>
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.8rem", fontWeight: "800", color: "#111827", margin: 0, display: "flex", alignItems: "center", gap: "10px" }}>
                <FileText size={24} color="var(--text-primary)" />
                Auto-Saved Session Notes
              </h2>
              <p style={{ color: "var(--text-secondary)", margin: "6px 0 0", fontSize: "0.95rem" }}>
                Notes collaboratively typed during your meetings are stored locally on your device for instant downloading & editing.
              </p>
            </div>

            {localNotes.length > 0 && (
              <button
                type="button"
                onClick={handleClearAllNotes}
                style={{
                  background: "#FEE2E2",
                  color: "#EF4444",
                  border: "1px solid #FECACA",
                  padding: "8px 16px",
                  borderRadius: "10px",
                  fontWeight: "700",
                  fontSize: "0.85rem",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  transition: "all 0.2s ease",
                }}
              >
                <Trash2 size={15} />
                Clear All Notes
              </button>
            )}
          </div>

          {localNotes.length === 0 ? (
            <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "18px", padding: "40px 24px", textAlign: "center", color: "#64748B" }}>
              No locally saved notes yet. When you complete a study session with notes typed, they will appear right here with individual copy, download, and delete controls!
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "20px" }}>
              {localNotes.map((item, idx) => (
                <div key={item.id || idx} style={{ background: "#FFFFFF", border: "1px solid var(--border-light)", borderRadius: "18px", padding: "24px", display: "flex", flexDirection: "column", justifyContent: "space-between", boxShadow: "0 4px 15px rgba(0,0,0,0.02)" }}>
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                      <span style={{ background: "#E8F8B6", color: "#111827", fontWeight: "700", fontSize: "0.78rem", padding: "4px 10px", borderRadius: "8px", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                        <BookOpen size={12} />
                        {item.topic || "StudySphere Session"}
                      </span>
                      <span style={{ fontSize: "0.8rem", color: "#64748B", fontWeight: "500", display: "flex", alignItems: "center", gap: "4px" }}>
                        <Calendar size={12} />
                        {item.date || "Recent"}
                      </span>
                    </div>

                    <h3 style={{ fontSize: "1.1rem", fontWeight: "700", color: "#111827", marginBottom: "8px", textAlign: "left", display: "flex", alignItems: "center", gap: "6px" }}>
                      <Target size={15} color="#3B82F6" />
                      {item.goal || "Shared Study Goal"}
                    </h3>

                    <div style={{
                      background: "#F8FAFC",
                      border: "1px solid #F1F5F9",
                      borderRadius: "10px",
                      padding: "12px",
                      fontSize: "0.88rem",
                      color: item.notes ? "#334155" : "#94A3B8",
                      whiteSpace: "pre-wrap",
                      fontFamily: item.notes ? "monospace" : "inherit",
                      maxHeight: "130px",
                      overflowY: "auto",
                      marginBottom: "16px",
                      textAlign: "left",
                      lineHeight: "1.5"
                    }}>
                      {item.notes || "No text written during this session."}
                    </div>
                  </div>

                  {/* Individual Note Action Bar */}
                  <div style={{ display: "flex", gap: "8px", paddingTop: "14px", borderTop: "1px solid #F1F5F9", alignItems: "center" }}>
                    <button
                      type="button"
                      onClick={() => handleDownloadNote(item)}
                      style={{ flex: 1, background: "var(--accent-lime, #C5FF4A)", color: "#111827", border: "none", padding: "8px 12px", borderRadius: "10px", fontWeight: "700", fontSize: "0.84rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
                    >
                      <Download size={14} />
                      Download
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCopyNote(item.notes || "", idx)}
                      disabled={!item.notes}
                      style={{ background: "#F1F5F9", color: item.notes ? "#334155" : "#94A3B8", border: "none", padding: "8px 12px", borderRadius: "10px", fontWeight: "600", fontSize: "0.84rem", cursor: item.notes ? "pointer" : "not-allowed", display: "flex", alignItems: "center", gap: "5px" }}
                    >
                      {copiedId === idx ? <Check size={14} color="#10B981" /> : <Copy size={14} />}
                      {copiedId === idx ? "Copied" : "Copy"}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteLocalNote(idx)}
                      title="Delete this saved note"
                      style={{
                        background: "#FEE2E2",
                        color: "#EF4444",
                        border: "1px solid #FECACA",
                        padding: "8px 10px",
                        borderRadius: "10px",
                        fontWeight: "600",
                        fontSize: "0.84rem",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transition: "all 0.2s ease",
                      }}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
