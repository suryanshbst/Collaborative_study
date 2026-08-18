"use client";

import React from "react";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  ScreenShare,
  FileText,
  MessageSquare,
  PhoneOff,
} from "lucide-react";

interface RoomControlsProps {
  isMicOn: boolean;
  isCameraOn: boolean;
  isScreenSharing: boolean;
  activeDrawer: "notes" | "chat" | null;
  onToggleMic: () => void;
  onToggleCamera: () => void;
  onToggleScreenShare: () => void;
  onToggleDrawer: (drawer: "notes" | "chat") => void;
  onLeaveRoom: () => void;
}

export function RoomControls({
  isMicOn,
  isCameraOn,
  isScreenSharing,
  activeDrawer,
  onToggleMic,
  onToggleCamera,
  onToggleScreenShare,
  onToggleDrawer,
  onLeaveRoom,
}: RoomControlsProps) {
  return (
    <div className="flex items-center justify-center gap-3 p-3 bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl">
      {/* Microphone Toggle */}
      <button
        onClick={onToggleMic}
        className={`p-3.5 rounded-xl transition-all duration-200 flex items-center justify-center ${
          isMicOn
            ? "bg-slate-800/80 text-slate-200 hover:bg-slate-700 hover:text-white"
            : "bg-rose-500/20 text-rose-400 border border-rose-500/30 hover:bg-rose-500/30"
        }`}
        title={isMicOn ? "Mute Microphone" : "Unmute Microphone"}
      >
        {isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
      </button>

      {/* Camera Toggle */}
      <button
        onClick={onToggleCamera}
        className={`p-3.5 rounded-xl transition-all duration-200 flex items-center justify-center ${
          isCameraOn
            ? "bg-slate-800/80 text-slate-200 hover:bg-slate-700 hover:text-white"
            : "bg-rose-500/20 text-rose-400 border border-rose-500/30 hover:bg-rose-500/30"
        }`}
        title={isCameraOn ? "Turn Off Camera" : "Turn On Camera"}
      >
        {isCameraOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
      </button>

      {/* Screen Share Toggle */}
      <button
        onClick={onToggleScreenShare}
        className={`p-3.5 rounded-xl transition-all duration-200 flex items-center justify-center ${
          isScreenSharing
            ? "bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/25"
            : "bg-slate-800/80 text-slate-200 hover:bg-slate-700 hover:text-cyan-400"
        }`}
        title={isScreenSharing ? "Stop Screen Sharing" : "Share Screen"}
      >
        <ScreenShare className="w-5 h-5" />
      </button>

      <div className="h-6 w-px bg-slate-800 mx-1" />

      {/* Notes Drawer Toggle */}
      <button
        onClick={() => onToggleDrawer("notes")}
        className={`p-3.5 rounded-xl transition-all duration-200 flex items-center justify-center ${
          activeDrawer === "notes"
            ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/25"
            : "bg-slate-800/80 text-slate-200 hover:bg-slate-700 hover:text-indigo-400"
        }`}
        title="Collaborative Notes"
      >
        <FileText className="w-5 h-5" />
      </button>

      {/* Chat Drawer Toggle */}
      <button
        onClick={() => onToggleDrawer("chat")}
        className={`p-3.5 rounded-xl transition-all duration-200 flex items-center justify-center ${
          activeDrawer === "chat"
            ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/25"
            : "bg-slate-800/80 text-slate-200 hover:bg-slate-700 hover:text-indigo-400"
        }`}
        title="Room Chat"
      >
        <MessageSquare className="w-5 h-5" />
      </button>

      <div className="h-6 w-px bg-slate-800 mx-1" />

      {/* Leave Room Button */}
      <button
        onClick={onLeaveRoom}
        className="p-3.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold shadow-lg shadow-rose-600/25 transition-all duration-200 flex items-center justify-center gap-2"
        title="Leave Study Room"
      >
        <PhoneOff className="w-5 h-5" />
        <span className="hidden sm:inline text-xs">Leave</span>
      </button>
    </div>
  );
}
