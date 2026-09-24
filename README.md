# URL Extractor

> ⚡ **Clean Minimalist, Anti-Slop, 100% Client-Side URL Extractor**
> Hosted on Cloudflare Pages: [url-extractor.pages.dev](https://url-extractor.pages.dev)

A modern, high-performance web tool built to extract, clean, and copy URLs from mixed, cluttered text (articles, notes, social media captions). Runs entirely in the client's browser with **zero server load**, guaranteed privacy, and instantaneous offline parsing.

---

## ✨ Features

- **100% Client-Side Engine**: All regex parsing and boundary normalization happens in your browser. Zero backend requests, zero telemetry, zero latency.
- **Clean Minimalist & Anti-Slop Design**: Designed with a Warm Light Theme (warm paper `#FDFBF7`, warm stone borders, deep charcoal typography) without generic AI-slop, neon mesh gradients, or bloated decorative filler.
- **Mobile-First Responsive Layout**: Single-column ergonomic touch controls on mobile, expanding seamlessly to a dual-pane workspace on tablets and desktops.
- **Smart Punctuation Trimming**: Automatically trims trailing periods, commas, colons, semicolons, exclamation marks, and boundary parentheses (e.g. `(https://example.com/test).` → `https://example.com/test`).
- **One-Click Instant Copy**: Copy all extracted URLs to clipboard with tactile visual feedback and toast confirmation.
- **Deduplication Toggle**: Option to eliminate duplicate links and keep only unique URLs.
- **Export to .txt**: Download all extracted URLs directly as a text file.
- **Keyboard Shortcuts**: `Ctrl + Enter` / `Cmd + Enter` to trigger extraction.

---

## 🛠️ Tech Stack

- **Bundler & Runtime**: [Vite 6](https://vitejs.dev/) + [TypeScript 5](https://www.typescriptlang.org/)
- **Styling**: Modern Mobile-First Vanilla CSS (CSS Variables, Semantic HTML5)
- **Testing**: [Vitest](https://vitest.dev/)
- **Hosting**: [Cloudflare Pages](https://pages.cloudflare.com/)

---

## 🚀 Development & Build

```bash
# Install dependencies
npm install

# Start local development server
npm run dev

# Run automated tests
npm run test

# Build production bundle (dist/)
npm run build

# Preview production build locally
npm run preview
```

---

## 📄 License

MIT © [Fatahilah](https://fatah.web.id)
