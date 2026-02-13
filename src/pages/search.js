// ZPlayer — Search Page
import { icons } from "../core/icons.js";
import { library } from "../core/library.js";
import { queueManager } from "../core/queue.js";
import { router } from "../router.js";
import { createElement, debounce } from "../core/utils.js";
import { renderTrackList } from "../components/trackList.js";

export function renderSearch(container) {
  container.innerHTML = "";
  const page = createElement("div", "page");

  page.innerHTML = `
    <h1 class="section-title" style="font-size: var(--fs-2xl); margin-bottom: var(--sp-6);">Search</h1>
    <div class="search-wrapper">
      <span class="search-icon">${icons.search}</span>
      <input class="search-input" id="search-input" type="text" placeholder="Songs, artists, or albums" autocomplete="off">
      <button class="search-clear" id="search-clear">${icons.close}</button>
    </div>
    <div id="search-results"></div>
    <div id="search-browse"></div>
  `;

  container.appendChild(page);

  const input = page.querySelector("#search-input");
  const clearBtn = page.querySelector("#search-clear");
  const resultsDiv = page.querySelector("#search-results");
  const browseDiv = page.querySelector("#search-browse");

  // Show browse categories initially
  showBrowse(browseDiv);

  const doSearch = debounce((query) => {
    if (!query.trim()) {
      resultsDiv.innerHTML = "";
      browseDiv.style.display = "";
      showBrowse(browseDiv);
      clearBtn.classList.remove("visible");
      return;
    }

    clearBtn.classList.add("visible");
    browseDiv.style.display = "none";
    const results = library.search(query);
    showResults(resultsDiv, results);
  }, 200);

  input.addEventListener("input", (e) => {
    doSearch(e.target.value);
  });

  clearBtn.addEventListener("click", () => {
    input.value = "";
    doSearch("");
    input.focus();
  });

  setTimeout(() => input.focus(), 100);
}

function showBrowse(container) {
  const genres = [
    { name: "Synthwave", color: "#e13300" },
    { name: "Lo-fi", color: "#1e3264" },
    { name: "Electronic", color: "#8400e7" },
    { name: "Ambient", color: "#148a08" },
    { name: "Chill", color: "#e8115b" },
    { name: "Focus", color: "#503750" },
    { name: "Energy", color: "#e61e32" },
    { name: "Mood", color: "#477d95" },
  ];

  container.innerHTML = `
    <div class="section-header">
      <h2 class="section-title">Browse All</h2>
    </div>
    <div class="cards-grid" style="grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));">
      ${genres
        .map(
          (g) => `
        <div class="card" style="background: ${g.color}; padding: var(--sp-5); aspect-ratio: 1; display: flex; align-items: flex-end; cursor: pointer;" data-genre="${g.name}">
          <div class="card-title" style="font-size: var(--fs-lg);">${g.name}</div>
        </div>
      `,
        )
        .join("")}
    </div>
  `;

  container.querySelectorAll("[data-genre]").forEach((card) => {
    card.addEventListener("click", () => {
      const genre = card.dataset.genre;
      const input = document.querySelector("#search-input");
      if (input) {
        input.value = genre;
        input.dispatchEvent(new Event("input"));
      }
    });
  });
}

function showResults(container, results) {
  container.innerHTML = "";

  if (
    results.tracks.length === 0 &&
    results.albums.length === 0 &&
    results.artists.length === 0
  ) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">${icons.search}</div>
        <div class="empty-state-title">No results found</div>
        <div class="empty-state-text">Try different keywords or check for typos</div>
      </div>
    `;
    return;
  }

  // Artists
  if (results.artists.length > 0) {
    const section = createElement("div", "");
    section.innerHTML = `<h3 class="section-title" style="margin-bottom: var(--sp-4);">Artists</h3>`;
    const grid = createElement("div", "cards-grid");
    results.artists.forEach((artist) => {
      const card = createElement("div", "card");
      card.innerHTML = `
        <img class="card-art rounded" src="${artist.image}" alt="${artist.name}" loading="lazy">
        <div class="card-title">${artist.name}</div>
        <div class="card-subtitle">${artist.genre}</div>
      `;
      card.addEventListener("click", () =>
        router.navigate(`#/artist/${artist.id}`),
      );
      grid.appendChild(card);
    });
    section.appendChild(grid);
    container.appendChild(section);
  }

  // Albums
  if (results.albums.length > 0) {
    const section = createElement("div", "");
    section.style.marginTop = "var(--sp-6)";
    section.innerHTML = `<h3 class="section-title" style="margin-bottom: var(--sp-4);">Albums</h3>`;
    const grid = createElement("div", "cards-grid");
    results.albums.forEach((album) => {
      const card = createElement("div", "card");
      card.innerHTML = `
        <img class="card-art" src="${album.cover}" alt="${album.title}" loading="lazy">
        <div class="card-title">${album.title}</div>
        <div class="card-subtitle">${album.artist}</div>
      `;
      card.addEventListener("click", () =>
        router.navigate(`#/album/${album.id}`),
      );
      grid.appendChild(card);
    });
    section.appendChild(grid);
    container.appendChild(section);
  }

  // Tracks
  if (results.tracks.length > 0) {
    const section = createElement("div", "");
    section.style.marginTop = "var(--sp-6)";
    section.innerHTML = `<h3 class="section-title" style="margin-bottom: var(--sp-4);">Songs</h3>`;
    const trackContainer = createElement("div", "");
    renderTrackList(results.tracks, trackContainer);
    section.appendChild(trackContainer);
    container.appendChild(section);
  }
}
