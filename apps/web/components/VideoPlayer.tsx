"use client";

import React, { useEffect, useRef } from "react";
import { MicOff, Crown, VideoOff } from "lucide-react";

interface VideoPlayerProps {
  stream: MediaStream | null;
  username: string;
  isLocal?: boolean;
  isHost?: boolean;
  isCameraOn?: boolean;
  isMicOn?: boolean;
  isScreenShare?: boolean;
}

export function VideoPlayer({
  stream,
  username,
  isLocal = false,
  isHost = false,
  isCameraOn = true,
  isMicOn = true,
  isScreenShare = false,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const hasVideoTrack =
    stream &&
    stream.getVideoTracks().length > 0 &&
    stream.getVideoTracks()[0]?.enabled &&
    isCameraOn;

  return (
    <div className="relative w-full h-full min-h-[220px] rounded-2xl overflow-hidden bg-slate-950 border border-slate-800/80 shadow-xl flex items-center justify-center group">
      {/* Video Element */}
      {stream && (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isLocal}
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            hasVideoTrack ? "opacity-100" : "opacity-0"
          } ${isLocal && !isScreenShare ? "scale-x-[-1]" : ""}`}
        />
      )}

      {/* Camera Off Placeholder Avatar */}
      {!hasVideoTrack && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 gap-3">
          <div className="w-20 h-20 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center shadow-lg shadow-indigo-500/10">
            <span className="text-3xl font-extrabold text-indigo-300">
              {username.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <VideoOff className="w-3.5 h-3.5 text-slate-500" />
            <span>Camera Off</span>
          </div>
        </div>
      )}

      {/* Name Tag & Status Badges */}
      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-2 bg-slate-950/80 backdrop-blur-md py-1 px-2.5 rounded-lg border border-white/10 text-xs font-medium text-slate-200 shadow-md">
          {isHost && (
            <Crown className="w-3.5 h-3.5 text-amber-400" title="Room Host" />
          )}
          <span>
            {username} {isLocal && "(You)"}
          </span>
          {isScreenShare && (
            <span className="text-[10px] bg-cyan-500/20 text-cyan-300 px-1.5 py-0.5 rounded font-semibold border border-cyan-500/30">
              Screen
            </span>
          )}
        </div>

        {/* Mic Status Badge */}
        {!isMicOn && (
          <div className="p-1.5 rounded-lg bg-rose-500/80 backdrop-blur-md text-white shadow-md">
            <MicOff className="w-3.5 h-3.5" />
          </div>
        )}
      </div>
    </div>
  );
}
