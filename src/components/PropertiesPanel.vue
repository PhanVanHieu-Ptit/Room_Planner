<script setup lang="ts">
import { reactive, computed, watch } from 'vue'
import { useFurnitureStore } from '@/stores/furnitureStore'
import { useHistoryStore } from '@/stores/historyStore'
import type { FurnitureItem } from '@/types'

const furnitureStore = useFurnitureStore()
const historyStore = useHistoryStore()

const TYPE_ICONS: Record<string, string> = {
  sofa: '🛋️',
  armchair: '🪑',
  table: '🪞',
  chair: '🪑',
  bed: '🛏️',
  desk: '🖥️',
  wardrobe: '🚪',
  bookshelf: '📚',
  tvstand: '📺',
}

const local = reactive({ name: '', x: 0, y: 0, width: 0, height: 0, rotation: 0, color: '#CCCCCC' })

watch(
  () => furnitureStore.selectedItem?.id,
  () => {
    const item = furnitureStore.selectedItem
    if (item) Object.assign(local, item)
  },
  { immediate: true }
)

let debounceTimer: ReturnType<typeof setTimeout> | null = null

function debouncedUpdate(patch: Partial<FurnitureItem>): void {
  const item = furnitureStore.selectedItem
  if (!item) return
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    furnitureStore.updateItem(item.id, patch)
  }, 150)
}

function commitChange(): void {
  if (debounceTimer) { clearTimeout(debounceTimer); debounceTimer = null }
  const item = furnitureStore.selectedItem
  if (!item) return
  furnitureStore.updateItem(item.id, { ...local })
  historyStore.saveSnapshot(furnitureStore.items)
}

function handleKeydown(e: KeyboardEvent): void {
  if (e.key === 'Enter') (e.target as HTMLElement).blur()
}

const selectedItem = computed(() => furnitureStore.selectedItem)

const itemIcon = computed(() => TYPE_ICONS[selectedItem.value?.type ?? ''] ?? '🪑')

const itemTypeLabel = computed(() => {
  const t = selectedItem.value?.type ?? ''
  return t.charAt(0).toUpperCase() + t.slice(1)
})

const labelField = computed({
  get: () => local.name,
  set: (v: string) => { local.name = v; debouncedUpdate({ name: v }) },
})

const xField = computed({
  get: () => local.x,
  set: (v: number) => { local.x = v; debouncedUpdate({ x: v }) },
})

const yField = computed({
  get: () => local.y,
  set: (v: number) => { local.y = v; debouncedUpdate({ y: v }) },
})

const widthField = computed({
  get: () => local.width,
  set: (v: number) => { local.width = v; debouncedUpdate({ width: v }) },
})

const heightField = computed({
  get: () => local.height,
  set: (v: number) => { local.height = v; debouncedUpdate({ height: v }) },
})

const rotationField = computed({
  get: () => local.rotation,
  set: (v: number) => { local.rotation = v; debouncedUpdate({ rotation: v }) },
})

const colorField = computed({
  get: () => local.color,
  set: (v: string) => { local.color = v; debouncedUpdate({ color: v }) },
})
</script>

<template>
  <aside class="bg-white border-l border-gray-200 p-4 flex flex-col gap-4 overflow-y-auto">

    <!-- No item selected -->
    <template v-if="!selectedItem">
      <div class="flex flex-col items-center justify-center flex-1 gap-3 text-gray-400 py-12">
        <span class="text-4xl select-none">🪑</span>
        <p class="text-sm font-medium">No item selected</p>
        <p class="text-xs text-center leading-relaxed">
          Click a furniture item on the canvas to edit its properties
        </p>
      </div>
    </template>

    <!-- Item editor -->
    <template v-else>

      <!-- Type badge -->
      <div class="flex items-center gap-2">
        <span class="px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-700 font-medium tracking-wide">
          {{ itemTypeLabel }}
        </span>
        <span v-if="selectedItem.locked" class="px-2 py-0.5 text-xs rounded-full bg-amber-100 text-amber-700 font-medium">
          Locked
        </span>
      </div>

      <!-- Rotation live preview -->
      <div class="flex justify-center items-center py-3 bg-gray-50 rounded-lg">
        <span
          class="text-5xl select-none transition-transform duration-150"
          :style="{ transform: `rotate(${local.rotation}deg)` }"
        >
          {{ itemIcon }}
        </span>
      </div>

      <!-- Label -->
      <div class="flex flex-col gap-1">
        <label class="text-xs text-gray-500">Label</label>
        <input
          type="text"
          v-model="labelField"
          @blur="commitChange"
          @keydown="handleKeydown"
          class="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-400"
        />
      </div>

      <!-- X / Y -->
      <div class="grid grid-cols-2 gap-2">
        <div class="flex flex-col gap-1">
          <label class="text-xs text-gray-500">X</label>
          <input
            type="number"
            v-model.number="xField"
            @blur="commitChange"
            @keydown="handleKeydown"
            class="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-400"
          />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-xs text-gray-500">Y</label>
          <input
            type="number"
            v-model.number="yField"
            @blur="commitChange"
            @keydown="handleKeydown"
            class="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-400"
          />
        </div>
      </div>

      <!-- Width / Height -->
      <div class="grid grid-cols-2 gap-2">
        <div class="flex flex-col gap-1">
          <label class="text-xs text-gray-500">Width</label>
          <input
            type="number"
            v-model.number="widthField"
            min="10"
            @blur="commitChange"
            @keydown="handleKeydown"
            class="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-400"
          />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-xs text-gray-500">Height</label>
          <input
            type="number"
            v-model.number="heightField"
            min="10"
            @blur="commitChange"
            @keydown="handleKeydown"
            class="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-400"
          />
        </div>
      </div>

      <!-- Rotation -->
      <div class="flex flex-col gap-1">
        <label class="text-xs text-gray-500">Rotation (°)</label>
        <div class="flex items-center gap-2">
          <input
            type="range"
            v-model.number="rotationField"
            min="0"
            max="360"
            class="flex-1 accent-blue-500"
            @change="commitChange"
          />
          <input
            type="number"
            v-model.number="rotationField"
            min="0"
            max="360"
            @blur="commitChange"
            @keydown="handleKeydown"
            class="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-400"
          />
        </div>
      </div>

      <!-- Color -->
      <div class="flex flex-col gap-1">
        <label class="text-xs text-gray-500">Color</label>
        <input
          type="color"
          v-model="colorField"
          @change="commitChange"
          class="w-full h-8 border border-gray-300 rounded cursor-pointer"
        />
      </div>

    </template>

  </aside>
</template>
