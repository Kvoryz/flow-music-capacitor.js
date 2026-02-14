import { icons } from "../core/icons.js";
import { audioEngine } from "../core/audioEngine.js";
import { createElement } from "../core/utils.js";
import { store } from "../core/store.js";

export function createEqualizer() {
  const el = createElement("div", "equalizer-panel");

  const gains = audioEngine.getEQGains();
  const bands = ["60Hz", "230Hz", "910Hz", "3.6kHz", "14kHz"];

  el.innerHTML = `
    <div class="eq-header">
      <div class="eq-title">Equalizer</div>
      <button class="eq-close" id="eq-close">${icons.close}</button>
    </div>
    
    <div class="eq-sliders">
      ${bands
        .map(
          (label, i) => `
        <div class="eq-slider-container">
          <div class="eq-slider-value" id="eq-val-${i}">${gains[i] > 0 ? "+" : ""}${gains[i]}dB</div>
          <input type="range" class="eq-slider" min="-12" max="12" step="1" value="${gains[i]}" data-index="${i}">
          <div class="eq-slider-label">${label}</div>
        </div>
      `,
        )
        .join("")}
    </div>
    
    <div class="eq-presets">
      <button class="eq-preset-btn" data-preset="flat">Flat</button>
      <button class="eq-preset-btn" data-preset="bass">Bass Boost</button>
      <button class="eq-preset-btn" data-preset="pop">Pop</button>
      <button class="eq-preset-btn" data-preset="rock">Rock</button>
    </div>
  `;

  el.querySelector("#eq-close").addEventListener("click", () => {
    store.set("eqOpen", false);
  });

  el.querySelectorAll(".eq-slider").forEach((slider) => {
    slider.addEventListener("input", (e) => {
      const idx = parseInt(e.target.dataset.index);
      const val = parseInt(e.target.value);
      audioEngine.setEQGain(idx, val);
      el.querySelector(`#eq-val-${idx}`).textContent =
        `${val > 0 ? "+" : ""}${val}dB`;
    });
  });

  const presets = {
    flat: [0, 0, 0, 0, 0],
    bass: [6, 4, 0, 0, 0],
    pop: [-1, 2, 5, 1, -2],
    rock: [4, 2, -3, 2, 5],
  };

  el.querySelectorAll(".eq-preset-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const p = presets[btn.dataset.preset];
      p.forEach((gain, i) => {
        audioEngine.setEQGain(i, gain);
        const slider = el.querySelector(`.eq-slider[data-index="${i}"]`);
        slider.value = gain;
        el.querySelector(`#eq-val-${i}`).textContent =
          `${gain > 0 ? "+" : ""}${gain}dB`;
      });
    });
  });

  return el;
}
