"use client";

import React, { useState, useEffect } from "react";
import { TopBar } from "../components/TopBar";
import { AmbientBackground } from "../components/AmbientBackground";
import { CoverflowHero } from "../components/CoverflowHero";
import { FeaturedMixesColumn } from "../components/FeaturedMixesColumn";
import { WeeklyTopSongs } from "../components/WeeklyTopSongs";
import { RecentArtistsGrid } from "../components/RecentArtistsGrid";
import { MusicIngestion } from "../components/MusicIngestion";
import { QueueView } from "../components/QueueView";
import { LibraryView } from "../components/LibraryView";
import { PlayerBar } from "../components/PlayerBar";
import { InviteModal } from "../components/InviteModal";
import { AccessDenied } from "../components/AccessDenied";
import { StudioImmersiveModal } from "../components/StudioImmersiveModal";
import { NavigationSidebar, type NavTab } from "../components/NavigationSidebar";
import { ArtistDetailView } from "../components/ArtistDetailView";
import { ArtistsDirectoryView } from "../components/ArtistsDirectoryView";
import { AlbumDetailView } from "../components/AlbumDetailView";
import { AlbumsDirectoryView } from "../components/AlbumsDirectoryView";
import { GenreDirectoryView } from "../components/GenreDirectoryView";
import { type ArtistProfileData, ARTISTS_CATALOG } from "../lib/data/artistsCatalog";
import { ALBUMS_CATALOG } from "../lib/data/albumsCatalog";
import type { MusicGenre } from "../lib/recommendation/genreTaxonomy";

import { AudioEngineCoordinator, type CoordinatorPlayerState, type PlaybackMode } from "../lib/player";
import { useLibraryStore, type LastSessionSnapshot } from "../lib/store/useLibraryStore";
import { useQueueStore } from "../lib/store/useQueueStore";
import { useRoomSync } from "../lib/sync/useRoomSync";
import type { Track, Playlist, Album } from "@soundlounge/shared";

// Singleton coordinator instance for the browser tab
let coordinatorSingleton: AudioEngineCoordinator | null = null;
function getCoordinator(): AudioEngineCoordinator {
  if (!coordinatorSingleton) {
    coordinatorSingleton = new AudioEngineCoordinator();
  }
  return coordinatorSingleton;
}

export default function SoundloungeApp() {
  const coordinator = getCoordinator();

  // Navigation and Modal State
  const [activeTab, setActiveTab] = useState<NavTab>("home");
  const [selectedArtist, setSelectedArtist] = useState<ArtistProfileData | null>(null);
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
  const [navHistory, setNavHistory] = useState<NavTab[]>(["home"]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [roomId] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return new URLSearchParams(window.location.search).get("room") || "lounge-main";
    }
    return "lounge-main";
  });
  const [inviteToken, setInviteToken] = useState<string | undefined>(() => {
    if (typeof window !== "undefined") {
      return new URLSearchParams(window.location.search).get("invite") || undefined;
    }
    return undefined;
  });
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isStudioOpen, setIsStudioOpen] = useState(false);

  const handleTabChange = (tab: NavTab) => {
    setSelectedArtist(null);
    setSelectedAlbum(null);
    setActiveTab(tab);
    setNavHistory((prev) => [...prev.slice(0, historyIndex + 1), tab]);
    setHistoryIndex((prev) => prev + 1);
  };

  const handleNavBack = () => {
    if (historyIndex > 0) {
      const newIdx = historyIndex - 1;
      setHistoryIndex(newIdx);
      setActiveTab(navHistory[newIdx]);
    }
  };

  const handleNavForward = () => {
    if (historyIndex < navHistory.length - 1) {
      const newIdx = historyIndex + 1;
      setHistoryIndex(newIdx);
      setActiveTab(navHistory[newIdx]);
    }
  };

  // Player state subscription
  const [playerState, setPlayerState] = useState<CoordinatorPlayerState>(() => coordinator.getState());

  useEffect(() => {
    return coordinator.onStateChange((state) => {
      setPlayerState(state);
      // Automatically snapshot session for Continue Listening
      if (state.currentTrack && state.status === "playing") {
        useLibraryStore.getState().saveLastSession(state.currentTrack, state.positionMs);
      }
    });
  }, [coordinator]);

  // Stores
  const { queue, currentIndex, isAutoplayEnabled, toggleAutoplay, autoQueueReasons, ensureSimilarQueued } =
    useQueueStore();

  const {
    likedTracks,
    playlists,
    history,
    lastSession,
    toggleLike,
    isLiked,
    createPlaylist,
    addTrackToPlaylist,
    deletePlaylist,
    addToHistory,
  } = useLibraryStore();

  // Synchronized WebSocket engine
  const sync = useRoomSync({
    roomId,
    inviteToken,
    coordinator,
  });

  const handleModeChange = (newMode: PlaybackMode) => {
    coordinator.setMode(newMode);
  };

  const handleAddTrack = (track: Track, playNext: boolean = false) => {
    if (playerState.mode === "synced") {
      sync.sendAddTrack(track, playNext);
    } else {
      useQueueStore.getState().addTrack(track, playNext);
      if (queue.length === 0) {
        coordinator.play(track, 0);
        addToHistory(track);
      }
    }
  };

  const handlePlayQueueTrack = (track: Track, index: number) => {
    useQueueStore.getState().setCurrentIndex(index);
    addToHistory(track);

    if (playerState.mode === "synced") {
      sync.sendPlay(track.id, 0);
    } else {
      coordinator.play(track, 0);
    }
  };

  const handleRemoveTrack = (trackId: string) => {
    if (playerState.mode === "synced") {
      sync.sendRemoveTrack(trackId);
    } else {
      useQueueStore.getState().removeTrack(trackId);
    }
  };

  const handlePlayNext = (track: Track) => {
    if (playerState.mode === "synced") {
      sync.sendAddTrack(track, true);
    } else {
      useQueueStore.getState().addTrack(track, true);
    }
  };

  const handleClearQueue = () => {
    if (playerState.mode === "synced") {
      sync.sendClearQueue();
    } else {
      useQueueStore.getState().clearQueue();
    }
  };

  const handleSaveQueueAsPlaylist = (name: string) => {
    if (queue.length === 0) return;
    const plId = createPlaylist(name);
    queue.forEach((t) => addTrackToPlaylist(plId, t));
  };

  const handlePlaySingleTrack = (track: Track) => {
    addToHistory(track);
    if (playerState.mode === "synced") {
      sync.sendAddTrack(track, true);
      sync.sendPlay(track.id, 0);
    } else {
      useQueueStore.getState().setQueue([track], 0);
      coordinator.play(track, 0);
      // Automatically queue similar tracks matching artist or genre
      ensureSimilarQueued(track, history);
    }
  };

  const handlePlayArtistAll = (tracks: Track[]) => {
    if (tracks.length === 0) return;
    useQueueStore.getState().setQueue(tracks, 0);
    handlePlaySingleTrack(tracks[0]);
  };

  const handlePlayAlbum = (tracks: Track[]) => {
    if (tracks.length === 0) return;
    useQueueStore.getState().setQueue(tracks, 0);
    handlePlaySingleTrack(tracks[0]);
  };

  const handleAddAlbumToQueue = (tracks: Track[]) => {
    tracks.forEach((t) => handleAddTrack(t, false));
  };

  const handlePlayGenreRadio = (genre: MusicGenre) => {
    const genreAlbums = ALBUMS_CATALOG.filter((a) => a.genres.some((g) => g.toLowerCase().includes(genre)));
    const genreArtists = ARTISTS_CATALOG.filter((a) => a.region === genre || a.genre.toLowerCase().includes(genre));

    let starterTracks: Track[] = [];
    if (genreAlbums.length > 0) {
      starterTracks = genreAlbums[0].tracks;
    } else if (genreArtists.length > 0) {
      starterTracks = genreArtists[0].topTracks;
    }

    if (starterTracks.length > 0) {
      handlePlayAlbum(starterTracks);
    }
  };

  const handlePlayPlaylist = (playlist: Playlist) => {
    if (playlist.tracks.length === 0) return;
    const firstTrack = playlist.tracks[0];
    addToHistory(firstTrack);

    if (playerState.mode === "synced") {
      sync.sendClearQueue();
      playlist.tracks.forEach((t) => sync.sendAddTrack(t));
      sync.sendPlay(firstTrack.id, 0);
    } else {
      useQueueStore.getState().setQueue(playlist.tracks, 0);
      coordinator.play(firstTrack, 0);
    }
  };

  const handleResumeSession = (session: LastSessionSnapshot) => {
    addToHistory(session.track);
    if (playerState.mode === "synced") {
      sync.sendAddTrack(session.track, true);
      sync.sendPlay(session.track.id, session.positionMs);
    } else {
      useQueueStore.getState().setQueue([session.track], 0);
      coordinator.play(session.track, session.positionMs);
    }
  };

  const handleTogglePlay = () => {
    if (playerState.status === "playing") {
      if (playerState.mode === "synced") {
        sync.sendPause(playerState.positionMs);
      } else {
        coordinator.pause();
      }
    } else {
      const cur = playerState.currentTrack || queue[currentIndex] || queue[0];
      if (cur) {
        if (playerState.mode === "synced") {
          sync.sendPlay(cur.id, playerState.positionMs);
        } else {
          coordinator.play(cur, playerState.positionMs);
        }
      }
    }
  };

  const handleSeek = (posMs: number) => {
    if (playerState.mode === "synced") {
      sync.sendSeek(posMs);
    } else {
      coordinator.seek(posMs);
    }
  };

  const handleNext = async () => {
    let next = useQueueStore.getState().nextTrack();
    if (!next && isAutoplayEnabled) {
      const cur = playerState.currentTrack || queue[currentIndex];
      if (cur) {
        const autoNext = await ensureSimilarQueued(cur, history);
        if (autoNext) {
          next = useQueueStore.getState().nextTrack();
        }
      }
    }

    if (next) {
      addToHistory(next);
      if (playerState.mode === "synced") {
        sync.sendPlay(next.id, 0);
      } else {
        coordinator.play(next, 0);
      }
    }
  };

  // Autonomous continuous similarity queuing:
  // When a track is playing and the queue is nearing completion, queue similar tracks
  useEffect(() => {
    const cur = playerState.currentTrack || queue[currentIndex];
    if (cur && playerState.status === "playing" && isAutoplayEnabled) {
      ensureSimilarQueued(cur, history);
    }
  }, [playerState.currentTrack?.id, playerState.status, queue.length, currentIndex, isAutoplayEnabled]);

  const handlePrevious = () => {
    const prev = useQueueStore.getState().previousTrack();
    if (prev) {
      addToHistory(prev);
      if (playerState.mode === "synced") {
        sync.sendPlay(prev.id, 0);
      } else {
        coordinator.play(prev, 0);
      }
    }
  };

  // Wire transport handlers for lock screen and auto-next on track completion
  useEffect(() => {
    coordinator.setTransportHandlers({
      onNext: handleNext,
      onPrevious: handlePrevious,
      onEnded: handleNext,
    });
  }, [queue, currentIndex]);

  // Global desktop studio keyboard shortcuts (Space, Arrow keys, F for Studio Mode)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) {
        return;
      }

      if (e.code === "Space") {
        e.preventDefault();
        handleTogglePlay();
      } else if (e.code === "ArrowRight" || e.key === "l" || e.key === "L") {
        e.preventDefault();
        handleSeek(Math.min(playerState.durationMs || 0, playerState.positionMs + 5000));
      } else if (e.code === "ArrowLeft" || e.key === "j" || e.key === "J") {
        e.preventDefault();
        handleSeek(Math.max(0, playerState.positionMs - 5000));
      } else if (e.key === "n" || e.key === "N") {
        e.preventDefault();
        handleNext();
      } else if (e.key === "p" || e.key === "P") {
        e.preventDefault();
        handlePrevious();
      } else if (e.key === "f" || e.key === "F") {
        e.preventDefault();
        setIsStudioOpen((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [playerState.status, playerState.positionMs, playerState.durationMs]);

  if (playerState.mode === "synced" && sync.isAccessDenied) {
    return (
      <div className="min-h-screen bg-[#080f14]">
        <TopBar
          mode={playerState.mode}
          onModeChange={handleModeChange}
          roomId={roomId}
          participantsCount={sync.participantsCount}
          pingMs={sync.pingMs}
          onOpenInvite={() => setIsInviteOpen(true)}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onSearch={(q) => {
            if (q.trim()) setActiveTab("search");
          }}
        />
        <AccessDenied
          roomId={roomId}
          onRetryWithToken={(token) => setInviteToken(token)}
          onReturnToSolo={() => handleModeChange("solo")}
        />
      </div>
    );
  }

  const activeTrack = playerState.currentTrack || queue[currentIndex] || null;

  return (
    <div className="min-h-screen bg-[#080f14] text-[#f3f4f6] relative overflow-x-hidden selection:bg-[#00e5c9]/30 selection:text-white">
      {/* Full-bleed Ambient Blurred Song Backdrop */}
      <AmbientBackground currentTrack={activeTrack} isPlaying={playerState.status === "playing"} />

      {/* Main Studio Shell: Left Sidebar + Right Stage */}
      <div className="relative z-10 flex min-h-screen">
        {/* Left Persistent Navigation Sidebar */}
        <NavigationSidebar
          activeTab={activeTab}
          onTabChange={handleTabChange}
          mode={playerState.mode}
          onModeChange={handleModeChange}
          queueCount={queue.length}
          likedCount={likedTracks.length}
          historyCount={history.length}
          roomId={roomId}
          participantsCount={sync.participantsCount}
          pingMs={sync.pingMs}
          onOpenInvite={() => setIsInviteOpen(true)}
          lastSession={lastSession}
          onResumeSession={handleResumeSession}
          isOpenMobile={isMobileMenuOpen}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
        />

        {/* Right Stage: Top Bar + Content Canvas */}
        <div className="flex-1 min-w-0 flex flex-col justify-between pb-28">
          <div>
            {/* Top Bar with History Arrows, Pill Search, Real Controls */}
            <TopBar
              mode={playerState.mode}
              onModeChange={handleModeChange}
              roomId={roomId}
              participantsCount={sync.participantsCount}
              pingMs={sync.pingMs}
              onOpenInvite={() => setIsInviteOpen(true)}
              onToggleMobileMenu={() => setIsMobileMenuOpen(true)}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              onSearch={(q) => {
                if (q.trim()) {
                  setSearchQuery(q.trim());
                  setSelectedArtist(null);
                  setSelectedAlbum(null);
                  setActiveTab("search");
                }
              }}
              onNavBack={handleNavBack}
              onNavForward={handleNavForward}
              onOpenUpload={() => setActiveTab("search")}
              onPlayTrack={handlePlaySingleTrack}
              onAddTrack={handleAddTrack}
              onSelectArtist={(artist) => setSelectedArtist(artist)}
              onSelectAlbum={(album) => setSelectedAlbum(album)}
            />

            {/* Stage Canvas */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
              {/* Detailed Artist Profile & Discography View */}
              {selectedArtist ? (
                <ArtistDetailView
                  artist={selectedArtist}
                  onBack={() => setSelectedArtist(null)}
                  onPlayTrack={handlePlaySingleTrack}
                  onAddTrack={handleAddTrack}
                  onPlayAll={handlePlayArtistAll}
                  onSelectAlbum={(album) => {
                    setSelectedArtist(null);
                    setSelectedAlbum(album);
                  }}
                  currentTrack={activeTrack}
                  isPlaying={playerState.status === "playing"}
                />
              ) : selectedAlbum ? (
                <AlbumDetailView
                  album={selectedAlbum}
                  onBack={() => setSelectedAlbum(null)}
                  onPlayTrack={handlePlaySingleTrack}
                  onAddTrack={handleAddTrack}
                  onPlayAlbum={handlePlayAlbum}
                  onAddAlbumToQueue={handleAddAlbumToQueue}
                  currentTrack={activeTrack}
                  isPlaying={playerState.status === "playing"}
                />
              ) : (
                <>
                  {/* 1. CORE HOME VIEW (Exact 3-Column Dashboard from Reference) */}
                  {activeTab === "home" && (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                      {/* Left Column: Top Remixes & Mixes (3 of 12 cols on desktop) */}
                      <div className="lg:col-span-3 order-2 lg:order-1">
                        <FeaturedMixesColumn
                          onPlayTrack={handlePlaySingleTrack}
                          currentTrack={activeTrack}
                          isPlaying={playerState.status === "playing"}
                        />
                      </div>

                      {/* Center Column: 3D Coverflow Hero + Weekly Top Songs (6 of 12 cols on desktop) */}
                      <div className="lg:col-span-6 order-1 lg:order-2 space-y-6">
                        <CoverflowHero
                          onPlayTrack={handlePlaySingleTrack}
                          currentTrack={activeTrack}
                          isPlaying={playerState.status === "playing"}
                          onOpenStudio={() => setIsStudioOpen(true)}
                        />

                        <WeeklyTopSongs
                          onPlayTrack={handlePlaySingleTrack}
                          onAddTrack={handleAddTrack}
                          currentTrack={activeTrack}
                          isPlaying={playerState.status === "playing"}
                          positionMs={playerState.positionMs}
                          durationMs={playerState.durationMs}
                        />
                      </div>

                      {/* Right Column: Popular Artists Grid (3 of 12 cols on desktop) */}
                      <div className="lg:col-span-3 order-3">
                        <RecentArtistsGrid onSelectArtist={(artist) => setSelectedArtist(artist)} />
                      </div>
                    </div>
                  )}

                  {/* 2. SEARCH & DISCOVERY VIEW */}
                  {activeTab === "search" && (
                    <div className="max-w-4xl mx-auto space-y-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h2 className="text-lg font-bold text-white tracking-tight">Music Search & Ingestion</h2>
                          <p className="text-xs text-[#718492]">
                            Direct search powered by YouTube & low-latency edge audio streaming
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            setSearchQuery("");
                            setActiveTab("home");
                          }}
                          className="text-xs text-[#00e5c9] hover:underline cursor-pointer"
                        >
                          Back to Home
                        </button>
                      </div>

                      <MusicIngestion
                        onAddTrack={handleAddTrack}
                        onPlayDirect={handlePlaySingleTrack}
                        roomId={roomId}
                        initialQuery={searchQuery}
                        onQueryChange={setSearchQuery}
                      />
                    </div>
                  )}

                  {/* 3. PLAYING QUEUE VIEW */}
                  {activeTab === "queue" && (
                    <div className="max-w-4xl mx-auto">
                      <QueueView
                        queue={queue}
                        currentIndex={currentIndex}
                        isAutoplayEnabled={isAutoplayEnabled}
                        onToggleAutoplay={toggleAutoplay}
                        autoQueueReasons={autoQueueReasons}
                        onPlayTrack={handlePlayQueueTrack}
                        onRemoveTrack={handleRemoveTrack}
                        onPlayNext={handlePlayNext}
                        onClearQueue={handleClearQueue}
                        onSavePlaylist={handleSaveQueueAsPlaylist}
                      />
                    </div>
                  )}

                  {/* 4. FAVORITES / LIKED SONGS VIEW */}
                  {activeTab === "liked" && (
                    <div className="max-w-4xl mx-auto">
                      <LibraryView
                        likedTracks={likedTracks}
                        playlists={playlists}
                        history={history}
                        lastSession={lastSession}
                        onPlayTrack={handlePlaySingleTrack}
                        onPlayPlaylist={handlePlayPlaylist}
                        onCreatePlaylist={createPlaylist}
                        onDeletePlaylist={deletePlaylist}
                        onResumeSession={handleResumeSession}
                        activeSection="liked"
                      />
                    </div>
                  )}

                  {/* 5. HISTORY VIEW */}
                  {activeTab === "history" && (
                    <div className="max-w-4xl mx-auto">
                      <LibraryView
                        likedTracks={likedTracks}
                        playlists={playlists}
                        history={history}
                        lastSession={lastSession}
                        onPlayTrack={handlePlaySingleTrack}
                        onPlayPlaylist={handlePlayPlaylist}
                        onCreatePlaylist={createPlaylist}
                        onDeletePlaylist={deletePlaylist}
                        onResumeSession={handleResumeSession}
                        activeSection="history"
                      />
                    </div>
                  )}

                  {/* 6. ARTISTS DIRECT VIEW */}
                  {activeTab === "artists" && (
                    <div className="max-w-6xl mx-auto">
                      <ArtistsDirectoryView
                        onSelectArtist={(artist) => setSelectedArtist(artist)}
                        onPlayArtistTopSongs={(artist) => handlePlayArtistAll(artist.topTracks)}
                      />
                    </div>
                  )}

                  {/* 7. ALBUMS & MOVIE SOUNDTRACKS VIEW */}
                  {activeTab === "albums" && (
                    <div className="max-w-6xl mx-auto">
                      <AlbumsDirectoryView
                        onSelectAlbum={(album) => setSelectedAlbum(album)}
                        onPlayAlbumQuick={(album) => handlePlayAlbum(album.tracks)}
                      />
                    </div>
                  )}

                  {/* 8. GENRE ECOSYSTEM VIEW */}
                  {activeTab === "genres" && (
                    <div className="max-w-6xl mx-auto">
                      <GenreDirectoryView
                        onPlayGenreRadio={handlePlayGenreRadio}
                        onSelectArtist={(artist) => setSelectedArtist(artist)}
                        onSelectAlbum={(album) => setSelectedAlbum(album)}
                      />
                    </div>
                  )}

                  {/* 9. OTHER TABS (Radio, Podcasts, Downloaded) */}
                  {(activeTab === "radio" || activeTab === "podcasts" || activeTab === "downloaded") && (
                    <div className="max-w-4xl mx-auto py-12 text-center rounded-2xl bg-[#0d181e] border border-[#1a2c35] space-y-3">
                      <h3 className="text-base font-bold text-white capitalize">{activeTab} Channel</h3>
                      <p className="text-xs text-[#718492] max-w-md mx-auto">
                        Live curated stream and audio channel for {activeTab}.
                      </p>
                      <div className="pt-2 flex justify-center gap-3">
                        <button
                          onClick={() => setActiveTab("home")}
                          className="px-4 py-2 rounded-xl bg-[#00e5c9] text-[#081014] text-xs font-semibold hover:bg-[#1cebd2] transition-colors cursor-pointer"
                        >
                          Explore Home Charts
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </main>
          </div>
        </div>
      </div>

      {/* Persistent Bottom Edge-to-Edge Audio Player Bar */}
      <PlayerBar
        currentTrack={activeTrack}
        status={playerState.status}
        positionMs={playerState.positionMs}
        durationMs={playerState.durationMs}
        volume={playerState.volume}
        mode={playerState.mode}
        pingMs={sync.pingMs}
        isLiked={activeTrack ? isLiked(activeTrack.id) : false}
        onToggleLike={(t) => toggleLike(t)}
        onTogglePlay={handleTogglePlay}
        onSeek={handleSeek}
        onNext={handleNext}
        onPrevious={handlePrevious}
        onVolumeChange={(v) => coordinator.setVolume(v)}
        onOpenStudio={() => setIsStudioOpen(true)}
        onOpenQueue={() => setActiveTab("queue")}
      />

      {/* Share / Invite Modal */}
      <InviteModal
        isOpen={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
        roomId={roomId}
        inviteToken={inviteToken}
      />

      {/* Fullscreen Immersive Studio Player */}
      <StudioImmersiveModal
        isOpen={isStudioOpen}
        onClose={() => setIsStudioOpen(false)}
        currentTrack={activeTrack}
        status={playerState.status}
        positionMs={playerState.positionMs}
        durationMs={playerState.durationMs}
        volume={playerState.volume}
        isLiked={activeTrack ? isLiked(activeTrack.id) : false}
        onToggleLike={(t) => toggleLike(t)}
        onTogglePlay={handleTogglePlay}
        onSeek={handleSeek}
        onNext={handleNext}
        onPrevious={handlePrevious}
        onVolumeChange={(v) => coordinator.setVolume(v)}
      />
    </div>
  );
}
