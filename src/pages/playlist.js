// ZPlayer — Playlist Detail Page
import { icons } from "../core/icons.js";
import { library } from "../core/library.js";
import { queueManager } from "../core/queue.js";
import { store } from "../core/store.js";
import { createElement, formatTime } from "../core/utils.js";
import { renderTrackList } from "../components/trackList.js";

export function renderPlaylist(container, params) {
  container.innerHTML = "";
  const playlist = library.getPlaylistById(params.id);
  if (!playlist) {
    container.innerHTML =
      '<div class="page"><div class="empty-state"><div class="empty-state-title">Playlist not found</div></div></div>';
    return;
  }

  const tracks = library.getPlaylistTracks(playlist.id);
  const totalDuration = tracks.reduce((sum, t) => sum + t.duration, 0);
  const coverArt = playlist.cover || tracks[0]?.cover || "";

  const page = createElement("div", "page");

  page.innerHTML = `
    <div class="page-header">
      <div class="page-header-bg"></div>
      <img class="page-header-art" src="${coverArt}" alt="${playlist.name}" style="${!coverArt ? "display:flex;align-items:center;justify-content:center;color:var(--text-tertiary);" : ""}">
      <div class="page-header-info">
        <div class="page-header-type">Playlist</div>
        <h1 class="page-header-title">${playlist.name}</h1>
        <div class="page-header-meta">
          <span>${tracks.length} songs</span>
          ${totalDuration > 0 ? `<span class="page-header-dot"></span><span>${formatTime(totalDuration)}</span>` : ""}
        </div>
      </div>
    </div>

    <div class="action-bar">
      ${
        tracks.length > 0
          ? `
        <button class="action-btn-play" id="play-playlist">${icons.play}</button>
        <button class="action-btn" id="shuffle-playlist">${icons.shuffle}</button>
      `
          : ""
      }
      <button class="action-btn" id="delete-playlist" style="margin-left: auto;" title="Delete playlist">${icons.remove}</button>
    </div>

    <div id="playlist-tracks"></div>
  `;

  container.appendChild(page);

  // Play all
  const playBtn = page.querySelector("#play-playlist");
  if (playBtn) {
    playBtn.addEventListener("click", () => {
      queueManager.playAll(tracks, 0);
      library.addToRecent(tracks[0].id);
    });
  }

  // Shuffle
  const shuffleBtn = page.querySelector("#shuffle-playlist");
  if (shuffleBtn) {
    shuffleBtn.addEventListener("click", () => {
      queueManager.playAll(tracks, 0);
      queueManager.toggleShuffle();
    });
  }

  // Delete
  page.querySelector("#delete-playlist").addEventListener("click", () => {
    library.deletePlaylist(playlist.id);
    store.showToast(`Deleted "${playlist.name}"`);
    window.location.hash = "#/library";
  });

  // Tracks
  if (tracks.length > 0) {
    renderTrackList(tracks, page.querySelector("#playlist-tracks"));
  } else {
    page.querySelector("#playlist-tracks").innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">${icons.music}</div>
        <div class="empty-state-title">Empty playlist</div>
        <div class="empty-state-text">Add songs to this playlist from the context menu</div>
      </div>
    `;
  }
}
