// ZPlayer — Local Music Scanner
// Uses custom Capacitor MusicScanner plugin on Android,
// falls back to demo data on web
import { Capacitor, registerPlugin } from "@capacitor/core";
import tracksData from "../data/tracks.json";

const MusicScanner = registerPlugin("MusicScanner");

/**
 * Convert native file paths and content:// URIs to WebView-accessible URLs.
 * This is REQUIRED for both audio playback and album art display in Capacitor.
 */
function convertUri(uri) {
  if (!uri) return "";
  try {
    return Capacitor.convertFileSrc(uri);
  } catch {
    return uri;
  }
}

class LocalScanner {
  constructor() {
    this._cachedResult = null;
    this._isScanning = false;
    this._listeners = {};
  }

  /**
   * Check if running on a native platform
   */
  isNative() {
    return Capacitor.isNativePlatform();
  }

  /**
   * Request audio permission on Android
   */
  async requestPermission() {
    if (!this.isNative()) return { audio: "granted" };
    try {
      const result = await MusicScanner.requestPermissions();
      return result;
    } catch (err) {
      console.error("Permission request failed:", err);
      return { audio: "denied" };
    }
  }

  /**
   * Check current permission status
   */
  async checkPermission() {
    if (!this.isNative()) return { audio: "granted" };
    try {
      const result = await MusicScanner.checkPermissions();
      return result;
    } catch {
      return { audio: "denied" };
    }
  }

  /**
   * Let user choose a folder to scan
   */
  async chooseFolder() {
    if (!this.isNative()) return null;
    try {
      return await MusicScanner.chooseFolder();
    } catch (err) {
      console.error("Choose folder failed:", err);
      return null;
    }
  }

  /**
   * Scan a specific folder
   */
  async scanFolder(folderUri) {
    if (!this.isNative()) return this._getDemoData();

    this._isScanning = true;
    this._emit("scanstart");

    try {
      const result = await MusicScanner.scanFolder({ folderUri });
      const processed = this._processNativeResult(result);

      // Merge with existing or replace?
      // For "scan folder", it's usually better to just use that as the library
      // or add to it. Let's merge for now to be helpful.
      const current = this.getCached();
      const mergedTracks = [...current.tracks];

      processed.tracks.forEach((newTrack) => {
        if (!mergedTracks.find((t) => t.id === newTrack.id)) {
          mergedTracks.push(newTrack);
        }
      });

      // Filter or rebuild albums/artists from merged tracks
      const finalResult = this._processNativeResult({ tracks: mergedTracks });
      this._cachedResult = finalResult;

      localStorage.setItem("zplayer_scan_cache", JSON.stringify(finalResult));

      this._isScanning = false;
      this._emit("scancomplete", { count: processed.tracks.length });
      return finalResult;
    } catch (err) {
      console.error("Folder scan failed:", err);
      this._isScanning = false;
      this._emit("scanerror", { error: err.message });
      return this.getCached();
    }
  }

  /**
   * Scan for local music files
   * Returns { tracks, albums, artists } matching the app's data format
   */
  async scan() {
    if (!this.isNative()) {
      // Return demo data on web
      return this._getDemoData();
    }

    if (this._isScanning) {
      return this._cachedResult || this._getDemoData();
    }

    this._isScanning = true;
    this._emit("scanstart");

    try {
      // Request permission first
      const perm = await this.requestPermission();
      if (perm.audio !== "granted") {
        console.warn("Audio permission not granted");
        this._isScanning = false;
        this._emit("scanerror", { error: "Permission denied" });
        return this._getDemoData();
      }

      // Scan via native plugin
      const result = await MusicScanner.scanMusic();

      // Process the result to match our data format
      const processed = this._processNativeResult(result);
      this._cachedResult = processed;

      // Cache in localStorage
      try {
        localStorage.setItem("zplayer_scan_cache", JSON.stringify(processed));
        localStorage.setItem("zplayer_scan_time", Date.now().toString());
      } catch {
        /* storage full */
      }

      this._isScanning = false;
      this._emit("scancomplete", { count: processed.tracks.length });
      return processed;
    } catch (err) {
      console.error("Music scan failed:", err);
      this._isScanning = false;
      this._emit("scanerror", { error: err.message });

      // Try to return cached data
      return this._getCachedData() || this._getDemoData();
    }
  }

  /**
   * Get cached scan result (no network call)
   */
  getCached() {
    if (this._cachedResult) return this._cachedResult;
    return this._getCachedData() || this._getDemoData();
  }

  /**
   * Process native MediaStore result into our app format
   */
  _processNativeResult(result) {
    const tracks = result.tracks || [];
    const albums = result.albums || [];
    const artists = result.artists || [];

    // Build trackIds per album
    const albumTrackMap = {};
    tracks.forEach((t) => {
      if (!albumTrackMap[t.albumId]) albumTrackMap[t.albumId] = [];
      albumTrackMap[t.albumId].push(t.id);
    });

    // Find artistId for each album from tracks
    const albumArtistMap = {};
    tracks.forEach((t) => {
      if (!albumArtistMap[t.albumId]) albumArtistMap[t.albumId] = t.artistId;
    });

    // Enrich albums — convert cover URIs for WebView
    const enrichedAlbums = albums.map((a) => ({
      ...a,
      trackIds: albumTrackMap[a.id] || [],
      artistId: albumArtistMap[a.id] || "",
      cover: convertUri(a.cover),
      genre: "",
    }));

    // For tracks — convert BOTH src (for playback) AND cover (for display)
    const enrichedTracks = tracks.map((t) => ({
      ...t,
      src: convertUri(t.src || t.contentUri || ""),
      cover: convertUri(t.cover),
    }));

    return {
      tracks: enrichedTracks,
      albums: enrichedAlbums,
      artists: artists,
    };
  }

  /**
   * Get cached data from localStorage
   */
  _getCachedData() {
    try {
      const cached = localStorage.getItem("zplayer_scan_cache");
      if (cached) return JSON.parse(cached);
    } catch {
      /* ignore */
    }
    return null;
  }

  /**
   * Return demo data for web development
   */
  _getDemoData() {
    return {
      tracks: tracksData.tracks || [],
      albums: tracksData.albums || [],
      artists: tracksData.artists || [],
    };
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

export const scanner = new LocalScanner();
