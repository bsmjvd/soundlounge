"use client";

import React, { useState, useEffect } from "react";
import { useShallow } from "zustand/react/shallow";
import { TopBar, type TopNavTab } from "../components/TopBar";
import { DiscoverHero } from "../components/DiscoverHero";
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
import { MobileNav } from "../components/MobileNav";
import { ArtistDetailView } from "../components/ArtistDetailView";
import { AlbumDetailView } from "../components/AlbumDetailView";
import { GenreDirectoryView } from "../components/GenreDirectoryView";
import { type ArtistProfileData, ARTISTS_CATALOG } from "../lib/data/artistsCatalog";
import { ALBUMS_CATALOG } from "../lib/data/albumsCatalog";
import type { MusicGenre } from "../lib/recommendation/genreTaxonomy";
import { useTasteProfile } from "../lib/recommendation/useTasteProfile";
import { DynamicTasteHomeSections } from "../components/DynamicTasteHomeSections";

import { useLibraryStore } from "../lib/store/useLibraryStore";
import { useQueueStore } from "../lib/store/useQueueStore";
import { useGlobalAudioHotkeys } from "../hooks/useGlobalAudioHotkeys";
import { usePlaybackController } from "../hooks/usePlaybackController";
import { FallingLeavesAmbient } from "../components/ui/FallingLeavesAmbient";
import type { Track, Album } from "@soundlounge/shared";

export default function SoundloungeApp() {
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

  const handleTopNavChange = (tab: TopNavTab) => {
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
  };

  const openQueue = () => {
    setSelectedArtist(null);
    setSelectedAlbum(null);
    setActiveTab("queue");
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

  const {
    coordinator,
    playerState,
    sync,
    activeTrack,
    handleModeChange,
    handleAddTrack,
    handleAddTracksToQueue,
    handlePlayQueueTrack,
    handleRemoveTrack,
    handlePlayNext,
    handleClearQueue,
    handlePlaySingleTrack,
    handlePlayTracks,
    handleResumeSession,
    handleTogglePlay,
    handleSeek,
    handleNext,
    handlePrevious,
  } = usePlaybackController({ roomId, inviteToken, recordPlay });

  // Stores
  const { queue, currentIndex, isAutoplayEnabled, toggleAutoplay, autoQueueReasons } = useQueueStore(
    useShallow((s) => ({
      queue: s.queue,
      currentIndex: s.currentIndex,
      isAutoplayEnabled: s.isAutoplayEnabled,
      toggleAutoplay: s.toggleAutoplay,
      autoQueueReasons: s.autoQueueReasons,
    }))
  );

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
  } = useLibraryStore(
    useShallow((s) => ({
      likedTracks: s.likedTracks,
      playlists: s.playlists,
      history: s.history,
      lastSession: s.lastSession,
      toggleLike: s.toggleLike,
      isLiked: s.isLiked,
      createPlaylist: s.createPlaylist,
      addTrackToPlaylist: s.addTrackToPlaylist,
      deletePlaylist: s.deletePlaylist,
    }))
  );

  const handleToggleLike = (track: Track) => {
    const isCurrentlyLiked = isLiked(track.id);
    toggleLike(track);
    recordLike(track, !isCurrentlyLiked);
  };

  const handleSaveQueueAsPlaylist = (name: string) => {
    if (queue.length === 0) return;
    const plId = createPlaylist(name);
    queue.forEach((t) => addTrackToPlaylist(plId, t));
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

    handlePlayTracks(starterTracks);
  };

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

  const topBar = (
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
      onTopTabChange={handleTopNavChange}
    />
  );

  // Library, queue and settings come from localStorage, which the server render can't see; render only on the client
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => setIsMounted(true), []);
  if (!isMounted) return <div className="min-h-dvh bg-canvas" />;

  if (playerState.mode === "synced" && sync.isAccessDenied) {
    return (
      <div className="min-h-dvh bg-canvas">
        {topBar}
        <AccessDenied
          roomId={roomId}
          onRetryWithToken={(token) => setInviteToken(token)}
          onReturnToSolo={() => handleModeChange("solo")}
        />
      </div>
    );
  }

  const isDiscoverHome = !selectedArtist && !selectedAlbum && activeTab === "home" && topNavTab === "discover";

  return (
    <div
      id="app-shell"
      className="min-h-dvh bg-canvas text-ink relative overflow-x-hidden selection:bg-accent/30 selection:text-ink"
    >
      {/* Full-bleed Ambient Blurred Song Backdrop */}
      <AmbientBackground currentTrack={activeTrack} isPlaying={playerState.status === "playing"} />

      {/* Seasonal Autumn Falling Leaves ambient effect */}
      <FallingLeavesAmbient enabled={isLeavesEnabled} />

      {/* Main Studio Shell: Left Sidebar ("Playlist") + Right Main Stage */}
      <div className="relative z-10 flex min-h-dvh">
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
        <div className="flex-1 min-w-0 flex flex-col justify-between pb-player">
          <div>
            {isDiscoverHome ? (
              <div className="hero-stage w-full overflow-hidden min-h-[340px] sm:min-h-[380px] pb-32 sm:pb-24">
                {/* THE HERO ARTWORK / ARTIST PORTRAIT: EXTENDS SEAMLESSLY DOWN BEHIND POPULAR ALBUMS (FLAWLESS MULTI-EDGE BLEND) */}
                <div className="absolute top-0 right-0 w-full sm:w-[70%] lg:w-[62%] xl:w-[56%] h-[580px] sm:h-[880px] pointer-events-none z-[2] overflow-hidden flex items-start justify-end">
                  <img
                    key={currentSpotlight.id}
                    src={currentSpotlight.heroImageUrl}
                    alt={currentSpotlight.title}
                    className="w-full h-full object-cover object-top sm:object-[center_top] select-none [mask-image:linear-gradient(to_bottom,black_35%,transparent_95%)] sm:[mask-image:radial-gradient(ellipse_at_70%_35%,black_38%,rgba(0,0,0,0.85)_60%,transparent_88%)] [webkit-mask-image:linear-gradient(to_bottom,black_35%,transparent_95%)] sm:[webkit-mask-image:radial-gradient(ellipse_at_70%_35%,black_38%,rgba(0,0,0,0.85)_60%,transparent_88%)] animate-in fade-in duration-700 opacity-70 sm:opacity-100"
                  />
                  {/* Subtle right-edge lateral fade protecting ultra-wide viewports */}
                  <div className="absolute inset-y-0 right-0 w-16 sm:w-28 bg-gradient-to-l from-canvas to-transparent pointer-events-none" />
                </div>

                {/* TopBar sitting seamlessly over the hero stage */}
                <div className="relative z-20">
                  {topBar}
                </div>

                {/* Hero Typography & Action Controls */}
                <div className="relative z-10 px-4 sm:px-8 lg:px-12 pt-2 sm:pt-4 pb-8">
                  <DiscoverHero
                    onPlayTrack={handlePlaySingleTrack}
                    currentTrack={activeTrack}
                    isPlaying={playerState.status === "playing"}
                    activeIndex={safeSpotlightIndex}
                    onActiveIndexChange={setHeroSpotlightIndex}
                    spotlights={dynamicSpotlights}
                  />
                </div>

                {/* UNIFIED DISCOVER CONTENT: Taste Profile -> Tailored Albums -> Popular Artists */}
                <div className="animate-view-in relative z-10 max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 space-y-12 pt-2">
                  <DynamicTasteHomeSections
                    onPlayTrack={handlePlaySingleTrack}
                    onPlayMix={handlePlayTracks}
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
                    isOverHero={true}
                  />

                  {/* Albums Tailored To Your Vibe / Popular Albums Row */}
                  <PopularAlbumsRow
                    onSelectAlbum={(album) => setSelectedAlbum(album as unknown as Album)}
                    onPlayAlbum={handlePlayTracks}
                    onPlayTrack={handlePlaySingleTrack}
                  />

                  {/* Artists You Love & Similar / Popular Artists Row */}
                  <PopularArtistsRow
                    onSelectArtist={(artist) => {
                      recordArtistView(artist.name);
                      setSelectedArtist(artist);
                    }}
                  />
                </div>
              </div>
            ) : (
              <div>
                {topBar}

                {/* Stage Canvas for non-discover views */}
                <main className="max-w-7xl mx-auto px-4 sm:px-8 pt-3 sm:pt-6 pb-player">
                  {/* Detailed Artist Profile & Discography View */}
                  {selectedArtist ? (
                    <ArtistDetailView
                      artist={selectedArtist}
                      onBack={() => setSelectedArtist(null)}
                      onPlayTrack={handlePlaySingleTrack}
                      onAddTrack={handleAddTrack}
                      onPlayAll={handlePlayTracks}
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
                      onPlayAlbum={handlePlayTracks}
                      onAddAlbumToQueue={handleAddTracksToQueue}
                      currentTrack={activeTrack}
                      isPlaying={playerState.status === "playing"}
                      onSelectAlbum={(alb) => setSelectedAlbum(alb)}
                    />
                  ) : activeTab === "queue" ? (
                    <div className="animate-view-in max-w-4xl mx-auto space-y-6">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <h2 className="text-xl font-bold text-ink tracking-tight font-display">Playing Queue</h2>
                          <p className="text-xs text-ink-muted">
                            {queue.length} track{queue.length === 1 ? "" : "s"} scheduled • Autoplay similar soundscapes
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            setActiveTab("home");
                            setTopNavTab("discover");
                          }}
                          className="min-h-11 text-xs text-accent hover:underline cursor-pointer"
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
                    <div className="animate-view-in max-w-4xl mx-auto space-y-6">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <h2 className="text-lg font-bold text-ink tracking-tight font-display">Music Search & Ingestion</h2>
                          <p className="text-xs text-ink-muted">
                            Direct search powered by YouTube & low-latency edge audio streaming
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            setSearchQuery("");
                            setActiveTab("home");
                            setTopNavTab("discover");
                          }}
                          className="min-h-11 text-xs text-accent hover:underline cursor-pointer"
                        >
                          Back to Discover
                        </button>
                      </div>

                      <MusicIngestion
                        onAddTrack={handleAddTrack}
                        onPlayDirect={handlePlaySingleTrack}
                        roomId={roomId}
                        inviteToken={inviteToken}
                        initialQuery={searchQuery}
                        onQueryChange={setSearchQuery}
                        onSelectAlbum={(album) => setSelectedAlbum(album)}
                      />
                    </div>
                  ) : topNavTab === "library" || activeTab === "liked" || activeTab === "history" ? (
                    <div className="animate-view-in max-w-5xl mx-auto">
                      <LibraryView
                        likedTracks={likedTracks}
                        playlists={playlists}
                        history={history}
                        lastSession={lastSession}
                        onPlayTrack={handlePlaySingleTrack}
                        onPlayPlaylist={(playlist) => handlePlayTracks(playlist.tracks)}
                        onCreatePlaylist={createPlaylist}
                        onDeletePlaylist={deletePlaylist}
                        onResumeSession={handleResumeSession}
                        activeSection={activeTab === "history" ? "history" : "liked"}
                      />
                    </div>
                  ) : topNavTab === "radio" || activeTab === "genres" ? (
                    <div className="animate-view-in max-w-6xl mx-auto">
                      <GenreDirectoryView
                        onPlayGenreRadio={handlePlayGenreRadio}
                        onSelectArtist={(artist) => setSelectedArtist(artist)}
                        onSelectAlbum={(album) => setSelectedAlbum(album)}
                      />
                    </div>
                  ) : null}
                </main>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile primary navigation in the thumb zone. Rendered before the player so
          the keyboard order matches the visual order from top to bottom. */}
      <MobileNav
        activeTopTab={topNavTab}
        activeTab={activeTab}
        onSelect={handleTopNavChange}
        onOpenQueue={openQueue}
        hasPlayer={!!activeTrack}
        queueCount={queue.length}
      />

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
        onOpenQueue={openQueue}
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
