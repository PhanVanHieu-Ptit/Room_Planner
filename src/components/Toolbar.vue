<script setup lang="ts">
import { ref } from 'vue'
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
</script>

<template>
  <header class="flex items-center gap-3 px-4 py-2 bg-white border-b border-gray-200 shadow-sm">
    <span class="text-lg font-bold text-gray-800 mr-4">Room Planner</span>

    <button
      :disabled="!historyStore.canUndo"
      @click="handleUndo"
      class="px-3 py-1.5 text-sm rounded border border-gray-300 hover:bg-gray-50
             disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      title="Undo"
    >
      Undo
    </button>
    <button
      :disabled="!historyStore.canRedo"
      @click="handleRedo"
      class="px-3 py-1.5 text-sm rounded border border-gray-300 hover:bg-gray-50
             disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      title="Redo"
    >
      Redo
    </button>

    <div class="w-px h-5 bg-gray-300" />

    <button
      @click="toggleSnap"
      :class="[
        'px-3 py-1.5 text-sm rounded border transition-colors',
        snapEnabled
          ? 'bg-blue-500 text-white border-blue-500 hover:bg-blue-600'
          : 'border-gray-300 hover:bg-gray-50 text-gray-700'
      ]"
      title="Toggle grid snap"
    >
      {{ snapEnabled ? 'Snap: ON' : 'Snap: OFF' }}
    </button>

    <div class="w-px h-5 bg-gray-300" />

    <button
      @click="handleExportJSON"
      class="px-3 py-1.5 text-sm rounded border border-gray-300 hover:bg-gray-50
             text-gray-700 transition-colors"
    >
      Export JSON
    </button>
    <button
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
      @click="handleExportPNG"
      :disabled="isExporting"
      class="px-3 py-1.5 text-sm rounded border border-gray-300 hover:bg-gray-50
             text-gray-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
    >
      {{ isExporting ? 'Exporting…' : 'Export PNG' }}
    </button>

    <div class="w-px h-5 bg-gray-300" />

    <button
      @click="handleClearAll"
      class="px-3 py-1.5 text-sm rounded border border-red-300 text-red-600
             hover:bg-red-50 transition-colors"
    >
      Clear All
    </button>
  </header>
</template>
