# Orlem Christmas Ball 2026 — Cinematic 3D Website (Steps 1–3+)

Minimal, high-end 3D event site scaffold inspired by [christmas-2024.riven.ch](https://christmas-2024.riven.ch/), themed for **Orlem Christmas Ball 2026**.

## Tech stack
- **React + Vite + TypeScript**
- **three**, **@react-three/fiber**, **@react-three/drei**
- **@react-three/postprocessing** + **postprocessing** (Bloom, Vignette, DepthOfField)
- **Tailwind CSS**, **Framer Motion**

## Event content (as specified)
- **Title:** Orlem Christmas Ball 2026
- **Presenter:** PCPL Presents
- **Featuring:** Knights The Entertainers
- **Tagline:** Making History! Direct from Sri Lanka. Live in Orlem.
- **Date:** 25 Dec, 7:30 p.m. onwards
- **Venue:** St. Joseph School Turf Ground, Orlem, Malad
- **Address:** Marve Road, Orlem, Malad West, Mumbai - 400064 (Opposite Orlem Church)
- **Entry:** By Invitation Only
- **Associated:** The Happy Hearts

## Project structure
```
cinematic-ball/
  src/
    App.tsx
    main.tsx
    index.css
    components/
      Scene.tsx       # R3F Canvas, Suspense, Environment preset, camera rig, hero ornament,
                      # 3D text, Sparkles, postprocessing (Bloom/Vignette/DOF), fog
      UIOverlay.tsx   # Tailwind overlay + Framer Motion modal + map link
```

## Implemented (steps 1–3 and core polish)
1. **Scaffolded** Vite React+TS app with Tailwind, R3F/drei, postprocessing, Framer Motion.
2. **`<Canvas dpr={[1,2]}>`** with `<Suspense>` and `<Environment preset="night" />` (HDRI lighting/reflections) plus fog and cinematic lighting.
3. **Floating camera rig** (`useFrame` subtle drone/lerp lookAt), **hero object** (glass-like `MeshTransmissionMaterial` sphere + gold cap/ring) with slow rotation/float, **Sparkles** gold dust, and **3D typography** (`Text` from drei) with metallic gold materials.
4. **Post-processing:** Bloom, Vignette, DepthOfField (`@react-three/postprocessing`).
5. **UI overlay:** minimal event details (Playfair Display/Montserrat), "By Invitation Only" badge, **"View Invitation Details"** modal (Framer Motion) with full info and **Open in Maps** link: https://www.google.com/maps/search/?api=1&query=St.+Joseph+School+Turf+Ground,+Orlem,+Malad+West,+Mumbai
6. **Perf notes:** key geometries memoized with `useMemo`.

## Run locally (requires Node.js + npm)
> Node/npm were not detected in the scaffolding environment, so dependencies are **not installed** yet.

```bash
cd cinematic-ball
npm install
npm run dev
```
Open the URL shown by Vite (usually http://localhost:5173).

## Optional enhancements / next steps
- Swap `Environment preset="night"` for a custom HDRI from [Poly Haven Ballroom](https://polyhaven.com/a/ballroom) via `<Environment files="/hdri.hdr" />`.
- Load a detailed `.glb` ornament/tree via `useGLTF` and add gold-foil PBR textures.
- Tune Bloom/DOF per device; add a reduced-motion fallback and mobile camera tweaks.
- Replace text-font URLs with self-hosted/local fonts for offline reliability.
