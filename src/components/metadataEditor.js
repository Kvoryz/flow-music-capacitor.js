import { icons } from "../core/icons.js";
import { musicLibrary } from "../core/library.js";
import { createElement } from "../core/utils.js";
import { store } from "../core/store.js";

export function createMetadataEditor(track) {
  const el = createElement("div", "metadata-editor");

  el.innerHTML = `
    <div class="metadata-editor-form">
      <div class="form-group">
        <label>Title</label>
        <input type="text" class="modal-input" id="edit-title" value="${track.title || ""}">
      </div>
      <div class="form-group" style="margin-top: 16px;">
        <label>Artist</label>
        <input type="text" class="modal-input" id="edit-artist" value="${track.artist || ""}">
      </div>
      <div class="form-group" style="margin-top: 16px;">
        <label>Album</label>
        <input type="text" class="modal-input" id="edit-album" value="${track.album || ""}">
      </div>
      
      <div class="modal-actions" style="margin-top: 24px;">
        <button class="btn btn-secondary" id="edit-cancel">Cancel</button>
        <button class="btn btn-primary" id="edit-save">Save Changes</button>
      </div>
    </div>
  `;

  el.querySelector("#edit-cancel").addEventListener("click", () => {
    store.set("modal", null);
  });

  el.querySelector("#edit-save").addEventListener("click", () => {
    const newData = {
      title: el.querySelector("#edit-title").value,
      artist: el.querySelector("#edit-artist").value,
      album: el.querySelector("#edit-album").value,
    };

    musicLibrary.updateTrackMetadata(track.id, newData);
    store.showToast("Metadata updated! 📝");
    store.set("modal", null);
  });

  return el;
}
