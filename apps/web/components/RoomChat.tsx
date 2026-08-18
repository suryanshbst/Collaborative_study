"use client";

import React, { useState, useEffect, useRef } from "react";
import { Send, MessageSquare, Sparkles } from "lucide-react";
import type { ChatMessage } from "@/lib/types";

interface RoomChatProps {
  messages: ChatMessage[];
  currentUsername: string;
  onSendMessage: (messageText: string) => void;
}

export function RoomChat({
  messages,
  currentUsername,
  onSendMessage,
}: RoomChatProps) {
  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;

    onSendMessage(inputText.trim());
    setInputText("");
  };

  return (
    <div className="w-full h-full flex flex-col glass-panel overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-[var(--border-subtle)] flex items-center justify-between bg-slate-900/60">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-indigo-400" />
          <h3 className="text-sm font-bold text-white">Room Discussion</h3>
          <span className="text-[10px] bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded-full font-semibold border border-indigo-500/20">
            {messages.length}
          </span>
        </div>
      </div>

      {/* Message List */}
      <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-3">
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-slate-500 gap-2">
            <Sparkles className="w-8 h-8 text-indigo-500/40" />
            <p className="text-xs">No messages yet. Say hello or share study links!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe =
              msg.sender.toLowerCase() === currentUsername.toLowerCase() ||
              msg.isMe;

            const time = msg.timestamp
              ? new Date(msg.timestamp).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "";

            return (
              <div
                key={msg.id}
                className={`flex flex-col max-w-[85%] ${
                  isMe ? "self-end items-end" : "self-start items-start"
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1 px-1">
                  <span className="text-[11px] font-semibold text-slate-400">
                    {isMe ? "You" : msg.sender}
                  </span>
                  <span className="text-[10px] text-slate-500">{time}</span>
                </div>

                <div
                  className={`p-3 rounded-2xl text-xs leading-relaxed break-words shadow-md ${
                    isMe
                      ? "bg-indigo-600 text-white rounded-br-none"
                      : "bg-slate-800/90 text-slate-200 border border-slate-700/50 rounded-bl-none"
                  }`}
                >
                  {msg.message}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input bar */}
      <form
        onSubmit={handleSend}
        className="p-3 border-t border-[var(--border-subtle)] bg-slate-900/60 flex items-center gap-2"
      >
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 input-field py-2 px-3 text-xs"
        />
        <button
          type="submit"
          disabled={!inputText.trim()}
          className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white transition-colors flex items-center justify-center shadow-md shadow-indigo-600/25"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
