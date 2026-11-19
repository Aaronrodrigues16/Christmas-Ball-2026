# Orlem Christmas Ball 2026 — 3D Interactive Card (Scaffold)

Minimal React + TypeScript + Vite scaffold inspired by the interactive 3D card experience, themed for **Orlem Christmas Ball 2026**.

## Tech stack
- **React 18 + Vite** (TypeScript)
- **Three.js** via **@react-three/fiber** and **@react-three/drei** (helpers: `PerspectiveCamera`, `OrbitControls`)
- **Tailwind CSS** for UI styling
- **Framer Motion** for UI animation

## Project structure
```
3d-card/
  index.html
  package.json
  vite.config.ts
  tailwind.config.js
  postcss.config.js
  tsconfig.json
  src/
    main.tsx          # entry
    index.css         # Tailwind directives
    App.tsx           # layout: 3D canvas + UI overlay
    components/
      Scene.tsx       # R3F <Canvas>, camera, lights, rotating placeholder tree, OrbitControls
      UIOverlay.tsx   # title, animated "Create Your Card" button (console.log placeholder)
```

## Setup & run (requires Node.js + npm)
> **Note:** Node/npm were not detected in the environment used to scaffold these files, so dependencies are not installed yet. Install Node.js (LTS) first, then run:

```bash
cd 3d-card
npm install
npm run dev
```

Open the local URL printed by Vite (typically http://localhost:5173).

## What's implemented now
- Full-screen R3F `<Canvas>` with `PerspectiveCamera`, ambient/directional/point lighting.
- Placeholder low-poly Christmas tree (grouped meshes) with slow rotation (`useFrame`).
- `OrbitControls` for inspect/rotate/zoom.
- Tailwind full-screen layout with a 2D UI overlay: **"Take Me To Christmas"** (Orlem Christmas Ball 2026) and **"Create Your Card"**.
- Framer Motion hover/tap animation on the button; click logs to console as a placeholder for the card creation flow.

## Next steps (to extend)
1. **Load a `.glb` model** (e.g. detailed tree/card) via `useGLTF` from `@react-three/drei` in `Scene.tsx`.
2. **Particles/snow & richer animation** (e.g. `@react-three/drei` `<Sparkles/>`, shader/instanced snow, GSAP/Framer for sequences).
3. **"Create and share a card" flow**: form/state for recipient + message, route or modal for preview, generate a shareable link/slug and render personalized content.
4. **Performance/polish**: tone mapping, postprocessing (bloom), responsive camera, asset preloading (`useGLTF.preload`).
