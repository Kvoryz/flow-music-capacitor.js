// ZPlayer — Discovery Page (Daily Mixes)
import { icons } from "../core/icons.js";
import { musicLibrary } from "../core/library.js";
import { queueManager } from "../core/queue.js";
import { router } from "../router.js";
import { createElement, cleanTitle } from "../core/utils.js";
import { renderTrackList } from "../components/trackList.js";

export function renderDiscovery(container) {
  container.innerHTML = "";
  const page = createElement("div", "page");

  const recentTrack = musicLibrary.getRecentlyAdded(1)[0];
  const forgottenTracks = musicLibrary.getForgottenTracks(10);
  const randomAlbum = musicLibrary.getRandomAlbum();
  const freshFinds = musicLibrary.getRecentlyAdded(10);

  page.innerHTML = `
    <header style="margin-bottom: var(--sp-8);">
      <h1 class="section-title" style="font-size: var(--fs-4xl); margin-bottom: var(--sp-2);">Smart Discovery</h1>
      <p style="color: var(--text-secondary); font-size: var(--fs-lg);">Your daily mixes, personalized for you.</p>
    </header>

    <div class="discovery-sections">
      
      <!-- Feature Card: Lucky Dip -->
      ${renderLuckyDip(randomAlbum)}

      <!-- Horizon Mix: Forgotten Gems -->
      <section style="margin-top: var(--sp-10);">
        <h2 class="section-title" style="margin-bottom: var(--sp-4); display: flex; align-items: center; gap: var(--sp-2);">
          ${icons.sparkles} Forgotten Gems
        </h2>
        <div class="horizontal-scroll" style="display: flex; gap: var(--sp-4); overflow-x: auto; padding-bottom: var(--sp-4); scrollbar-width: none;">
          ${forgottenTracks
            .map(
              (t) => `
            <div class="mix-card" data-track-id="${t.id}" style="flex: 0 0 160px; cursor: pointer;">
              <img src="${t.cover}" style="width: 160px; height: 160px; border-radius: var(--radius-lg); object-fit: cover; box-shadow: var(--shadow-lg);">
              <div style="margin-top: var(--sp-3);">
                <div class="track-title" style="font-size: var(--fs-md); font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${cleanTitle(t.title, 25)}</div>
                <div class="track-artist" style="font-size: var(--fs-xs); color: var(--text-tertiary);">${t.artist}</div>
              </div>
            </div>
          `,
            )
            .join("")}
        </div>
      </section>

      <!-- Grid: Fresh Finds -->
      <section style="margin-top: var(--sp-10);">
        <h2 class="section-title" style="margin-bottom: var(--sp-4);">Recently Added</h2>
        <div id="fresh-finds-list"></div>
      </section>
    </div>
  `;

  container.appendChild(page);

  // Event Listeners
  page.querySelectorAll(".mix-card").forEach((card) => {
    card.addEventListener("click", () => {
      const track = musicLibrary.getTrackById(card.dataset.trackId);
      if (track) queueManager.playTrack(track);
    });
  });

  const luckyDipBtn = page.querySelector("#lucky-dip-play");
  if (luckyDipBtn && randomAlbum) {
    luckyDipBtn.addEventListener("click", () => {
      router.navigate(`#/album/${randomAlbum.id}`);
    });
  }

  const freshList = page.querySelector("#fresh-finds-list");
  if (freshList) {
    renderTrackList(freshFinds, freshList);
  }
}

function renderLuckyDip(album) {
  if (!album) return "";
  return `
    <div class="card" style="background: linear-gradient(135deg, var(--surface-light), var(--surface)); border: 1px solid rgba(255,255,255,0.05); padding: var(--sp-6); display: flex; gap: var(--sp-6); align-items: center; border-radius: var(--radius-2xl);">
      <img src="${album.cover}" style="width: 140px; height: 140px; border-radius: var(--radius-xl); box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
      <div style="flex: 1;">
        <div style="color: var(--primary); font-size: var(--fs-xs); font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: var(--sp-1);">Lucky Dip</div>
        <h2 style="font-size: var(--fs-3xl); margin-bottom: var(--sp-2);">${album.title}</h2>
        <p style="color: var(--text-tertiary); margin-bottom: var(--sp-4);">${album.artist}</p>
        <button class="btn btn-primary" id="lucky-dip-play" style="display: flex; align-items: center; gap: var(--sp-2); padding: var(--sp-3) var(--sp-6);">
          ${icons.play} Open Album
        </button>
      </div>
    </div>
  `;
}
