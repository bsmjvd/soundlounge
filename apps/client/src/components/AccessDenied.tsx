"use client";

import React, { useState } from "react";
import { ShieldAlert, ArrowLeft, KeyRound } from "lucide-react";

interface AccessDeniedProps {
  roomId: string;
  onRetryWithToken: (token: string) => void;
  onReturnToSolo: () => void;
}

export function AccessDenied({ roomId, onRetryWithToken, onReturnToSolo }: AccessDeniedProps) {
  const [tokenInput, setTokenInput] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (tokenInput.trim()) {
      onRetryWithToken(tokenInput.trim());
    }
  };

  return (
    <div className="min-h-[500px] flex items-center justify-center p-6">
      <div className="bg-surface border border-danger/30 rounded-card shadow-panel max-w-md w-full p-6 sm:p-8 text-center space-y-5">
        <div className="w-14 h-14 rounded-control bg-danger/10 border border-danger/20 text-danger flex items-center justify-center mx-auto">
          <ShieldAlert className="w-7 h-7" />
        </div>

        <div>
          <h2 className="text-lg font-bold text-ink font-display">Private Room Access Denied</h2>
          <p className="text-xs text-ink-muted mt-1">
            Room <span className="font-mono text-ink-secondary">{roomId}</span> is private (error 4003). A valid invite token is required to join this synchronized listening session.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex items-center gap-2 bg-canvas border border-line-strong rounded-control px-3 py-1">
            <KeyRound className="w-4 h-4 text-ink-subtle" />
            <label htmlFor="invite-token" className="sr-only">
              Invite token
            </label>
            <input
              id="invite-token"
              type="text"
              name="invite-token"
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
              enterKeyHint="done"
              placeholder="Paste invite token here..."
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              required
              className="bg-transparent border-none min-h-11 text-base sm:text-xs text-ink placeholder-ink-subtle outline-none w-full"
            />
          </div>
          <button
            type="submit"
            className="w-full min-h-11 bg-accent hover:bg-accent-strong text-accent-foreground py-2 rounded-control text-xs font-semibold transition-colors cursor-pointer"
          >
            Unlock & Join Session
          </button>
        </form>

        <button
          onClick={onReturnToSolo}
          className="flex min-h-11 items-center justify-center gap-2 text-xs text-ink-muted hover:text-ink mx-auto px-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Return to Solo Mode
        </button>
      </div>
    </div>
  );
}
