<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useFurnitureStore } from '@/stores/furnitureStore'
import { useHistoryStore } from '@/stores/historyStore'
import { useRoomStore } from '@/stores/roomStore'
import { useDragDrop } from '@/composables/useDragDrop'
import { useSnap } from '@/composables/useSnap'
import type { FurnitureItem } from '@/types'

const furnitureStore = useFurnitureStore()
const historyStore = useHistoryStore()
const roomStore = useRoomStore()
const { dragState, startDrag, onDragMove, endDrag } = useDragDrop()
const { snapPosition } = useSnap()

const canvasEl = ref<HTMLElement | null>(null)

const canvasStyle = computed(() => ({
  width: `${roomStore.config.width}px`,
  height: `${roomStore.config.height}px`,
  backgroundColor: roomStore.config.backgroundColor,
  '--grid-size': `${roomStore.config.gridSize}px`
}))

function getItemStyle(item: FurnitureItem): Record<string, string> {
  return {
    left: `${item.x}px`,
    top: `${item.y}px`,
    width: `${item.width}px`,
    height: `${item.height}px`,
    backgroundColor: item.color,
    transform: `rotate(${item.rotation}deg)`,
    transformOrigin: 'center center',
    cursor: item.locked ? 'not-allowed' : dragState.value.isDragging ? 'grabbing' : 'grab',
    zIndex: furnitureStore.selectedId === item.id ? '10' : '1'
  }
}

function handleItemMousedown(item: FurnitureItem, event: MouseEvent): void {
  if (item.locked) return
  event.stopPropagation()
  furnitureStore.selectItem(item.id)
  startDrag(item, event)
}

function handleCanvasMousedown(): void {
  furnitureStore.selectItem(null)
}

function handleMousemove(event: MouseEvent): void {
  if (!dragState.value.isDragging || !canvasEl.value) return
  const rawPos = onDragMove(event, canvasEl.value)
  if (!rawPos) return

  const snapped = snapPosition(rawPos.x, rawPos.y, roomStore.config.gridSize)
  const item = furnitureStore.items.find(i => i.id === dragState.value.itemId)
  if (!item) return

  const clampedX = Math.max(0, Math.min(snapped.x, roomStore.config.width - item.width))
  const clampedY = Math.max(0, Math.min(snapped.y, roomStore.config.height - item.height))
  furnitureStore.updateItem(item.id, { x: clampedX, y: clampedY })
}

function handleMouseup(): void {
  if (dragState.value.isDragging) {
    endDrag()
    historyStore.snapshot([...furnitureStore.items])
  }
}

onMounted(() => {
  window.addEventListener('mousemove', handleMousemove)
  window.addEventListener('mouseup', handleMouseup)
})

onUnmounted(() => {
  window.removeEventListener('mousemove', handleMousemove)
  window.removeEventListener('mouseup', handleMouseup)
})
</script>

<template>
  <div class="flex-1 overflow-auto bg-gray-100 p-6 flex items-start justify-center">
    <div
      ref="canvasEl"
      data-room-canvas
      :style="canvasStyle"
      class="canvas-grid relative select-none shadow-lg border border-gray-300 flex-shrink-0"
      @mousedown.self="handleCanvasMousedown"
    >
      <div
        v-for="item in furnitureStore.items"
        :key="item.id"
        :style="getItemStyle(item)"
        class="absolute flex flex-col items-center justify-center overflow-hidden border border-black/10"
        :class="{
          'ring-2 ring-blue-500': furnitureStore.selectedId === item.id,
          'opacity-75': item.locked
        }"
        @mousedown="(e) => handleItemMousedown(item, e)"
      >
        <span class="text-xs font-medium text-white drop-shadow text-center px-1 leading-tight pointer-events-none">
          {{ item.name }}
        </span>
        <div class="absolute top-0.5 right-0.5 w-3 h-3 rounded-full bg-white/60 border border-white/80 pointer-events-none" />
      </div>
    </div>
  </div>
</template>
