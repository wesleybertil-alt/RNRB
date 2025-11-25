# Claude E-Ink Notebook

A minimalist Claude interface optimized for e-ink devices (Boox Air 4C), embodying "The Librarian Model" - AI as cognitive exoskeleton, not replacement creator.

## Philosophy

- **AI handles**: memory, retrieval, research labor, holding the mental stack
- **Human handles**: abstraction, judgment, taste, vision, final authority
- **Result**: Human thinks better, not human replaced by machine thinking worse

## Features

### Four-Mode System
- **Draft**: Exploration and generation - say "yes, and" to ideas
- **Research**: Verification and evidence - find what's true
- **Synthesis**: Connection and meaning - see the bigger picture
- **Writing**: Craft and clarity - make the work sing

### Core Features
- Project-based organization with knowledge bases
- Conversation history with IndexedDB persistence
- Document stage tracking (Draft → Research → Synthesis → Writing)
- E-ink optimized UI (no animations, high contrast, touch-friendly)
- PWA with offline support
- Capacitor for native Android APK

## Tech Stack

- **Frontend**: React 18 + TypeScript
- **Styling**: Tailwind CSS (e-ink custom theme)
- **State**: Zustand (lightweight, persistent)
- **Storage**: IndexedDB (Dexie.js wrapper)
- **API**: Claude API (claude-sonnet-4-20250514)
- **PWA**: Vite PWA plugin
- **Native**: Capacitor (iOS/Android)

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Claude API key from [console.anthropic.com](https://console.anthropic.com)

### Installation

```bash
# Clone and install
cd claude-eink-notebook
npm install

# Start development server
npm run dev
```

### Configuration

1. Open the app in your browser
2. Click the menu (☰) → Settings
3. Enter your Claude API key
4. Start chatting!

## Deployment

### PWA (Vercel)

```bash
# Build for production
npm run build

# Deploy to Vercel
npx vercel --prod

# Or use the Vercel dashboard to connect your repo
```

### Android APK (Capacitor)

```bash
# Build web assets
npm run build

# Add Android platform (first time only)
npx cap add android

# Sync and build
npm run build:android

# Open in Android Studio
npx cap open android

# Build APK from Android Studio:
# Build → Build Bundle(s) / APK(s) → Build APK(s)
```

APK location: `android/app/build/outputs/apk/debug/app-debug.apk`

## E-ink UI Guidelines

This app follows strict e-ink UI rules:

- **No animations** - causes ghosting
- **No hover states** - e-ink has no cursor
- **Black/white/gray only** - no colors
- **2px solid borders** - crisp visibility
- **48px minimum touch targets** - finger-friendly
- **18px Literata font** - optimized for readability
- **No rounded corners > 4px** - ghosting issues
- **No shadows** - render poorly

## Project Structure

```
claude-eink-notebook/
├── src/
│   ├── components/     # UI components
│   ├── hooks/          # Custom React hooks
│   ├── stores/         # Zustand state stores
│   ├── lib/            # Utilities and API
│   ├── styles/         # E-ink theme CSS
│   └── types/          # TypeScript types
├── public/
│   ├── icons/          # App icons
│   └── manifest.json   # PWA manifest
├── capacitor.config.ts # Native app config
├── vite.config.ts      # Build config
└── vercel.json         # Deployment config
```

## Scripts

```bash
npm run dev           # Start dev server
npm run build         # Production build
npm run preview       # Preview production build
npm run build:android # Build for Android
npm run cap:sync      # Sync Capacitor
```

## License

MIT

---

Built with the belief that AI should enhance human thinking, not replace it.
