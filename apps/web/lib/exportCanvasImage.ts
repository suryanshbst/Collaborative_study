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

  // If no elements passed, try to fetch from sessionStorage for this room
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

  // If still empty and notes exist, we can render notes fallback or an empty whiteboard with topic
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const width = 1400;
  const height = 900;
  const scale = 2; // 2x Retina resolution

  canvas.width = width * scale;
  canvas.height = height * scale;
  ctx.scale(scale, scale);

  // 1. Background
  const bgGrad = ctx.createLinearGradient(0, 0, width, height);
  bgGrad.addColorStop(0, "#0F172A");
  bgGrad.addColorStop(1, "#080E1E");
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // 2. Background Grid Dot Pattern
  ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
  const dotSpacing = 28;
  for (let x = 20; x < width; x += dotSpacing) {
    for (let y = 20; y < height; y += dotSpacing) {
      ctx.beginPath();
      ctx.arc(x, y, 1.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // 3. Top Branding Header
  ctx.fillStyle = "#C5FF4A";
  ctx.font = "bold 13px 'Plus Jakarta Sans', sans-serif";
  ctx.fillText("STUDYSPHERE WHITEBOARD CANVAS", 40, 45);

  ctx.fillStyle = "#FFFFFF";
  ctx.font = "bold 24px 'Plus Jakarta Sans', sans-serif";
  ctx.fillText(`/${topic}`, 40, 75);

  ctx.fillStyle = "#94A3B8";
  ctx.font = "600 13px 'Plus Jakarta Sans', sans-serif";
  ctx.fillText(`📅 ${date} • Room: ${roomId}`, 40, 98);

  ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(40, 115);
  ctx.lineTo(width - 40, 115);
  ctx.stroke();

  // 4. Render All Whiteboard Elements
  if (parsedElements.length > 0) {
    parsedElements.forEach((el) => {
      ctx.strokeStyle = el.color || "#C5FF4A";
      ctx.fillStyle = el.color || "#C5FF4A";
      ctx.lineWidth = el.strokeWidth || 4;
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
          ctx.fillText(el.text, el.x, el.y);
          break;
        }
      }
    });
  } else if (notesFallback) {
    // If no canvas drawing was made, render the notes content cleanly
    ctx.fillStyle = "#E2E8F0";
    ctx.font = "18px 'Plus Jakarta Sans', sans-serif";
    ctx.fillText(notesFallback.substring(0, 300), 50, 180);
  } else {
    ctx.fillStyle = "#64748B";
    ctx.font = "italic 16px 'Plus Jakarta Sans', sans-serif";
    ctx.fillText("No drawings recorded on this whiteboard session.", 50, 180);
  }

  // 5. Footer Watermark
  ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(40, height - 40);
  ctx.lineTo(width - 40, height - 40);
  ctx.stroke();

  ctx.fillStyle = "#64748B";
  ctx.font = "500 12px 'Plus Jakarta Sans', sans-serif";
  ctx.fillText("StudySphere Real-Time Collaborative Canvas • Exported PNG", 40, height - 20);

  // 6. Download Trigger
  const filename = `${(topic || "StudySphere").replace(/[^a-zA-Z0-9_-]/g, "_")}_Whiteboard.png`;
  const link = document.createElement("a");
  link.download = filename;
  link.href = canvas.toDataURL("image/png");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
