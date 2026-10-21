# TriCalc — Three-mode scientific calculator

TriCalc is an independent mobile-first scientific calculator project with three model-inspired interfaces: Casio fx-991CW-style ClassWiz, TI-84 Plus-style graphing, and Casio fx-991ES Plus-style Classic ES.

## Features

- Scientific expressions using Math.js
- Three selectable calculator layouts
- Degree/radian toggle, calculation history, dark/light themes
- Interactive multi-function graphing
- Quadratic solver with complex roots, descriptive statistics, complex-number modulus/argument, and angle conversion
- Responsive UI, PWA manifest/service worker, Capacitor Android wrapper

## Run locally

Requires Node.js 20+.

```bash
npm install
npm run dev
```

## Build web/PWA

```bash
npm run build
npm run preview
```

Deploy `dist/` to a static host over HTTPS. The app can then be installed from the mobile browser.

## Build Android APK

Install Android Studio, Android SDK, and a compatible JDK. Then:

```bash
npm install
npm run android:add
npm run android:sync
npm run android:open
```

In Android Studio select **Build → Build Bundle(s) / APK(s) → Build APK(s)**. The generated `android/` directory is intentionally created locally by Capacitor and is not committed.

## Project contents

- `src/App.tsx` — app navigation, calculator interfaces, expression evaluation, graphing and tools
- `src/style.css` — responsive model-inspired calculator UI
- `src/main.tsx` — React entry point and PWA service-worker registration
- `public/` — PWA manifest, service worker and app icon
- `capacitor.config.ts` — Android wrapper configuration

## Limitations

This is a model-inspired independent implementation, not an emulator of the proprietary calculator firmware and not affiliated with Casio or Texas Instruments. Some model-specific keys are placeholders; feature-for-feature equivalence, full matrix/vector workflows, symbolic algebra and full TI-84 functionality are not yet implemented. Verify important calculations independently.