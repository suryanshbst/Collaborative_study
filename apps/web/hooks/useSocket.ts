"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { WS_BASE_URL } from "@/lib/api";
import type { MessageType, WebSocketMessage } from "@/lib/types";

type MessageHandler = (payload: any) => void;

export function useSocket(userId: string, username: string) {
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);
  const handlersRef = useRef<Map<MessageType, Set<MessageHandler>>>(new Map());
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const userIdRef = useRef(userId);
  const usernameRef = useRef(username);

  useEffect(() => {
    userIdRef.current = userId;
  }, [userId]);

  useEffect(() => {
    usernameRef.current = username;
  }, [username]);

  const connect = useCallback(() => {
    if (!userIdRef.current) return;

    // Prevent duplicate connections if already open or connecting
    if (
      socketRef.current &&
      (socketRef.current.readyState === WebSocket.OPEN ||
        socketRef.current.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }

    try {
      const url = `${WS_BASE_URL}?userId=${encodeURIComponent(userIdRef.current)}&username=${encodeURIComponent(usernameRef.current)}`;
      const ws = new WebSocket(url);
      socketRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        console.log("[WebSocket] Connected to StudySphere Hub");
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as WebSocketMessage;
          const handlers = handlersRef.current.get(data.type);
          if (handlers) {
            handlers.forEach((handler) => handler(data.payload));
          }
        } catch (err) {
          console.error("[WebSocket] Failed to parse message", err);
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = setTimeout(connect, 3000);
      };

      ws.onerror = () => {
        // Handled silently; onclose triggers reconnection
      };
    } catch (err) {
      console.error("[WebSocket] Connect error:", err);
    }
  }, []);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [connect]);

  const send = useCallback((type: MessageType, payload: unknown) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type, payload }));
    } else {
      console.warn("[WebSocket] Cannot send message, socket not open");
    }
  }, []);

  const on = useCallback((type: MessageType, handler: MessageHandler) => {
    if (!handlersRef.current.has(type)) {
      handlersRef.current.set(type, new Set());
    }
    handlersRef.current.get(type)!.add(handler);

    return () => {
      handlersRef.current.get(type)?.delete(handler);
    };
  }, []);

  return { isConnected, send, on, connect, disconnect: () => socketRef.current?.close() };
}
