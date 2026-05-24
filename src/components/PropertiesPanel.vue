<script setup lang="ts">
import { computed } from 'vue'
import { useFurnitureStore } from '@/stores/furnitureStore'
import { useHistoryStore } from '@/stores/historyStore'
import { useRoomStore } from '@/stores/roomStore'
import type { FurnitureItem, RoomConfig } from '@/types'

const furnitureStore = useFurnitureStore()
const historyStore = useHistoryStore()
const roomStore = useRoomStore()

const selectedItem = computed(() => furnitureStore.selectedItem)

function updateItemField<K extends keyof FurnitureItem>(field: K, value: FurnitureItem[K]): void {
  if (!selectedItem.value) return
  furnitureStore.updateItem(selectedItem.value.id, { [field]: value } as Partial<FurnitureItem>)
}

function commitItemChange(): void {
  historyStore.saveSnapshot(furnitureStore.items)
}

function updateRoomField<K extends keyof RoomConfig>(field: K, value: RoomConfig[K]): void {
  roomStore.updateConfig({ [field]: value } as Partial<RoomConfig>)
}

function handleDeleteItem(): void {
  if (!selectedItem.value) return
  furnitureStore.removeItem(selectedItem.value.id)
}

function handleToggleLock(): void {
  if (!selectedItem.value) return
  updateItemField('locked', !selectedItem.value.locked)
  commitItemChange()
}
</script>

<template>
  <aside class="bg-white border-l border-gray-200 p-4 flex flex-col gap-4">

    <!-- Item properties -->
    <template v-if="selectedItem">
      <h2 class="text-xs font-semibold text-gray-500 uppercase tracking-wider">
        Item Properties
      </h2>

      <div class="flex flex-col gap-1">
        <label class="text-xs text-gray-500">Name</label>
        <input
          type="text"
          :value="selectedItem.name"
          @change="(e) => { updateItemField('name', (e.target as HTMLInputElement).value); commitItemChange() }"
          class="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-400"
        />
      </div>

      <div class="grid grid-cols-2 gap-2">
        <div class="flex flex-col gap-1">
          <label class="text-xs text-gray-500">X</label>
          <input
            type="number"
            :value="selectedItem.x"
            @change="(e) => { updateItemField('x', Number((e.target as HTMLInputElement).value)); commitItemChange() }"
            class="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-400"
          />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-xs text-gray-500">Y</label>
          <input
            type="number"
            :value="selectedItem.y"
            @change="(e) => { updateItemField('y', Number((e.target as HTMLInputElement).value)); commitItemChange() }"
            class="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-400"
          />
        </div>
      </div>

      <div class="grid grid-cols-2 gap-2">
        <div class="flex flex-col gap-1">
          <label class="text-xs text-gray-500">Width</label>
          <input
            type="number"
            :value="selectedItem.width"
            @change="(e) => { updateItemField('width', Number((e.target as HTMLInputElement).value)); commitItemChange() }"
            class="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-400"
          />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-xs text-gray-500">Height</label>
          <input
            type="number"
            :value="selectedItem.height"
            @change="(e) => { updateItemField('height', Number((e.target as HTMLInputElement).value)); commitItemChange() }"
            class="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-400"
          />
        </div>
      </div>

      <div class="flex flex-col gap-1">
        <label class="text-xs text-gray-500">Rotation (°)</label>
        <input
          type="number"
          :value="selectedItem.rotation"
          min="-360"
          max="360"
          @change="(e) => { updateItemField('rotation', Number((e.target as HTMLInputElement).value)); commitItemChange() }"
          class="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-400"
        />
      </div>

      <div class="flex flex-col gap-1">
        <label class="text-xs text-gray-500">Color</label>
        <input
          type="color"
          :value="selectedItem.color"
          @change="(e) => { updateItemField('color', (e.target as HTMLInputElement).value); commitItemChange() }"
          class="w-full h-8 border border-gray-300 rounded cursor-pointer"
        />
      </div>

      <button
        @click="handleToggleLock"
        :class="[
          'w-full py-1.5 text-sm rounded border transition-colors',
          selectedItem.locked
            ? 'bg-amber-100 border-amber-400 text-amber-700'
            : 'border-gray-300 text-gray-600 hover:bg-gray-50'
        ]"
      >
        {{ selectedItem.locked ? 'Locked — Click to Unlock' : 'Unlocked — Click to Lock' }}
      </button>

      <button
        @click="handleDeleteItem"
        class="w-full py-1.5 text-sm rounded border border-red-300 text-red-600
               hover:bg-red-50 transition-colors mt-auto"
      >
        Delete Item
      </button>
    </template>

    <!-- Room properties -->
    <template v-else>
      <h2 class="text-xs font-semibold text-gray-500 uppercase tracking-wider">
        Room Properties
      </h2>

      <div class="flex flex-col gap-1">
        <label class="text-xs text-gray-500">Room Name</label>
        <input
          type="text"
          :value="roomStore.config.name"
          @change="(e) => updateRoomField('name', (e.target as HTMLInputElement).value)"
          class="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-400"
        />
      </div>

      <div class="grid grid-cols-2 gap-2">
        <div class="flex flex-col gap-1">
          <label class="text-xs text-gray-500">Width (px)</label>
          <input
            type="number"
            :value="roomStore.config.width"
            min="200"
            max="2000"
            @change="(e) => updateRoomField('width', Number((e.target as HTMLInputElement).value))"
            class="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-400"
          />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-xs text-gray-500">Height (px)</label>
          <input
            type="number"
            :value="roomStore.config.height"
            min="200"
            max="2000"
            @change="(e) => updateRoomField('height', Number((e.target as HTMLInputElement).value))"
            class="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-400"
          />
        </div>
      </div>

      <div class="flex flex-col gap-1">
        <label class="text-xs text-gray-500">Grid Size (px)</label>
        <input
          type="number"
          :value="roomStore.config.gridSize"
          min="5"
          max="100"
          step="5"
          @change="(e) => updateRoomField('gridSize', Number((e.target as HTMLInputElement).value))"
          class="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-400"
        />
      </div>

      <div class="flex flex-col gap-1">
        <label class="text-xs text-gray-500">Background Color</label>
        <input
          type="color"
          :value="roomStore.config.backgroundColor"
          @change="(e) => updateRoomField('backgroundColor', (e.target as HTMLInputElement).value)"
          class="w-full h-8 border border-gray-300 rounded cursor-pointer"
        />
      </div>
    </template>

  </aside>
</template>
