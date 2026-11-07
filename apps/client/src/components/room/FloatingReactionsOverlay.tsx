"use client";

import React, { useState } from "react";

interface ReactionParticle {
  id: string;
  emoji: string;
  x: number; // percentage 0-100
}

interface FloatingReactionsOverlayProps {
  onSendReaction?: (emoji: string) => void;
  className?: string;
}

const EMOJIS = ["❤️", "🔥", "🎵", "🚀", "👏", "⚡"];

export function FloatingReactionsOverlay({ onSendReaction, className = "" }: FloatingReactionsOverlayProps) {
  const [particles, setParticles] = useState<ReactionParticle[]>([]);

  const triggerReaction = (emoji: string) => {
    const id = `${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    const x = Math.floor(Math.random() * 60) + 20; // 20% to 80%

    setParticles((prev) => [...prev, { id, emoji, x }]);

    if (onSendReaction) {
      onSendReaction(emoji);
    }

    // Auto remove particle after animation finishes
    setTimeout(() => {
      setParticles((prev) => prev.filter((p) => p.id !== id));
    }, 2200);
  };

  return (
    <div className={`relative ${className}`}>
      {/* Floating Particles Area */}
      <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
        {particles.map((particle) => (
          <div
            key={particle.id}
            className="absolute bottom-24 text-2xl sm:text-3xl animate-[float-up_2s_ease-out_forwards] select-none"
            style={{ left: `${particle.x}%` }}
          >
            {particle.emoji}
          </div>
        ))}
      </div>

      {/* Interactive Emoji Reaction Dock */}
      <div className="flex items-center gap-1.5 p-1.5 rounded-full bg-slate-900/80 border border-slate-700/60 shadow-lg backdrop-blur-md">
        {EMOJIS.map((emoji) => (
          <button
            key={emoji}
            onClick={() => triggerReaction(emoji)}
            className="w-8 h-8 rounded-full hover:bg-slate-800 flex items-center justify-center text-sm transition-transform hover:scale-125 active:scale-95 cursor-pointer"
            aria-label={`Send ${emoji} reaction`}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}
