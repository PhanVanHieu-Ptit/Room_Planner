<script setup lang="ts">
import { useFurnitureStore } from '@/stores/furnitureStore'
import { useHistoryStore } from '@/stores/historyStore'
import { useRoomStore } from '@/stores/roomStore'
import type { FurnitureTemplate } from '@/types'

const furnitureStore = useFurnitureStore()
const historyStore = useHistoryStore()
const roomStore = useRoomStore()

const templates: FurnitureTemplate[] = [
  { type: 'sofa',      name: 'Sofa',         defaultWidth: 180, defaultHeight: 80,  color: '#8B7355', icon: '🛋️' },
  { type: 'armchair',  name: 'Armchair',     defaultWidth: 80,  defaultHeight: 80,  color: '#A0845C', icon: '🪑' },
  { type: 'table',     name: 'Dining Table', defaultWidth: 160, defaultHeight: 90,  color: '#D4A373', icon: '🪞' },
  { type: 'chair',     name: 'Chair',        defaultWidth: 60,  defaultHeight: 60,  color: '#C9B99A', icon: '🪑' },
  { type: 'bed',       name: 'Queen Bed',    defaultWidth: 160, defaultHeight: 200, color: '#B8C4BB', icon: '🛏️' },
  { type: 'desk',      name: 'Desk',         defaultWidth: 120, defaultHeight: 60,  color: '#E8D5B7', icon: '🖥️' },
  { type: 'wardrobe',  name: 'Wardrobe',     defaultWidth: 200, defaultHeight: 60,  color: '#9B8B7A', icon: '🚪' },
  { type: 'bookshelf', name: 'Bookshelf',    defaultWidth: 120, defaultHeight: 30,  color: '#8B6914', icon: '📚' },
  { type: 'tvstand',   name: 'TV Stand',     defaultWidth: 150, defaultHeight: 40,  color: '#6B7280', icon: '📺' }
]

function addToCenter(template: FurnitureTemplate): void {
  const centerX = Math.round(roomStore.config.width / 2 - template.defaultWidth / 2)
  const centerY = Math.round(roomStore.config.height / 2 - template.defaultHeight / 2)
  furnitureStore.addItem({
    name: template.name,
    type: template.type,
    x: centerX,
    y: centerY,
    width: template.defaultWidth,
    height: template.defaultHeight,
    rotation: 0,
    color: template.color,
    locked: false
  })
  historyStore.snapshot([...furnitureStore.items])
}
</script>

<template>
  <aside class="bg-white border-r border-gray-200 p-3 flex flex-col gap-2">
    <h2 class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
      Furniture
    </h2>

    <button
      v-for="template in templates"
      :key="template.type"
      @click="addToCenter(template)"
      class="flex flex-col items-center gap-1 p-2 rounded-lg border border-gray-200
             hover:border-blue-400 hover:bg-blue-50 transition-all cursor-pointer text-center group"
    >
      <span class="text-2xl">{{ template.icon }}</span>
      <span class="text-xs text-gray-600 group-hover:text-blue-600 leading-tight">
        {{ template.name }}
      </span>
      <span class="text-xs text-gray-400">
        {{ template.defaultWidth }}×{{ template.defaultHeight }}
      </span>
    </button>
  </aside>
</template>
