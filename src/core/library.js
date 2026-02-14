// ZPlayer Library — Music data layer
// Supports both demo data (web) and scanned local files (Android)
import tracksData from "../data/tracks.json";
import { scanner } from "./scanner.js";

class Library {
  constructor() {
    // Start with demo data
    this.tracks = tracksData.tracks || [];
    this.albums = tracksData.albums || [];
    this.artists = tracksData.artists || [];
    this._favorites = this._loadFavorites();
    this._playlists = this._loadPlaylists();
    this._recentlyPlayed = this._loadRecent();
    this._playCounts = this._loadPlayCounts();
    this._listeners = {};
    this._initialized = false;
  }

  _saveToLocal() {
    localStorage.setItem(
      "zplayer_tracks_modified",
      JSON.stringify(this.tracks),
    );
  }

  /**
   * Initialize by loading cached library first, then scanning if needed.
   * Should be called once at app startup.
   */
  async init() {
    if (this._initialized) return;
    this._initialized = true;

    // Try to load from cache first (instant startup)
    const cached = this._loadCachedLibrary();
    if (cached && cached.tracks && cached.tracks.length > 0) {
      this.tracks = cached.tracks;
      this.albums = cached.albums || [];
      this.artists = cached.artists || [];
      this._enrichAlbums();
      this._emit("updated", {
        tracks: this.tracks.length,
        albums: this.albums.length,
        artists: this.artists.length,
      });
      return; // Use cached data, no re-scan needed
    }

    // No cache: perform a full scan
    try {
      const result = await scanner.scan();
      if (result && result.tracks.length > 0) {
        this.tracks = result.tracks;
        this.albums = result.albums;
        this.artists = result.artists;
        this._enrichAlbums();
        this._saveCachedLibrary();
        this._emit("updated", {
          tracks: this.tracks.length,
          albums: this.albums.length,
          artists: this.artists.length,
        });
      }
    } catch (err) {
      console.warn("Library init scan failed, using demo data:", err);
    }
  }

  _enrichAlbums() {
    // Build trackIds for albums if not present
    this.albums.forEach((album) => {
      if (!album.trackIds || album.trackIds.length === 0) {
        album.trackIds = this.tracks
          .filter((t) => t.albumId === album.id)
          .map((t) => t.id);
      }
    });
    // Build artistId for albums if missing
    this.albums.forEach((album) => {
      if (!album.artistId) {
        const firstTrack = this.tracks.find((t) => t.albumId === album.id);
        if (firstTrack) album.artistId = firstTrack.artistId;
      }
    });
  }

  _saveCachedLibrary() {
    try {
      localStorage.setItem(
        "flow_library_cache",
        JSON.stringify({
          tracks: this.tracks,
          albums: this.albums,
          artists: this.artists,
          savedAt: Date.now(),
        }),
      );
    } catch {
      /* storage full */
    }
  }

  _loadCachedLibrary() {
    try {
      const data = localStorage.getItem("flow_library_cache");
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  /**
   * Let user pick a folder and scan it
   */
  async pickAndScanFolder() {
    try {
      const folder = await scanner.chooseFolder();
      if (!folder) return;

      const result = await scanner.scanFolder(folder.folderUri);
      if (result && result.tracks) {
        this.tracks = result.tracks;
        this.albums = result.albums;
        this.artists = result.artists;
        this._enrichAlbums();
        this._saveCachedLibrary();

        this._emit("updated", {
          tracks: this.tracks.length,
          albums: this.albums.length,
          artists: this.artists.length,
          folder: result.folder,
        });
      }
    } catch (err) {
      console.error("Pick and scan failed:", err);
    }
  }

  /**
   * Force rescan music from device
   */
  async rescan() {
    this._initialized = false;
    return this.init();
  }

  // ========================
  // Tracks
  // ========================
  getAllTracks() {
    return this.tracks;
  }

  getTrackById(id) {
    return this.tracks.find((t) => t.id === id);
  }

  getTracksByAlbum(albumId) {
    return this.tracks.filter((t) => t.albumId === albumId);
  }

  getTracksByArtist(artistId) {
    return this.tracks.filter((t) => t.artistId === artistId);
  }

  /**
   * Add a track from an external source (like YouTube search results)
   */
  addExternalTrack(track) {
    if (!this.tracks.find((t) => t.id === track.id)) {
      // Ensure it has basic fields
      const newTrack = {
        ...track,
        id: track.id || `ext_${Date.now()}`,
        dateAdded: Date.now(),
        artistId: track.artistId || "yt_unknown",
        albumId: track.albumId || "yt_downloads",
      };

      this.tracks.push(newTrack);

      // Ensure "YouTube" artist/album exist in memory
      if (!this.artists.find((a) => a.id === newTrack.artistId)) {
        this.artists.push({
          id: newTrack.artistId,
          name: newTrack.artist,
          genre: "YouTube",
        });
      }
      if (!this.albums.find((a) => a.id === newTrack.albumId)) {
        this.albums.push({
          id: newTrack.albumId,
          title: "YouTube Downloads",
          artist: "Various Artists",
          cover: "",
        });
      }

      this._saveToLocal();
      this._emit("updated");
      return newTrack;
    }
    return this.tracks.find((t) => t.id === track.id);
  }

  /**
   * Sort tracks by various criteria
   */
  sortTracks(tracks, criterion = "title", ascending = true) {
    const sorted = [...tracks].sort((a, b) => {
      let valA, valB;

      switch (criterion) {
        case "artist":
          valA = (a.artist || "").toLowerCase();
          valB = (b.artist || "").toLowerCase();
          break;
        case "album":
          valA = (a.album || "").toLowerCase();
          valB = (b.album || "").toLowerCase();
          break;
        case "duration":
          valA = a.duration || 0;
          valB = b.duration || 0;
          break;
        case "date":
          valA = a.createdAt || 0;
          valB = b.createdAt || 0;
          break;
        default:
          valA = (a.title || "").toLowerCase();
          valB = (b.title || "").toLowerCase();
      }

      if (valA < valB) return ascending ? -1 : 1;
      if (valA > valB) return ascending ? 1 : -1;
      return 0;
    });
    return sorted;
  }

  // ========================
  // Albums
  // ========================
  getAllAlbums() {
    return this.albums;
  }

  getAlbumById(id) {
    return this.albums.find((a) => a.id === id);
  }

  getAlbumsByArtist(artistId) {
    return this.albums.filter((a) => a.artistId === artistId);
  }

  // ========================
  // Artists
  // ========================
  getAllArtists() {
    return this.artists;
  }

  getArtistById(id) {
    return this.artists.find((a) => a.id === id);
  }

  // ========================
  // Search
  // ========================
  search(query) {
    if (!query || query.trim().length === 0)
      return { tracks: [], albums: [], artists: [] };
    const q = query.toLowerCase().trim();

    const tracks = this.tracks.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.artist.toLowerCase().includes(q) ||
        t.album.toLowerCase().includes(q),
    );

    const albums = this.albums.filter(
      (a) =>
        a.title.toLowerCase().includes(q) || a.artist.toLowerCase().includes(q),
    );

    const artists = this.artists.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        (a.genre && a.genre.toLowerCase().includes(q)),
    );

    return { tracks, albums, artists };
  }

  // ========================
  // Favorites
  // ========================
  getFavorites() {
    return this._favorites;
  }

  getFavoriteTracks() {
    return this.tracks.filter((t) => this._favorites.includes(t.id));
  }

  isFavorite(trackId) {
    return this._favorites.includes(trackId);
  }

  toggleFavorite(trackId) {
    const idx = this._favorites.indexOf(trackId);
    if (idx >= 0) {
      this._favorites.splice(idx, 1);
    } else {
      this._favorites.push(trackId);
    }
    this._saveFavorites();
    return this.isFavorite(trackId);
  }

  _loadFavorites() {
    try {
      return JSON.parse(localStorage.getItem("zplayer_favorites")) || [];
    } catch {
      return [];
    }
  }
  _saveFavorites() {
    localStorage.setItem("zplayer_favorites", JSON.stringify(this._favorites));
  }

  // ========================
  // Playlists
  // ========================
  getPlaylists() {
    return this._playlists;
  }

  getPlaylistById(id) {
    return this._playlists.find((p) => p.id === id);
  }

  getPlaylistTracks(playlistId) {
    const pl = this.getPlaylistById(playlistId);
    if (!pl) return [];
    return pl.trackIds.map((id) => this.getTrackById(id)).filter(Boolean);
  }

  createPlaylist(name) {
    const playlist = {
      id: "pl_" + Date.now(),
      name,
      trackIds: [],
      cover: null,
      createdAt: Date.now(),
    };
    this._playlists.push(playlist);
    this._savePlaylists();
    return playlist;
  }

  deletePlaylist(id) {
    this._playlists = this._playlists.filter((p) => p.id !== id);
    this._savePlaylists();
  }

  renamePlaylist(id, newName) {
    const pl = this.getPlaylistById(id);
    if (pl) {
      pl.name = newName;
      this._savePlaylists();
    }
  }

  updatePlaylistCover(id, coverUrl) {
    const pl = this.getPlaylistById(id);
    if (pl) {
      pl.cover = coverUrl;
      this._savePlaylists();
      this._emit("updated");
    }
  }

  getArtistCover(artistId) {
    // Use first album cover from this artist as their image
    const album = this.albums.find((a) => a.artistId === artistId && a.cover);
    if (album) return album.cover;
    // Fallback: first track cover
    const track = this.tracks.find((t) => t.artistId === artistId && t.cover);
    return track ? track.cover : "";
  }

  addTrackToPlaylist(playlistId, trackId) {
    const pl = this.getPlaylistById(playlistId);
    if (pl && !pl.trackIds.includes(trackId)) {
      pl.trackIds.push(trackId);
      if (!pl.cover) {
        const track = this.getTrackById(trackId);
        if (track) pl.cover = track.cover;
      }
      this._savePlaylists();
      return true;
    }
    return false;
  }

  removeTrackFromPlaylist(playlistId, trackId) {
    const pl = this.getPlaylistById(playlistId);
    if (pl) {
      pl.trackIds = pl.trackIds.filter((id) => id !== trackId);
      this._savePlaylists();
    }
  }

  _loadPlaylists() {
    try {
      return JSON.parse(localStorage.getItem("zplayer_playlists")) || [];
    } catch {
      return [];
    }
  }
  _savePlaylists() {
    localStorage.setItem("zplayer_playlists", JSON.stringify(this._playlists));
  }

  // ========================
  // Recently Played
  // ========================
  getRecentlyPlayed() {
    return this._recentlyPlayed
      .map((id) => this.getTrackById(id))
      .filter(Boolean);
  }

  addToRecent(trackId) {
    this._recentlyPlayed = this._recentlyPlayed.filter((id) => id !== trackId);
    this._recentlyPlayed.unshift(trackId);
    if (this._recentlyPlayed.length > 20) {
      this._recentlyPlayed = this._recentlyPlayed.slice(0, 20);
    }
    this._saveRecent();
  }

  _loadRecent() {
    try {
      return JSON.parse(localStorage.getItem("zplayer_recent")) || [];
    } catch {
      return [];
    }
  }

  _loadPlayCounts() {
    try {
      return JSON.parse(localStorage.getItem("zplayer_playcounts")) || {};
    } catch {
      return {};
    }
  }

  // Smart Playlists
  getRecentlyAdded(limit = 20) {
    return [...this.tracks]
      .sort(
        (a, b) =>
          (b.dateAdded || b.createdAt || 0) - (a.dateAdded || a.createdAt || 0),
      )
      .slice(0, limit);
  }

  getForgottenTracks(limit = 20) {
    const counts = this._loadPlayCounts();
    // Prioritize tracks with 0 plays, then tracks with fewest plays
    return [...this.tracks]
      .map((t) => ({ ...t, plays: counts[t.id] || 0 }))
      .sort((a, b) => a.plays - b.plays)
      .slice(0, limit);
  }

  getRandomAlbum() {
    if (this.albums.length === 0) return null;
    const idx = Math.floor(Math.random() * this.albums.length);
    return this.albums[idx];
  }

  getMostPlayed(limit = 20) {
    const counts = this._loadPlayCounts();
    return [...this.tracks]
      .map((t) => ({ ...t, plays: counts[t.id] || 0 }))
      .filter((t) => t.plays > 0)
      .sort((a, b) => b.plays - a.plays)
      .slice(0, limit);
  }

  incrementPlayCount(trackId) {
    const counts = this._loadPlayCounts();
    counts[trackId] = (counts[trackId] || 0) + 1;
    localStorage.setItem("zplayer_playcounts", JSON.stringify(counts));
    this._emit("updated");
  }

  // Metadata Editor
  updateTrackMetadata(trackId, newData) {
    const trackIndex = this.tracks.findIndex((t) => t.id === trackId);
    if (trackIndex >= 0) {
      this.tracks[trackIndex] = { ...this.tracks[trackIndex], ...newData };
      this._saveToLocal();
      this._emit("updated");
      return true;
    }
    return false;
  }
  _saveRecent() {
    localStorage.setItem(
      "zplayer_recent",
      JSON.stringify(this._recentlyPlayed),
    );
  }

  // Event system
  on(event, cb) {
    if (!this._listeners[event]) this._listeners[event] = [];
    this._listeners[event].push(cb);
  }
  off(event, cb) {
    if (!this._listeners[event]) return;
    this._listeners[event] = this._listeners[event].filter((fn) => fn !== cb);
  }
  _emit(event, data) {
    if (this._listeners[event]) {
      this._listeners[event].forEach((cb) => cb(data));
    }
  }
}

export const musicLibrary = new Library();
