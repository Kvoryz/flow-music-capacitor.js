// ZPlayer — Main App Shell
import { Capacitor } from "@capacitor/core";
import { StatusBar, Style } from "@capacitor/status-bar";
import { icons } from "./core/icons.js";
import { router } from "./router.js";
import { store } from "./core/store.js";
import { library } from "./core/library.js";
import { audioEngine } from "./core/audioEngine.js";
import { queueManager } from "./core/queue.js";
import { createElement } from "./core/utils.js";

// Components
import { createMiniPlayer } from "./components/miniPlayer.js";
import { createNowPlaying } from "./components/nowPlaying.js";
import { createContextMenu } from "./components/contextMenu.js";
import { createModal } from "./components/modal.js";
import { createToast } from "./components/toast.js";

// Pages
import { renderHome } from "./pages/home.js";
import { renderSearch } from "./pages/search.js";
import { renderLibrary } from "./pages/library.js";
import { renderAlbum } from "./pages/album.js";
import { renderArtist } from "./pages/artist.js";
import { renderPlaylist } from "./pages/playlist.js";
import { renderQueue } from "./pages/queue.js";

export async function initApp() {
  // Initialize Native UI
  if (Capacitor.isNativePlatform()) {
    try {
      await StatusBar.setOverlaysWebView({ overlay: true });
      await StatusBar.setStyle({ style: Style.Light });
      await StatusBar.setBackgroundColor({ color: "#000000" });
    } catch (e) {
      console.warn("StatusBar init failed", e);
    }
  }

  const appEl = document.getElementById("app");
  appEl.innerHTML = "";

  // Build app shell
  appEl.innerHTML = `
    <div class="app-body">
      <nav class="sidebar" id="sidebar">
        <div class="sidebar-header">
          <div class="sidebar-logo">Z</div>
          <span class="sidebar-title">ZPlayer</span>
        </div>
        <div class="sidebar-nav" id="sidebar-nav">
          <a class="sidebar-nav-item active" data-route="#/" data-nav="home">
            ${icons.homeFill}
            <span>Home</span>
          </a>
          <a class="sidebar-nav-item" data-route="#/search" data-nav="search">
            ${icons.search}
            <span>Search</span>
          </a>
          <a class="sidebar-nav-item" data-route="#/library" data-nav="library">
            ${icons.library}
            <span>Your Library</span>
          </a>
        </div>
        <div class="sidebar-divider"></div>
        <div class="sidebar-nav">
          <a class="sidebar-nav-item" data-route="#/queue" data-nav="queue">
            ${icons.queue}
            <span>Queue</span>
          </a>
        </div>
        <div class="sidebar-divider"></div>
        <div class="sidebar-playlists" id="sidebar-playlists"></div>
      </nav>
      <main class="main-content" id="main-content"></main>
    </div>
  `;

  // Mini player
  app.appendChild(createMiniPlayer());

  // Bottom nav (mobile)
  const bottomNav = createElement("nav", "bottom-nav");
  bottomNav.innerHTML = `
    <div class="bottom-nav-items">
      <button class="bottom-nav-item active" data-route="#/" data-nav="home">
        ${icons.homeFill}
        <span>Home</span>
      </button>
      <button class="bottom-nav-item" data-route="#/search" data-nav="search">
        ${icons.search}
        <span>Search</span>
      </button>
      <button class="bottom-nav-item" data-route="#/library" data-nav="library">
        ${icons.library}
        <span>Library</span>
      </button>
    </div>
  `;
  app.appendChild(bottomNav);

  // Overlays
  app.appendChild(createNowPlaying());
  app.appendChild(createContextMenu());
  app.appendChild(createModal());
  app.appendChild(createToast());

  // Setup sidebar nav click
  const sidebarNav = document.getElementById("sidebar-nav");
  const mainContent = document.getElementById("main-content");

  document.querySelectorAll("[data-route]").forEach((item) => {
    item.addEventListener("click", (e) => {
      e.preventDefault();
      router.navigate(item.dataset.route);
    });
  });

  // Update active nav on route change
  store.on("currentView", (view) => {
    updateActiveNav(view);
    updateSidebarPlaylists();
  });

  // Track changes: update recently played in sidebar
  audioEngine.on("trackchange", ({ track }) => {
    library.addToRecent(track.id);
  });

  // Register routes
  router.register("#/", () => renderHome(mainContent));
  router.register("#/search", () => renderSearch(mainContent));
  router.register("#/library", () => renderLibrary(mainContent));
  router.register("#/album/:id", (params) => renderAlbum(mainContent, params));
  router.register("#/artist/:id", (params) =>
    renderArtist(mainContent, params),
  );
  router.register("#/playlist/:id", (params) =>
    renderPlaylist(mainContent, params),
  );
  router.register("#/queue", () => renderQueue(mainContent));

  // Initialize
  updateSidebarPlaylists();
  router.init();

  // Scan local music (Android) — async, non-blocking
  library.init().then(() => {
    // Re-render current page after scan completes with new data
    router._resolve();
    updateSidebarPlaylists();
  });

  // Listen for library updates to show toasts
  library.on("updated", (data) => {
    if (data.tracks > 0) {
      showToast(`Found ${data.tracks} songs!`);
    } else {
      showToast("No music found on device.");
    }
  });
}

function updateActiveNav(view) {
  // Determine base nav
  let navKey = "home";
  if (view.startsWith("#/search")) navKey = "search";
  else if (
    view.startsWith("#/library") ||
    view.startsWith("#/album") ||
    view.startsWith("#/artist") ||
    view.startsWith("#/playlist")
  )
    navKey = "library";
  else if (view.startsWith("#/queue")) navKey = "queue";

  // Update sidebar
  document.querySelectorAll(".sidebar-nav-item").forEach((item) => {
    const isActive = item.dataset.nav === navKey;
    item.classList.toggle("active", isActive);
    // Swap icons
    if (item.dataset.nav === "home") {
      item
        .querySelector("svg")
        ?.closest(".sidebar-nav-item")
        ?.querySelector("svg")?.remove;
    }
  });

  // Update bottom nav
  document.querySelectorAll(".bottom-nav-item").forEach((item) => {
    item.classList.toggle("active", item.dataset.nav === navKey);
  });
}

function updateSidebarPlaylists() {
  const container = document.getElementById("sidebar-playlists");
  if (!container) return;

  const playlists = library.getPlaylists();
  const favCount = library.getFavoriteTracks().length;

  container.innerHTML = "";

  // Liked songs entry
  if (favCount > 0) {
    const likedItem = createElement("div", "sidebar-playlist-item");
    likedItem.innerHTML = `
      <div class="sidebar-playlist-thumb" style="background: linear-gradient(135deg, #450af5, #c4efd9); display: flex; align-items: center; justify-content: center;">
        ${icons.heartFill}
      </div>
      <div class="sidebar-playlist-info">
        <div class="sidebar-playlist-name">Liked Songs</div>
        <div class="sidebar-playlist-meta">${favCount} songs</div>
      </div>
    `;
    likedItem.addEventListener("click", () => {
      router.navigate("#/library");
      // Switch to liked tab after navigation
      setTimeout(() => {
        const likedTab = document.querySelector('[data-tab="liked"]');
        if (likedTab) likedTab.click();
      }, 100);
    });
    container.appendChild(likedItem);
  }

  // Playlists
  playlists.forEach((pl) => {
    const tracks = library.getPlaylistTracks(pl.id);
    const item = createElement("div", "sidebar-playlist-item");
    item.innerHTML = `
      <img class="sidebar-playlist-thumb" src="${pl.cover || tracks[0]?.cover || ""}" alt="">
      <div class="sidebar-playlist-info">
        <div class="sidebar-playlist-name">${pl.name}</div>
        <div class="sidebar-playlist-meta">Playlist • ${tracks.length} songs</div>
      </div>
    `;
    item.addEventListener("click", () =>
      router.navigate(`#/playlist/${pl.id}`),
    );
    container.appendChild(item);
  });
}
