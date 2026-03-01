# tackl

**Tackling the fine print, one web page at a time.**

Tackl is a browser extension that scans web pages for Terms & Conditions, analyzes them with AI for privacy risks and hidden clauses, and gives you clear advice plus ready-to-send emails to opt out or delete your data.

---

## Features

- **Smart T&C detection** — Finds terms on the current page, in embedded sections, or by following links (e.g. “Terms of Service”, “Privacy Policy”).
- **AI-powered analysis** — Uses Google Gemini to identify:
  - **Privacy risks** (data tracking, AI training, broad licenses, third-party sharing, arbitration, etc.) with severity and solutions.
  - **Opt-out email** — The address the service provides for privacy/data requests.
  - **Ghost Mode** — 5 quick-win privacy settings with step-by-step instructions to find them in the app or site.
- **Action buttons** — After a scan, generate and send:
  - **Delete My Account & Data** — Formal request (e.g. Canadian CPPA Section 55–style) for permanent deletion.
  - **Opt Out of Data Sharing** — Email to opt out using the risks identified in the analysis.
- **Default advice** — General “before” and “after” tips when you haven’t scanned yet (cancellation, auto-renewal, saving confirmations, etc.).

---

## Prerequisites

- **Gemini API key** (free): Get one at [Google AI Studio](https://aistudio.google.com). Add it in the extension **Settings** after installation.

---

## Installation

### 1. Clone and install

```bash
git clone https://github.com/eribakov/TC-Advisor.git
cd TC-Advisor
npm install
```

### 2. Build the extension

```bash
npm run build
```

Output is in the `dist` folder.

### 3. Load in Chrome (or Chromium-based browser)

1. Open `chrome://extensions/`.
2. Turn on **Developer mode** (top right).
3. Click **Load unpacked**.
4. Select the **`dist`** folder inside the project.

The Tackl icon should appear in your toolbar. Click it to open the popup.

---

## Usage

1. **Add your API key** — Open the extension popup → **Settings** → paste your Gemini API key → **Save Key**.
2. **Open any webpage** (e.g. a signup or subscription page).
3. **Click the Tackl icon** and then **Scan this page**.
4. Review **Risks** (before agreeing) and **Ghost Mode** (after agreeing).
5. Optionally enter your name and email, then use **Delete My Account & Data** or **Opt Out of Data Sharing** to open a pre-filled email to the service’s privacy/opt-out address.

---

## Project structure

```
TC-Advisor/
├── public/           # Static assets (manifest, icons, popup CSS)
├── src/
│   ├── popup.ts      # Popup UI, scan trigger, advice display
│   ├── content.ts    # Injected script: finds T&C on page, sends to background
│   ├── background.ts # Service worker: calls analyzer, returns result
│   ├── analyzer.ts   # Gemini integration, risk analysis, email generation
│   ├── components/
│   │   └── emailButtons.ts  # Delete / Opt-out buttons and mailto
│   └── prompts/
│       ├── deletionEmail.ts # Delete-account email prompt (e.g. CPPA)
│       └── optOutEmail.ts   # Opt-out email prompt
├── index.html        # Popup + settings views
├── settings.html     # Options page
├── vite.config.ts    # Build config (popup, content, background entries)
└── package.json
```

---

## Tech stack

- **TypeScript** — Extension and popup logic
- **Vite** — Build (popup, content script, background service worker)
- **Chrome Extension APIs** — `tabs`, `storage`, `runtime`, content scripts
- **Google Gemini** (`@google/genai`) — Terms analysis and email generation

---

## Scripts

| Command        | Description              |
|----------------|--------------------------|
| `npm run dev`  | Start Vite dev server    |
| `npm run build`| Build extension to `dist`|
| `npm run preview` | Preview Vite build    |

After code changes, run `npm run build` and click **Reload** on the extension in `chrome://extensions/`.

---

## License

ISC

---

## Links

- **Repository:** [github.com/eribakov/TC-Advisor](https://github.com/eribakov/TC-Advisor)
- **Issues:** [github.com/eribakov/TC-Advisor/issues](https://github.com/eribakov/TC-Advisor/issues)
