<script setup lang="ts">
import { useFurnitureStore } from '@/stores/furnitureStore'
import { useRoomStore } from '@/stores/roomStore'
import type { FurnitureTemplate } from '@/types'

const furnitureStore = useFurnitureStore()
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
  const centerX = Math.round(roomStore.config.width / 2)
  const centerY = Math.round(roomStore.config.height / 2)
  furnitureStore.addItem(template.type, centerX, centerY)
}

function handleDragStart(template: FurnitureTemplate, e: DragEvent): void {
  furnitureStore.pendingDrag = { type: template.type, width: template.defaultWidth, height: template.defaultHeight }
  e.dataTransfer!.setData('text/plain', template.type)
  e.dataTransfer!.effectAllowed = 'copy'
  const ghost = document.createElement('div')
  ghost.textContent = template.icon
  ghost.style.cssText = 'position:fixed;top:-100px;left:-100px;font-size:32px;pointer-events:none'
  document.body.appendChild(ghost)
  e.dataTransfer!.setDragImage(ghost, 16, 16)
  requestAnimationFrame(() => document.body.removeChild(ghost))
}

function handleDragEnd(): void {
  furnitureStore.pendingDrag = null
}

let touchMoveHandler: ((e: TouchEvent) => void) | null = null
let touchEndHandler: ((e: TouchEvent) => void) | null = null

function handleTouchStart(template: FurnitureTemplate, e: TouchEvent): void {
  e.preventDefault()
  furnitureStore.pendingDrag = { type: template.type, width: template.defaultWidth, height: template.defaultHeight }

  touchMoveHandler = (ev: TouchEvent) => {
    ev.preventDefault()
    const touch = ev.touches[0]
    const el = document.elementFromPoint(touch.clientX, touch.clientY)
    const svg = el?.closest('[data-room-canvas]') as SVGSVGElement | null
    if (!svg) return
    const pt = svg.createSVGPoint()
    pt.x = touch.clientX
    pt.y = touch.clientY
    const svgPos = pt.matrixTransform(svg.getScreenCTM()!.inverse())
    const pd = furnitureStore.pendingDrag
    if (!pd) return
    const grid = roomStore.config.snapEnabled ? roomStore.config.gridSize : 1
    const snappedX = Math.max(0, Math.round((svgPos.x - pd.width / 2) / grid) * grid)
    const snappedY = Math.max(0, Math.round((svgPos.y - pd.height / 2) / grid) * grid)
    furnitureStore.pendingDrag = { ...pd, ghostX: snappedX, ghostY: snappedY } as typeof furnitureStore.pendingDrag & { ghostX: number; ghostY: number }
  }

  touchEndHandler = (ev: TouchEvent) => {
    const touch = ev.changedTouches[0]
    const el = document.elementFromPoint(touch.clientX, touch.clientY)
    const svg = el?.closest('[data-room-canvas]') as SVGSVGElement | null
    if (svg && furnitureStore.pendingDrag) {
      const pd = furnitureStore.pendingDrag as typeof furnitureStore.pendingDrag & { ghostX?: number; ghostY?: number }
      const x = pd.ghostX ?? Math.round(roomStore.config.width / 2)
      const y = pd.ghostY ?? Math.round(roomStore.config.height / 2)
      furnitureStore.addItem(pd.type, x, y)
    }
    furnitureStore.pendingDrag = null
    document.removeEventListener('touchmove', touchMoveHandler!, { capture: true } as EventListenerOptions)
    document.removeEventListener('touchend', touchEndHandler!)
    touchMoveHandler = null
    touchEndHandler = null
  }

  document.addEventListener('touchmove', touchMoveHandler, { passive: false, capture: true })
  document.addEventListener('touchend', touchEndHandler)
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
      draggable="true"
      @click="addToCenter(template)"
      @dragstart="handleDragStart(template, $event)"
      @dragend="handleDragEnd"
      @touchstart.prevent="handleTouchStart(template, $event)"
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
