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
    this._listeners = {};
    this._initialized = false;
  }

  /**
   * Initialize by scanning local music (if on Android)
   * Should be called once at app startup
   */
  async init() {
    if (this._initialized) return;
    this._initialized = true;

    try {
      const result = await scanner.scan();
      if (result && result.tracks.length > 0) {
        this.tracks = result.tracks;
        this.albums = result.albums;
        this.artists = result.artists;

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
  _emit(event, data) {
    if (this._listeners[event]) {
      this._listeners[event].forEach((cb) => cb(data));
    }
  }
}

export const library = new Library();
