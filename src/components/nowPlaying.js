// ZPlayer — Now Playing Full Screen
import { icons } from "../core/icons.js";
import { audioEngine } from "../core/audioEngine.js";
import { queueManager } from "../core/queue.js";
import { musicLibrary } from "../core/library.js";
import { store } from "../core/store.js";
import { router } from "../router.js";
import { formatTime, createElement } from "../core/utils.js";

let progressDragging = false;

export function createNowPlaying() {
  const el = createElement("div", "now-playing");
  el.id = "now-playing";

  el.innerHTML = `
    <div class="now-playing-bg" id="np-bg"></div>
    <div class="now-playing-content">
      <div class="now-playing-header">
        <button class="now-playing-close" id="np-close">${icons.chevronDown}</button>
        <span class="now-playing-source" id="np-source">Playing from Library</span>
        <button class="now-playing-menu" id="np-menu">${icons.moreVert}</button>
      </div>

      <div class="now-playing-art-container">
        <img class="now-playing-art" id="np-art" src="" alt="">
      </div>

      <div class="now-playing-info">
        <div class="now-playing-details">
          <div class="now-playing-title" id="np-title">Not Playing</div>
          <div class="now-playing-artist" id="np-artist"></div>
        </div>
        <button class="now-playing-like" id="np-like">${icons.heart}</button>
      </div>

      <div class="progress-container">
        <div class="progress-bar-wrapper" id="np-progress-wrapper">
          <div class="progress-bar-fill" id="np-progress-fill" style="width: 0%">
            <div class="progress-bar-thumb"></div>
          </div>
        </div>
        <div class="progress-times">
          <span id="np-time-current">0:00</span>
          <span id="np-time-total">0:00</span>
        </div>
      </div>

      <div class="now-playing-controls">
        <button class="control-btn" id="np-shuffle" aria-label="Shuffle">${icons.shuffle}</button>
        <button class="control-btn control-btn-skip" id="np-prev" aria-label="Previous">${icons.skipPrev}</button>
        <button class="control-btn-play" id="np-play" aria-label="Play">${icons.play}</button>
        <button class="control-btn control-btn-skip" id="np-next" aria-label="Next">${icons.skipNext}</button>
        <button class="control-btn" id="np-repeat" aria-label="Repeat">${icons.repeat}</button>
      </div>

      <div class="now-playing-bottom">
        <button id="np-device">${icons.volumeUp}</button>
        <button id="np-queue">${icons.queue}</button>
        <button id="np-share">${icons.share}</button>
      </div>
    </div>
  `;

  // Close
  el.querySelector("#np-close").addEventListener("click", () => {
    store.set("nowPlayingOpen", false);
  });

  // Controls
  el.querySelector("#np-play").addEventListener("click", () => {
    audioEngine.togglePlay();
  });

  el.querySelector("#np-prev").addEventListener("click", () => {
    queueManager.playPrev();
  });

  el.querySelector("#np-next").addEventListener("click", () => {
    queueManager.playNext();
  });

  el.querySelector("#np-shuffle").addEventListener("click", () => {
    queueManager.toggleShuffle();
    const enabled = audioEngine.shuffleMode;
    store.showToast(enabled ? "Shuffle On 🔀" : "Shuffle Off");
  });

  el.querySelector("#np-repeat").addEventListener("click", () => {
    const mode = audioEngine.toggleRepeat();
    const labels = {
      off: "Repeat Off",
      all: "Repeat All 🔁",
      one: "Repeat One 🔂",
    };
    store.showToast(labels[mode] || "Repeat Off");
  });

  el.querySelector("#np-like").addEventListener("click", () => {
    const track = queueManager.getCurrentTrack();
    if (track) {
      const liked = musicLibrary.toggleFavorite(track.id);
      updateLikeButton(el, liked);
      store.showToast(
        liked ? "Added to Liked Songs" : "Removed from Liked Songs",
      );
    }
  });

  el.querySelector("#np-queue").addEventListener("click", () => {
    store.set("nowPlayingOpen", false);
    router.navigate("#/queue");
  });

  el.querySelector("#np-menu").addEventListener("click", () => {
    const track = queueManager.getCurrentTrack();
    if (track) {
      store.set("contextMenu", { track });
    }
  });

  // Progress bar seeking
  const progressWrapper = el.querySelector("#np-progress-wrapper");

  const seekFromEvent = (e) => {
    const rect = progressWrapper.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const time = pct * (audioEngine.duration || 0);
    audioEngine.seek(time);
  };

  progressWrapper.addEventListener("mousedown", (e) => {
    progressDragging = true;
    seekFromEvent(e);
  });

  progressWrapper.addEventListener(
    "touchstart",
    (e) => {
      progressDragging = true;
      const touch = e.touches[0];
      const rect = progressWrapper.getBoundingClientRect();
      const pct = Math.max(
        0,
        Math.min(1, (touch.clientX - rect.left) / rect.width),
      );
      audioEngine.seek(pct * (audioEngine.duration || 0));
    },
    { passive: true },
  );

  window.addEventListener("mousemove", (e) => {
    if (progressDragging) seekFromEvent(e);
  });

  window.addEventListener("mouseup", () => {
    progressDragging = false;
  });

  window.addEventListener(
    "touchmove",
    (e) => {
      if (progressDragging) {
        const touch = e.touches[0];
        const rect = progressWrapper.getBoundingClientRect();
        const pct = Math.max(
          0,
          Math.min(1, (touch.clientX - rect.left) / rect.width),
        );
        audioEngine.seek(pct * (audioEngine.duration || 0));
      }
    },
    { passive: true },
  );

  window.addEventListener("touchend", () => {
    progressDragging = false;
  });

  // Update UI on audio events
  audioEngine.on("trackchange", ({ track }) => updateNowPlayingUI(el, track));
  audioEngine.on("play", () => {
    el.querySelector("#np-play").innerHTML = icons.pause;
  });
  audioEngine.on("pause", () => {
    el.querySelector("#np-play").innerHTML = icons.play;
  });
  audioEngine.on("timeupdate", ({ currentTime, duration }) => {
    if (!progressDragging && duration > 0) {
      const pct = (currentTime / duration) * 100;
      el.querySelector("#np-progress-fill").style.width = pct + "%";
      el.querySelector("#np-time-current").textContent =
        formatTime(currentTime);
      el.querySelector("#np-time-total").textContent = formatTime(duration);
    }
  });

  audioEngine.on("shufflechange", ({ enabled }) => {
    el.querySelector("#np-shuffle").className =
      `control-btn${enabled ? " active" : ""}`;
  });

  audioEngine.on("repeatchange", ({ mode }) => {
    const btn = el.querySelector("#np-repeat");
    btn.className = `control-btn${mode !== "off" ? " active" : ""}`;
    btn.innerHTML = mode === "one" ? icons.repeatOne : icons.repeat;
  });

  // Open/close reactivity
  store.on("nowPlayingOpen", (open) => {
    if (open) {
      el.classList.add("open");
      document.body.style.overflow = "hidden";
    } else {
      el.classList.remove("open");
      document.body.style.overflow = "";
    }
  });

  // Real-time metadata updates
  musicLibrary.on("updated", () => {
    const track = queueManager.getCurrentTrack();
    if (track) updateNowPlayingUI(el, track);
  });

  return el;
}

function updateNowPlayingUI(el, track) {
  el.querySelector("#np-art").src = track.cover || "";
  el.querySelector("#np-bg").style.backgroundImage = `url(${track.cover})`;
  el.querySelector("#np-title").textContent = track.title;
  el.querySelector("#np-artist").textContent = track.artist;
  updateLikeButton(el, musicLibrary.isFavorite(track.id));
}

function updateLikeButton(el, liked) {
  const btn = el.querySelector("#np-like");
  btn.className = `now-playing-like${liked ? " liked" : ""}`;
  btn.innerHTML = liked ? icons.heartFill : icons.heart;
}
