# QA status

## Automated checks run

npm test — PASS. Nine assertions grouped in a single Node test file cover:

- 140 BPM/4×4 chart and event counts.
- Rejecting a wrong tempo, duplicate IDs and invalid risk references.
- Perfect and Good crossings, direction checks, one-time score and accuracy.
- Movement boundaries.
- Risk-gate clearance after Hard mode transformations.
- Safe passage through a wall, damage outside its opening.
- Timed shield pickup.

node --check src/engine.js — PASS. node --check src/game.js — PASS. MP3 file response and chart integrity are checked separately during static server validation.

## Not run

No Chromium, Chrome or Firefox binary was available. Browser UI interaction, Canvas rendering screenshots, actual audio output, Web Audio suspension in a Telegram webview, iPhone, Android and physical latency calibration remain to be tested. The Playwright package is not required for the current test suite.

## Known gameplay test scope

Automated physics assertions test the engine functions directly, not the browser wrapper or native audio hardware. The full audio/chart hash check requires a secure browser context (localhost or HTTPS), as provided by the intended local and static-hosting setup.
