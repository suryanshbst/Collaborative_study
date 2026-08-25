/**
 * Exports study notes and session summary as a beautifully formatted high-res PNG image.
 */
interface ExportNotesImageOptions {
  topic?: string;
  goal?: string;
  notes?: string;
  date?: string;
  completedSessions?: number;
  totalSessions?: number;
  durationMin?: number;
}

export function exportNotesAsImage({
  topic = "Study Session",
  goal = "Focus Goal",
  notes = "",
  date = new Date().toLocaleDateString(),
  completedSessions = 0,
  totalSessions = 4,
  durationMin = 25,
}: ExportNotesImageOptions) {
  if (typeof window === "undefined") return;

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const width = 1000;
  const padding = 50;
  const contentWidth = width - padding * 2;

  // Split notes into lines and wrap text
  const noteLines: string[] = [];
  const rawParagraphs = (notes || "No notes recorded for this session.").split("\n");

  ctx.font = "18px 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

  rawParagraphs.forEach((para) => {
    if (!para.trim()) {
      noteLines.push("");
      return;
    }

    const words = para.split(" ");
    let currentLine = "";

    words.forEach((word) => {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const metrics = ctx.measureText(testLine);
      if (metrics.width > contentWidth && currentLine) {
        noteLines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    });

    if (currentLine) {
      noteLines.push(currentLine);
    }
  });

  // Calculate dynamic canvas height
  const headerHeight = 260;
  const lineHeight = 28;
  const notesBodyHeight = Math.max(120, noteLines.length * lineHeight + 40);
  const footerHeight = 70;
  const totalHeight = headerHeight + notesBodyHeight + footerHeight;

  // Set high-res canvas size (2x for retina sharpness)
  const scale = 2;
  canvas.width = width * scale;
  canvas.height = totalHeight * scale;
  ctx.scale(scale, scale);

  // 1. Background Gradient
  const bgGrad = ctx.createLinearGradient(0, 0, width, totalHeight);
  bgGrad.addColorStop(0, "#0F172A");
  bgGrad.addColorStop(1, "#080E1E");
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, totalHeight);

  // Background Grid Accent Dots
  ctx.fillStyle = "rgba(255, 255, 255, 0.03)";
  for (let x = 20; x < width; x += 30) {
    for (let y = 20; y < totalHeight; y += 30) {
      ctx.beginPath();
      ctx.arc(x, y, 1.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // 2. Outer Border & Header Card
  ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
  ctx.lineWidth = 1.5;
  ctx.strokeRect(16, 16, width - 32, totalHeight - 32);

  // Brand Header
  ctx.fillStyle = "#C5FF4A";
  ctx.font = "bold 14px 'Plus Jakarta Sans', sans-serif";
  ctx.fillText("STUDYSPHERE COLLABORATIVE SESSION", padding, padding + 10);

  // Topic Title
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "bold 32px 'Plus Jakarta Sans', sans-serif";
  ctx.fillText(`/${topic}`, padding, padding + 52);

  // Goal Subtitle
  ctx.fillStyle = "#94A3B8";
  ctx.font = "600 18px 'Plus Jakarta Sans', sans-serif";
  ctx.fillText(`🎯 Goal: ${goal}`, padding, padding + 86);

  // Badges / Metadata Row
  const badgeY = padding + 120;

  // Date Badge
  ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
  ctx.fillRect(padding, badgeY, 180, 36);
  ctx.fillStyle = "#E2E8F0";
  ctx.font = "600 14px 'Plus Jakarta Sans', sans-serif";
  ctx.fillText(`📅 ${date}`, padding + 14, badgeY + 23);

  // Pomodoro Sessions Badge
  ctx.fillStyle = "rgba(197, 255, 74, 0.12)";
  ctx.fillRect(padding + 195, badgeY, 210, 36);
  ctx.fillStyle = "#C5FF4A";
  ctx.fillText(`🍅 ${completedSessions}/${totalSessions} Focus Sessions`, padding + 209, badgeY + 23);

  // Duration Badge
  ctx.fillStyle = "rgba(56, 189, 248, 0.12)";
  ctx.fillRect(padding + 420, badgeY, 160, 36);
  ctx.fillStyle = "#38BDF8";
  ctx.fillText(`⏱️ ~${durationMin} mins total`, padding + 434, badgeY + 23);

  // 3. Divider
  ctx.strokeStyle = "rgba(197, 255, 74, 0.35)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(padding, headerHeight - 20);
  ctx.lineTo(width - padding, headerHeight - 20);
  ctx.stroke();

  // 4. Notes Section Header
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "bold 20px 'Plus Jakarta Sans', sans-serif";
  ctx.fillText("📝 Shared Notes", padding, headerHeight + 15);

  // 5. Notes Body
  ctx.fillStyle = "#E2E8F0";
  ctx.font = "17px 'Plus Jakarta Sans', sans-serif";

  let currentY = headerHeight + 52;
  noteLines.forEach((line) => {
    if (line.startsWith("# ")) {
      ctx.fillStyle = "#C5FF4A";
      ctx.font = "bold 22px 'Plus Jakarta Sans', sans-serif";
      ctx.fillText(line.replace("# ", ""), padding, currentY);
      ctx.font = "17px 'Plus Jakarta Sans', sans-serif";
      ctx.fillStyle = "#E2E8F0";
    } else if (line.startsWith("## ")) {
      ctx.fillStyle = "#38BDF8";
      ctx.font = "bold 19px 'Plus Jakarta Sans', sans-serif";
      ctx.fillText(line.replace("## ", ""), padding, currentY);
      ctx.font = "17px 'Plus Jakarta Sans', sans-serif";
      ctx.fillStyle = "#E2E8F0";
    } else if (line.startsWith("- ") || line.startsWith("* ")) {
      ctx.fillStyle = "#C5FF4A";
      ctx.fillText("•", padding + 8, currentY);
      ctx.fillStyle = "#E2E8F0";
      ctx.fillText(line.substring(2), padding + 26, currentY);
    } else {
      ctx.fillText(line, padding, currentY);
    }
    currentY += lineHeight;
  });

  // 6. Footer Watermark
  const footerY = totalHeight - 32;
  ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(padding, footerY - 18);
  ctx.lineTo(width - padding, footerY - 18);
  ctx.stroke();

  ctx.fillStyle = "#64748B";
  ctx.font = "500 13px 'Plus Jakarta Sans', sans-serif";
  ctx.fillText("Generated with StudySphere • Peer-to-Peer Collaborative Study Platform", padding, footerY + 4);

  // 7. Trigger Image Download
  const filename = `${topic.replace(/[^a-zA-Z0-9_-]/g, "_")}_Notes.png`;
  const link = document.createElement("a");
  link.download = filename;
  link.href = canvas.toDataURL("image/png");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
