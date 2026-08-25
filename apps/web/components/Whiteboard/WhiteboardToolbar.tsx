"use client";

import React from "react";
import {
  Pencil,
  Square,
  Circle,
  Minus,
  MoveRight,
  Type,
  Eraser,
  Undo2,
  Redo2,
  Trash2,
  Download,
  Maximize2,
  Minimize2,
} from "lucide-react";
import type { ToolType } from "./types";

interface WhiteboardToolbarProps {
  tool: ToolType;
  color: string;
  strokeWidth: number;
  isFilled: boolean;
  isFullscreen: boolean;
  canUndo: boolean;
  canRedo: boolean;
  onSelectTool: (t: ToolType) => void;
  onSelectColor: (c: string) => void;
  onSelectStrokeWidth: (w: number) => void;
  onToggleFill: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
  onDownload: () => void;
  onToggleFullscreen: () => void;
}

const PALETTE = [
  { name: "White", value: "#FFFFFF" },
  { name: "Lime", value: "#C5FF4A" },
  { name: "Sky", value: "#38BDF8" },
  { name: "Emerald", value: "#34D399" },
  { name: "Red", value: "#F87171" },
  { name: "Amber", value: "#FBBF24" },
  { name: "Purple", value: "#C084FC" },
];

const STROKE_WIDTHS = [
  { label: "Fine", value: 2 },
  { label: "Med", value: 4 },
  { label: "Bold", value: 8 },
];

export function WhiteboardToolbar({
  tool,
  color,
  strokeWidth,
  isFilled,
  isFullscreen,
  canUndo,
  canRedo,
  onSelectTool,
  onSelectColor,
  onSelectStrokeWidth,
  onToggleFill,
  onUndo,
  onRedo,
  onClear,
  onDownload,
  onToggleFullscreen,
}: WhiteboardToolbarProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "8px 12px",
        background: "#0F172A",
        borderRadius: "12px",
        border: "1px solid rgba(255,255,255,0.12)",
        marginBottom: "10px",
        gap: "10px",
        flexWrap: "wrap",
        userSelect: "none",
      }}
    >
      {/* 1. Tool Selection Group */}
      <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
        <button
          type="button"
          onClick={() => onSelectTool("pencil")}
          title="Pencil / Draw"
          style={{
            background: tool === "pencil" ? "var(--accent-lime, #C5FF4A)" : "rgba(255,255,255,0.06)",
            color: tool === "pencil" ? "#0F172A" : "#E2E8F0",
            border: "none",
            borderRadius: "8px",
            padding: "6px 8px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.15s ease",
          }}
        >
          <Pencil size={15} />
        </button>

        <button
          type="button"
          onClick={() => onSelectTool("rect")}
          title="Rectangle"
          style={{
            background: tool === "rect" ? "var(--accent-lime, #C5FF4A)" : "rgba(255,255,255,0.06)",
            color: tool === "rect" ? "#0F172A" : "#E2E8F0",
            border: "none",
            borderRadius: "8px",
            padding: "6px 8px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.15s ease",
          }}
        >
          <Square size={15} />
        </button>

        <button
          type="button"
          onClick={() => onSelectTool("circle")}
          title="Circle"
          style={{
            background: tool === "circle" ? "var(--accent-lime, #C5FF4A)" : "rgba(255,255,255,0.06)",
            color: tool === "circle" ? "#0F172A" : "#E2E8F0",
            border: "none",
            borderRadius: "8px",
            padding: "6px 8px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.15s ease",
          }}
        >
          <Circle size={15} />
        </button>

        <button
          type="button"
          onClick={() => onSelectTool("line")}
          title="Straight Line"
          style={{
            background: tool === "line" ? "var(--accent-lime, #C5FF4A)" : "rgba(255,255,255,0.06)",
            color: tool === "line" ? "#0F172A" : "#E2E8F0",
            border: "none",
            borderRadius: "8px",
            padding: "6px 8px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.15s ease",
          }}
        >
          <Minus size={15} />
        </button>

        <button
          type="button"
          onClick={() => onSelectTool("arrow")}
          title="Arrow"
          style={{
            background: tool === "arrow" ? "var(--accent-lime, #C5FF4A)" : "rgba(255,255,255,0.06)",
            color: tool === "arrow" ? "#0F172A" : "#E2E8F0",
            border: "none",
            borderRadius: "8px",
            padding: "6px 8px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.15s ease",
          }}
        >
          <MoveRight size={15} />
        </button>

        <button
          type="button"
          onClick={() => onSelectTool("text")}
          title="Text Box"
          style={{
            background: tool === "text" ? "var(--accent-lime, #C5FF4A)" : "rgba(255,255,255,0.06)",
            color: tool === "text" ? "#0F172A" : "#E2E8F0",
            border: "none",
            borderRadius: "8px",
            padding: "6px 8px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.15s ease",
          }}
        >
          <Type size={15} />
        </button>

        <button
          type="button"
          onClick={() => onSelectTool("eraser")}
          title="Eraser"
          style={{
            background: tool === "eraser" ? "#EF4444" : "rgba(255,255,255,0.06)",
            color: tool === "eraser" ? "#FFFFFF" : "#E2E8F0",
            border: "none",
            borderRadius: "8px",
            padding: "6px 8px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.15s ease",
          }}
        >
          <Eraser size={15} />
        </button>
      </div>

      {/* 2. Color Palette */}
      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
        {PALETTE.map((p) => (
          <button
            key={p.value}
            type="button"
            onClick={() => onSelectColor(p.value)}
            title={p.name}
            style={{
              width: "18px",
              height: "18px",
              borderRadius: "50%",
              background: p.value,
              border: color === p.value ? "2px solid #FFFFFF" : "1px solid rgba(255,255,255,0.2)",
              transform: color === p.value ? "scale(1.25)" : "scale(1)",
              cursor: "pointer",
              padding: 0,
              transition: "transform 0.15s ease",
            }}
          />
        ))}
      </div>

      {/* 3. Stroke Width */}
      <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
        {STROKE_WIDTHS.map((sw) => (
          <button
            key={sw.value}
            type="button"
            onClick={() => onSelectStrokeWidth(sw.value)}
            title={`${sw.label} stroke (${sw.value}px)`}
            style={{
              background: strokeWidth === sw.value ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.05)",
              color: strokeWidth === sw.value ? "var(--accent-lime, #C5FF4A)" : "#94A3B8",
              border: strokeWidth === sw.value ? "1px solid var(--accent-lime, #C5FF4A)" : "1px solid transparent",
              borderRadius: "6px",
              padding: "3px 7px",
              fontSize: "0.72rem",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            {sw.label}
          </button>
        ))}

        {(tool === "rect" || tool === "circle") && (
          <button
            type="button"
            onClick={onToggleFill}
            title="Toggle Shape Fill"
            style={{
              background: isFilled ? "rgba(197, 255, 74, 0.2)" : "rgba(255,255,255,0.05)",
              color: isFilled ? "var(--accent-lime, #C5FF4A)" : "#94A3B8",
              border: isFilled ? "1px solid var(--accent-lime, #C5FF4A)" : "1px solid transparent",
              borderRadius: "6px",
              padding: "3px 7px",
              fontSize: "0.72rem",
              fontWeight: 700,
              cursor: "pointer",
              marginLeft: "4px",
            }}
          >
            {isFilled ? "Filled" : "Outline"}
          </button>
        )}
      </div>

      {/* 4. Actions: Undo, Redo, Clear, Download, Fullscreen */}
      <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
        <button
          type="button"
          onClick={onUndo}
          disabled={!canUndo}
          title="Undo"
          style={{
            background: "rgba(255,255,255,0.06)",
            color: canUndo ? "#E2E8F0" : "#475569",
            border: "none",
            borderRadius: "8px",
            padding: "6px 8px",
            cursor: canUndo ? "pointer" : "not-allowed",
            display: "flex",
            alignItems: "center",
          }}
        >
          <Undo2 size={15} />
        </button>

        <button
          type="button"
          onClick={onRedo}
          disabled={!canRedo}
          title="Redo"
          style={{
            background: "rgba(255,255,255,0.06)",
            color: canRedo ? "#E2E8F0" : "#475569",
            border: "none",
            borderRadius: "8px",
            padding: "6px 8px",
            cursor: canRedo ? "pointer" : "not-allowed",
            display: "flex",
            alignItems: "center",
          }}
        >
          <Redo2 size={15} />
        </button>

        <button
          type="button"
          onClick={onClear}
          title="Clear Board"
          style={{
            background: "rgba(239, 68, 68, 0.12)",
            color: "#EF4444",
            border: "1px solid rgba(239, 68, 68, 0.25)",
            borderRadius: "8px",
            padding: "6px 8px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
          }}
        >
          <Trash2 size={15} />
        </button>

        <button
          type="button"
          onClick={onDownload}
          title="Download Canvas PNG"
          style={{
            background: "rgba(255,255,255,0.06)",
            color: "#E2E8F0",
            border: "none",
            borderRadius: "8px",
            padding: "6px 8px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
          }}
        >
          <Download size={15} />
        </button>

        <button
          type="button"
          onClick={onToggleFullscreen}
          title={isFullscreen ? "Exit Fullscreen" : "Fullscreen Board"}
          style={{
            background: isFullscreen ? "var(--accent-lime, #C5FF4A)" : "rgba(255,255,255,0.06)",
            color: isFullscreen ? "#0F172A" : "#E2E8F0",
            border: "none",
            borderRadius: "8px",
            padding: "6px 8px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
          }}
        >
          {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
        </button>
      </div>
    </div>
  );
}
