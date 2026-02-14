import { Haptics, ImpactStyle } from "@capacitor/haptics";
import { store } from "./store.js";

class HapticEngine {
  constructor() {
    this.enabled = localStorage.getItem("flow_haptics_enabled") !== "false";
    this.intensity =
      parseFloat(localStorage.getItem("flow_haptics_intensity")) || 1.0;
  }

  toggle(enabled) {
    this.enabled = enabled;
    localStorage.setItem("flow_haptics_enabled", enabled);
  }

  setIntensity(value) {
    this.intensity = Math.max(0.1, Math.min(1.0, value));
    localStorage.setItem("flow_haptics_intensity", this.intensity.toString());
  }

  async impact(style = ImpactStyle.Light) {
    if (!this.enabled || this.intensity < 0.2) return;
    try {
      await Haptics.impact({ style });
    } catch (e) {}
  }

  async selection() {
    if (!this.enabled) return;
    try {
      await Haptics.selectionStart();
      await Haptics.selectionEnd();
    } catch (e) {}
  }

  async vibrate() {
    if (!this.enabled) return;
    try {
      await Haptics.vibrate();
    } catch (e) {}
  }

  light() {
    this.impact(ImpactStyle.Light);
  }

  medium() {
    this.impact(ImpactStyle.Medium);
  }
}

export const haptics = new HapticEngine();
