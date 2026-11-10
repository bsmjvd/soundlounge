"use client";

import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X, Copy, Check, ShieldCheck, Link2, Loader2 } from "lucide-react";
import { useFocusTrap } from "../hooks/useFocusTrap";

interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomId: string;
  inviteToken?: string;
}

export function InviteModal({ isOpen, onClose, roomId, inviteToken }: InviteModalProps) {
  const [copied, setCopied] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [copyError, setCopyError] = useState("");
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const shell = document.getElementById("app-shell");
    shell?.setAttribute("inert", "");
    return () => shell?.removeAttribute("inert");
  }, [isOpen]);

  useFocusTrap(isOpen, panelRef, onClose);

  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  if (!isOpen || typeof document === "undefined") return null;

  const handleCreatePrivate = async () => {
    setIsCreating(true);
    setCreateError("");
    try {
      const workerHttpUrl = process.env.NEXT_PUBLIC_WORKER_HTTP_URL || "http://localhost:8787";
      const res = await fetch(`${workerHttpUrl}/api/rooms`, { method: "POST" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const { roomId: newRoomId, inviteToken: newToken } = await res.json();
      window.location.assign(`/?room=${encodeURIComponent(newRoomId)}&invite=${encodeURIComponent(newToken)}`);
    } catch {
      setCreateError("Couldn't create a private room. Try again.");
      setIsCreating(false);
    }
  };

  const origin = typeof window !== "undefined" ? window.location.origin : "https://soundlounge.vercel.app";
  const inviteUrl = `${origin}/?room=${encodeURIComponent(roomId)}${
    inviteToken ? `&invite=${encodeURIComponent(inviteToken)}` : ""
  }`;

  const handleCopy = async () => {
    try {
      if (!navigator.clipboard) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(inviteUrl);
      setCopyError("");
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopyError("Copy failed. Select the link and copy it manually.");
    }
  };

  return createPortal(
    <div
      className="animate-modal-overlay-in fixed inset-0 z-[220] flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="invite-title"
        tabIndex={-1}
        className="animate-modal-panel-in surface-panel rounded-card w-full max-w-md p-5 sm:p-6 space-y-5 outline-none"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-control bg-ember/15 border border-ember/30 flex items-center justify-center text-ember">
              <Link2 className="w-5 h-5" />
            </div>
            <div>
              <h3 id="invite-title" className="text-sm font-bold text-ink font-display">
                Invite to Sync Lounge
              </h3>
              <p className="text-[11px] text-ink-muted">Share instant sub-30ms listening session</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close invite modal"
            className="w-11 h-11 -mr-1 -mt-1 flex items-center justify-center rounded-control text-ink-muted hover:text-ink hover:bg-ink/10 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-ink-secondary leading-relaxed">
          Anyone with this private link will join your room and synchronize their audio player to within sub-30ms using
          precision edge NTP clock barriers.
        </p>

        <div className="space-y-2">
          <label
            htmlFor="invite-url"
            className="text-[11px] font-bold text-ink-muted uppercase tracking-wider"
          >
            Shareable Invite URL
          </label>

          <div className="flex items-center gap-2 bg-canvas/60 border border-line-strong rounded-control p-2">
            <input
              id="invite-url"
              type="text"
              readOnly
              value={inviteUrl}
              className="bg-transparent border-none text-base sm:text-xs text-ink-secondary w-full outline-none px-2 font-mono"
            />
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1.5 bg-accent hover:bg-accent-strong text-accent-foreground px-4 min-h-11 rounded-control text-xs font-bold transition-colors active:scale-[0.98] cursor-pointer flex-shrink-0"
            >
              <span
                key={copied ? "copied" : "copy"}
                className="animate-icon-swap flex items-center gap-1.5"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? "Copied!" : "Copy"}
              </span>
            </button>
          </div>
          <span className="sr-only" role="status">
            {copied ? "Invite link copied" : ""}
          </span>
          {copyError && (
            <p role="alert" className="text-[11px] text-danger">
              {copyError}
            </p>
          )}
        </div>

        {inviteToken ? (
          <div className="flex items-center gap-2.5 bg-positive/15 border border-positive/30 rounded-2xl p-3 text-xs text-positive">
            <ShieldCheck className="w-4 h-4 flex-shrink-0 text-positive" />
            <span>Private room access key is securely embedded in the link.</span>
          </div>
        ) : (
          <div className="space-y-1.5">
            <button
              type="button"
              onClick={handleCreatePrivate}
              disabled={isCreating}
              aria-busy={isCreating}
              className="w-full min-h-11 flex items-center justify-center gap-2 border border-positive/30 bg-positive/10 hover:bg-positive/20 text-positive rounded-control p-3 text-xs font-bold transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-wait"
            >
              {isCreating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ShieldCheck className="w-4 h-4" />
              )}
              Create a private room instead
            </button>
            {createError && (
              <p role="alert" className="text-[11px] text-danger text-center">
                {createError}
              </p>
            )}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
