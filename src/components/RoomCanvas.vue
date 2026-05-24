<script setup lang="ts">
import { ref } from 'vue'
import { useFurnitureStore } from '@/stores/furnitureStore'
import { useHistoryStore } from '@/stores/historyStore'
import { useRoomStore } from '@/stores/roomStore'
import { useDragDrop } from '@/composables/useDragDrop'
import type { FurnitureItem, Position } from '@/types'

const furnitureStore = useFurnitureStore()
const historyStore = useHistoryStore()
const roomStore = useRoomStore()

const svgEl = ref<SVGSVGElement | null>(null)
const dragJustEnded = ref(false)

const { onPointerDown, onPointerMove, onPointerUp, isDragging } = useDragDrop(svgEl)

const emit = defineEmits<{
  'canvas-click': [position: Position]
}>()

function handleItemPointerDown(item: FurnitureItem, event: PointerEvent): void {
  event.stopPropagation()
  furnitureStore.selectItem(item.id)
  onPointerDown(item, event)
}

function handleCanvasMousedown(): void {
  furnitureStore.selectItem(null)
}

function handleCanvasClick(event: MouseEvent): void {
  if (dragJustEnded.value) {
    dragJustEnded.value = false
    return
  }
  if (!svgEl.value) return
  const pt = svgEl.value.createSVGPoint()
  pt.x = event.clientX
  pt.y = event.clientY
  const svgPos = pt.matrixTransform(svgEl.value.getScreenCTM()!.inverse())
  emit('canvas-click', { x: svgPos.x, y: svgPos.y })
}

function handlePointerUp(event: PointerEvent): void {
  if (!isDragging.value) return
  onPointerUp(event)
  historyStore.saveSnapshot(furnitureStore.items)
  dragJustEnded.value = true
}
</script>

<template>
  <div class="w-full h-full bg-gray-100 p-6 flex items-center justify-center overflow-hidden">
    <svg
      ref="svgEl"
      :viewBox="`-40 -40 ${roomStore.config.width + 80} ${roomStore.config.height + 80}`"
      style="width: 100%; height: 100%"
      preserveAspectRatio="xMidYMid meet"
      class="select-none"
      @pointermove="onPointerMove"
      @pointerup="handlePointerUp"
    >
      <defs>
        <pattern
          id="dot-grid"
          :width="roomStore.config.gridSize"
          :height="roomStore.config.gridSize"
          patternUnits="userSpaceOnUse"
        >
          <circle cx="0" cy="0" r="1" fill="#d1d5db" />
        </pattern>
        <filter id="room-shadow" x="-5%" y="-5%" width="110%" height="110%">
          <feDropShadow dx="0" dy="4" stdDeviation="8" flood-color="black" flood-opacity="0.18" />
        </filter>
      </defs>

      <!-- Shadow layer — SVG filter preserves document-order z-index unlike CSS filter -->
      <rect
        x="0"
        y="0"
        :width="roomStore.config.width"
        :height="roomStore.config.height"
        fill="white"
        filter="url(#room-shadow)"
        style="pointer-events: none"
      />

      <!-- Room background — captures empty-space clicks -->
      <rect
        x="0"
        y="0"
        :width="roomStore.config.width"
        :height="roomStore.config.height"
        :fill="roomStore.config.backgroundColor"
        @mousedown="handleCanvasMousedown"
        @click="handleCanvasClick"
      />

      <!-- Dotted grid overlay -->
      <rect
        x="0"
        y="0"
        :width="roomStore.config.width"
        :height="roomStore.config.height"
        fill="url(#dot-grid)"
        style="pointer-events: none"
      />

      <!-- Thick walls border -->
      <rect
        x="4"
        y="4"
        :width="roomStore.config.width - 8"
        :height="roomStore.config.height - 8"
        fill="none"
        stroke="#374151"
        stroke-width="8"
        style="pointer-events: none"
      />

      <!-- Dimension label — top wall (width) -->
      <text
        :x="roomStore.config.width / 2"
        y="-18"
        text-anchor="middle"
        font-size="13"
        fill="#6b7280"
        font-family="sans-serif"
        style="pointer-events: none"
      >{{ roomStore.config.width }} px</text>

      <!-- Dimension label — bottom wall (width) -->
      <text
        :x="roomStore.config.width / 2"
        :y="roomStore.config.height + 30"
        text-anchor="middle"
        font-size="13"
        fill="#6b7280"
        font-family="sans-serif"
        style="pointer-events: none"
      >{{ roomStore.config.width }} px</text>

      <!-- Dimension label — left wall (height), rotated -->
      <text
        x="-18"
        :y="roomStore.config.height / 2"
        text-anchor="middle"
        font-size="13"
        fill="#6b7280"
        font-family="sans-serif"
        :transform="`rotate(-90, -18, ${roomStore.config.height / 2})`"
        style="pointer-events: none"
      >{{ roomStore.config.height }} px</text>

      <!-- Dimension label — right wall (height), rotated -->
      <text
        :x="roomStore.config.width + 18"
        :y="roomStore.config.height / 2"
        text-anchor="middle"
        font-size="13"
        fill="#6b7280"
        font-family="sans-serif"
        :transform="`rotate(90, ${roomStore.config.width + 18}, ${roomStore.config.height / 2})`"
        style="pointer-events: none"
      >{{ roomStore.config.height }} px</text>

      <!-- Furniture items -->
      <g
        v-for="item in furnitureStore.items"
        :key="item.id"
        :transform="`translate(${item.x + item.width / 2}, ${item.y + item.height / 2}) rotate(${item.rotation}) translate(${-item.width / 2}, ${-item.height / 2})`"
        :style="{
          cursor: item.locked ? 'not-allowed' : isDragging ? 'grabbing' : 'grab',
          opacity: item.locked ? 0.75 : 1
        }"
        @pointerdown="(e) => handleItemPointerDown(item, e)"
      >
        <!-- Item body -->
        <rect
          x="0"
          y="0"
          :width="item.width"
          :height="item.height"
          :fill="item.color"
          rx="2"
          stroke="rgba(0,0,0,0.1)"
          stroke-width="1"
        />

        <!-- Selection ring -->
        <rect
          v-if="furnitureStore.selectedId === item.id"
          x="-2"
          y="-2"
          :width="item.width + 4"
          :height="item.height + 4"
          fill="none"
          stroke="#3b82f6"
          stroke-width="2"
          rx="3"
          style="pointer-events: none"
        />

        <!-- Name label -->
        <text
          :x="item.width / 2"
          :y="item.height / 2 + 4"
          text-anchor="middle"
          font-size="11"
          fill="white"
          font-weight="500"
          font-family="sans-serif"
          style="pointer-events: none"
        >{{ item.name }}</text>

        <!-- Corner indicator dot -->
        <circle
          :cx="item.width - 6"
          cy="6"
          r="3"
          fill="rgba(255,255,255,0.6)"
          stroke="rgba(255,255,255,0.8)"
          stroke-width="1"
          style="pointer-events: none"
        />
      </g>
    </svg>
  </div>
</template>
