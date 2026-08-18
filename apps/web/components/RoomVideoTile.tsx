"use client";

import React, { useEffect, useRef } from "react";
import { MicOff, VideoOff, Crown, Monitor } from "lucide-react";

interface RoomVideoTileProps {
  stream: MediaStream | null;
  username: string;
  isLocal?: boolean;
  isHost?: boolean;
  isCameraOn?: boolean;
  isMicOn?: boolean;
  isScreenSharing?: boolean;
}

export function RoomVideoTile({
  stream,
  username,
  isLocal = false,
  isHost = false,
  isCameraOn = true,
  isMicOn = true,
  isScreenSharing = false,
}: RoomVideoTileProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Bind video stream
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

  // Bind remote audio stream
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || isLocal) return;

    if (stream) {
      if (audio.srcObject !== stream) {
        audio.srcObject = stream;
      }
      audio.play().catch(() => {});
    } else {
      audio.srcObject = null;
    }
  }, [stream, isLocal]);

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
        position: "relative",
        background: "#1E293B",
        border: "1.5px solid rgba(255, 255, 255, 0.14)",
        borderRadius: "20px",
        overflow: "hidden",
        aspectRatio: "16 / 9",
        minHeight: "240px",
        maxHeight: "420px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 16px 40px rgba(0, 0, 0, 0.45)",
      }}
    >
      {/* Remote Audio Track */}
      {!isLocal && <audio ref={audioRef} autoPlay playsInline />}

      {/* Video Element */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isLocal}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          display: isCameraOn && stream ? "block" : "none",
          transform: isLocal && !isScreenSharing ? "scaleX(-1)" : "none",
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
            background: "linear-gradient(135deg, #0F172A 0%, #1E293B 100%)",
            color: "#E2E8F0",
          }}
        >
          <div
            style={{
              width: "72px",
              height: "72px",
              borderRadius: "50%",
              background: "rgba(197, 255, 74, 0.15)",
              border: "2.5px solid var(--accent-lime, #C5FF4A)",
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
          <span style={{ fontSize: "1rem", fontWeight: "700", color: "#F8FAFC" }}>
            {username} {isLocal && "(You)"}
          </span>
          <span style={{ fontSize: "0.82rem", color: "#94A3B8", marginTop: "4px" }}>
            Camera is turned off
          </span>
        </div>
      )}

      {/* Name Badge */}
      <div
        style={{
          position: "absolute",
          bottom: "14px",
          left: "14px",
          background: "rgba(15, 23, 42, 0.88)",
          backdropFilter: "blur(8px)",
          border: "1px solid rgba(255, 255, 255, 0.15)",
          padding: "6px 14px",
          borderRadius: "20px",
          fontSize: "0.84rem",
          fontWeight: 700,
          color: "white",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          zIndex: 10,
        }}
      >
        <span className="vector-pulse-dot" />
        <span>
          {isLocal ? `You (${username})` : username} {isHost ? "👑 Host" : ""} {!isMicOn ? "🔇" : ""}{" "}
          {!isCameraOn ? "📷 Off" : ""}
        </span>
        {isScreenSharing && (
          <span
            style={{
              background: "rgba(56, 189, 248, 0.2)",
              color: "#38BDF8",
              padding: "2px 8px",
              borderRadius: "6px",
              fontSize: "0.72rem",
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <Monitor size={12} />
            Screen
          </span>
        )}
      </div>
    </div>
  );
}
