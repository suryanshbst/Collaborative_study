"use client";

import React, { useEffect, useRef } from "react";
import { Video, VideoOff, Mic, MicOff } from "lucide-react";

interface LobbyVideoPreviewProps {
  stream: MediaStream | null;
  isCameraOn: boolean;
  isMicOn: boolean;
  username: string;
  onToggleCamera: () => void;
  onToggleMic: () => void;
}

export function LobbyVideoPreview({
  stream,
  isCameraOn,
  isMicOn,
  username,
  onToggleCamera,
  onToggleMic,
}: LobbyVideoPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  // Set srcObject ONLY when stream changes or camera toggles
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (stream && isCameraOn) {
      if (video.srcObject !== stream) {
        video.srcObject = stream;
      }
      video.play().catch(() => {});
    } else {
      video.srcObject = null;
    }
  }, [stream, isCameraOn]);

  const getInitials = (name?: string) => {
    if (!name) return "S";
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  return (
    <div
      style={{
        width: "100%",
        maxWidth: "520px",
        height: "280px",
        margin: "0 auto 24px",
        background: "#0F172A",
        borderRadius: "20px",
        overflow: "hidden",
        border: "2px solid #111827",
        boxShadow: "0 12px 30px rgba(0,0,0,0.15)",
        position: "relative",
      }}
    >
      {/* Persistent Video Element */}
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          display: isCameraOn && stream ? "block" : "none",
          background: "#0F172A",
          transform: "scaleX(-1)", // Mirror local selfie camera
        }}
      />

      {/* Avatar Fallback when camera is off */}
      {(!isCameraOn || !stream) && (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(135deg, #111827 0%, #1F2937 100%)",
            color: "#E5E7EB",
          }}
        >
          <div
            style={{
              width: "72px",
              height: "72px",
              borderRadius: "50%",
              background: "rgba(197, 255, 74, 0.15)",
              border: "2px solid var(--accent-lime, #C5FF4A)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.8rem",
              fontWeight: "800",
              color: "var(--accent-lime, #C5FF4A)",
              marginBottom: "12px",
            }}
          >
            {getInitials(username)}
          </div>
          <span style={{ fontSize: "0.92rem", fontWeight: "600", color: "#9CA3AF" }}>
            Camera is turned off
          </span>
        </div>
      )}

      {/* Lobby Media Toggles */}
      <div
        style={{
          position: "absolute",
          bottom: "14px",
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          gap: "12px",
          background: "rgba(15, 23, 42, 0.75)",
          backdropFilter: "blur(8px)",
          padding: "6px 14px",
          borderRadius: "30px",
          zIndex: 10,
        }}
      >
        <button
          type="button"
          onClick={onToggleCamera}
          style={{
            width: "42px",
            height: "42px",
            borderRadius: "50%",
            border: "none",
            background: isCameraOn ? "rgba(255,255,255,0.15)" : "#EF4444",
            color: "white",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.2s ease",
          }}
          title={isCameraOn ? "Turn Camera Off" : "Turn Camera On"}
        >
          {isCameraOn ? <Video size={18} /> : <VideoOff size={18} />}
        </button>
        <button
          type="button"
          onClick={onToggleMic}
          style={{
            width: "42px",
            height: "42px",
            borderRadius: "50%",
            border: "none",
            background: isMicOn ? "rgba(255,255,255,0.15)" : "#EF4444",
            color: "white",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.2s ease",
          }}
          title={isMicOn ? "Mute Microphone" : "Unmute Microphone"}
        >
          {isMicOn ? <Mic size={18} /> : <MicOff size={18} />}
        </button>
      </div>
    </div>
  );
}
