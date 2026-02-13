// ZPlayer — Home Page
import { icons } from "../core/icons.js";
import { library } from "../core/library.js";
import { queueManager } from "../core/queue.js";
import { createElement } from "../core/utils.js";
import { router } from "../router.js";

export function renderHome(container) {
  container.innerHTML = "";
  const page = createElement("div", "page");

  // Modern greeting
  const hour = new Date().getHours();
  let greeting = "Good evening";
  if (hour < 5) greeting = "Good night";
  else if (hour < 12) greeting = "Good morning";
  else if (hour < 17) greeting = "Good afternoon";

  page.innerHTML = `
    <header class="home-header">
      <h1 class="greeting-text">${greeting}</h1>
      <p class="greeting-sub">What's the vibe today?</p>
    </header>
  `;

  const allTracks = library.getAllTracks();
  const recentTracks = library.getRecentlyPlayed();

  // Empty State
  if (allTracks.length === 0) {
    const emptyState = createElement("div", "home-empty-state");
    emptyState.innerHTML = `
      <div class="empty-icon">${icons.music}</div>
      <h2 class="empty-title">Digital silence</h2>
      <p class="empty-desc">No music found yet. Select a folder to start listening.</p>
      <button class="btn btn-primary" id="home-scan-btn">
        ${icons.folder}
        Select Music Folder
      </button>
      <div class="empty-tips">
        <span>Tip: Pick a folder where your music files are stored</span>
      </div>
    `;
    page.appendChild(emptyState);

    emptyState
      .querySelector("#home-scan-btn")
      .addEventListener("click", async (e) => {
        const btn = e.currentTarget;
        btn.classList.add("loading");
        btn.disabled = true;
        await library.pickAndScanFolder();
        btn.classList.remove("loading");
        btn.disabled = false;
      });

    container.appendChild(page);
    return;
  }

  // Featured quick-access cards
  const featured =
    recentTracks.length > 0 ? recentTracks.slice(0, 6) : allTracks.slice(0, 6);

  if (featured.length > 0) {
    const featuredRow = createElement("div", "featured-row");
    featuredRow.style.marginBottom = "var(--sp-6)";

    featured.forEach((track) => {
      const card = createElement("div", "featured-card");
      const coverHtml = track.cover
        ? `<img class="featured-card-art" src="${track.cover}" alt="" loading="lazy" onerror="this.style.display='none'">`
        : `<div class="featured-card-art" style="display:flex;align-items:center;justify-content:center;background:var(--bg-surface);color:var(--text-tertiary)">${icons.music}</div>`;
      card.innerHTML = `
        ${coverHtml}
        <span class="featured-card-title">${track.title}</span>
      `;
      card.addEventListener("click", () => {
        queueManager.playAll(
          library.getAllTracks(),
          library.getAllTracks().findIndex((t) => t.id === track.id),
        );
        library.addToRecent(track.id);
      });
      featuredRow.appendChild(card);
    });

    page.appendChild(featuredRow);
  }

  // Albums Section
  const albums = library.getAllAlbums();
  if (albums.length > 0) {
    const section = createElement("div", "");
    section.innerHTML = `
      <div class="section-header">
        <h2 class="section-title">Albums</h2>
        <a class="section-link" href="#/library">Show all</a>
      </div>
    `;

    const grid = createElement("div", "cards-grid");
    albums.slice(0, 6).forEach((album) => {
      const card = createElement("div", "card");
      const coverHtml = album.cover
        ? `<img class="card-art" src="${album.cover}" alt="" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">`
        : "";
      card.innerHTML = `
        <div style="position: relative;">
          ${coverHtml}
          <div class="card-art card-art-fallback" style="${album.cover ? "display:none;" : "display:flex;"}align-items:center;justify-content:center;color:var(--text-tertiary)">${icons.album}</div>
          <button class="card-play-btn">${icons.play}</button>
        </div>
        <div class="card-title">${album.title}</div>
        <div class="card-subtitle">${album.artist || "Unknown Artist"}${album.year ? " · " + album.year : ""}</div>
      `;

      card.querySelector(".card-play-btn").addEventListener("click", (e) => {
        e.stopPropagation();
        const tracks = library.getTracksByAlbum(album.id);
        if (tracks.length > 0) {
          queueManager.playAll(tracks, 0);
          library.addToRecent(tracks[0].id);
        }
      });

      card.addEventListener("click", () => {
        router.navigate(`#/album/${album.id}`);
      });

      grid.appendChild(card);
    });

    section.appendChild(grid);
    page.appendChild(section);
  }

  // Artists Section
  const artists = library.getAllArtists();
  if (artists.length > 0) {
    const section = createElement("div", "");
    section.style.marginTop = "var(--sp-6)";
    section.innerHTML = `
      <div class="section-header">
        <h2 class="section-title">Artists</h2>
        <a class="section-link" href="#/library">Show all</a>
      </div>
    `;

    const grid = createElement("div", "cards-grid");
    artists.slice(0, 6).forEach((artist) => {
      const card = createElement("div", "card");
      card.innerHTML = `
        <div style="position: relative;">
          <div class="card-art rounded" style="display:flex;align-items:center;justify-content:center;background:var(--bg-surface);color:var(--text-tertiary)">${icons.artist}</div>
          <button class="card-play-btn">${icons.play}</button>
        </div>
        <div class="card-title">${artist.name}</div>
        <div class="card-subtitle">${artist.numTracks || 0} tracks</div>
      `;

      card.querySelector(".card-play-btn").addEventListener("click", (e) => {
        e.stopPropagation();
        const tracks = library.getTracksByArtist(artist.id);
        if (tracks.length > 0) {
          queueManager.playAll(tracks, 0);
          library.addToRecent(tracks[0].id);
        }
      });

      card.addEventListener("click", () => {
        router.navigate(`#/artist/${artist.id}`);
      });

      grid.appendChild(card);
    });

    section.appendChild(grid);
    page.appendChild(section);
  }

  container.appendChild(page);
}
