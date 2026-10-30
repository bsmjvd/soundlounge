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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-[#131722] border border-[#1f2638] rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-sky-500/10 flex items-center justify-center text-sky-400">
              <Link2 className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-white">Invite Friends to Sync Lounge</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-[#1f2638]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-gray-400">
          Anyone with this link will sync audio playback to within 30 milliseconds using edge NTP clock synchronization.
        </p>

        <div className="space-y-1.5">
          <label className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">
            Shareable Invite URL
          </label>
          <div className="flex items-center gap-2 bg-[#0b0d13] border border-[#1f2638] rounded-xl p-2">
            <input
              type="text"
              readOnly
              value={inviteUrl}
              className="bg-transparent border-none text-xs text-gray-300 w-full outline-none px-1"
            />
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex-shrink-0 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        </div>

        {inviteToken && (
          <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-2.5 text-xs text-emerald-400">
            <ShieldCheck className="w-4 h-4 flex-shrink-0" />
            <span>Private room security token embedded automatically.</span>
          </div>
        )}
      </div>
    </div>
  );
}
