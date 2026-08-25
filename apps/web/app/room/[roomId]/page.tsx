"use client";

import React, { useState, useEffect, use, useRef } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { useAuth } from "@/context/AuthContext";
import { useSocket } from "@/hooks/useSocket";
import { useWebRTC } from "@/hooks/useWebRTC";
import { useStudyTimer } from "@/hooks/useStudyTimer";
import { LobbyVideoPreview } from "@/components/LobbyVideoPreview";
import { RoomVideoTile } from "@/components/RoomVideoTile";
import { StudyPanel } from "@/components/StudyPanel";
import { SessionSummaryModal, type SummaryData } from "@/components/SessionSummaryModal";
import StudySphereLogoIcon from "@/components/StudySphereLogoIcon";
import { api } from "@/lib/api";
import type { Participant, ChatMessage } from "@/lib/types";
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  Monitor,
  Users,
  MessageSquare,
  BookOpen,
  PhoneOff,
  Target,
  Clock,
  Copy,
  Check,
  Crown,
  Send,
  X,
  Sparkles,
} from "lucide-react";

interface RoomPageProps {
  params: Promise<{ roomId: string }>;
}

export default function RoomPage({ params }: RoomPageProps) {
  const resolvedParams = use(params);
  const roomId = decodeURIComponent(resolvedParams.roomId);
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading, setGuestUser } = useAuth();

  const [guestNameInput, setGuestNameInput] = useState("");

  // Lobby vs In-Call View
  const [inLobby, setInLobby] = useState(true);

  // User details & Lobby configs
  const [username, setUsername] = useState(user?.username || "Student");
  const [topic, setTopic] = useState(roomId);
  const [goal, setGoal] = useState("");
  const [focusDuration, setFocusDuration] = useState(25);
  const [sessions, setSessions] = useState(4);
  const [showStudyPanel, setShowStudyPanel] = useState(true);
  const [existingRoomInfo, setExistingRoomInfo] = useState<{
    exists: boolean;
    topic: string;
    goal: string;
    peerCount: number;
  } | null>(null);

  // Drawers & Modals
  const [showChat, setShowChat] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [chatMessage, setChatMessage] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [copyToast, setCopyToast] = useState(false);

  // End Session Summary Modal
  const [showSummary, setShowSummary] = useState(false);
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null);

  // Room state
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isHost, setIsHost] = useState(false);

  const [guestId] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = sessionStorage.getItem("studysphere_guest_id");
      if (saved) return saved;
      const newId = `user-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      sessionStorage.setItem("studysphere_guest_id", newId);
      return newId;
    }
    return `user-${Date.now()}`;
  });

  const currentUserId = user?.id || guestId;

  // Keep username synced with AuthContext
  useEffect(() => {
    if (user?.username) {
      setUsername(user.username);
    }
  }, [user?.username]);

  // 1. WebSocket Hook
  const { isConnected, send, on } = useSocket(currentUserId, username);

  // 2. WebRTC Hook
  const {
    localStream,
    remoteStreams,
    screenStream,
    isCameraOn,
    isMicOn,
    isScreenSharing,
    toggleCamera,
    toggleMic,
    toggleScreenShare,
  } = useWebRTC({
    roomId,
    userId: currentUserId,
    username,
    send,
    on,
  });

  // 3. Study & Pomodoro Hook
  const {
    topic: studyTopic,
    goal: studyGoal,
    focusDuration: studyFocusDuration,
    breakDuration: studyBreakDuration,
    sessions: studySessions,
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
  } = useStudyTimer({
    roomId,
    isHost,
    send,
    on,
    onSessionComplete: (stats) => {
      setSummaryData(stats);
      setShowSummary(true);
    },
  });

  // Check if room already exists
  useEffect(() => {
    if (!roomId || !isConnected) return;

    send("room-state-request", { roomId });

    const unsubSync = on("study-sync", (payload: any) => {
      if (payload && (payload.hostId || (payload.participants && payload.participants.length > 0))) {
        setExistingRoomInfo({
          exists: true,
          topic: payload.topic,
          goal: payload.goal,
          peerCount: payload.participants?.length || 1,
        });
        if (payload.topic) setTopic(payload.topic);
        if (payload.goal) setGoal(payload.goal);
        if (payload.focusDuration) setFocusDuration(payload.focusDuration);
        if (payload.sessions) setSessions(payload.sessions);
      }
      if (payload.participants) {
        setParticipants(payload.participants);
      }
      setIsHost(payload.hostId === currentUserId);
    });

    const unsubUserJoined = on("user-joined", (payload: any) => {
      if (payload.participants) {
        setParticipants(payload.participants);
      }
    });

    const unsubUserLeft = on("user-left", (payload: any) => {
      if (payload.participants) {
        setParticipants(payload.participants);
      }
      if (payload.hostId) {
        setIsHost(payload.hostId === currentUserId);
      }
    });

    const unsubParticipantToggle = on("participant-toggle", (payload: any) => {
      if (payload.participants) {
        setParticipants(payload.participants);
      }
    });

    const unsubChat = on("chat-message", (payload: any) => {
      setChatMessages((prev) => [
        ...prev,
        {
          id: `msg-${Date.now()}-${Math.random()}`,
          sender: payload.sender || "Peer",
          message: payload.message,
          timestamp: payload.timestamp || new Date().toISOString(),
        },
      ]);
    });

    return () => {
      unsubSync();
      unsubUserJoined();
      unsubUserLeft();
      unsubParticipantToggle();
      unsubChat();
    };
  }, [roomId, isConnected, currentUserId, on, send]);

  // Auto-scroll chat
  useEffect(() => {
    if (showChat) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, showChat]);

  // Helper for participant lookup
  const getParticipantForPeer = (peerUserId: string) => {
    return participants.find((p) => p.userId === peerUserId);
  };

  const handleStartSession = () => {
    setInLobby(false);
    send("join-room", {
      roomId,
      username: username.trim() || "Student",
      userId: currentUserId,
    });

    if (!existingRoomInfo) {
      setIsHost(true);
      updateStudyConfig({
        topic: topic.trim() || roomId,
        goal: goal.trim() || "Achieve daily goals",
        focusDuration,
        breakDuration: Math.round(focusDuration / 5) || 5,
        sessions,
        timeLeft: focusDuration * 60,
      });
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;

    const senderName = username.trim() || "Student";
    send("chat-message", {
      roomId,
      message: chatMessage.trim(),
      sender: senderName,
    });

    setChatMessages((prev) => [
      ...prev,
      {
        id: `msg-${Date.now()}-${Math.random()}`,
        sender: senderName,
        message: chatMessage.trim(),
        timestamp: new Date().toISOString(),
        isMe: true,
      },
    ]);
    setChatMessage("");
  };

  const handleCopyLink = async () => {
    if (typeof window === "undefined") return;
    const shareUrl = window.location.href;
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = shareUrl;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setCopyToast(true);
      setTimeout(() => setCopyToast(false), 2500);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = shareUrl;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopyToast(true);
      setTimeout(() => setCopyToast(false), 2500);
    }
  };

  const handleEndCall = () => {
    const elapsedMs = Math.max(60000, (focusDuration * 60 - timeLeft) * 1000);
    const data: SummaryData = {
      topic: topic || roomId,
      goal: goal || "Achieve daily goals",
      completedSessions: currentSession,
      totalSessions: sessions,
      totalStudyMs: elapsedMs,
      notes,
    };
    setSummaryData(data);
    setShowSummary(true);
  };

  const handleFinalExit = () => {
    send("leave-room", { roomId });
    router.push("/");
  };

  const effectivePeerCount = Math.max(participants.length, 1 + remoteStreams.size);

  // Authentication & Guest Entry Screen
  if (authLoading || !isAuthenticated) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#F8F9FA" }}>
        <Navbar />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 20px" }}>
          <div className="ramain-auth-card" style={{ textAlign: "center", maxWidth: "460px", width: "100%" }}>
            <div className="vector-pulse-dot" style={{ margin: "0 auto 16px", width: "14px", height: "14px" }} />
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.4rem", fontWeight: "800", marginBottom: "8px" }}>
              Join Study Room
            </h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.92rem", marginBottom: "24px" }}>
              You were invited to study room <strong style={{ color: "var(--text-primary)" }}>/{roomId}</strong>.
            </p>

            {/* Quick Guest Join */}
            <div style={{ background: "#F3F4F6", padding: "16px", borderRadius: "14px", marginBottom: "20px", textAlign: "left", border: "1px solid var(--border-light)" }}>
              <label style={{ display: "block", fontSize: "0.82rem", fontWeight: "700", color: "var(--text-secondary)", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                Enter Your Display Name
              </label>
              <input
                type="text"
                placeholder="e.g. Alex"
                value={guestNameInput}
                onChange={(e) => setGuestNameInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && guestNameInput.trim()) {
                    setGuestUser(guestNameInput.trim());
                  }
                }}
                className="input-ramain"
                style={{ width: "100%", marginBottom: "12px", background: "#FFFFFF" }}
              />
              <button
                type="button"
                onClick={() => setGuestUser(guestNameInput.trim() || "Peer")}
                className="btn-lime"
                style={{ width: "100%", padding: "12px", fontSize: "0.95rem" }}
              >
                Join as Guest →
              </button>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "12px", margin: "16px 0" }}>
              <div style={{ flex: 1, height: "1px", background: "var(--border-light)" }} />
              <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: "600" }}>OR</span>
              <div style={{ flex: 1, height: "1px", background: "var(--border-light)" }} />
            </div>

            <button
              type="button"
              onClick={() => router.push(`/auth?redirect=/room/${encodeURIComponent(roomId)}`)}
              className="btn-secondary"
              style={{ width: "100%", padding: "12px", fontSize: "0.95rem" }}
            >
              Sign In with Account
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // 1. LOBBY VIEW (Pre-Session Setup)
  // ==========================================
  if (inLobby) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#F8F9FA", position: "relative", overflow: "hidden" }}>
        {/* Background Vector Orbit Ring */}
        <svg
          className="vector-bg-decoration"
          width="700"
          height="700"
          viewBox="0 0 700 700"
          fill="none"
          style={{
            top: "35%",
            left: "50%",
            animation: "vectorRingSpin 80s linear infinite",
          }}
        >
          <circle cx="350" cy="350" r="320" stroke="var(--border-light)" strokeWidth="1.5" strokeDasharray="12 12" />
          <circle cx="350" cy="350" r="220" stroke="var(--border-light)" strokeWidth="1" />
          <circle cx="350" cy="30" r="6" fill="#10B981" />
          <circle cx="670" cy="350" r="4" fill="var(--accent-lime)" />
        </svg>

        <Navbar />

        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 20px", textAlign: "center", position: "relative", zIndex: 2 }}>
          <div style={{ maxWidth: "560px", width: "100%", position: "relative", zIndex: 2 }}>
            <h1 style={{ fontFamily: "var(--font-display)", fontSize: "2.2rem", fontWeight: "800", marginBottom: "8px", letterSpacing: "-0.03em" }}>
              Study Room <span className="lime-highlight">Lobby</span>
            </h1>
            <p style={{ color: "var(--text-secondary)", marginBottom: "24px", fontSize: "0.98rem", maxWidth: "460px", margin: "0 auto 24px", lineHeight: "1.5", textAlign: "center" }}>
              Prepare your audio/video and configure study session parameters before<br />
              joining <code style={{ background: "#E5E7EB", padding: "2px 6px", borderRadius: "6px" }}>/{roomId}</code>.
            </p>

            {/* Stable Video Preview Frame */}
            <LobbyVideoPreview
              stream={localStream}
              isCameraOn={isCameraOn}
              isMicOn={isMicOn}
              username={username}
              onToggleCamera={toggleCamera}
              onToggleMic={toggleMic}
            />

            {/* Display Name capsule */}
            <div className="ramain-input-capsule" style={{ maxWidth: "520px", margin: "0 auto 20px" }}>
              <div className="ramain-capsule-icon">
                <Users size={18} />
              </div>
              <input
                type="text"
                className="ramain-capsule-input"
                placeholder="Enter your display username..."
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>

            {/* Configs (Shown to Room Creator) */}
            {!existingRoomInfo ? (
              <>
                <div className="ramain-input-capsule" style={{ maxWidth: "520px", margin: "0 auto 16px" }}>
                  <div className="ramain-capsule-icon">
                    <BookOpen size={18} />
                  </div>
                  <input
                    type="text"
                    className="ramain-capsule-input"
                    placeholder="Shared Study Topic (e.g. Data Structures & Algorithms)..."
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                  />
                </div>

                <div className="ramain-input-capsule" style={{ maxWidth: "520px", margin: "0 auto 16px" }}>
                  <div className="ramain-capsule-icon">
                    <Target size={18} />
                  </div>
                  <input
                    type="text"
                    className="ramain-capsule-input"
                    placeholder="Shared Study Goal (e.g. Solve 5 Tree & Graph Problems)..."
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                  />
                </div>

                {/* Focus duration glider */}
                <div className="peerspace-glider-box" style={{ maxWidth: "520px", margin: "20px auto 0", textAlign: "left" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                    <label style={{ fontSize: "0.82rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em", color: "#334155", display: "flex", alignItems: "center", gap: "6px" }}>
                      <Clock size={14} color="#10B981" />
                      Focus Duration (5 — 90 min)
                    </label>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <input
                        type="number"
                        min="5"
                        max="90"
                        className="vector-glider-input"
                        value={focusDuration}
                        onChange={(e) => setFocusDuration(Math.max(5, Math.min(90, Number(e.target.value) || 25)))}
                      />
                      <span style={{ fontSize: "0.88rem", fontWeight: 700, color: "#64748B" }}>min</span>
                    </div>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="90"
                    value={focusDuration}
                    onChange={(e) => setFocusDuration(Number(e.target.value))}
                    className="peerspace-vector-glider"
                    style={{
                      background: `linear-gradient(to right, var(--accent-lime, #C5FF4A) 0%, var(--accent-lime, #C5FF4A) ${(focusDuration / 90) * 100}%, #E2E8F0 ${(focusDuration / 90) * 100}%, #E2E8F0 100%)`,
                    }}
                  />
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem", color: "#94A3B8", fontWeight: 600, padding: "0 2px" }}>
                    <span>5 min</span>
                    <span>15</span>
                    <span>25</span>
                    <span>45</span>
                    <span>60</span>
                    <span>75</span>
                    <span>90 min</span>
                  </div>
                </div>

                {/* Session count glider */}
                <div className="peerspace-glider-box" style={{ maxWidth: "520px", margin: "16px auto 0", textAlign: "left" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                    <label style={{ fontSize: "0.82rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em", color: "#334155", display: "flex", alignItems: "center", gap: "6px" }}>
                      <Target size={14} color="#3B82F6" />
                      Sessions (1 — 10)
                    </label>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        className="vector-glider-input"
                        value={sessions}
                        onChange={(e) => setSessions(Math.max(1, Math.min(10, Number(e.target.value) || 1)))}
                      />
                      <span style={{ fontSize: "0.88rem", fontWeight: 700, color: "#64748B" }}>sessions</span>
                    </div>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={sessions}
                    onChange={(e) => setSessions(Number(e.target.value))}
                    className="peerspace-vector-glider"
                    style={{
                      background: `linear-gradient(to right, #3B82F6 0%, #3B82F6 ${((sessions - 1) / 9) * 100}%, #E2E8F0 ${((sessions - 1) / 9) * 100}%, #E2E8F0 100%)`,
                    }}
                  />
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem", color: "#94A3B8", fontWeight: 600, padding: "0 2px" }}>
                    <span>1</span>
                    <span>2</span>
                    <span>3</span>
                    <span>4</span>
                    <span>5</span>
                    <span>6</span>
                    <span>7</span>
                    <span>8</span>
                    <span>9</span>
                    <span>10</span>
                  </div>
                </div>
              </>
            ) : (
              /* Configs (Shown to subsequent Joiners) */
              <div style={{ width: "100%", maxWidth: "520px", margin: "20px auto 10px", background: "#FFFFFF", border: "2px dashed #CBD5E1", borderRadius: "18px", padding: "24px", textAlign: "left", boxShadow: "0 4px 15px rgba(0,0,0,0.03)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                  <span style={{ background: "#C5FF4A", color: "#111827", fontWeight: "800", fontSize: "0.78rem", padding: "5px 12px", borderRadius: "10px" }}>
                    ACTIVE STUDY ROOM
                  </span>
                  <span style={{ color: "#64748B", fontWeight: "600", fontSize: "0.86rem" }}>
                    ({existingRoomInfo.peerCount} {existingRoomInfo.peerCount === 1 ? "participant" : "participants"} inside)
                  </span>
                </div>
                <div style={{ fontWeight: "800", color: "#0F172A", fontSize: "1.2rem", marginBottom: "6px", display: "flex", alignItems: "center", gap: "8px" }}>
                  <BookOpen size={20} color="#3B82F6" />
                  {existingRoomInfo.topic || "Shared Study Session"}
                </div>
                {existingRoomInfo.goal && (
                  <div style={{ color: "#475569", fontSize: "0.94rem", fontWeight: "600", marginBottom: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
                    <Target size={16} color="#10B981" />
                    Goal: {existingRoomInfo.goal}
                  </div>
                )}
                <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: "12px", padding: "12px 14px", fontSize: "0.86rem", color: "#64748B", lineHeight: "1.5" }}>
                  ⚡ Room topic, goal, and Pomodoro timers are active. Click <strong>Join Study Room</strong> below to enter!
                </div>
              </div>
            )}

            <div style={{ marginTop: "28px" }}>
              <button
                type="button"
                onClick={handleStartSession}
                className="btn-lime"
                style={{ fontSize: "1rem", padding: "14px 36px" }}
              >
                {existingRoomInfo ? "Join Study Room →" : "Start Study Room →"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // 2. LIVE CALLING & STUDY WORKSPACE (Exact actualll.png Layout)
  // ==========================================
  return (
    <div className="studyRoomWrapper">
      {/* Top Header Bar (Matching actualll.png with clean text wrapping) */}
      <header className="studyHeader">
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <div className="studyBrand" onClick={() => router.push("/")} style={{ cursor: "pointer" }}>
            <StudySphereLogoIcon size={32} />
            <span>StudySphere</span>
          </div>

          <div
            className="roomCodePill"
            onClick={handleCopyLink}
            title="Click to copy study room link"
            style={{
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              background: "rgba(255,255,255,0.08)",
              padding: "6px 12px",
              borderRadius: "8px",
              fontSize: "0.85rem",
              gap: "6px",
              color: "#E2E8F0",
            }}
          >
            Room: /{roomId}
            {copyToast ? <Check size={14} color="#10B981" /> : <Copy size={13} color="#9CA3AF" />}
          </div>
        </div>

        {/* Center Active Topic / Goal / Session Capsule */}
        <div className="headerStatusCapsule">
          <span className="headerStatusSection">
            📚 <strong>{topic || roomId}</strong>
          </span>
          <span style={{ color: "rgba(255,255,255,0.2)" }}>|</span>
          <span className="headerStatusSection">
            🎯 <strong>{goal || "Achieve daily goals"}</strong>
          </span>
          <span style={{ color: "rgba(255,255,255,0.2)" }}>|</span>
          <span
            className="headerStatusSection"
            style={{
              color: "var(--accent-lime, #C5FF4A)",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <span className="vector-pulse-dot" />
            Session {currentSession} of {sessions}
          </span>
        </div>

        {/* Header Right Actions */}
        <div className="headerActions">
          <button
            type="button"
            className="headerBtn"
            onClick={() => {
              setShowParticipants((p) => !p);
              setShowChat(false);
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              background: showParticipants ? "rgba(197, 255, 74, 0.2)" : undefined,
              borderColor: showParticipants ? "var(--accent-lime)" : undefined,
              color: showParticipants ? "var(--accent-lime)" : "white",
              cursor: "pointer",
            }}
          >
            👥 {effectivePeerCount} {effectivePeerCount === 1 ? "Participant" : "Participants"}
          </button>
          <button
            type="button"
            className="headerBtn"
            onClick={() => {
              setShowChat((c) => !c);
              setShowParticipants(false);
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              background: showChat ? "rgba(197, 255, 74, 0.2)" : undefined,
              borderColor: showChat ? "var(--accent-lime)" : undefined,
              color: showChat ? "var(--accent-lime)" : "white",
              cursor: "pointer",
            }}
          >
            💬 Chat {chatMessages.length > 0 ? `(${chatMessages.length})` : ""}
          </button>
          <button
            type="button"
            className="leaveRoomBtn"
            onClick={handleEndCall}
          >
            Leave Room
          </button>
        </div>
      </header>

      {/* Main Scrollable Body */}
      <div className="studyMainBody">
        {/* Real-time Side Drawer Participants */}
        {showParticipants && (
          <div className="chatRoom">
            <div className="chatContainer">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "12px", borderBottom: "1px solid #E5E7EB" }}>
                <h1 style={{ margin: 0, fontSize: "1.2rem", color: "#111827", fontWeight: "800", display: "flex", alignItems: "center", gap: "8px" }}>
                  <Users size={20} color="#111827" />
                  Participants ({effectivePeerCount})
                </h1>
                <button onClick={() => setShowParticipants(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#6B7280", padding: "4px" }}>
                  <X size={18} />
                </button>
              </div>

              {/* Share link snippet in drawer */}
              <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: "12px", padding: "10px 14px", margin: "12px 0 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ textAlign: "left" }}>
                  <div style={{ fontSize: "0.74rem", fontWeight: "700", color: "#64748B" }}>SHARE STUDY LINK</div>
                  <div style={{ fontSize: "0.85rem", fontWeight: "700", color: "#0F172A" }}>/{roomId}</div>
                </div>
                <button type="button" onClick={handleCopyLink} className="btn-outline" style={{ padding: "4px 10px", fontSize: "0.78rem", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                  <Copy size={12} />
                  Copy Link
                </button>
              </div>

              {/* Participants List */}
              <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "10px" }}>
                {/* Self */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", background: "rgba(197, 255, 74, 0.12)", border: "1px solid #C5FF4A", borderRadius: "14px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{ width: "38px", height: "38px", borderRadius: "50%", background: "#111827", color: "#C5FF4A", fontWeight: "800", fontSize: "0.95rem", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {username.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ textAlign: "left" }}>
                      <div style={{ fontSize: "0.92rem", fontWeight: "700", color: "#111827", display: "flex", alignItems: "center", gap: "6px" }}>
                        {username}
                        <span style={{ fontSize: "0.72rem", background: "#E5E7EB", padding: "2px 6px", borderRadius: "6px" }}>You</span>
                        {isHost && <Crown size={13} color="#F59E0B" />}
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "#6B7280" }}>
                        {isScreenSharing ? "Sharing Screen" : "Active in Room"}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    {isCameraOn ? <Video size={16} color="#10B981" /> : <VideoOff size={16} color="#EF4444" />}
                    {isMicOn ? <Mic size={16} color="#10B981" /> : <MicOff size={16} color="#EF4444" />}
                  </div>
                </div>

                {/* Remote Peers */}
                {participants
                  .filter((p) => p.userId !== currentUserId)
                  .map((peer) => {
                    const peerName = peer.username || `Student (${peer.userId.substring(0, 5)})`;
                    return (
                      <div key={peer.userId} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: "14px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          <div style={{ width: "38px", height: "38px", borderRadius: "50%", background: "#3B82F6", color: "#FFFFFF", fontWeight: "800", fontSize: "0.95rem", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            {peerName.charAt(0).toUpperCase()}
                          </div>
                          <div style={{ textAlign: "left" }}>
                            <div style={{ fontSize: "0.92rem", fontWeight: "700", color: "#111827", display: "flex", alignItems: "center", gap: "6px" }}>
                              {peerName}
                              {peer.isHost && <Crown size={13} color="#F59E0B" />}
                            </div>
                            <div style={{ fontSize: "0.75rem", color: "#6B7280" }}>
                              {peer.isScreenSharing ? "Sharing Screen" : "Active in Room"}
                            </div>
                          </div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          {peer.isCameraOn !== false ? <Video size={16} color="#10B981" /> : <VideoOff size={16} color="#EF4444" />}
                          {peer.isMicOn !== false ? <Mic size={16} color="#10B981" /> : <MicOff size={16} color="#EF4444" />}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        )}

        {/* Real-time Side Drawer Chat */}
        {showChat && (
          <div className="chatRoom">
            <div className="chatContainer">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "12px", borderBottom: "1px solid #E5E7EB" }}>
                <h1 style={{ margin: 0, fontSize: "1.2rem", color: "#111827", fontWeight: "800", display: "flex", alignItems: "center", gap: "8px" }}>
                  <MessageSquare size={20} color="#111827" />
                  Room Chat
                </h1>
                <button onClick={() => setShowChat(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#6B7280", padding: "4px" }}>
                  <X size={18} />
                </button>
              </div>

              <div className="chattingDisplay">
                {chatMessages.length === 0 ? (
                  <div style={{ textAlign: "center", color: "#9CA3AF", margin: "auto 0", fontSize: "0.88rem" }}>
                    No messages yet. Say hello to your study partner!
                  </div>
                ) : (
                  chatMessages.map((item) => (
                    <div key={item.id} style={{ textAlign: "left" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", margin: "0 4px 4px" }}>
                        <span style={{ fontWeight: "700", fontSize: "0.8rem", color: item.sender === username ? "#047857" : "#4B5563" }}>
                          {item.sender} {item.sender === username ? "(You)" : ""}
                        </span>
                      </div>
                      <p style={{ background: item.sender === username ? "rgba(197, 255, 74, 0.2)" : "#F3F4F6", padding: "10px 14px", borderRadius: "14px", border: "1px solid #E5E7EB", color: "#1F2937", margin: 0, wordBreak: "break-word" }}>
                        {item.message}
                      </p>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              <form onSubmit={handleSendMessage} className="chattingArea">
                <input
                  type="text"
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="ramain-input"
                  style={{ padding: "8px 12px", fontSize: "0.88rem" }}
                />
                <button type="submit" className="btn-lime" style={{ padding: "8px 14px", fontSize: "0.85rem", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                  <Send size={14} />
                  Send
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Multi-Peer Video Grid (Top Half) */}
        <div
          className="studyVideoGrid"
          style={{
            gridTemplateColumns:
              participants.filter((p) => p.userId !== currentUserId).length === 0
                ? "minmax(360px, 760px)"
                : `repeat(auto-fit, minmax(${participants.filter((p) => p.userId !== currentUserId).length >= 2 ? "320px" : "440px"}, 1fr))`,
            justifyContent: "center",
            margin: "0 auto",
            width: "100%",
          }}
        >
          {/* Local Stream Tile */}
          <RoomVideoTile
            stream={localStream}
            username={username}
            isLocal={true}
            isHost={isHost}
            isCameraOn={isCameraOn}
            isMicOn={isMicOn}
            isScreenSharing={isScreenSharing}
          />

          {/* Remote Peer Tiles */}
          {participants
            .filter((p) => p.userId !== currentUserId)
            .map((peer) => {
              const stream = remoteStreams.get(peer.userId) || null;
              return (
                <RoomVideoTile
                  key={peer.userId}
                  stream={stream}
                  username={peer.username || "Study Partner"}
                  isLocal={false}
                  isHost={peer.isHost}
                  isCameraOn={peer.isCameraOn !== false && !!stream}
                  isMicOn={peer.isMicOn !== false}
                  isScreenSharing={peer.isScreenSharing}
                />
              );
            })}
        </div>

        {/* Productivity 3-Card Dashboard (Bottom Half) */}
        {showStudyPanel && (
          <StudyPanel
            topic={studyTopic || topic}
            goal={studyGoal || goal}
            focusDuration={studyFocusDuration || focusDuration}
            breakDuration={studyBreakDuration || Math.round((studyFocusDuration || focusDuration) / 5) || 5}
            sessions={studySessions || sessions}
            currentSession={currentSession}
            phase={phase}
            timeLeft={timeLeft}
            isRunning={isRunning}
            notes={notes}
            onUpdateConfig={(config) => {
              if (config.topic !== undefined) setTopic(config.topic);
              if (config.goal !== undefined) setGoal(config.goal);
              if (config.sessions !== undefined) setSessions(config.sessions);
              if (config.focusDuration !== undefined) {
                setFocusDuration(config.focusDuration);
                config.timeLeft = config.focusDuration * 60;
              }
              updateStudyConfig(config);
            }}
            onTimerAction={(action) => {
              if (action === "start") startTimer();
              else if (action === "pause") pauseTimer();
              else if (action === "reset") resetTimer();
              else if (action === "skip") skipPhase();
              else if (action === "end") handleEndCall();
            }}
            onNotesChange={(val) => updateNotes(val)}
          />
        )}
      </div>

      {/* Floating Bottom Control Bar with Sleek Lucide SVG Icons */}
      <div className="buttonContainers">
        <button
          type="button"
          onClick={toggleCamera}
          style={{
            background: isCameraOn ? "rgba(255, 255, 255, 0.1)" : "rgba(239, 68, 68, 0.25)",
            color: isCameraOn ? "white" : "#EF4444",
          }}
          title={isCameraOn ? "Turn off camera" : "Turn on camera"}
        >
          {isCameraOn ? <Video size={20} /> : <VideoOff size={20} />}
        </button>

        <button
          type="button"
          onClick={toggleMic}
          style={{
            background: isMicOn ? "rgba(255, 255, 255, 0.1)" : "#EF4444",
            color: "white",
          }}
          title={isMicOn ? "Mute microphone" : "Unmute microphone"}
        >
          {isMicOn ? <Mic size={20} /> : <MicOff size={20} />}
        </button>

        <button
          type="button"
          onClick={toggleScreenShare}
          style={{
            background: isScreenSharing ? "rgba(197, 255, 74, 0.2)" : "rgba(255, 255, 255, 0.1)",
            color: isScreenSharing ? "var(--accent-lime)" : "white",
          }}
          title={isScreenSharing ? "Stop sharing screen" : "Share screen"}
        >
          <Monitor size={20} />
        </button>

        <button
          type="button"
          onClick={() => {
            setShowParticipants((p) => !p);
            setShowChat(false);
          }}
          style={{
            background: showParticipants ? "rgba(197, 255, 74, 0.2)" : "rgba(255, 255, 255, 0.1)",
            color: showParticipants ? "var(--accent-lime)" : "white",
          }}
          title="View room participants"
        >
          <Users size={20} />
        </button>

        <button
          type="button"
          onClick={() => {
            setShowChat((c) => !c);
            setShowParticipants(false);
          }}
          style={{
            background: showChat ? "rgba(197, 255, 74, 0.2)" : "rgba(255, 255, 255, 0.1)",
            color: showChat ? "var(--accent-lime)" : "white",
          }}
          title="Toggle chat room"
        >
          <MessageSquare size={20} />
        </button>

        <button
          type="button"
          onClick={() => setShowStudyPanel((s) => !s)}
          style={{
            background: showStudyPanel ? "rgba(197, 255, 74, 0.2)" : "rgba(255, 255, 255, 0.1)",
            color: showStudyPanel ? "var(--accent-lime)" : "white",
          }}
          title="Toggle study panel"
        >
          <BookOpen size={20} />
        </button>

        <button
          type="button"
          onClick={handleEndCall}
          style={{
            background: "#DC2626",
            color: "white",
          }}
          title="Leave room"
        >
          <PhoneOff size={20} />
        </button>
      </div>

      {/* Session Summary Modal */}
      {showSummary && (
        <SessionSummaryModal
          data={summaryData}
          onClose={() => setShowSummary(false)}
          onExit={async () => {
            if (summaryData) {
              try {
                await api.post("/api/history", {
                  topic: summaryData.topic || roomId,
                  goal: summaryData.goal || "Achieve daily goals",
                  duration: Math.max(1, Math.round((summaryData.totalStudyMs || 60000) / 60000)),
                  notes: summaryData.notes || null,
                });
              } catch (e) {
                console.error("Save history error:", e);
              }
              try {
                const existing = JSON.parse(localStorage.getItem("studysphere_saved_notes") || "[]");
                existing.unshift({
                  id: Date.now(),
                  topic: summaryData.topic || roomId,
                  goal: summaryData.goal || "Achieve daily goals",
                  notes: summaryData.notes || "",
                  date: new Date().toLocaleDateString(),
                  durationMin: Math.max(1, Math.round((summaryData.totalStudyMs || 60000) / 60000)),
                  completedSessions: summaryData.completedSessions,
                  totalSessions: summaryData.totalSessions,
                });
                localStorage.setItem("studysphere_saved_notes", JSON.stringify(existing));
              } catch (err) {}
            }
            handleFinalExit();
          }}
        />
      )}
    </div>
  );
}
