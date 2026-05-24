# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**Room Planner** — a web app for dragging and dropping furniture onto a 2D floor plan ("Kéo thả nội thất lên mặt bằng 2D").

## Stack

**Vue 3** (Composition API + `<script setup>`) · **TypeScript** · **Vite** · **Pinia** · **Vue Router 4** · **Tailwind CSS v3**

## Commands

- Dev server: `npm run dev`
- Build: `npm run build`
- Type-check: `npm run type-check`
- Preview build: `npm run preview`

## Key Architecture

- `src/types/index.ts` — all shared interfaces (`FurnitureItem`, `RoomConfig`, etc.)
- `src/stores/` — Pinia stores using **setup syntax** (never options syntax)
  - `roomStore` — room config (dimensions, grid, snap, bg color)
  - `furnitureStore` — items array, selection, CRUD + `setItems` for undo/redo
  - `historyStore` — undo/redo stack (50-entry cap, cursor-based)
- `src/composables/` — typed composables returning `Ref<T>` / `ComputedRef<T>`
  - `useDragDrop` — pure mouse math, no store deps
  - `useSnap` — reads/writes `roomStore.config.snapEnabled`
  - `useExport` — JSON blob download + lazy html2canvas PNG export
- `src/components/` — Toolbar, FurniturePanel, RoomCanvas, PropertiesPanel
- `src/views/HomeView.vue` — 3-column layout (panel | canvas | properties)

## Core Domain Concepts

- **Floor plan canvas**: a 2D grid or free-form canvas where users place furniture
- **Furniture items**: draggable elements with fixed or resizable dimensions
- **Drag-and-drop**: primary interaction model for placing and repositioning items
