<script setup lang="ts">
import { ref } from 'vue'
import { useEventListener } from '@vueuse/core'
import { useFurnitureStore } from '@/stores/furnitureStore'
import { useHistoryStore } from '@/stores/historyStore'
import { useRoomStore } from '@/stores/roomStore'
import { useSnap } from '@/composables/useSnap'
import { useExport } from '@/composables/useExport'

const furnitureStore = useFurnitureStore()
const historyStore = useHistoryStore()
const roomStore = useRoomStore()
const { snapEnabled, toggleSnap } = useSnap()
const { isExporting, exportJSON, exportSVGtoPNG, importJSON } = useExport()

const importFileInput = ref<HTMLInputElement | null>(null)
const showShortcuts = ref(false)

function handleUndo(): void {
  const restored = historyStore.undo()
  if (restored !== null) furnitureStore.setItems(restored)
}

function handleRedo(): void {
  const restored = historyStore.redo()
  if (restored !== null) furnitureStore.setItems(restored)
}

function handleClearAll(): void {
  furnitureStore.clearAll()
  historyStore.saveSnapshot([])
}

function handleExportJSON(): void {
  exportJSON()
}

async function handleExportPNG(): Promise<void> {
  const svgEl = document.querySelector<SVGSVGElement>('[data-room-canvas]')
  await exportSVGtoPNG(svgEl, roomStore.config.name.replace(/\s+/g, '_'))
}

function handleImportClick(): void {
  importFileInput.value?.click()
}

async function handleImportJSON(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  try {
    await importJSON(file)
  } catch (err) {
    alert(`Import failed: ${err instanceof Error ? err.message : String(err)}`)
  } finally {
    input.value = ''
  }
}

function toggleShortcuts(): void {
  showShortcuts.value = !showShortcuts.value
}

useEventListener(window, 'keydown', (e: KeyboardEvent) => {
  const tag = (e.target as Element)?.tagName ?? ''
  if (tag === 'INPUT' || tag === 'TEXTAREA') return
  if (e.key === '?') {
    showShortcuts.value = !showShortcuts.value
  }
})
</script>

<template>
  <header class="relative z-10 flex items-center gap-3 px-4 py-2 bg-white border-b border-gray-200 shadow-sm">
    <span class="text-lg font-bold text-gray-800 mr-4">Room Planner</span>

    <button
      id="btn-undo"
      data-tooltip="Undo · Ctrl+Z"
      data-tooltip-below
      :disabled="!historyStore.canUndo"
      @click="handleUndo"
      class="px-3 py-1.5 text-sm rounded border border-gray-300 hover:bg-gray-50
             disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
    >
      Undo
    </button>
    <button
      id="btn-redo"
      data-tooltip="Redo · Ctrl+Y / Ctrl+Shift+Z"
      data-tooltip-below
      :disabled="!historyStore.canRedo"
      @click="handleRedo"
      class="px-3 py-1.5 text-sm rounded border border-gray-300 hover:bg-gray-50
             disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
    >
      Redo
    </button>

    <div class="w-px h-5 bg-gray-300" />

    <button
      id="btn-snap"
      data-tooltip="Toggle Snap · S"
      data-tooltip-below
      @click="toggleSnap"
      :class="[
        'px-3 py-1.5 text-sm rounded border transition-colors',
        snapEnabled
          ? 'bg-blue-500 text-white border-blue-500 hover:bg-blue-600'
          : 'border-gray-300 hover:bg-gray-50 text-gray-700'
      ]"
    >
      {{ snapEnabled ? 'Snap: ON' : 'Snap: OFF' }}
    </button>

    <div class="w-px h-5 bg-gray-300" />

    <button
      id="btn-export-json"
      data-tooltip="Export JSON · Ctrl+S"
      data-tooltip-below
      @click="handleExportJSON"
      class="px-3 py-1.5 text-sm rounded border border-gray-300 hover:bg-gray-50
             text-gray-700 transition-colors"
    >
      Export JSON
    </button>
    <button
      id="btn-import-json"
      data-tooltip="Import JSON"
      data-tooltip-below
      @click="handleImportClick"
      class="px-3 py-1.5 text-sm rounded border border-gray-300 hover:bg-gray-50
             text-gray-700 transition-colors"
    >
      Import JSON
    </button>
    <input
      ref="importFileInput"
      type="file"
      accept=".json"
      class="hidden"
      @change="handleImportJSON"
    />
    <button
      id="btn-export-png"
      data-tooltip="Export PNG · Ctrl+Shift+S"
      data-tooltip-below
      @click="handleExportPNG"
      :disabled="isExporting"
      class="px-3 py-1.5 text-sm rounded border border-gray-300 hover:bg-gray-50
             text-gray-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
    >
      {{ isExporting ? 'Exporting…' : 'Export PNG' }}
    </button>

    <div class="w-px h-5 bg-gray-300" />

    <button
      id="btn-clear"
      data-tooltip="Clear All"
      data-tooltip-below
      @click="handleClearAll"
      class="px-3 py-1.5 text-sm rounded border border-red-300 text-red-600
             hover:bg-red-50 transition-colors"
    >
      Clear All
    </button>

    <div class="w-px h-5 bg-gray-300" />

    <button
      id="btn-help"
      data-tooltip="Keyboard shortcuts · ?"
      data-tooltip-below
      @click="toggleShortcuts"
      class="px-3 py-1.5 text-sm rounded border border-gray-300 hover:bg-gray-50
             text-gray-700 transition-colors font-bold"
    >
      ?
    </button>
  </header>

  <div id="shortcut-panel" v-show="showShortcuts">
    <div class="sp-header">
      <span>Keyboard shortcuts</span>
      <button
        @click="showShortcuts = false"
        class="text-gray-400 hover:text-gray-700 transition-colors leading-none"
      >✕</button>
    </div>
    <table class="sp-table">
      <tbody>
        <tr><td>Undo</td>        <td><kbd>Ctrl</kbd><kbd>Z</kbd></td></tr>
        <tr><td>Redo</td>        <td><kbd>Ctrl</kbd><kbd>Y</kbd> · <kbd>Ctrl</kbd><kbd>⇧</kbd><kbd>Z</kbd></td></tr>
        <tr><td>Delete item</td> <td><kbd>Del</kbd></td></tr>
        <tr><td>Rotate CW</td>   <td><kbd>R</kbd></td></tr>
        <tr><td>Rotate CCW</td>  <td><kbd>⇧</kbd><kbd>R</kbd></td></tr>
        <tr><td>Nudge item</td>  <td><kbd>↑</kbd><kbd>↓</kbd><kbd>←</kbd><kbd>→</kbd></td></tr>
        <tr><td>Deselect</td>    <td><kbd>Esc</kbd></td></tr>
        <tr><td>This panel</td>  <td><kbd>?</kbd></td></tr>
      </tbody>
    </table>
  </div>
</template>
