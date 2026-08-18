"use client";

import React, { useState, useEffect, useRef } from "react";
import { FileText, Download, Trash2, Check, Sparkles } from "lucide-react";

interface NotesEditorProps {
  initialNotes: string;
  onUpdateNotes: (notes: string) => void;
  topic?: string;
}

export function NotesEditor({
  initialNotes,
  onUpdateNotes,
  topic = "Study Session",
}: NotesEditorProps) {
  const [content, setContent] = useState(initialNotes);
  const [isSaved, setIsSaved] = useState(true);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync external incoming notes changes
  useEffect(() => {
    if (initialNotes !== content) {
      setContent(initialNotes);
    }
  }, [initialNotes]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const nextContent = e.target.value;
    setContent(nextContent);
    setIsSaved(false);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      onUpdateNotes(nextContent);
      setIsSaved(true);
    }, 400);
  };

  const handleDownload = () => {
    const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${topic.toLowerCase().replace(/\s+/g, "-")}-notes.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleClear = () => {
    if (confirm("Are you sure you want to clear notes for this room?")) {
      setContent("");
      onUpdateNotes("");
    }
  };

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;

  return (
    <div className="w-full h-full flex flex-col glass-panel overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-[var(--border-subtle)] flex items-center justify-between bg-slate-900/60">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-indigo-400" />
          <h3 className="text-sm font-bold text-white">Collaborative Notes</h3>
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 font-medium ${
              isSaved
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
            }`}
          >
            {isSaved ? (
              <>
                <Check className="w-3 h-3" />
                Synced
              </>
            ) : (
              "Saving..."
            )}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handleDownload}
            className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-slate-800 transition-colors"
            title="Download Notes (.md)"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            onClick={handleClear}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
            title="Clear Notes"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Editor Area */}
      <div className="flex-1 p-4 flex flex-col">
        <textarea
          value={content}
          onChange={handleChange}
          placeholder="Jot down shared insights, formulas, code snippets, or notes in real time... (Synced across all participants)"
          className="w-full flex-1 bg-transparent resize-none border-none outline-none text-slate-200 text-sm leading-relaxed placeholder:text-slate-500 font-mono"
        />
      </div>

      {/* Footer info */}
      <div className="px-4 py-2 bg-slate-900/40 border-t border-[var(--border-subtle)] flex items-center justify-between text-[11px] text-slate-400">
        <span>Markdown formatting supported</span>
        <span>
          {wordCount} words • {content.length} chars
        </span>
      </div>
    </div>
  );
}
