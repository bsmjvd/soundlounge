"use client";

import React, { useState } from "react";
import { X, Copy, Check, ShieldCheck, Link2 } from "lucide-react";

interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomId: string;
  inviteToken?: string;
}

export function InviteModal({ isOpen, onClose, roomId, inviteToken }: InviteModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const origin = typeof window !== "undefined" ? window.location.origin : "https://soundlounge.app";
  const inviteUrl = `${origin}/?room=${encodeURIComponent(roomId)}${
    inviteToken ? `&invite=${encodeURIComponent(inviteToken)}` : ""
  }`;

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="bg-[#121622]/95 border border-white/10 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-5 backdrop-blur-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/15 border border-sky-400/30 flex items-center justify-center text-sky-400 shadow-md shadow-sky-500/20">
              <Link2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Invite to Sync Lounge</h3>
              <p className="text-[11px] text-gray-400">Share instant sub-30ms listening session</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close invite modal"
            className="p-1.5 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-gray-300 leading-relaxed">
          Anyone with this private link will join your room and synchronize their audio player to within sub-30ms using precision edge NTP clock barriers.
        </p>

        <div className="space-y-2">
          <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
            Shareable Invite URL
          </label>
          <div className="flex items-center gap-2 bg-black/60 border border-white/10 rounded-2xl p-2 shadow-inner">
            <input
              type="text"
              readOnly
              value={inviteUrl}
              className="bg-transparent border-none text-xs text-gray-200 w-full outline-none px-2 font-mono"
            />
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 bg-white hover:bg-gray-100 text-black px-4 py-2 rounded-xl text-xs font-bold shadow-md shadow-white/10 transition-all hover:scale-105 active:scale-95 cursor-pointer flex-shrink-0"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-black" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        </div>

        {inviteToken && (
          <div className="flex items-center gap-2.5 bg-emerald-500/15 border border-emerald-500/30 rounded-2xl p-3 text-xs text-emerald-300">
            <ShieldCheck className="w-4 h-4 flex-shrink-0 text-emerald-400" />
            <span>Private room access key is securely embedded in the link.</span>
          </div>
        )}
      </div>
    </div>
  );
}
