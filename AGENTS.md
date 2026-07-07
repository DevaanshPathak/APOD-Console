# APOD Console Agent Guide

APOD Console is a mission-control-style dashboard for NASA's Astronomy Picture of the Day API. It should feel like a probe decoding a daily transmission from deep space, not a simple image card demo. The finished site uses Vanilla JavaScript, HTML, CSS, Vite, NASA APOD data, local caching, recent transmission history, random archive access, and GitHub Pages deployment for the `apod-console` repo path.

## Design System Reference

Palette:

- Void background: `#0a0d12`
- Panel background: `#10151c`
- Primary text / phosphor: `#d7e4e8`
- Primary accent / Apollo DSKY amber: `#ffb000`
- Secondary accent / data cyan: `#5cc8ff`
- Alert / error: `#ff4d4d`
- Hairline grid: `rgba(92, 200, 255, 0.15)`

Typography:

- Load Google Fonts with `<link>` tags.
- Use `JetBrains Mono` for headers, labels, telemetry data, buttons, and console UI.
- Use uppercase and modest letter spacing for console labels and telemetry text.
- Use `IBM Plex Sans` for APOD explanation body copy so long paragraphs stay readable.

Layout:

- Header: mission ID text `APOD-CONSOLE // DEEP SPACE IMAGE LINK`, blinking status dot, live UTC clock in `HH:MM:SSZ` format.
- Hero: APOD image or embedded video inside a viewfinder frame with four CSS corner-bracket reticle marks.
- Hero overlay: APOD title and date at the bottom of the media frame, uppercase mono styling.
- Sidebar panel 1: `MISSION CONTROLS` with date input, `TODAY`, `RANDOM SIGNAL`, and a horizontally scrollable `RECENT TRANSMISSIONS` thumbnail strip.
- Sidebar panel 2: `SIGNAL DATA` as a `<dl>` readout for media type, SOL count, copyright/credit, and cache state.
- Main lower panel: `TRANSMISSION LOG` with the APOD explanation text in readable body type.
- Footer: small credit line.

Signature interaction:

- On page load, show a boot overlay before rendering APOD data.
- Use a `<pre>` boot log that types lines one at a time:
  - `> ESTABLISHING DEEP SPACE NETWORK LINK...`
  - `> AUTHENTICATING APOD UPLINK...`
  - `> DECODING IMAGE PACKET...`
  - `> LINK ESTABLISHED.`
- Fill a progress bar alongside the boot sequence.
- Only cross-fade into the main console after the boot sequence has finished and APOD data is ready.
- If API data is still pending when the boot text finishes, keep the progress bar animating until data arrives.
- Add a subtle fixed full-viewport CRT scanline overlay with a very low opacity `repeating-linear-gradient` and `pointer-events: none`.
- Respect `prefers-reduced-motion`: disable boot typing and decorative motion, then show content immediately.

## Constraints

- Use Vanilla JavaScript, HTML, and CSS only. No React, Vue, Svelte, or other frontend framework syntax.
- Use Vite as the build tool and dev server.
- No UI component libraries and no CSS frameworks such as Tailwind or Bootstrap.
- Use hand-written CSS with CSS custom properties for the palette so the UI is easy to retheme.
- Keep Vanilla JS modules under `src/`.
- Read the NASA key from `import.meta.env.VITE_NASA_API_KEY`, with `DEMO_KEY` fallback when missing.
- Handle `image` and `video` APOD media types correctly. Video responses should embed from the NASA `url` field instead of rendering as images.
- Cache fetched APOD responses in `localStorage`, keyed by date.
- Maintain a recent transmissions list of roughly the last 10 viewed dates.
- Date picker minimum is `1995-06-16`; maximum is today's date.
- SOL count means days elapsed since `1995-06-16`.
- Credit fallback text is `UNCREDITED / PUBLIC DOMAIN`.
- Cache state must report `LIVE FETCH` or `CACHED`.
- Show an explicit `SIGNAL LOST` error panel with the error message and a `RETRY UPLINK` button for failed fetches.
- Code should be commented enough that a human can explain any part of it in a hackathon submission.
- Accessible behavior is required: visible keyboard focus states, APOD title as image alt text, and `aria-live="polite"` on the boot status region.

## Git and Devlog Rules

- Do not push to GitHub unless and until the user asks.
- If the user asks to push, push to `main`. Do not create pull requests or different branches unless the user explicitly overrides this rule.
- When asked to write a devlog, create a folder named `devlog`, add it to `.gitignore`, and write numbered Markdown entries there.
- The first devlog is `devlog/1.md`, the second is `devlog/2.md`, and so on.
- Keep every devlog entry under 4000 characters.
