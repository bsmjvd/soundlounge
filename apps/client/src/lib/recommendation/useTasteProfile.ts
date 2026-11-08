"use client";

import { useState, useEffect } from "react";
import { TasteProfileEngine, type StoredTasteProfile } from "./TasteProfileEngine";
import type { Track, Album } from "@soundlounge/shared";
import type { ArtistProfileData } from "../data/artistsCatalog";
import type { DisplayAlbum, DisplayArtist, FeaturedSpotlight } from "../data/mockupData";

export function useTasteProfile() {
  const engine = TasteProfileEngine.getInstance();
  const [profile, setProfile] = useState<StoredTasteProfile>(() => engine.getProfile());

  useEffect(() => {
    return engine.subscribe((newProfile) => {
      setProfile({ ...newProfile });
    });
  }, [engine]);

  return {
    profile,
    hasTaste: engine.hasTasteProfile(),
    dominantGenre: engine.getDominantGenre(),
    dominantArtist: engine.getDominantArtist(),
    topArtists: engine.getTopArtists(10),
    topGenres: engine.getTopGenres(5),
    recordPlay: (track: Track) => engine.recordPlay(track),
    recordLike: (track: Track, isLiked: boolean) => engine.recordLike(track, isLiked),
    recordSearch: (query: string) => engine.recordSearch(query),
    recordArtistView: (artistName: string) => engine.recordArtistView(artistName),
    rankArtists: (artists: ArtistProfileData[]) => engine.rankArtists(artists),
    rankDisplayArtists: (artists: DisplayArtist[]) => engine.rankDisplayArtists(artists),
    rankAlbums: <T extends Album | DisplayAlbum>(albums: T[]) => engine.rankAlbums(albums),
    getPersonalizedSpotlights: () => engine.getPersonalizedSpotlights(),
    getBecauseYouListenedSection: () => engine.getBecauseYouListenedSection(),
    getSidebarRecommendedTracks: () => engine.getSidebarRecommendedTracks(),
  };
}
