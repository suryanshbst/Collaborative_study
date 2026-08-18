"use client";

import React from "react";
import { VideoPlayer } from "./VideoPlayer";
import type { Participant } from "@/lib/types";

interface VideoGridProps {
  localStream: MediaStream | null;
  remoteStreams: Map<string, MediaStream>;
  screenStream: MediaStream | null;
  participants: Participant[];
  currentUserId: string;
  currentUsername: string;
  isHost: boolean;
  isCameraOn: boolean;
  isMicOn: boolean;
  isScreenSharing: boolean;
}

export function VideoGrid({
  localStream,
  remoteStreams,
  screenStream,
  participants,
  currentUserId,
  currentUsername,
  isHost,
  isCameraOn,
  isMicOn,
  isScreenSharing,
}: VideoGridProps) {
  // Find other participants
  const otherParticipants = participants.filter((p) => p.userId !== currentUserId);

  return (
    <div className="w-full h-full flex flex-col gap-4">
      {/* 1. Screen Share Hero View (if anyone is sharing screen) */}
      {screenStream && (
        <div className="w-full h-[55vh] min-h-[300px] rounded-2xl overflow-hidden border border-cyan-500/30 shadow-2xl shadow-cyan-500/10">
          <VideoPlayer
            stream={screenStream}
            username={`${currentUsername}'s Screen`}
            isLocal={false}
            isScreenShare={true}
          />
        </div>
      )}

      {/* 2. Responsive Camera Stream Grid */}
      <div
        className={`w-full flex-1 grid gap-4 transition-all duration-300 ${
          screenStream
            ? "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 max-h-[220px]"
            : otherParticipants.length === 0
              ? "grid-cols-1"
              : otherParticipants.length === 1
                ? "grid-cols-1 md:grid-cols-2"
                : otherParticipants.length <= 3
                  ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
                  : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4"
        }`}
      >
        {/* Local Participant Video */}
        <div className="h-full min-h-[200px]">
          <VideoPlayer
            stream={localStream}
            username={currentUsername}
            isLocal={true}
            isHost={isHost}
            isCameraOn={isCameraOn}
            isMicOn={isMicOn}
          />
        </div>

        {/* Remote Participants Videos */}
        {otherParticipants.map((peer) => {
          const stream = remoteStreams.get(peer.userId) || null;
          return (
            <div key={peer.userId} className="h-full min-h-[200px]">
              <VideoPlayer
                stream={stream}
                username={peer.username}
                isLocal={false}
                isHost={peer.isHost}
                isCameraOn={peer.isCameraOn}
                isMicOn={peer.isMicOn}
                isScreenShare={peer.isScreenSharing}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
