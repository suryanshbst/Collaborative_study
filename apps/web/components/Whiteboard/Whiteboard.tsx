"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import { WhiteboardToolbar } from "./WhiteboardToolbar";
import { useWhiteboard } from "@/hooks/useWhiteboard";
import type { ToolType, CanvasElement, Point, WhiteboardProps } from "./types";

export function Whiteboard({
  roomId,
  initialElements,
  send,
  on,
}: WhiteboardProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [tool, setTool] = useState<ToolType>("pencil");
  const [color, setColor] = useState<string>("#C5FF4A");
  const [strokeWidth, setStrokeWidth] = useState<number>(4);
  const [isFilled, setIsFilled] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Text input state
  const [textInputPos, setTextInputPos] = useState<Point | null>(null);
  const [textInputValue, setTextInputValue] = useState<string>("");

  // Drawing state
  const isDrawingRef = useRef<boolean>(false);
  const currentElementRef = useRef<CanvasElement | null>(null);

  const {
    elements,
    updateElements,
    undo,
    redo,
    clearCanvas,
    canUndo,
    canRedo,
  } = useWhiteboard({
    roomId,
    initialElements,
    send,
    on,
  });

  // Calculate mouse/touch position relative to canvas
  const getCanvasPoint = useCallback((e: React.PointerEvent<HTMLCanvasElement>): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }, []);

  // Render an element on canvas context
  const drawElement = useCallback((ctx: CanvasRenderingContext2D, el: CanvasElement) => {
    ctx.strokeStyle = el.color;
    ctx.fillStyle = el.color;
    ctx.lineWidth = el.strokeWidth;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    switch (el.type) {
      case "pencil": {
        if (!el.points || el.points.length === 0) return;
        ctx.beginPath();
        ctx.moveTo(el.points[0]!.x, el.points[0]!.y);
        for (let i = 1; i < el.points.length; i++) {
          ctx.lineTo(el.points[i]!.x, el.points[i]!.y);
        }
        ctx.stroke();
        break;
      }

      case "rect": {
        const w = el.width || 0;
        const h = el.height || 0;
        ctx.beginPath();
        ctx.rect(el.x, el.y, w, h);
        if (el.fill) {
          ctx.globalAlpha = 0.25;
          ctx.fill();
          ctx.globalAlpha = 1.0;
        }
        ctx.stroke();
        break;
      }

      case "circle": {
        const rx = Math.abs((el.width || 0) / 2);
        const ry = Math.abs((el.height || 0) / 2);
        const cx = el.x + (el.width || 0) / 2;
        const cy = el.y + (el.height || 0) / 2;
        ctx.beginPath();
        ctx.ellipse(cx, cy, rx || 1, ry || 1, 0, 0, 2 * Math.PI);
        if (el.fill) {
          ctx.globalAlpha = 0.25;
          ctx.fill();
          ctx.globalAlpha = 1.0;
        }
        ctx.stroke();
        break;
      }

      case "line": {
        const endX = el.x + (el.width || 0);
        const endY = el.y + (el.height || 0);
        ctx.beginPath();
        ctx.moveTo(el.x, el.y);
        ctx.lineTo(endX, endY);
        ctx.stroke();
        break;
      }

      case "arrow": {
        const endX = el.x + (el.width || 0);
        const endY = el.y + (el.height || 0);
        const headlen = 14;
        const angle = Math.atan2(endY - el.y, endX - el.x);

        ctx.beginPath();
        ctx.moveTo(el.x, el.y);
        ctx.lineTo(endX, endY);
        ctx.stroke();

        // Arrow head
        ctx.beginPath();
        ctx.moveTo(endX, endY);
        ctx.lineTo(
          endX - headlen * Math.cos(angle - Math.PI / 6),
          endY - headlen * Math.sin(angle - Math.PI / 6),
        );
        ctx.moveTo(endX, endY);
        ctx.lineTo(
          endX - headlen * Math.cos(angle + Math.PI / 6),
          endY - headlen * Math.sin(angle + Math.PI / 6),
        );
        ctx.stroke();
        break;
      }

      case "text": {
        if (!el.text) return;
        ctx.font = `${Math.max(14, el.strokeWidth * 4)}px 'Plus Jakarta Sans', sans-serif`;
        ctx.textBaseline = "top";
        ctx.fillText(el.text, el.x, el.y);
        break;
      }
    }
  }, []);

  // Redraw all elements on canvas
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background grid dots for modern vector aesthetics
    ctx.fillStyle = "rgba(255, 255, 255, 0.04)";
    const dotSpacing = 24;
    for (let x = 12; x < canvas.width; x += dotSpacing) {
      for (let y = 12; y < canvas.height; y += dotSpacing) {
        ctx.beginPath();
        ctx.arc(x, y, 1, 0, 2 * Math.PI);
        ctx.fill();
      }
    }

    // Draw all saved elements
    elements.forEach((el) => drawElement(ctx, el));

    // Draw active drawing element if in progress
    if (currentElementRef.current) {
      drawElement(ctx, currentElementRef.current);
    }
  }, [drawElement, elements]);

  // Adjust canvas resolution to container size
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;

      const rect = container.getBoundingClientRect();
      const width = Math.max(300, rect.width);
      const height = isFullscreen ? window.innerHeight - 130 : 340;

      canvas.width = width;
      canvas.height = height;
      redrawCanvas();
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isFullscreen, redrawCanvas]);

  useEffect(() => {
    redrawCanvas();
  }, [elements, redrawCanvas]);

  // Eraser helper: check if element is near point
  const isPointNearElement = (pt: Point, el: CanvasElement): boolean => {
    const threshold = 12;
    if (el.type === "pencil" && el.points) {
      return el.points.some(
        (p) => Math.hypot(p.x - pt.x, p.y - pt.y) < threshold,
      );
    }
    const minX = Math.min(el.x, el.x + (el.width || 0)) - threshold;
    const maxX = Math.max(el.x, el.x + (el.width || 0)) + threshold;
    const minY = Math.min(el.y, el.y + (el.height || 0)) - threshold;
    const maxY = Math.max(el.y, el.y + (el.height || 0)) + threshold;
    return pt.x >= minX && pt.x <= maxX && pt.y >= minY && pt.y <= maxY;
  };

  // Pointer Down
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    const pt = getCanvasPoint(e);

    if (tool === "text") {
      setTextInputPos(pt);
      setTextInputValue("");
      return;
    }

    if (tool === "eraser") {
      updateElements((prev) => prev.filter((el) => !isPointNearElement(pt, el)));
      return;
    }

    isDrawingRef.current = true;

    const newEl: CanvasElement = {
      id: `el-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      type: tool,
      x: pt.x,
      y: pt.y,
      width: 0,
      height: 0,
      points: tool === "pencil" ? [pt] : undefined,
      color,
      strokeWidth,
      fill: isFilled,
    };

    currentElementRef.current = newEl;
    redrawCanvas();
  };

  // Pointer Move
  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const pt = getCanvasPoint(e);

    if (tool === "eraser" && e.buttons === 1) {
      updateElements((prev) => prev.filter((el) => !isPointNearElement(pt, el)), false);
      return;
    }

    if (!isDrawingRef.current || !currentElementRef.current) return;

    const el = currentElementRef.current;

    if (el.type === "pencil") {
      el.points = [...(el.points || []), pt];
    } else {
      el.width = pt.x - el.x;
      el.height = pt.y - el.y;
    }

    redrawCanvas();
  };

  // Pointer Up
  const handlePointerUp = () => {
    if (!isDrawingRef.current || !currentElementRef.current) return;
    isDrawingRef.current = false;

    const finalEl = currentElementRef.current;
    currentElementRef.current = null;

    if (
      finalEl.type === "pencil" &&
      finalEl.points &&
      finalEl.points.length > 1
    ) {
      updateElements((prev) => [...prev, finalEl]);
    } else if (
      finalEl.type !== "pencil" &&
      (Math.abs(finalEl.width || 0) > 4 || Math.abs(finalEl.height || 0) > 4)
    ) {
      updateElements((prev) => [...prev, finalEl]);
    } else {
      redrawCanvas();
    }
  };

  // Text submit
  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (textInputPos && textInputValue.trim()) {
      const textEl: CanvasElement = {
        id: `text-${Date.now()}`,
        type: "text",
        x: textInputPos.x,
        y: textInputPos.y,
        text: textInputValue.trim(),
        color,
        strokeWidth,
      };
      updateElements((prev) => [...prev, textEl]);
    }
    setTextInputPos(null);
    setTextInputValue("");
  };

  // Download canvas image
  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Create a temporary export canvas with dark background
    const exportCanvas = document.createElement("canvas");
    exportCanvas.width = canvas.width;
    exportCanvas.height = canvas.height;
    const expCtx = exportCanvas.getContext("2d");
    if (!expCtx) return;

    expCtx.fillStyle = "#0B132B";
    expCtx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
    elements.forEach((el) => drawElement(expCtx, el));

    const link = document.createElement("a");
    link.download = `StudySphere_Whiteboard_${roomId}_${Date.now()}.png`;
    link.href = exportCanvas.toDataURL("image/png");
    link.click();
  };

  return (
    <div
      ref={containerRef}
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        position: isFullscreen ? "fixed" : "relative",
        top: isFullscreen ? 0 : "auto",
        left: isFullscreen ? 0 : "auto",
        width: isFullscreen ? "100vw" : "100%",
        height: isFullscreen ? "100vh" : "100%",
        zIndex: isFullscreen ? 9999 : 1,
        background: isFullscreen ? "#0B132B" : "transparent",
        padding: isFullscreen ? "20px" : 0,
        boxSizing: "border-box",
      }}
    >
      <WhiteboardToolbar
        tool={tool}
        color={color}
        strokeWidth={strokeWidth}
        isFilled={isFilled}
        isFullscreen={isFullscreen}
        canUndo={canUndo}
        canRedo={canRedo}
        onSelectTool={setTool}
        onSelectColor={setColor}
        onSelectStrokeWidth={setStrokeWidth}
        onToggleFill={() => setIsFilled(!isFilled)}
        onUndo={undo}
        onRedo={redo}
        onClear={() => {
          if (window.confirm("Clear all drawings on the whiteboard for this room?")) {
            clearCanvas();
          }
        }}
        onDownload={handleDownload}
        onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
      />

      {/* Canvas Wrap */}
      <div
        style={{
          position: "relative",
          flex: 1,
          background: "#080E1E",
          borderRadius: "14px",
          border: "1px solid rgba(255,255,255,0.12)",
          overflow: "hidden",
          cursor:
            tool === "pencil"
              ? "crosshair"
              : tool === "text"
              ? "text"
              : tool === "eraser"
              ? "pointer"
              : "crosshair",
        }}
      >
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          style={{
            display: "block",
            touchAction: "none",
            width: "100%",
            height: "100%",
          }}
        />

        {/* Text Input Prompt Overlay */}
        {textInputPos && (
          <form
            onSubmit={handleTextSubmit}
            style={{
              position: "absolute",
              left: `${textInputPos.x}px`,
              top: `${textInputPos.y}px`,
              zIndex: 10,
              display: "flex",
              alignItems: "center",
              gap: "4px",
              background: "#1E293B",
              padding: "4px 8px",
              borderRadius: "8px",
              border: "1.5px solid var(--accent-lime, #C5FF4A)",
              boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
            }}
          >
            <input
              type="text"
              autoFocus
              placeholder="Type note & press Enter..."
              value={textInputValue}
              onChange={(e) => setTextInputValue(e.target.value)}
              onBlur={handleTextSubmit}
              style={{
                background: "transparent",
                border: "none",
                color: color,
                outline: "none",
                fontSize: "0.92rem",
                fontWeight: 600,
                width: "180px",
              }}
            />
          </form>
        )}
      </div>
    </div>
  );
}
