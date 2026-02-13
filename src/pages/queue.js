// ZPlayer — Queue Page
import { icons } from "../core/icons.js";
import { audioEngine } from "../core/audioEngine.js";
import { queueManager } from "../core/queue.js";
import { library } from "../core/library.js";
import { store } from "../core/store.js";
import { createElement, formatTime } from "../core/utils.js";

export function renderQueue(container) {
  container.innerHTML = "";
  const page = createElement("div", "page");

  const current = queueManager.getCurrentTrack();
  const upcoming = queueManager.getUpcoming();

  page.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--sp-6);">
      <h1 class="section-title" style="font-size: var(--fs-2xl);">Queue</h1>
      ${upcoming.length > 0 ? `<button class="btn btn-secondary" id="clear-queue-btn" style="font-size: var(--fs-sm);">Clear</button>` : ""}
    </div>
    <div id="queue-content"></div>
  `;

  container.appendChild(page);

  const contentEl = page.querySelector("#queue-content");

  // Clear queue button
  const clearBtn = page.querySelector("#clear-queue-btn");
  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      queueManager.clearQueue();
      store.showToast("Queue cleared");
      renderQueue(container); // Re-render
    });
  }

  if (!current && upcoming.length === 0) {
    contentEl.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">${icons.queue}</div>
        <div class="empty-state-title">Queue is empty</div>
        <div class="empty-state-text">Add songs to your queue to see them here</div>
      </div>
    `;
    return;
  }

  // Now Playing
  if (current) {
    const nowSection = createElement("div", "");
    nowSection.innerHTML = `<div class="queue-section-title">Now Playing</div>`;

    const item = createQueueItem(current, -1, true);
    nowSection.appendChild(item);
    contentEl.appendChild(nowSection);
  }

  // Up Next
  if (upcoming.length > 0) {
    const nextSection = createElement("div", "");
    nextSection.innerHTML = `<div class="queue-section-title">Next Up</div>`;

    upcoming.forEach((track, idx) => {
      const item = createQueueItem(
        track,
        queueManager.currentIndex + 1 + idx,
        false,
      );
      nextSection.appendChild(item);
    });

    contentEl.appendChild(nextSection);
  }
}

function createQueueItem(track, queueIndex, isCurrent) {
  const isFav = library.isFavorite(track.id);
  const item = createElement("div", `track-item${isCurrent ? " playing" : ""}`);

  item.innerHTML = `
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
        <span class="track-play-icon" style="visibility: visible;">${icons.play}</span>
      `
      }
    </div>
    <img class="track-art" src="${track.cover}" alt="${track.title}" loading="lazy">
    <div class="track-info">
      <div class="track-title">${track.title}</div>
      <div class="track-artist">${track.artist}</div>
    </div>
    <div class="track-meta">
      <span class="track-duration">${formatTime(track.duration)}</span>
      ${
        !isCurrent
          ? `
        <button class="track-more" data-action="remove" style="padding: 4px; color: var(--text-tertiary);">
          ${icons.close}
        </button>
      `
          : ""
      }
    </div>
  `;

  item.addEventListener("click", (e) => {
    if (e.target.closest('[data-action="remove"]')) return;
    if (isCurrent) {
      audioEngine.togglePlay();
    } else {
      queueManager.currentIndex = queueIndex;
      queueManager._playCurrentTrack();
    }
  });

  // Remove from queue
  const removeBtn = item.querySelector('[data-action="remove"]');
  if (removeBtn) {
    removeBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      queueManager.removeFromQueue(queueIndex);
      // Re-render queue page
      const container = document.querySelector("#main-content");
      if (container) renderQueue(container);
    });
  }

  return item;
}
