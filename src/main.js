// ZPlayer — Entry Point
import "./styles/index.css";
import { initApp } from "./app.js";

// Safety Hatch: Catch any top-level errors and show them on screen
window.onerror = function (msg, url, lineNo, columnNo, error) {
  const errorDiv = document.createElement("div");
  errorDiv.setAttribute(
    "style",
    "position:fixed;top:0;left:0;width:100%;height:100%;background:red;color:white;z-index:9999;padding:20px;overflow:auto;word-break:break-all;",
  );
  errorDiv.innerHTML = `<h1>Fatal Error</h1><p>${msg}</p><p>at ${url}:${lineNo}:${columnNo}</p><pre>${error ? error.stack : ""}</pre>`;
  document.body.appendChild(errorDiv);
  return false;
};

window.onunhandledrejection = function (event) {
  console.error("Unhandled Rejection", event.reason);
};

// Initialize once DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    initApp().catch((err) => {
      window.onerror(err.message, "app.js", 0, 0, err);
    });
  });
} else {
  initApp().catch((err) => {
    window.onerror(err.message, "app.js", 0, 0, err);
  });
}
