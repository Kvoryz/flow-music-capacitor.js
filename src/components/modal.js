// ZPlayer — Modal Component
import { store } from "../core/store.js";
import { library } from "../core/library.js";
import { createElement } from "../core/utils.js";

export function createModal() {
  const wrapper = createElement("div", "");
  wrapper.id = "modal-wrapper";
  wrapper.style.display = "none";

  store.on("modal", (modal) => {
    if (modal) {
      showModal(wrapper, modal);
    } else {
      wrapper.style.display = "none";
      wrapper.innerHTML = "";
    }
  });

  return wrapper;
}

function showModal(wrapper, modal) {
  if (modal.type === "create-playlist") {
    showCreatePlaylistModal(wrapper, modal.data);
  }
}

function showCreatePlaylistModal(wrapper, data = {}) {
  wrapper.style.display = "block";
  wrapper.innerHTML = `
    <div class="modal-overlay">
      <div class="modal">
        <div class="modal-title">Create Playlist</div>
        <input class="modal-input" id="playlist-name-input" type="text" placeholder="Playlist name" autofocus>
        <div class="modal-actions">
          <button class="btn btn-secondary" id="modal-cancel">Cancel</button>
          <button class="btn btn-primary" id="modal-create">Create</button>
        </div>
      </div>
    </div>
  `;

  const input = wrapper.querySelector("#playlist-name-input");
  setTimeout(() => input.focus(), 100);

  const create = () => {
    const name = input.value.trim();
    if (name) {
      const playlist = library.createPlaylist(name);
      if (data.trackToAdd) {
        library.addTrackToPlaylist(playlist.id, data.trackToAdd);
      }
      store.showToast(`Created "${name}"`);
      store.set("modal", null);
    }
  };

  wrapper.querySelector("#modal-cancel").addEventListener("click", () => {
    store.set("modal", null);
  });

  wrapper.querySelector("#modal-create").addEventListener("click", create);

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") create();
    if (e.key === "Escape") store.set("modal", null);
  });

  // Close on overlay click
  wrapper.querySelector(".modal-overlay").addEventListener("click", (e) => {
    if (e.target.classList.contains("modal-overlay")) {
      store.set("modal", null);
    }
  });
}
