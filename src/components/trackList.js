// ZPlayer — Track List Component
import { icons } from "../core/icons.js";
import { audioEngine } from "../core/audioEngine.js";
import { queueManager } from "../core/queue.js";
import { library } from "../core/library.js";
import { store } from "../core/store.js";
import { formatTime, createElement } from "../core/utils.js";

export function renderTrackList(tracks, container, options = {}) {
  const {
    showAlbumArt = true,
    showNumbers = true,
    context = "library",
  } = options;
  container.innerHTML = "";

  const list = createElement("div", "track-list");

  tracks.forEach((track, index) => {
    const isPlaying =
      queueManager.getCurrentTrack()?.id === track.id && audioEngine.isPlaying;
    const isCurrent = queueManager.getCurrentTrack()?.id === track.id;
    const isFav = library.isFavorite(track.id);

    const item = createElement(
      "div",
      `track-item${isCurrent ? " playing" : ""}`,
    );
    item.dataset.trackId = track.id;
    item.id = `track-${track.id}`;

    item.innerHTML = `
      ${
        showNumbers
          ? `
        <div class="track-number-col">
          ${
            isCurrent && audioEngine.isPlaying
              ? `
            <div class="eq-bars">
              <div class="eq-bar"></div>
              <div class="eq-bar"></div>
              <div class="eq-bar"></div>
              <div class="eq-bar"></div>
            </div>
          `
              : `
            <span class="track-number">${index + 1}</span>
            <span class="track-play-icon">${icons.play}</span>
          `
          }
        </div>
      `
          : ""
      }
      ${showAlbumArt ? `<img class="track-art" src="${track.cover || ""}" alt="" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"><div class="track-art track-art-fallback" style="display:none;align-items:center;justify-content:center;color:var(--text-tertiary)">${icons.music}</div>` : ""}
      <div class="track-info">
        <div class="track-title">${track.title}</div>
        <div class="track-artist">${track.artist}</div>
      </div>
      <div class="track-meta">
        <button class="track-like${isFav ? " liked" : ""}" data-action="like" data-track-id="${track.id}">
          ${isFav ? icons.heartFill : icons.heart}
        </button>
        <span class="track-duration">${formatTime(track.duration)}</span>
        <button class="track-more" data-action="more" data-track-id="${track.id}" style="padding: 4px; color: var(--text-tertiary);">
          ${icons.moreVert}
        </button>
      </div>
    `;

    // Click to play
    item.addEventListener("click", (e) => {
      if (e.target.closest("[data-action]")) return;
      queueManager.playAll(tracks, index);
      library.addToRecent(track.id);
    });

    // Like button
    const likeBtn = item.querySelector('[data-action="like"]');
    likeBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const liked = library.toggleFavorite(track.id);
      likeBtn.className = `track-like${liked ? " liked" : ""}`;
      likeBtn.innerHTML = liked ? icons.heartFill : icons.heart;
      store.showToast(
        liked ? "Added to Liked Songs" : "Removed from Liked Songs",
      );
    });

    // More button (context menu)
    const moreBtn = item.querySelector('[data-action="more"]');
    moreBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      store.set("contextMenu", { track });
    });

    // Hover show more button
    item.addEventListener("mouseenter", () => {
      moreBtn.style.opacity = "1";
    });
    item.addEventListener("mouseleave", () => {
      moreBtn.style.opacity = "0";
    });

    list.appendChild(item);
  });

  container.appendChild(list);
}
