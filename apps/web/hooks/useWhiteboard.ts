"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { CanvasElement } from "@/components/Whiteboard/types";

interface UseWhiteboardProps {
  roomId: string;
  initialElements?: string;
  send: (type: string, payload: any) => void;
  on: (type: string, handler: (payload: any) => void) => () => void;
}

export function useWhiteboard({
  roomId,
  initialElements,
  send,
  on,
}: UseWhiteboardProps) {
  const [elements, setElements] = useState<CanvasElement[]>(() => {
    if (initialElements) {
      try {
        return JSON.parse(initialElements);
      } catch {
        return [];
      }
    }
    return [];
  });

  const [history, setHistory] = useState<CanvasElement[][]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const elementsRef = useRef<CanvasElement[]>(elements);
  elementsRef.current = elements;

  const isLocalUpdateRef = useRef(false);

  // Sync elements to server with debounce
  const syncTimerRef = useRef<NodeJS.Timeout | null>(null);

  const broadcastElements = useCallback(
    (newElements: CanvasElement[]) => {
      if (syncTimerRef.current) {
        clearTimeout(syncTimerRef.current);
      }

      syncTimerRef.current = setTimeout(() => {
        send("whiteboard-update", {
          roomId,
          elements: JSON.stringify(newElements),
        });
      }, 50);
    },
    [roomId, send],
  );

  // Push new elements to history and state
  const updateElements = useCallback(
    (
      action:
        | CanvasElement[]
        | ((prev: CanvasElement[]) => CanvasElement[]),
      recordHistory = true,
    ) => {
      setElements((prev) => {
        const next = typeof action === "function" ? action(prev) : action;
        elementsRef.current = next;

        if (recordHistory) {
          setHistory((hist) => {
            const trimmed = hist.slice(0, historyIndex + 1);
            return [...trimmed, next];
          });
          setHistoryIndex((idx) => idx + 1);
        }

        isLocalUpdateRef.current = true;
        broadcastElements(next);
        return next;
      });
    },
    [broadcastElements, historyIndex],
  );

  // Undo action
  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const prevElements = history[historyIndex - 1] || [];
      setHistoryIndex((idx) => idx - 1);
      setElements(prevElements);
      elementsRef.current = prevElements;
      broadcastElements(prevElements);
    } else if (historyIndex === 0) {
      setHistoryIndex(-1);
      setElements([]);
      elementsRef.current = [];
      broadcastElements([]);
    }
  }, [broadcastElements, history, historyIndex]);

  // Redo action
  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const nextElements = history[historyIndex + 1] || [];
      setHistoryIndex((idx) => idx + 1);
      setElements(nextElements);
      elementsRef.current = nextElements;
      broadcastElements(nextElements);
    }
  }, [broadcastElements, history, historyIndex]);

  // Clear canvas
  const clearCanvas = useCallback(() => {
    updateElements([]);
    send("whiteboard-clear", { roomId });
  }, [roomId, send, updateElements]);

  // Listen for peer whiteboard events
  useEffect(() => {
    const unsubUpdate = on(
      "whiteboard-update",
      (payload: { roomId: string; elements: string }) => {
        try {
          const parsed = JSON.parse(payload.elements);
          if (Array.isArray(parsed)) {
            setElements(parsed);
            elementsRef.current = parsed;
          }
        } catch (err) {
          console.warn("[Whiteboard] Error parsing remote whiteboard update:", err);
        }
      },
    );

    const unsubClear = on("whiteboard-clear", () => {
      setElements([]);
      elementsRef.current = [];
    });

    const unsubSync = on("study-sync", (state: any) => {
      if (state.whiteboard) {
        try {
          const parsed = JSON.parse(state.whiteboard);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setElements(parsed);
            elementsRef.current = parsed;
          }
        } catch {}
      }
    });

    return () => {
      unsubUpdate();
      unsubClear();
      unsubSync();
      if (syncTimerRef.current) {
        clearTimeout(syncTimerRef.current);
      }
    };
  }, [on]);

  return {
    elements,
    updateElements,
    undo,
    redo,
    clearCanvas,
    canUndo: historyIndex >= 0,
    canRedo: historyIndex < history.length - 1,
  };
}
