// ZPlayer — Context Menu Component
import { icons } from "../core/icons.js";
import { library } from "../core/library.js";
import { queueManager } from "../core/queue.js";
import { store } from "../core/store.js";
import { createElement } from "../core/utils.js";

export function createContextMenu() {
  const wrapper = createElement("div", "");
  wrapper.id = "context-menu-wrapper";
  wrapper.style.display = "none";

  store.on("contextMenu", (ctx) => {
    if (ctx) {
      showContextMenu(wrapper, ctx.track);
    } else {
      wrapper.style.display = "none";
      wrapper.innerHTML = "";
    }
  });

  return wrapper;
}

function showContextMenu(wrapper, track) {
  const isFav = library.isFavorite(track.id);
  const playlists = library.getPlaylists();

  wrapper.style.display = "block";
  wrapper.innerHTML = `
    <div class="context-menu-overlay"></div>
    <div class="context-menu">
      <div class="context-menu-header">
        <img class="context-menu-art" src="${track.cover}" alt="">
        <div>
          <div class="context-menu-title">${track.title}</div>
          <div class="context-menu-subtitle">${track.artist}</div>
        </div>
      </div>
      <button class="context-menu-item" data-action="like">
        ${isFav ? icons.heartFill : icons.heart}
        <span>${isFav ? "Remove from Liked Songs" : "Like"}</span>
      </button>
      <button class="context-menu-item" data-action="queue">
        ${icons.queue}
        <span>Add to Queue</span>
      </button>
      <button class="context-menu-item" data-action="add-playlist">
        ${icons.addPlaylist}
        <span>Add to Playlist</span>
      </button>
      <button class="context-menu-item" data-action="go-album">
        ${icons.album}
        <span>Go to Album</span>
      </button>
      <button class="context-menu-item" data-action="go-artist">
        ${icons.artist}
        <span>Go to Artist</span>
      </button>
    </div>
  `;

  // Close on overlay click
  wrapper
    .querySelector(".context-menu-overlay")
    .addEventListener("click", () => {
      store.set("contextMenu", null);
    });

  // Like
  wrapper
    .querySelector('[data-action="like"]')
    .addEventListener("click", () => {
      const liked = library.toggleFavorite(track.id);
      store.showToast(
        liked ? "Added to Liked Songs" : "Removed from Liked Songs",
      );
      store.set("contextMenu", null);
    });

  // Add to Queue
  wrapper
    .querySelector('[data-action="queue"]')
    .addEventListener("click", () => {
      queueManager.addToQueue(track);
      store.showToast("Added to Queue");
      store.set("contextMenu", null);
    });

  // Add to Playlist
  wrapper
    .querySelector('[data-action="add-playlist"]')
    .addEventListener("click", () => {
      store.set("contextMenu", null);
      showAddToPlaylistMenu(wrapper, track);
    });

  // Go to Album
  wrapper
    .querySelector('[data-action="go-album"]')
    .addEventListener("click", () => {
      store.set("contextMenu", null);
      store.set("nowPlayingOpen", false);
      window.location.hash = `#/album/${track.albumId}`;
    });

  // Go to Artist
  wrapper
    .querySelector('[data-action="go-artist"]')
    .addEventListener("click", () => {
      store.set("contextMenu", null);
      store.set("nowPlayingOpen", false);
      window.location.hash = `#/artist/${track.artistId}`;
    });
}

function showAddToPlaylistMenu(wrapper, track) {
  const playlists = library.getPlaylists();

  wrapper.style.display = "block";
  wrapper.innerHTML = `
    <div class="context-menu-overlay"></div>
    <div class="context-menu">
      <div class="context-menu-header">
        <div style="display: flex; align-items: center; gap: 12px; width: 100%;">
          <span style="font-weight: 600; font-size: 16px;">Add to Playlist</span>
        </div>
      </div>
      <button class="context-menu-item" data-action="new-playlist">
        ${icons.add}
        <span>New Playlist</span>
      </button>
      ${playlists
        .map(
          (pl) => `
        <button class="context-menu-item" data-action="add-to-${pl.id}">
          ${icons.music}
          <span>${pl.name}</span>
        </button>
      `,
        )
        .join("")}
    </div>
  `;

  wrapper
    .querySelector(".context-menu-overlay")
    .addEventListener("click", () => {
      wrapper.style.display = "none";
      wrapper.innerHTML = "";
    });

  wrapper
    .querySelector('[data-action="new-playlist"]')
    .addEventListener("click", () => {
      wrapper.style.display = "none";
      wrapper.innerHTML = "";
      store.set("modal", {
        type: "create-playlist",
        data: { trackToAdd: track.id },
      });
    });

  playlists.forEach((pl) => {
    const btn = wrapper.querySelector(`[data-action="add-to-${pl.id}"]`);
    if (btn) {
      btn.addEventListener("click", () => {
        const added = library.addTrackToPlaylist(pl.id, track.id);
        store.showToast(added ? `Added to ${pl.name}` : "Already in playlist");
        wrapper.style.display = "none";
        wrapper.innerHTML = "";
      });
    }
  });
}
