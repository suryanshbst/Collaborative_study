import type { CanvasElement } from "@/components/Whiteboard/types";

interface ExportCanvasOptions {
  elements?: CanvasElement[] | string;
  topic?: string;
  roomId?: string;
  date?: string;
  notesFallback?: string;
}

export function exportWhiteboardCanvasAsImage({
  elements,
  topic = "Study Session",
  roomId = "whiteboard",
  date = new Date().toLocaleDateString(),
  notesFallback = "",
}: ExportCanvasOptions) {
  if (typeof window === "undefined") return;

  let parsedElements: CanvasElement[] = [];

  if (Array.isArray(elements)) {
    parsedElements = elements;
  } else if (typeof elements === "string" && elements.trim()) {
    try {
      const parsed = JSON.parse(elements);
      if (Array.isArray(parsed)) {
        parsedElements = parsed;
      }
    } catch {}
  }

  // If no elements passed, try to fetch from sessionStorage
  if (parsedElements.length === 0 && typeof window !== "undefined") {
    try {
      const stored = sessionStorage.getItem(`studysphere_wb_${roomId}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          parsedElements = parsed;
        }
      }
    } catch {}
  }

  // Calculate bounding box of drawn elements to ensure perfect dynamic framing
  let minX = 0;
  let minY = 0;
  let maxX = 800;
  let maxY = 500;

  if (parsedElements.length > 0) {
    let hasCoords = false;
    let bMinX = Infinity;
    let bMinY = Infinity;
    let bMaxX = -Infinity;
    let bMaxY = -Infinity;

    parsedElements.forEach((el) => {
      if (el.type === "pencil" && el.points && el.points.length > 0) {
        hasCoords = true;
        el.points.forEach((p) => {
          bMinX = Math.min(bMinX, p.x);
          bMinY = Math.min(bMinY, p.y);
          bMaxX = Math.max(bMaxX, p.x);
          bMaxY = Math.max(bMaxY, p.y);
        });
      } else {
        hasCoords = true;
        const ex2 = el.x + (el.width || 0);
        const ey2 = el.y + (el.height || 0);
        bMinX = Math.min(bMinX, el.x, ex2);
        bMinY = Math.min(bMinY, el.y, ey2);
        bMaxX = Math.max(bMaxX, el.x, ex2);
        bMaxY = Math.max(bMaxY, el.y, ey2);
      }
    });

    if (hasCoords && isFinite(bMinX) && isFinite(bMaxX)) {
      minX = Math.min(0, bMinX);
      minY = Math.min(0, bMinY);
      maxX = Math.max(800, bMaxX);
      maxY = Math.max(500, bMaxY);
    }
  }

  const headerHeight = 76;
  const canvasPadding = 40;
  const drawOffsetY = headerHeight + 24; // Ensures all drawings start strictly below the top header

  // Dynamic canvas sizing to fit all drawings with comfortable breathing room
  const contentWidth = Math.max(1000, maxX + canvasPadding * 2);
  const contentHeight = Math.max(650, maxY + drawOffsetY + canvasPadding * 2);

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const scale = 2; // 2x Retina crisp sharpness
  canvas.width = contentWidth * scale;
  canvas.height = contentHeight * scale;
  ctx.scale(scale, scale);

  // 1. Plain dark canvas background
  ctx.fillStyle = "#080E1E";
  ctx.fillRect(0, 0, contentWidth, contentHeight);

  // 2. Background Grid Dot Pattern (Canvas area)
  ctx.fillStyle = "rgba(255, 255, 255, 0.04)";
  const dotSpacing = 26;
  for (let x = 16; x < contentWidth; x += dotSpacing) {
    for (let y = drawOffsetY; y < contentHeight; y += dotSpacing) {
      ctx.beginPath();
      ctx.arc(x, y, 1.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // 3. Top Header Bar (Clean dedicated bar at the top)
  ctx.fillStyle = "#0F172A";
  ctx.fillRect(0, 0, contentWidth, headerHeight);

  // Header bottom border
  ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, headerHeight);
  ctx.lineTo(contentWidth, headerHeight);
  ctx.stroke();

  // Header Brand Pill
  ctx.fillStyle = "rgba(197, 255, 74, 0.15)";
  ctx.fillRect(canvasPadding, 18, 160, 24);
  ctx.strokeStyle = "rgba(197, 255, 74, 0.4)";
  ctx.lineWidth = 1;
  ctx.strokeRect(canvasPadding, 18, 160, 24);

  ctx.fillStyle = "#C5FF4A";
  ctx.font = "bold 11px 'Plus Jakarta Sans', sans-serif";
  ctx.fillText("STUDYSPHERE CANVAS", canvasPadding + 14, 34);

  // Header Topic & Room Info
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "bold 20px 'Plus Jakarta Sans', sans-serif";
  ctx.fillText(`/${topic}`, canvasPadding + 175, 36);

  ctx.fillStyle = "#94A3B8";
  ctx.font = "600 13px 'Plus Jakarta Sans', sans-serif";
  ctx.fillText(`📅 ${date}   •   Room: ${roomId}`, contentWidth - canvasPadding - 220, 36);

  // 4. Render All Whiteboard Drawings Strictly Below the Header
  if (parsedElements.length > 0) {
    parsedElements.forEach((el) => {
      ctx.strokeStyle = el.color || "#C5FF4A";
      ctx.fillStyle = el.color || "#C5FF4A";
      ctx.lineWidth = el.strokeWidth || 4;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      // Apply drawOffsetY to avoid any overlap with the top header
      const startX = el.x + canvasPadding;
      const startY = el.y + drawOffsetY;

      switch (el.type) {
        case "pencil": {
          if (!el.points || el.points.length === 0) return;
          ctx.beginPath();
          ctx.moveTo(el.points[0]!.x + canvasPadding, el.points[0]!.y + drawOffsetY);
          for (let i = 1; i < el.points.length; i++) {
            ctx.lineTo(el.points[i]!.x + canvasPadding, el.points[i]!.y + drawOffsetY);
          }
          ctx.stroke();
          break;
        }

        case "rect": {
          const w = el.width || 0;
          const h = el.height || 0;
          ctx.beginPath();
          ctx.rect(startX, startY, w, h);
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
          const cx = startX + (el.width || 0) / 2;
          const cy = startY + (el.height || 0) / 2;
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
          const endX = startX + (el.width || 0);
          const endY = startY + (el.height || 0);
          ctx.beginPath();
          ctx.moveTo(startX, startY);
          ctx.lineTo(endX, endY);
          ctx.stroke();
          break;
        }

        case "arrow": {
          const endX = startX + (el.width || 0);
          const endY = startY + (el.height || 0);
          const headlen = 14;
          const angle = Math.atan2(endY - startY, endX - startX);

          ctx.beginPath();
          ctx.moveTo(startX, startY);
          ctx.lineTo(endX, endY);
          ctx.stroke();

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
          ctx.font = `${Math.max(16, el.strokeWidth * 4)}px 'Plus Jakarta Sans', sans-serif`;
          ctx.textBaseline = "top";
          ctx.fillText(el.text, startX, startY);
          break;
        }
      }
    });
  } else if (notesFallback) {
    ctx.fillStyle = "#E2E8F0";
    ctx.font = "18px 'Plus Jakarta Sans', sans-serif";
    ctx.fillText(notesFallback.substring(0, 300), canvasPadding, drawOffsetY + 50);
  } else {
    ctx.fillStyle = "#64748B";
    ctx.font = "italic 16px 'Plus Jakarta Sans', sans-serif";
    ctx.fillText("No drawings recorded on this whiteboard session.", canvasPadding, drawOffsetY + 50);
  }

  // 5. Clean Footer at bottom
  ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(canvasPadding, contentHeight - 32);
  ctx.lineTo(contentWidth - canvasPadding, contentHeight - 32);
  ctx.stroke();

  ctx.fillStyle = "#64748B";
  ctx.font = "500 12px 'Plus Jakarta Sans', sans-serif";
  ctx.fillText("StudySphere Real-Time Collaborative Canvas • Exported PNG", canvasPadding, contentHeight - 16);

  // 6. Trigger Download
  const filename = `${(topic || "StudySphere").replace(/[^a-zA-Z0-9_-]/g, "_")}_Whiteboard.png`;
  const link = document.createElement("a");
  link.download = filename;
  link.href = canvas.toDataURL("image/png");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
