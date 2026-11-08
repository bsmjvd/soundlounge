"use client";

import React, { useState, useEffect } from "react";
import { TopBar, type TopNavTab } from "../components/TopBar";
import { DiscoverHero } from "../components/DiscoverHero";
import { FEATURED_SPOTLIGHTS } from "../lib/data/mockupData";
import { PopularAlbumsRow } from "../components/PopularAlbumsRow";
import { PopularArtistsRow } from "../components/PopularArtistsRow";
import { AmbientBackground } from "../components/AmbientBackground";
import { MusicIngestion } from "../components/MusicIngestion";
import { QueueView } from "../components/QueueView";
import { LibraryView } from "../components/LibraryView";
import { PlayerBar } from "../components/PlayerBar";
import { InviteModal } from "../components/InviteModal";
import { AccessDenied } from "../components/AccessDenied";
import { StudioImmersiveModal } from "../components/StudioImmersiveModal";
import { NavigationSidebar, type NavTab } from "../components/NavigationSidebar";
import { ArtistDetailView } from "../components/ArtistDetailView";
import { AlbumDetailView } from "../components/AlbumDetailView";
import { GenreDirectoryView } from "../components/GenreDirectoryView";
import { type ArtistProfileData, ARTISTS_CATALOG } from "../lib/data/artistsCatalog";
import { ALBUMS_CATALOG } from "../lib/data/albumsCatalog";
import type { MusicGenre } from "../lib/recommendation/genreTaxonomy";
import { useTasteProfile } from "../lib/recommendation/useTasteProfile";
import { DynamicTasteHomeSections } from "../components/DynamicTasteHomeSections";

import { AudioEngineCoordinator, type CoordinatorPlayerState, type PlaybackMode } from "../lib/player";
import { useLibraryStore, type LastSessionSnapshot } from "../lib/store/useLibraryStore";
import { useQueueStore } from "../lib/store/useQueueStore";
import { useRoomSync } from "../lib/sync/useRoomSync";
import { useGlobalAudioHotkeys } from "../hooks/useGlobalAudioHotkeys";
import { FallingLeavesAmbient } from "../components/ui/FallingLeavesAmbient";
import { YouTubeIframeBridge } from "../lib/player/YouTubeIframeBridge";
import type { Track, Playlist, Album } from "@soundlounge/shared";

// Singleton coordinator instance for the browser tab, preserved on window across fast refresh
let coordinatorSingleton: AudioEngineCoordinator | null = null;
function getCoordinator(): AudioEngineCoordinator {
  if (!coordinatorSingleton) {
    if (typeof window !== "undefined") {
      const winWithCoord = window as unknown as { __soundlounge_coordinator__?: AudioEngineCoordinator };
      if (winWithCoord.__soundlounge_coordinator__) {
        coordinatorSingleton = winWithCoord.__soundlounge_coordinator__;
      } else {
        coordinatorSingleton = new AudioEngineCoordinator();
        winWithCoord.__soundlounge_coordinator__ = coordinatorSingleton;
      }
    } else {
      coordinatorSingleton = new AudioEngineCoordinator();
    }
  }
  return coordinatorSingleton ?? new AudioEngineCoordinator();
}

export default function SoundloungeApp() {
  const coordinator = getCoordinator();

  // Navigation and Modal State
  const [activeTab, setActiveTab] = useState<NavTab>("home");
  const [topNavTab, setTopNavTab] = useState<TopNavTab>("discover");
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

  // Dynamic Taste Profile Engine
  const {
    recordPlay,
    recordLike,
    recordSearch,
    recordArtistView,
    getPersonalizedSpotlights,
    hasTaste,
    dominantGenre,
    dominantArtist,
  } = useTasteProfile();

  const dynamicSpotlights = getPersonalizedSpotlights();
  const [heroSpotlightIndex, setHeroSpotlightIndex] = useState(0);
  const safeSpotlightIndex =
    heroSpotlightIndex >= 0 && heroSpotlightIndex < dynamicSpotlights.length ? heroSpotlightIndex : 0;
  const currentSpotlight = dynamicSpotlights[safeSpotlightIndex] || dynamicSpotlights[0];

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

  // Seasonal Autumn Falling Leaves ambient effect
  const [isLeavesEnabled, setIsLeavesEnabled] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("soundlounge_falling_leaves_enabled");
        if (saved !== null) return JSON.parse(saved);
      } catch {}
    }
    return true;
  });

  const handleToggleLeaves = () => {
    setIsLeavesEnabled((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("soundlounge_falling_leaves_enabled", JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  // Pre-initialize YouTube IFrame player on page mount for instant audio readiness
  useEffect(() => {
    YouTubeIframeBridge.getInstance().initIframeApi();
  }, []);

  // Player state subscription
  const [playerState, setPlayerState] = useState<CoordinatorPlayerState>(() => coordinator.getState());

  useEffect(() => {
    return coordinator.onStateChange((state) => {
      setPlayerState(state);
      // Automatically snapshot session for Continue Listening and record taste
      if (state.currentTrack && state.status === "playing") {
        useLibraryStore.getState().saveLastSession(state.currentTrack, state.positionMs);
        recordPlay(state.currentTrack);
      }
    });
  }, [coordinator, recordPlay]);

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

  const handleToggleLike = (track: Track) => {
    const isCurrentlyLiked = isLiked(track.id);
    toggleLike(track);
    recordLike(track, !isCurrentlyLiked);
  };

  const handleModeChange = (newMode: PlaybackMode) => {
    coordinator.setMode(newMode);
  };

  const handleAddTrack = (track: Track, playNext: boolean = false) => {
    if (playerState.mode === "synced") {
      sync.sendAddTrack(track, playNext);
    } else {
      const state = useQueueStore.getState();
      const wasEmpty = state.queue.length === 0;
      state.addTrack(track, playNext);
      if (wasEmpty) {
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
    recordPlay(track);
    if (playerState.mode === "synced") {
      sync.sendClearQueue();
      sync.sendAddTrack(track, false);
      sync.sendPlay(track.id, 0);
    } else {
      const state = useQueueStore.getState();
      state.setQueue([track], 0);
      coordinator.play(track, 0);
      if (isAutoplayEnabled) {
        state.seedSimilarQueue(track, history);
      }
    }
  };

  const handlePlayMix = (tracks: Track[]) => {
    if (tracks.length === 0) return;
    useQueueStore.getState().setQueue(tracks, 0);
    addToHistory(tracks[0]);
    recordPlay(tracks[0]);
    if (playerState.mode === "synced") {
      sync.sendClearQueue();
      tracks.forEach((t) => sync.sendAddTrack(t));
      sync.sendPlay(tracks[0].id, 0);
    } else {
      coordinator.play(tracks[0], 0);
    }
  };

  const handlePlayArtistAll = (tracks: Track[]) => {
    if (tracks.length === 0) return;
    useQueueStore.getState().setQueue(tracks, 0);
    addToHistory(tracks[0]);
    if (playerState.mode === "synced") {
      sync.sendClearQueue();
      tracks.forEach((t) => sync.sendAddTrack(t));
      sync.sendPlay(tracks[0].id, 0);
    } else {
      coordinator.play(tracks[0], 0);
    }
  };

  const handlePlayAlbum = (tracks: Track[]) => {
    if (tracks.length === 0) return;
    useQueueStore.getState().setQueue(tracks, 0);
    addToHistory(tracks[0]);
    if (playerState.mode === "synced") {
      sync.sendClearQueue();
      tracks.forEach((t) => sync.sendAddTrack(t));
      sync.sendPlay(tracks[0].id, 0);
    } else {
      coordinator.play(tracks[0], 0);
    }
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
      const state = useQueueStore.getState();
      const existingIdx = state.queue.findIndex((t) => t.id === session.track.id);
      if (existingIdx !== -1) {
        state.setCurrentIndex(existingIdx);
      } else if (state.queue.length > 0) {
        const insertIdx = state.currentIndex >= 0 ? state.currentIndex + 1 : 0;
        state.addTrack(session.track, true);
        state.setCurrentIndex(insertIdx);
      } else {
        state.setQueue([session.track], 0);
      }
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

  // Autonomous similarity queuing:
  // ONLY trigger when the current track is playing, autoplay is ON, and there is NO song next to it (tracksAhead <= 0)
  useEffect(() => {
    const tracksAhead = queue.length - 1 - currentIndex;
    const cur = playerState.currentTrack || queue[currentIndex];
    if (cur && playerState.status === "playing" && isAutoplayEnabled && tracksAhead <= 0) {
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

  // Global desktop studio keyboard shortcuts (Space, M, Arrow keys, S/F for Studio Mode)
  useGlobalAudioHotkeys({
    onTogglePlay: handleTogglePlay,
    onToggleMute: () => {
      const currentVol = coordinator.getVolume();
      coordinator.setVolume(currentVol > 0 ? 0 : 0.4);
    },
    onSeekRelative: (deltaMs) => {
      handleSeek(Math.max(0, Math.min(playerState.durationMs || 0, playerState.positionMs + deltaMs)));
    },
    onVolumeRelative: (deltaVol) => {
      const currentVol = coordinator.getVolume();
      coordinator.setVolume(Math.max(0, Math.min(1, currentVol + deltaVol)));
    },
    onToggleStudio: () => setIsStudioOpen((prev) => !prev),
    enabled: true,
  });

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
  const isDiscoverHome = !selectedArtist && !selectedAlbum && activeTab === "home" && topNavTab === "discover";

  return (
    <div className="min-h-screen bg-[#0e1422] text-[#f3f4f6] relative overflow-x-hidden selection:bg-[#00e5ff]/30 selection:text-white">
      {/* Full-bleed Ambient Blurred Song Backdrop */}
      <AmbientBackground currentTrack={activeTrack} isPlaying={playerState.status === "playing"} />

      {/* Seasonal Autumn Falling Leaves ambient effect */}
      <FallingLeavesAmbient enabled={isLeavesEnabled} />

      {/* Main Studio Shell: Left Sidebar ("Playlist") + Right Main Stage */}
      <div className="relative z-10 flex min-h-screen">
        {/* Left Persistent Navigation & Playlist Sidebar */}
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
          currentTrack={activeTrack}
          isPlaying={playerState.status === "playing"}
          onPlayTrack={handlePlaySingleTrack}
          queue={queue}
          historyTracks={history}
        />

        {/* Right Stage: Top Bar + Content Canvas */}
        <div className="flex-1 min-w-0 flex flex-col justify-between pb-28">
          <div>
            {isDiscoverHome ? (
              /* SEAMLESS FULL-BLEED DISCOVER STAGE (TopBar + Flume Spotlight Hero) */
              <div className="relative w-full overflow-hidden min-h-[340px] sm:min-h-[380px] bg-gradient-to-r from-[#175d69] via-[#103a4c] to-[#0c192c]">
                {/* Ambient glowing atmosphere matching reference design */}
                <div className="absolute top-0 left-0 w-[640px] h-full bg-[radial-gradient(ellipse_at_top_left,#00e5ff_0%,#187280_40%,transparent_75%)] opacity-35 pointer-events-none z-[1]" />
                <div className="absolute -top-10 right-0 w-[680px] h-full bg-[radial-gradient(ellipse_at_top_right,#1b3d68_0%,#0f223a_50%,transparent_80%)] opacity-40 pointer-events-none z-[1]" />

                {/* THE HERO ARTWORK / ALBUM COVER FILLED SEAMLESSLY IN THE BACKGROUND */}
                <div className="absolute top-0 right-0 bottom-0 w-[55%] sm:w-[50%] lg:w-[48%] pointer-events-none z-0 overflow-hidden flex items-start justify-end">
                  <img
                    key={currentSpotlight.id}
                    src={currentSpotlight.heroImageUrl}
                    alt={currentSpotlight.title}
                    className="w-full h-full object-cover object-top sm:object-[center_top] select-none animate-in fade-in duration-700 [mask-image:linear-gradient(to_left,black_60%,transparent_100%)] [webkit-mask-image:linear-gradient(to_left,black_60%,transparent_100%)]"
                  />
                </div>

                {/* Ambient bottom-edge smooth gradient fade into main content */}
                <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-b from-transparent to-[#0e1422] pointer-events-none z-10" />

                {/* TopBar sitting seamlessly over the hero stage */}
                <div className="relative z-20">
                  <TopBar
                    mode={playerState.mode}
                    onModeChange={handleModeChange}
                    roomId={roomId}
                    participantsCount={sync.participantsCount}
                    pingMs={sync.pingMs}
                    onOpenInvite={() => setIsInviteOpen(true)}
                    onToggleMobileMenu={() => setIsMobileMenuOpen(true)}
                    isLeavesEnabled={isLeavesEnabled}
                    onToggleLeaves={handleToggleLeaves}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    onSearch={(q) => {
                      if (q.trim()) {
                        setSearchQuery(q.trim());
                        recordSearch(q.trim());
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
                    onSelectArtist={(artist) => {
                      recordArtistView(artist.name);
                      setSelectedArtist(artist);
                    }}
                    onSelectAlbum={(album) => setSelectedAlbum(album)}
                    activeTopTab={topNavTab}
                    onTopTabChange={(tab) => {
                      setSelectedArtist(null);
                      setSelectedAlbum(null);
                      setTopNavTab(tab);
                      if (tab === "discover") {
                        setActiveTab("home");
                      } else if (tab === "library") {
                        setActiveTab("liked");
                      } else if (tab === "radio") {
                        setActiveTab("genres");
                      }
                    }}
                  />
                </div>

                {/* Hero Typography & Action Controls */}
                <div className="relative z-10 px-4 sm:px-8 lg:px-12 pt-2 sm:pt-4 pb-12">
                  <DiscoverHero
                    onPlayTrack={handlePlaySingleTrack}
                    currentTrack={activeTrack}
                    isPlaying={playerState.status === "playing"}
                    activeIndex={safeSpotlightIndex}
                    onActiveIndexChange={setHeroSpotlightIndex}
                    spotlights={dynamicSpotlights}
                  />
                </div>
              </div>
            ) : (
              <TopBar
                mode={playerState.mode}
                onModeChange={handleModeChange}
                roomId={roomId}
                participantsCount={sync.participantsCount}
                pingMs={sync.pingMs}
                onOpenInvite={() => setIsInviteOpen(true)}
                onToggleMobileMenu={() => setIsMobileMenuOpen(true)}
                isLeavesEnabled={isLeavesEnabled}
                onToggleLeaves={handleToggleLeaves}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                onSearch={(q) => {
                  if (q.trim()) {
                    setSearchQuery(q.trim());
                    recordSearch(q.trim());
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
                onSelectArtist={(artist) => {
                  recordArtistView(artist.name);
                  setSelectedArtist(artist);
                }}
                onSelectAlbum={(album) => setSelectedAlbum(album)}
                activeTopTab={topNavTab}
                onTopTabChange={(tab) => {
                  setSelectedArtist(null);
                  setSelectedAlbum(null);
                  setTopNavTab(tab);
                  if (tab === "discover") {
                    setActiveTab("home");
                  } else if (tab === "library") {
                    setActiveTab("liked");
                  } else if (tab === "radio") {
                    setActiveTab("genres");
                  }
                }}
              />
            )}

            {/* Stage Canvas */}
            <main className="max-w-7xl mx-auto px-4 sm:px-8 pt-3 sm:pt-6 pb-32 sm:pb-24">
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
                  onSelectAlbum={(alb) => setSelectedAlbum(alb)}
                />
              ) : activeTab === "queue" ? (
                <div className="max-w-4xl mx-auto space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-bold text-white tracking-tight">Playing Queue</h2>
                      <p className="text-xs text-slate-400">
                        {queue.length} track{queue.length === 1 ? "" : "s"} scheduled • Autoplay similar soundscapes
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setActiveTab("home");
                        setTopNavTab("discover");
                      }}
                      className="text-xs text-[#00e5ff] hover:underline cursor-pointer"
                    >
                      Back to Discover
                    </button>
                  </div>

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
              ) : activeTab === "search" ? (
                <div className="max-w-4xl mx-auto space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-bold text-white tracking-tight">Music Search & Ingestion</h2>
                      <p className="text-xs text-slate-400">
                        Direct search powered by YouTube & low-latency edge audio streaming
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setSearchQuery("");
                        setActiveTab("home");
                        setTopNavTab("discover");
                      }}
                      className="text-xs text-[#00e5ff] hover:underline cursor-pointer"
                    >
                      Back to Discover
                    </button>
                  </div>

                  <MusicIngestion
                    onAddTrack={handleAddTrack}
                    onPlayDirect={handlePlaySingleTrack}
                    roomId={roomId}
                    initialQuery={searchQuery}
                    onQueryChange={setSearchQuery}
                    onSelectAlbum={(album) => setSelectedAlbum(album)}
                  />
                </div>
              ) : topNavTab === "library" || activeTab === "liked" || activeTab === "history" ? (
                <div className="max-w-5xl mx-auto">
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
                    activeSection={activeTab === "history" ? "history" : "liked"}
                  />
                </div>
              ) : topNavTab === "radio" || activeTab === "genres" ? (
                <div className="max-w-6xl mx-auto">
                  <GenreDirectoryView
                    onPlayGenreRadio={handlePlayGenreRadio}
                    onSelectArtist={(artist) => setSelectedArtist(artist)}
                    onSelectAlbum={(album) => setSelectedAlbum(album)}
                  />
                </div>
              ) : (
                /* DYNAMIC PERSONALIZED DISCOVERY VIEW: Jump Back In + Because You Listened + Popular Albums + Popular Artists */
                <div className="space-y-10 pt-2">
                  {/* Dynamic Taste Sections: Jump Back In & Because You Listened */}
                  <DynamicTasteHomeSections
                    onPlayTrack={handlePlaySingleTrack}
                    onPlayMix={handlePlayMix}
                    onSelectArtist={(artistName) => {
                      const match = ARTISTS_CATALOG.find(
                        (a) => a.name.toLowerCase() === artistName.toLowerCase()
                      );
                      if (match) {
                        recordArtistView(match.name);
                        setSelectedArtist(match);
                      }
                    }}
                    onSelectAlbum={(album) => setSelectedAlbum(album as unknown as Album)}
                    currentTrack={activeTrack}
                    isPlaying={playerState.status === "playing"}
                    historyTracks={history}
                  />

                  {/* Popular Albums Section (Dynamically re-ranked by taste) */}
                  <PopularAlbumsRow
                    onSelectAlbum={(album) => setSelectedAlbum(album as unknown as Album)}
                    onPlayAlbum={handlePlayAlbum}
                    onPlayTrack={handlePlaySingleTrack}
                  />

                  {/* Popular Artists Section (Dynamically re-ranked by taste) */}
                  <PopularArtistsRow
                    onSelectArtist={(artist) => {
                      recordArtistView(artist.name);
                      setSelectedArtist(artist);
                    }}
                  />
                </div>
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
        queueCount={queue.length}
        isLiked={activeTrack ? isLiked(activeTrack.id) : false}
        onToggleLike={(t) => handleToggleLike(t)}
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
        onToggleLike={(t) => handleToggleLike(t)}
        onTogglePlay={handleTogglePlay}
        onSeek={handleSeek}
        onNext={handleNext}
        onPrevious={handlePrevious}
        onVolumeChange={(v) => coordinator.setVolume(v)}
      />
    </div>
  );
}
