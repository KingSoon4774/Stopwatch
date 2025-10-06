# Dream Unlimited Stopwatch

A spiritual, modern stopwatch that responds to your voice to capture "clipped" moments and saves your session timeline automatically when you close out.

## Features
- 🌌 **Immersive interface:** Aurora-inspired glassmorphism with light/dark toggle.
- 🕒 **Precision timing:** Start, pause/resume, reset, and manual clip controls.
- 🗣️ **Voice mantra control:** Define your own clip word and completion phrase. Speak the mantra to capture a lap, or say the completion phrase (default: “session complete”) to end and save the journey.
- 📄 **Automatic session export:** When a session completes, a JSON file with all lap data is downloaded (Chrome/Edge will place this in your default download folder—move it to Desktop to match your ritual).

## Getting Started
1. Open `index.html` in a modern Chromium-based browser (Chrome, Edge, Arc, Brave) for Web Speech API support.
2. Grant microphone access when prompted.
3. Set the session name, clip word, and completion phrase to whatever inspires you.
4. Press **Start** to begin tracking.
5. Speak your clip word or press **Clip** to capture moments.
6. Say your completion phrase (or press **Export**) to download the session record.

> Tip: If voice capture stops listening, tap the microphone button again to resume. The Web Speech API may occasionally stop after periods of silence.

## Data Format
The exported JSON contains:
- `sessionName`
- `startedAt` and `completedAt` timestamps (ISO 8601)
- `clipWord`, `completionPhrase`
- `totalElapsed`
- `laps`: array of lap objects (`index`, `time`, `delta`, `origin`, `spokenPhrase`)

## Development
No build step required—simply edit the HTML, CSS, and JavaScript files. For changes to voice behavior, update `script.js`.
