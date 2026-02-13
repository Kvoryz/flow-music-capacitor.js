// ZPlayer Audio Engine — Singleton audio controller
class AudioEngine {
  constructor() {
    this.audio = new Audio();
    this.audio.preload = "auto";
    this.currentTrack = null;
    this.isPlaying = false;
    this.currentTime = 0;
    this.duration = 0;
    this.volume = 1;
    this.repeatMode = "off"; // off, one, all
    this.shuffleMode = false;
    this._listeners = {};

    this._setupAudioEvents();
    this._setupMediaSession();
  }

  _setupAudioEvents() {
    this.audio.addEventListener("timeupdate", () => {
      this.currentTime = this.audio.currentTime;
      this.duration = this.audio.duration || 0;
      this._emit("timeupdate", {
        currentTime: this.currentTime,
        duration: this.duration,
      });
    });

    this.audio.addEventListener("loadedmetadata", () => {
      this.duration = this.audio.duration;
      this._emit("loaded", { duration: this.duration });
    });

    this.audio.addEventListener("ended", () => {
      this._handleTrackEnd();
    });

    this.audio.addEventListener("play", () => {
      this.isPlaying = true;
      this._emit("play", { track: this.currentTrack });
    });

    this.audio.addEventListener("pause", () => {
      this.isPlaying = false;
      this._emit("pause", { track: this.currentTrack });
    });

    this.audio.addEventListener("error", (e) => {
      console.error("Audio error:", e);
      this._emit("error", { error: e });
    });
  }

  _setupMediaSession() {
    if ("mediaSession" in navigator) {
      navigator.mediaSession.setActionHandler("play", () => this.resume());
      navigator.mediaSession.setActionHandler("pause", () => this.pause());
      navigator.mediaSession.setActionHandler("previoustrack", () =>
        this._emit("prev"),
      );
      navigator.mediaSession.setActionHandler("nexttrack", () =>
        this._emit("next"),
      );
      navigator.mediaSession.setActionHandler("seekto", (details) => {
        if (details.seekTime != null) this.seek(details.seekTime);
      });
    }
  }

  _updateMediaSession(track) {
    if ("mediaSession" in navigator && track) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: track.title,
        artist: track.artist,
        album: track.album,
        artwork: track.cover
          ? [{ src: track.cover, sizes: "400x400", type: "image/jpeg" }]
          : [],
      });
    }
  }

  async play(track) {
    if (!track || !track.src) return;
    this.currentTrack = track;
    this.audio.src = track.src;

    try {
      await this.audio.play();
      this._updateMediaSession(track);
      this._emit("trackchange", { track });
    } catch (err) {
      console.error("Play failed:", err);
    }
  }

  pause() {
    this.audio.pause();
  }

  resume() {
    if (this.currentTrack) {
      this.audio.play().catch(() => {});
    }
  }

  togglePlay() {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.resume();
    }
  }

  seek(time) {
    if (isFinite(time)) {
      this.audio.currentTime = time;
    }
  }

  setVolume(level) {
    this.volume = Math.max(0, Math.min(1, level));
    this.audio.volume = this.volume;
    this._emit("volumechange", { volume: this.volume });
  }

  toggleRepeat() {
    const modes = ["off", "all", "one"];
    const idx = modes.indexOf(this.repeatMode);
    this.repeatMode = modes[(idx + 1) % modes.length];
    this._emit("repeatchange", { mode: this.repeatMode });
    return this.repeatMode;
  }

  toggleShuffle() {
    this.shuffleMode = !this.shuffleMode;
    this._emit("shufflechange", { enabled: this.shuffleMode });
    return this.shuffleMode;
  }

  _handleTrackEnd() {
    if (this.repeatMode === "one") {
      this.audio.currentTime = 0;
      this.audio.play().catch(() => {});
    } else {
      this._emit("ended");
    }
  }

  // Event system
  on(event, callback) {
    if (!this._listeners[event]) this._listeners[event] = [];
    this._listeners[event].push(callback);
  }

  off(event, callback) {
    if (!this._listeners[event]) return;
    this._listeners[event] = this._listeners[event].filter(
      (cb) => cb !== callback,
    );
  }

  _emit(event, data) {
    if (this._listeners[event]) {
      this._listeners[event].forEach((cb) => cb(data));
    }
  }
}

// Singleton
export const audioEngine = new AudioEngine();
