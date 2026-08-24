"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { MessageType, SignalingPayload } from "@/lib/types";

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
    { urls: "stun:stun3.l.google.com:19302" },
    { urls: "stun:stun4.l.google.com:19302" },
    { urls: "stun:global.stun.twilio.com:3478" },
  ],
};

interface UseWebRTCProps {
  roomId: string;
  userId: string;
  username: string;
  send: (type: MessageType, payload: unknown) => void;
  on: (type: MessageType, handler: (payload: any) => void) => () => void;
}

export function useWebRTC({
  roomId,
  userId,
  username,
  send,
  on,
}: UseWebRTCProps) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(
    new Map(),
  );
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);

  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  const peerConnections = useRef<Map<string, RTCPeerConnection>>(new Map());
  const pendingCandidates = useRef<Map<string, RTCIceCandidateInit[]>>(new Map());
  const localStreamRef = useRef<MediaStream | null>(null);

  // 1. Initialize local media
  useEffect(() => {
    let active = true;

    async function initMedia() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: true,
        });

        if (!active) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        localStreamRef.current = stream;
        setLocalStream(stream);
      } catch (err) {
        console.warn("[WebRTC] Could not access camera/mic with high quality, falling back to basic audio/video", err);
        try {
          const fallbackStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true,
          });
          if (active) {
            localStreamRef.current = fallbackStream;
            setLocalStream(fallbackStream);
          }
        } catch (fallbackErr) {
          console.warn("[WebRTC] Camera/mic permissions not granted:", fallbackErr);
          setIsCameraOn(false);
          setIsMicOn(false);
        }
      }
    }

    initMedia();

    return () => {
      active = false;
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  // Synchronize local tracks to all existing peer connections whenever localStream updates
  useEffect(() => {
    if (!localStream) return;
    localStreamRef.current = localStream;

    peerConnections.current.forEach((pc) => {
      const senders = pc.getSenders();
      localStream.getTracks().forEach((track) => {
        const sender = senders.find((s) => s.track && s.track.kind === track.kind);
        if (sender) {
          sender.replaceTrack(track);
        } else {
          pc.addTrack(track, localStream);
        }
      });
    });
  }, [localStream]);

  // 2. Create peer connection
  const createPeerConnection = useCallback(
    (targetUserId: string) => {
      if (peerConnections.current.has(targetUserId)) {
        return peerConnections.current.get(targetUserId)!;
      }

      const pc = new RTCPeerConnection(ICE_SERVERS);
      peerConnections.current.set(targetUserId, pc);

      // Add local tracks
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => {
          pc.addTrack(track, localStreamRef.current!);
        });
      }

      // Handle ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          send("ice-candidate", {
            roomId,
            targetId: targetUserId,
            candidate: event.candidate,
          });
        }
      };

      // Handle remote stream tracks
      pc.ontrack = (event) => {
        const [stream] = event.streams;
        if (stream) {
          setRemoteStreams((prev) => {
            const next = new Map(prev);
            next.set(targetUserId, stream);
            return next;
          });
        }
      };

      pc.onconnectionstatechange = () => {
        if (
          pc.connectionState === "disconnected" ||
          pc.connectionState === "failed" ||
          pc.connectionState === "closed"
        ) {
          peerConnections.current.delete(targetUserId);
          setRemoteStreams((prev) => {
            const next = new Map(prev);
            next.delete(targetUserId);
            return next;
          });
        }
      };

      return pc;
    },
    [roomId, send],
  );

  // 3. Setup signaling handlers
  useEffect(() => {
    // A new user joined -> Initiate offer to them
    const unsubJoined = on("user-joined", async (data: { userId: string; username: string }) => {
      if (data.userId === userId) return;

      const pc = createPeerConnection(data.userId);
      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        send("offer", {
          roomId,
          targetId: data.userId,
          sdp: offer,
        });
      } catch (err) {
        console.error("[WebRTC] Error creating offer:", err);
      }
    });

    // Received an Offer -> create Answer
    const unsubOffer = on(
      "offer",
      async (data: { senderId: string; sdp: RTCSessionDescriptionInit }) => {
        const pc = createPeerConnection(data.senderId);
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));

          // Process queued ICE candidates
          const queued = pendingCandidates.current.get(data.senderId) || [];
          for (const cand of queued) {
            await pc.addIceCandidate(new RTCIceCandidate(cand));
          }
          pendingCandidates.current.delete(data.senderId);

          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);

          send("answer", {
            roomId,
            targetId: data.senderId,
            sdp: answer,
          });
        } catch (err) {
          console.error("[WebRTC] Error handling offer:", err);
        }
      },
    );

    // Received Answer
    const unsubAnswer = on(
      "answer",
      async (data: { senderId: string; sdp: RTCSessionDescriptionInit }) => {
        const pc = peerConnections.current.get(data.senderId);
        if (pc) {
          try {
            await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));

            const queued = pendingCandidates.current.get(data.senderId) || [];
            for (const cand of queued) {
              await pc.addIceCandidate(new RTCIceCandidate(cand));
            }
            pendingCandidates.current.delete(data.senderId);
          } catch (err) {
            console.error("[WebRTC] Error setting remote answer:", err);
          }
        }
      },
    );

    // Received ICE Candidate
    const unsubIce = on(
      "ice-candidate",
      async (data: { senderId: string; candidate: RTCIceCandidateInit }) => {
        const pc = peerConnections.current.get(data.senderId);
        if (pc && pc.remoteDescription) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
          } catch (err) {
            console.error("[WebRTC] Error adding ICE candidate:", err);
          }
        } else {
          // Queue candidates if remoteDescription is not ready yet
          if (!pendingCandidates.current.has(data.senderId)) {
            pendingCandidates.current.set(data.senderId, []);
          }
          pendingCandidates.current.get(data.senderId)!.push(data.candidate);
        }
      },
    );

    // User Left
    const unsubLeft = on("user-left", (data: { userId: string }) => {
      const pc = peerConnections.current.get(data.userId);
      if (pc) {
        pc.close();
        peerConnections.current.delete(data.userId);
      }
      setRemoteStreams((prev) => {
        const next = new Map(prev);
        next.delete(data.userId);
        return next;
      });
    });

    return () => {
      unsubJoined();
      unsubOffer();
      unsubAnswer();
      unsubIce();
      unsubLeft();
    };
  }, [createPeerConnection, on, roomId, send, userId]);

  // Clean up all peer connections on unmount
  useEffect(() => {
    return () => {
      peerConnections.current.forEach((pc) => pc.close());
      peerConnections.current.clear();
      pendingCandidates.current.clear();
    };
  }, []);

  // Controls: Toggle Camera
  const toggleCamera = useCallback(() => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsCameraOn(videoTrack.enabled);
        send("participant-toggle", {
          roomId,
          isCameraOn: videoTrack.enabled,
        });
      }
    }
  }, [roomId, send]);

  // Controls: Toggle Mic
  const toggleMic = useCallback(() => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMicOn(audioTrack.enabled);
        send("participant-toggle", {
          roomId,
          isMicOn: audioTrack.enabled,
        });
      }
    }
  }, [roomId, send]);

  // Controls: Toggle Screen Sharing
  const toggleScreenShare = useCallback(async () => {
    if (isScreenSharing) {
      // Stop screen share -> revert to camera video
      if (screenStream) {
        screenStream.getTracks().forEach((t) => t.stop());
        setScreenStream(null);
      }
      setIsScreenSharing(false);

      if (localStreamRef.current) {
        const camVideoTrack = localStreamRef.current.getVideoTracks()[0];
        if (camVideoTrack) {
          peerConnections.current.forEach((pc) => {
            const sender = pc
              .getSenders()
              .find((s) => s.track && s.track.kind === "video");
            if (sender) sender.replaceTrack(camVideoTrack);
          });
        }
      }
      send("participant-toggle", { roomId, isScreenSharing: false });
    } else {
      try {
        const displayStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true,
        });

        const screenVideoTrack = displayStream.getVideoTracks()[0];
        if (screenVideoTrack) {
          setScreenStream(displayStream);
          setIsScreenSharing(true);

          peerConnections.current.forEach((pc) => {
            const sender = pc
              .getSenders()
              .find((s) => s.track && s.track.kind === "video");
            if (sender) sender.replaceTrack(screenVideoTrack);
          });

          screenVideoTrack.onended = () => {
            toggleScreenShare();
          };

          send("participant-toggle", { roomId, isScreenSharing: true });
        }
      } catch (err) {
        console.warn("[WebRTC] Screen sharing cancelled/denied", err);
      }
    }
  }, [isScreenSharing, roomId, screenStream, send]);

  return {
    localStream,
    remoteStreams,
    screenStream,
    isCameraOn,
    isMicOn,
    isScreenSharing,
    toggleCamera,
    toggleMic,
    toggleScreenShare,
  };
}
