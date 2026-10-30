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
      <div className="bg-[#131722] border border-red-500/30 rounded-2xl max-w-md w-full p-8 shadow-2xl text-center space-y-5">
        <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-7 h-7" />
        </div>

        <div>
          <h2 className="text-lg font-bold text-white">Private Room Access Denied</h2>
          <p className="text-xs text-gray-400 mt-1">
            Room <span className="font-mono text-gray-200">{roomId}</span> is private (error 4003). A valid invite token is required to join this synchronized listening session.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex items-center gap-2 bg-[#0b0d13] border border-[#1f2638] rounded-xl px-3 py-2">
            <KeyRound className="w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Paste invite token here..."
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              required
              className="bg-transparent border-none text-xs text-white placeholder-gray-500 outline-none w-full"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-2 rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-colors"
          >
            Unlock & Join Session
          </button>
        </form>

        <button
          onClick={onReturnToSolo}
          className="flex items-center justify-center gap-2 text-xs text-gray-400 hover:text-white mx-auto pt-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Return to Solo Mode
        </button>
      </div>
    </div>
  );
}
