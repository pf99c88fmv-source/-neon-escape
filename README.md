# МАКАР + ЖЕНЯ

Playable HTML5 rhythm arcade prototype for Telegram Mini Apps and mobile browsers. The public game title is **МАКАР + ЖЕНЯ**; the repository keeps its original name.

## Run locally

Use Python 3 and Node.js 18 or newer. No npm install is required.

    cd neon-escape-v2
    npm test
    npm run serve

Open http://localhost:8000. Audio starts after the in-game button is tapped, as required by mobile browsers. The menu, instructions and settings work without sound.

## Game

- Portrait Canvas tunnel, animated neon ship, phone-sized responsive layout and reduced effects setting.
- Original 140 BPM, straight 4/4 techno file. Kick, bass, hats, industrial percussion, evolving synth layers, break and drops are in the track; beat-scheduled gates and obstacles use the companion JSON chart.
- One-finger horizontal drag, keyboard arrows / A-D, pause and resume with a four-beat count-in.
- Score gates on direction and musical timing. Perfect/Good grades, combo multipliers, risk gates, two shield pickups, flow bonus, three lives (two on Hard), increasing obstacle challenge.
- Particle bursts, impact wave, hit protection, synthesized sound effects.
- Separate Normal and Hard personal records, saved locally; best score is not a server-verified leaderboard.
- Telegram WebApp initialization, expansion, swipe setting, safe-area and lifecycle handling. The ordinary browser remains supported.

## Music asset

assets/audio/neon-rush-140.mp3 is an original procedural synth sketch, exported from a 44.1 kHz stereo WAV prototype. The runtime downloads/decodes a single MP3 and verifies its SHA-256 from the chart. The 32-bar track is about 55 seconds; it is not a professionally mastered commercial release. Listen before release and approve a final master if desired. See `docs/IMPLEMENTATION_REPORT_RU.md` for the full concept, audit, architecture and release caveats.

## Tests

npm test currently passes the pure JavaScript engine checks for chart integrity, gate timing and one-time scoring, misses, multipliers, accuracy, movement boundaries, Hard risk clearances, wall collision, full laser active window and shield pickup.

No Chromium/Chrome/Firefox binary is available in the implementation environment, so browser UI automation and physical iOS/Android/Telegram tests could not be run here. This is recorded as pending QA, not a passed test.

## Publish after review

1. Host this directory as a static site on HTTPS (GitHub Pages, Cloudflare Pages or another static host).
2. Verify /index.html, /assets/charts/rave-140.json and /assets/audio/neon-rush-140.mp3 all load over HTTPS. Keep paths relative; GitHub Pages project subpaths are supported.
3. Run the game on Safari iPhone and Chrome Android, then inside Telegram on both. Test audio unlock, drag, pause/resume, safe-area, device rotation, background/return, and reduced effects.
4. In BotFather, set the approved HTTPS URL as the bot's Mini App or menu button. The game cannot change the bot's public name; the visible page/header styling and all in-game branding already show МАКАР + ЖЕНЯ.
5. Keep the audio and matching chart hash together. Do not publish only one side of an audio/chart update.

There is no backend, anti-cheat, friend leaderboard, or global ranking in this version. initData is not submitted or trusted.
