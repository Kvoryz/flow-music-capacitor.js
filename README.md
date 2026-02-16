# Flow Music Player

Flow is a premium, high-performance music player built with Capacitor and Vite. It features a stunning "Glass Tiles 2.0" design, high-fidelity audio engine with crossfade Support, and advanced library management.

## ✨ Features

- **Premium UI & UX**:
  - Modern glassmorphism design with dynamic accent colors.
  - **Smooth Page Transitions**: Slide and fade animations for a seamless feel.
  - **Skeleton Loaders**: Polished loading states for improved perceived performance.
  - **Swipe Gestures**: Swipe down to close the Now Playing screen.
- **Advanced Audio Engine**:
  - Gapless playback and crossfading (0-12s).
  - **4-Mode Playback**: Cycle through Play Once ⏹️, Play to End 🏁, Repeat All 🔁, and Repeat One 🔂.
  - 5-band parametric equalizer with makeup gain.
  - Mono audio downmixing and "Avoid Short Tracks" filtering.
- **Queue & Library**:
  - **Circular Queue View**: Infinite scrolling/looping "Up Next" list when Repeat All is active.
  - **Mode Transparency**: Real-time status bar and Shuffle/Repeat toggles directly in the Queue.
  - **Visual "Play Once"**: Dimmed queue states and "STOP" badges for clear playback feedback.
  - **Drag & Drop Reordering**: Natural touch-based reordering in the queue.
  - **Play Next**: Context menu option to jump tracks to the top of the queue.
  - Blazing fast local scanning with metadata editing.
- **Premium UI & UX**:
  - Modern glassmorphism design with dynamic accent colors.
  - **Hardware Accelerated Blur**: Zero-jump blur transitions for premium glass feel.
  - **Layout Stability**: `scrollbar-gutter: stable` prevents content shifting.
  - **Restored Visualizers**: Eq-bars animation in the library for currently playing tracks.
  - **Smooth Page Transitions**: Slide and fade animations for a seamless feel.

## 🚀 Getting Started

### Prerequisites

- Node.js (v18+)
- Android Studio (for native builds)
- Capacitor CLI

### Installation

1. Install dependencies:

   ```bash
   npm install
   ```

2. Run development server:
   ```bash
   npm run dev
   ```

### 📱 Android Build

To build the debug APK:

1. Build web assets:

   ```bash
   npm run build
   ```

2. Sync with Capacitor:

   ```bash
   npx cap sync android
   ```

3. Build APK:
   ```bash
   cd android && ./gradlew assembleDebug
   ```

The APK will be located at `android/app/build/outputs/apk/debug/app-debug.apk`.

## 🛠 Tech Stack

- **Frontend**: Vanilla HTML/JS, Vite
- **Styling**: Modern CSS (Variables, HSL, Glassmorphism)
- **Native**: Capacitor
- **Icons**: Custom SVG Icon system

## 📄 License

MIT
