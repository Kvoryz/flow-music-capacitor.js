// ZPlayer — Library Page
import { icons } from "../core/icons.js";
import { library } from "../core/library.js";
import { queueManager } from "../core/queue.js";
import { router } from "../router.js";
import { store } from "../core/store.js";
import { createElement } from "../core/utils.js";
import { renderTrackList } from "../components/trackList.js";

export function renderLibrary(container) {
  container.innerHTML = "";
  const page = createElement("div", "page");

  page.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--sp-4);">
      <h1 style="font-size:var(--fs-2xl);font-weight:var(--fw-bold);letter-spacing:var(--ls-tight);">Your Library</h1>
      <button class="icon-btn" id="refresh-library-btn" title="Add Music Folder" style="width:36px;height:36px;border-radius:50%;background:var(--bg-surface);">
        ${icons.folder}
      </button>
    </div>
    <div class="tabs" id="library-tabs">
      <button class="tab active" data-tab="songs">Songs</button>
      <button class="tab" data-tab="albums">Albums</button>
      <button class="tab" data-tab="artists">Artists</button>
      <button class="tab" data-tab="playlists">Playlists</button>
      <button class="tab" data-tab="liked">Liked</button>
    </div>
    <div id="library-content"></div>
  `;

  const refreshBtn = page.querySelector("#refresh-library-btn");
  refreshBtn.addEventListener("click", async () => {
    refreshBtn.classList.add("spinning");
    await library.pickAndScanFolder();
    refreshBtn.classList.remove("spinning");
    const activeTab = page.querySelector(".tab.active");
    if (activeTab) renderTab(contentEl, activeTab.dataset.tab);
  });

  container.appendChild(page);

  const tabsEl = page.querySelector("#library-tabs");
  const contentEl = page.querySelector("#library-content");

  // Tab click handler
  tabsEl.addEventListener("click", (e) => {
    const tab = e.target.closest(".tab");
    if (!tab) return;

    tabsEl
      .querySelectorAll(".tab")
      .forEach((t) => t.classList.remove("active"));
    tab.classList.add("active");
    renderTab(contentEl, tab.dataset.tab);
  });

  // Default tab
  renderTab(contentEl, "songs");
}

function renderTab(container, tabName) {
  container.innerHTML = "";

  switch (tabName) {
    case "songs":
      renderSongsTab(container);
      break;
    case "albums":
      renderAlbumsTab(container);
      break;
    case "artists":
      renderArtistsTab(container);
      break;
    case "playlists":
      renderPlaylistsTab(container);
      break;
    case "liked":
      renderLikedTab(container);
      break;
  }
}

function renderSongsTab(container) {
  const tracks = library.getAllTracks();
  if (tracks.length === 0) {
    showEmpty(container, "No songs yet", "Your library is empty");
    return;
  }

  // Action bar
  const actionBar = createElement("div", "action-bar");
  actionBar.innerHTML = `
    <button class="action-btn-play" id="play-all-btn">${icons.play}</button>
    <button class="action-btn" id="shuffle-all-btn">${icons.shuffle}</button>
  `;
  container.appendChild(actionBar);

  actionBar.querySelector("#play-all-btn").addEventListener("click", () => {
    queueManager.playAll(tracks, 0);
    library.addToRecent(tracks[0].id);
  });

  actionBar.querySelector("#shuffle-all-btn").addEventListener("click", () => {
    if (!queueManager.queue.length) {
      queueManager.playAll(tracks, 0);
    }
    queueManager.toggleShuffle();
  });

  const trackContainer = createElement("div", "");
  renderTrackList(tracks, trackContainer);
  container.appendChild(trackContainer);
}

function renderAlbumsTab(container) {
  const albums = library.getAllAlbums();
  if (albums.length === 0) {
    showEmpty(container, "No albums", "Albums you save will appear here");
    return;
  }

  const grid = createElement("div", "cards-grid");
  albums.forEach((album) => {
    const card = createElement("div", "card");
    card.innerHTML = `
      <div style="position: relative;">
        <img class="card-art" src="${album.cover || ""}" alt="" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
        <div class="card-art card-art-fallback" style="display:none;align-items:center;justify-content:center;color:var(--text-tertiary)">${icons.album}</div>
        <button class="card-play-btn">${icons.play}</button>
      </div>
      <div class="card-title">${album.title}</div>
      <div class="card-subtitle">${album.artist}${album.year ? " • " + album.year : ""}</div>
    `;

    card.querySelector(".card-play-btn").addEventListener("click", (e) => {
      e.stopPropagation();
      const tracks = library.getTracksByAlbum(album.id);
      queueManager.playAll(tracks, 0);
    });

    card.addEventListener("click", () => {
      router.navigate(`#/album/${album.id}`);
    });

    grid.appendChild(card);
  });

  container.appendChild(grid);
}

function renderArtistsTab(container) {
  const artists = library.getAllArtists();
  if (artists.length === 0) {
    showEmpty(container, "No artists", "Artists you follow will appear here");
    return;
  }

  const grid = createElement("div", "cards-grid");
  artists.forEach((artist) => {
    const card = createElement("div", "card");
    card.innerHTML = `
      <div style="position: relative;">
        <div class="card-art rounded" style="display:flex;align-items:center;justify-content:center;background:var(--bg-highlight);color:var(--text-tertiary)">${icons.artist}</div>
        <button class="card-play-btn">${icons.play}</button>
      </div>
      <div class="card-title">${artist.name}</div>
      <div class="card-subtitle">${artist.numTracks || 0} tracks</div>
    `;

    card.querySelector(".card-play-btn").addEventListener("click", (e) => {
      e.stopPropagation();
      const tracks = library.getTracksByArtist(artist.id);
      queueManager.playAll(tracks, 0);
    });

    card.addEventListener("click", () => {
      router.navigate(`#/artist/${artist.id}`);
    });

    grid.appendChild(card);
  });

  container.appendChild(grid);
}

function renderPlaylistsTab(container) {
  const playlists = library.getPlaylists();

  // Create playlist button
  const createBtn = createElement("button", "featured-card");
  createBtn.style.marginBottom = "var(--sp-4)";
  createBtn.style.border = "1px dashed var(--border-light)";
  createBtn.style.background = "transparent";
  createBtn.innerHTML = `
    <div style="width: 64px; height: 64px; display: flex; align-items: center; justify-content: center; color: var(--text-secondary);">
      ${icons.add}
    </div>
    <span class="featured-card-title" style="color: var(--text-secondary);">Create Playlist</span>
  `;
  createBtn.addEventListener("click", () => {
    store.set("modal", { type: "create-playlist", data: {} });
  });
  container.appendChild(createBtn);

  if (playlists.length === 0) {
    showEmpty(container, "No playlists yet", "Create your first playlist");
    return;
  }

  playlists.forEach((playlist) => {
    const tracks = library.getPlaylistTracks(playlist.id);
    const card = createElement("div", "featured-card");
    card.style.marginBottom = "var(--sp-2)";
    card.innerHTML = `
      <img class="featured-card-art" src="${playlist.cover || tracks[0]?.cover || ""}" alt="${playlist.name}" style="background: var(--bg-card);">
      <span class="featured-card-title">${playlist.name} <span style="color: var(--text-tertiary); font-weight: 400; font-size: 12px;">${tracks.length} songs</span></span>
    `;
    card.addEventListener("click", () => {
      router.navigate(`#/playlist/${playlist.id}`);
    });
    container.appendChild(card);
  });
}

function renderLikedTab(container) {
  const favorites = library.getFavoriteTracks();
  if (favorites.length === 0) {
    showEmpty(container, "No liked songs", "Songs you like will appear here");
    return;
  }

  // Action bar
  const actionBar = createElement("div", "action-bar");
  actionBar.innerHTML = `
    <button class="action-btn-play" id="play-liked">${icons.play}</button>
    <button class="action-btn" id="shuffle-liked">${icons.shuffle}</button>
  `;
  container.appendChild(actionBar);

  actionBar.querySelector("#play-liked").addEventListener("click", () => {
    queueManager.playAll(favorites, 0);
  });

  actionBar.querySelector("#shuffle-liked").addEventListener("click", () => {
    queueManager.playAll(favorites, 0);
    queueManager.toggleShuffle();
  });

  const trackContainer = createElement("div", "");
  renderTrackList(favorites, trackContainer);
  container.appendChild(trackContainer);
}

function showEmpty(container, title, text) {
  const empty = createElement("div", "empty-state");
  empty.innerHTML = `
    <div class="empty-state-icon">${icons.music}</div>
    <div class="empty-state-title">${title}</div>
    <div class="empty-state-text">${text}</div>
  `;
  container.appendChild(empty);
}
