# Neon Escape

Mobile-first HTML5 Canvas arcade game for Telegram Mini Apps.

## Run locally
Open `index.html` in a browser, or serve it with `python3 -m http.server 8000` and open `http://localhost:8000`.

## Publish
Deploy `index.html` to an HTTPS static hosting provider (GitHub Pages, Cloudflare Pages, or similar). Create a bot with @BotFather, configure its Mini App/menu button to open your HTTPS URL, and launch it from Telegram.

## Features
Touch controls, random obstacles, collectible crystals, lives, score, local high score, replay, share button, and Telegram WebApp initialization when available.

## Notes
This MVP stores only the high score in localStorage. No server or global leaderboard is included. The share button shares text; add the published game URL to improve sharing.