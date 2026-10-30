"use client";

import React, { useState, useRef } from "react";
import { UploadCloud, Youtube, Music, Plus, Check, Loader2 } from "lucide-react";
import type { Track, TrackSource } from "@soundlounge/shared";

interface MusicIngestionProps {
  onAddTrack: (track: Track, playNext?: boolean) => void;
  roomId: string;
  workerHttpUrl?: string;
}

export function MusicIngestion({
  onAddTrack,
  roomId,
  workerHttpUrl = process.env.NEXT_PUBLIC_WORKER_HTTP_URL || "http://localhost:8787",
}: MusicIngestionProps) {
  const [activeTab, setActiveTab] = useState<TrackSource>("upload");
  const [urlInput, setUrlInput] = useState("");
  const [titleInput, setTitleInput] = useState("");
  const [artistInput, setArtistInput] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (file: File, playNext: boolean = false) => {
    setIsUploading(true);
    setUploadProgress(10);

    try {
      // 1. Request presigned R2 PUT URL from Worker
      const presignRes = await fetch(`${workerHttpUrl}/api/rooms/${roomId}/upload-url`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          contentType: file.type || "audio/mpeg",
        }),
      });

      if (!presignRes.ok) {
        throw new Error("Failed to get presigned upload URL");
      }

      const { uploadUrl, publicUrl, key } = await presignRes.json();
      setUploadProgress(40);

      // 2. Direct upload to Cloudflare R2 bucket (or test endpoint)
      try {
        await fetch(uploadUrl, {
          method: "PUT",
          headers: { "Content-Type": file.type || "audio/mpeg" },
          body: file,
        });
      } catch {
        // Fallback or local simulation
      }
      setUploadProgress(90);

      // Estimate duration or default
      const durationMs = 210000; // 3.5 min default if unmeasured
      const track: Track = {
        id: `upl_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        title: file.name.replace(/\.[^/.]+$/, ""),
        artist: "Local Upload",
        durationMs,
        url: publicUrl || URL.createObjectURL(file),
        source: "upload",
        r2Key: key,
        createdAt: Date.now(),
      };

      onAddTrack(track, playNext);
      setUploadProgress(100);
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
      }, 500);
    } catch (err) {
      console.error("Upload error", err);
      // Fallback local blob URL
      const track: Track = {
        id: `upl_${Date.now()}`,
        title: file.name.replace(/\.[^/.]+$/, ""),
        artist: "Local Upload",
        durationMs: 180000,
        url: URL.createObjectURL(file),
        source: "upload",
        createdAt: Date.now(),
      };
      onAddTrack(track, playNext);
      setIsUploading(false);
    }
  };

  const handleExternalSubmit = (e: React.FormEvent, playNext: boolean = false) => {
    e.preventDefault();
    if (!urlInput.trim()) return;

    const track: Track = {
      id: `${activeTab}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      title: titleInput.trim() || `${activeTab === "youtube" ? "YouTube Audio" : "SoundCloud Audio"} Track`,
      artist: artistInput.trim() || "Soundlounge Stream",
      durationMs: 240000, // 4 mins estimated
      url: urlInput.trim(),
      source: activeTab,
      coverUrl:
        activeTab === "youtube"
          ? "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&auto=format&fit=crop&q=60"
          : undefined,
      createdAt: Date.now(),
    };

    onAddTrack(track, playNext);
    setUrlInput("");
    setTitleInput("");
    setArtistInput("");
  };

  return (
    <div className="bg-[#131722] border border-[#1f2638] rounded-2xl p-5 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-gray-200 flex items-center gap-2">
          <Plus className="w-4 h-4 text-indigo-400" />
          Add Music to Lounge
        </h2>
        {/* Source Selector Tabs */}
        <div className="flex bg-[#0b0d13] p-1 rounded-lg border border-[#1f2638] text-xs">
          <button
            onClick={() => setActiveTab("upload")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-medium transition-all ${
              activeTab === "upload" ? "bg-indigo-600 text-white" : "text-gray-400 hover:text-white"
            }`}
          >
            <UploadCloud className="w-3.5 h-3.5" />
            File Upload
          </button>
          <button
            onClick={() => setActiveTab("youtube")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-medium transition-all ${
              activeTab === "youtube" ? "bg-red-600 text-white" : "text-gray-400 hover:text-white"
            }`}
          >
            <Youtube className="w-3.5 h-3.5" />
            YouTube
          </button>
          <button
            onClick={() => setActiveTab("soundcloud")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-medium transition-all ${
              activeTab === "soundcloud" ? "bg-amber-600 text-white" : "text-gray-400 hover:text-white"
            }`}
          >
            <Music className="w-3.5 h-3.5" />
            SoundCloud
          </button>
        </div>
      </div>

      {activeTab === "upload" ? (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            if (e.dataTransfer.files?.[0]) {
              handleFileUpload(e.dataTransfer.files[0]);
            }
          }}
          className="border-2 border-dashed border-[#1f2638] hover:border-indigo-500/50 rounded-xl p-6 text-center cursor-pointer transition-all bg-[#0b0d13]/50"
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.[0]) {
                handleFileUpload(e.target.files[0]);
              }
            }}
          />
          {isUploading ? (
            <div className="flex flex-col items-center justify-center gap-2">
              <Loader2 className="w-7 h-7 text-indigo-400 animate-spin" />
              <p className="text-xs text-gray-300 font-medium">
                Uploading directly to Cloudflare R2... {uploadProgress}%
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-2">
              <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                <UploadCloud className="w-5 h-5" />
              </div>
              <p className="text-xs text-gray-300 font-medium">
                Drag & drop audio files here, or <span className="text-indigo-400 underline">browse</span>
              </p>
              <p className="text-[11px] text-gray-500">
                MP3, WAV, FLAC, AAC, M4A · Direct presigned upload to edge storage
              </p>
            </div>
          )}
        </div>
      ) : (
        <form onSubmit={(e) => handleExternalSubmit(e)} className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <div className="md:col-span-2">
              <input
                type="url"
                placeholder={
                  activeTab === "youtube"
                    ? "https://www.youtube.com/watch?v=..."
                    : "https://soundcloud.com/artist/track"
                }
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                required
                className="w-full bg-[#0b0d13] border border-[#1f2638] focus:border-indigo-500 rounded-lg px-3.5 py-2 text-xs text-gray-200 placeholder-gray-500 outline-none transition-colors"
              />
            </div>
            <div>
              <input
                type="text"
                placeholder="Track Title (Optional)"
                value={titleInput}
                onChange={(e) => setTitleInput(e.target.value)}
                className="w-full bg-[#0b0d13] border border-[#1f2638] focus:border-indigo-500 rounded-lg px-3.5 py-2 text-xs text-gray-200 placeholder-gray-500 outline-none transition-colors"
              />
            </div>
          </div>
          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] text-gray-500">
              Direct edge streaming from origin CDN
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={(e) => handleExternalSubmit(e as any, true)}
                className="bg-[#1f2638] hover:bg-[#2b354d] text-gray-200 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors"
              >
                Play Next
              </button>
              <button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-1.5 rounded-lg text-xs font-semibold shadow-md shadow-indigo-600/30 transition-colors"
              >
                Add to Queue
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
