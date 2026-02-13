// ZPlayer — Entry Point
import "./styles/index.css";
import { initApp } from "./app.js";

// Initialize once DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initApp);
} else {
  initApp();
}
