<script setup lang="ts">
import { ref, computed } from 'vue'
import { useEventListener } from '@vueuse/core'
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

const { onPointerDown, onPointerMove, onPointerUp, isDragging, toSVGCoords } = useDragDrop(svgEl)

const emit = defineEmits<{
  'canvas-click': [position: Position]
}>()

// ── Feature 1: Sidebar drag-drop ghost ──────────────────────────────────────
const ghostX = ref(0)
const ghostY = ref(0)
const ghostValid = ref(false)
const isOverCanvas = ref(false)

function snapValue(v: number): number {
  const g = roomStore.config.snapEnabled ? roomStore.config.gridSize : 1
  return Math.round(v / g) * g
}

function isInsideRoom(x: number, y: number, w: number, h: number): boolean {
  return x >= 0 && y >= 0 && x + w <= roomStore.config.width && y + h <= roomStore.config.height
}

function hasOverlapWithExisting(x: number, y: number, w: number, h: number): boolean {
  return furnitureStore.items.some(
    item => !(x + w <= item.x || x >= item.x + item.width || y + h <= item.y || y >= item.y + item.height)
  )
}

function handleDragOver(e: DragEvent): void {
  e.preventDefault()
  if (!svgEl.value || !furnitureStore.pendingDrag) return
  const svgPos = toSVGCoords(e.clientX, e.clientY)
  const { width, height } = furnitureStore.pendingDrag
  ghostX.value = Math.max(0, Math.min(snapValue(svgPos.x - width / 2), roomStore.config.width - width))
  ghostY.value = Math.max(0, Math.min(snapValue(svgPos.y - height / 2), roomStore.config.height - height))
  ghostValid.value =
    isInsideRoom(ghostX.value, ghostY.value, width, height) &&
    !hasOverlapWithExisting(ghostX.value, ghostY.value, width, height)
  isOverCanvas.value = true
}

function handleDrop(e: DragEvent): void {
  e.preventDefault()
  if (!furnitureStore.pendingDrag || !ghostValid.value) return
  furnitureStore.addItem(furnitureStore.pendingDrag.type, ghostX.value, ghostY.value)
  isOverCanvas.value = false
  furnitureStore.pendingDrag = null
}

function handleDragLeave(e: DragEvent): void {
  if (!svgEl.value?.contains(e.relatedTarget as Node)) {
    isOverCanvas.value = false
  }
}

// Also handle touch ghost from FurniturePanel touch drag
const touchGhost = computed(() => {
  const pd = furnitureStore.pendingDrag as (typeof furnitureStore.pendingDrag & { ghostX?: number; ghostY?: number }) | null
  if (!pd || pd.ghostX === undefined || pd.ghostY === undefined) return null
  return { x: pd.ghostX, y: pd.ghostY, width: pd.width, height: pd.height }
})

// ── Feature 2: Rotate handle ─────────────────────────────────────────────────
const rotatingId = ref<string | null>(null)
const rotatePivotX = ref(0)
const rotatePivotY = ref(0)
const rotateStartAngle = ref(0)
const rotateInitialRotation = ref(0)
const liveAngleDeg = ref<number | null>(null)

function handleRotatePointerDown(item: FurnitureItem, e: PointerEvent): void {
  e.preventDefault()
  if (!svgEl.value) return
  const cx = item.x + item.width / 2
  const cy = item.y + item.height / 2
  const svgPos = toSVGCoords(e.clientX, e.clientY)
  rotatePivotX.value = cx
  rotatePivotY.value = cy
  rotateStartAngle.value = Math.atan2(svgPos.y - cy, svgPos.x - cx)
  rotateInitialRotation.value = item.rotation
  rotatingId.value = item.id
  ;(e.target as Element).setPointerCapture(e.pointerId)
}

function handleRotatePointerMove(e: PointerEvent): void {
  if (!rotatingId.value || !svgEl.value) return
  const svgPos = toSVGCoords(e.clientX, e.clientY)
  const angle = Math.atan2(svgPos.y - rotatePivotY.value, svgPos.x - rotatePivotX.value)
  let deg = ((angle - rotateStartAngle.value) * 180 / Math.PI) + rotateInitialRotation.value
  deg = ((deg % 360) + 360) % 360
  if (e.shiftKey) deg = Math.round(deg / 15) * 15
  liveAngleDeg.value = Math.round(deg)
  furnitureStore.updateItem(rotatingId.value, { rotation: deg })
}

function handleRotatePointerUp(): void {
  if (!rotatingId.value) return
  historyStore.saveSnapshot(furnitureStore.items)
  rotatingId.value = null
  liveAngleDeg.value = null
}

function buildArcPath(w: number, h: number): string {
  const r = Math.max(w, h) / 2 + 10
  const cx = w / 2
  const cy = h / 2
  const endRad = ((liveAngleDeg.value ?? 0) - 90) * Math.PI / 180
  const ex = cx + r * Math.cos(endRad)
  const ey = cy + r * Math.sin(endRad)
  const large = Math.abs(liveAngleDeg.value ?? 0) > 180 ? 1 : 0
  return `M ${cx} ${cy - r} A ${r} ${r} 0 ${large} 1 ${ex} ${ey}`
}

// ── Feature 3: Delete ────────────────────────────────────────────────────────
const deletingIds = ref<Set<string>>(new Set())
const contextMenuPos = ref<{ x: number; y: number } | null>(null)
const contextMenuItemId = ref<string | null>(null)

function deleteItemsWithAnimation(ids: string[]): void {
  if (ids.length === 0) return
  historyStore.saveSnapshot(furnitureStore.items)
  const toDelete = [...ids]
  toDelete.forEach(id => deletingIds.value = new Set([...deletingIds.value, id]))
  setTimeout(() => {
    if (toDelete.length === 1) furnitureStore.removeItemSilent(toDelete[0])
    else furnitureStore.removeItemsSilent(toDelete)
    const next = new Set(deletingIds.value)
    toDelete.forEach(id => next.delete(id))
    deletingIds.value = next
  }, 150)
}

function handleContextMenu(item: FurnitureItem, e: MouseEvent): void {
  furnitureStore.selectItem(item.id)
  contextMenuPos.value = { x: e.clientX, y: e.clientY }
  contextMenuItemId.value = item.id
}

function handleContextMenuDelete(): void {
  if (contextMenuItemId.value) deleteItemsWithAnimation([contextMenuItemId.value])
  contextMenuPos.value = null
  contextMenuItemId.value = null
}

useEventListener(document, 'click', () => {
  contextMenuPos.value = null
  contextMenuItemId.value = null
})

// Keyboard: Delete/Backspace
useEventListener(window, 'keydown', (e: KeyboardEvent) => {
  const tag = (e.target as Element)?.tagName ?? ''
  if (tag === 'INPUT' || tag === 'TEXTAREA') return
  if (e.key === 'Delete' || e.key === 'Backspace') {
    e.preventDefault()
    const ids =
      furnitureStore.selectedIds.length > 0
        ? [...furnitureStore.selectedIds]
        : furnitureStore.selectedId
          ? [furnitureStore.selectedId]
          : []
    deleteItemsWithAnimation(ids)
  }
})

// ── Multi-select tooltip ─────────────────────────────────────────────────────
const multiSelectTooltip = computed(() => {
  const n = furnitureStore.selectedIds.length
  return n >= 3 ? `Delete ${n} items? Press Del` : null
})

// ── Drag-select box ──────────────────────────────────────────────────────────
const selectBoxStart = ref<{ x: number; y: number } | null>(null)
const selectBoxCurrent = ref<{ x: number; y: number } | null>(null)

const selectBoxRect = computed(() => {
  if (!selectBoxStart.value || !selectBoxCurrent.value) return null
  const x = Math.min(selectBoxStart.value.x, selectBoxCurrent.value.x)
  const y = Math.min(selectBoxStart.value.y, selectBoxCurrent.value.y)
  const w = Math.abs(selectBoxCurrent.value.x - selectBoxStart.value.x)
  const h = Math.abs(selectBoxCurrent.value.y - selectBoxStart.value.y)
  return { x, y, width: w, height: h }
})

function completeDragSelect(): void {
  const box = selectBoxRect.value
  if (!box || (box.width < 5 && box.height < 5)) return
  const ids = furnitureStore.items
    .filter(item =>
      item.x >= box.x && item.y >= box.y &&
      item.x + item.width <= box.x + box.width &&
      item.y + item.height <= box.y + box.height
    )
    .map(item => item.id)
  if (ids.length > 0) furnitureStore.setSelectedIds(ids)
}

// ── Existing handlers (modified) ─────────────────────────────────────────────
function handleItemPointerDown(item: FurnitureItem, event: PointerEvent): void {
  event.stopPropagation()
  if (event.shiftKey) {
    furnitureStore.addToSelection(item.id)
  } else {
    furnitureStore.selectItem(item.id)
    onPointerDown(item, event)
  }
}

function handleCanvasPointerDown(event: PointerEvent): void {
  furnitureStore.selectItem(null)
  if (!svgEl.value) return
  const svgPos = toSVGCoords(event.clientX, event.clientY)
  selectBoxStart.value = svgPos
  selectBoxCurrent.value = svgPos
}

function handlePointerMove(event: PointerEvent): void {
  onPointerMove(event)
  if (rotatingId.value) handleRotatePointerMove(event)
  if (selectBoxStart.value && !isDragging.value) {
    selectBoxCurrent.value = toSVGCoords(event.clientX, event.clientY)
  }
}

function handlePointerUp(event: PointerEvent): void {
  if (rotatingId.value) {
    handleRotatePointerUp()
    return
  }
  if (isDragging.value) {
    onPointerUp(event)
    historyStore.saveSnapshot(furnitureStore.items)
    dragJustEnded.value = true
  }
  if (selectBoxStart.value) {
    completeDragSelect()
    selectBoxStart.value = null
    selectBoxCurrent.value = null
  }
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
</script>

<template>
  <div class="relative w-full h-full bg-gray-100 p-6 flex items-center justify-center overflow-hidden">
    <svg
      ref="svgEl"
      data-room-canvas
      :viewBox="`-40 -40 ${roomStore.config.width + 80} ${roomStore.config.height + 80}`"
      style="width: 100%; height: 100%"
      preserveAspectRatio="xMidYMid meet"
      class="select-none"
      @pointermove="handlePointerMove"
      @pointerup="handlePointerUp"
      @dragover="handleDragOver"
      @drop="handleDrop"
      @dragleave="handleDragLeave"
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

      <!-- Shadow layer -->
      <rect
        x="0" y="0"
        :width="roomStore.config.width"
        :height="roomStore.config.height"
        fill="white"
        filter="url(#room-shadow)"
        style="pointer-events: none"
      />

      <!-- Room background — captures empty-space clicks -->
      <rect
        x="0" y="0"
        :width="roomStore.config.width"
        :height="roomStore.config.height"
        :fill="roomStore.config.backgroundColor"
        @pointerdown="handleCanvasPointerDown"
        @click="handleCanvasClick"
      />

      <!-- Dotted grid overlay -->
      <rect
        x="0" y="0"
        :width="roomStore.config.width"
        :height="roomStore.config.height"
        fill="url(#dot-grid)"
        style="pointer-events: none"
      />

      <!-- Thick walls border -->
      <rect
        x="4" y="4"
        :width="roomStore.config.width - 8"
        :height="roomStore.config.height - 8"
        fill="none"
        stroke="#374151"
        stroke-width="8"
        style="pointer-events: none"
      />

      <!-- Dimension labels -->
      <text :x="roomStore.config.width / 2" y="-18" text-anchor="middle" font-size="13" fill="#6b7280" font-family="sans-serif" style="pointer-events: none">{{ roomStore.config.width }} px</text>
      <text :x="roomStore.config.width / 2" :y="roomStore.config.height + 30" text-anchor="middle" font-size="13" fill="#6b7280" font-family="sans-serif" style="pointer-events: none">{{ roomStore.config.width }} px</text>
      <text x="-18" :y="roomStore.config.height / 2" text-anchor="middle" font-size="13" fill="#6b7280" font-family="sans-serif" :transform="`rotate(-90, -18, ${roomStore.config.height / 2})`" style="pointer-events: none">{{ roomStore.config.height }} px</text>
      <text :x="roomStore.config.width + 18" :y="roomStore.config.height / 2" text-anchor="middle" font-size="13" fill="#6b7280" font-family="sans-serif" :transform="`rotate(90, ${roomStore.config.width + 18}, ${roomStore.config.height / 2})`" style="pointer-events: none">{{ roomStore.config.height }} px</text>

      <!-- Sidebar drag ghost preview -->
      <rect
        v-if="isOverCanvas && furnitureStore.pendingDrag"
        :x="ghostX" :y="ghostY"
        :width="furnitureStore.pendingDrag.width"
        :height="furnitureStore.pendingDrag.height"
        :fill="ghostValid ? 'rgba(34,197,94,0.25)' : 'rgba(239,68,68,0.25)'"
        :stroke="ghostValid ? '#16a34a' : '#dc2626'"
        stroke-width="1.5"
        stroke-dasharray="4,3"
        rx="2"
        style="pointer-events: none"
      />

      <!-- Touch drag ghost preview -->
      <rect
        v-if="touchGhost"
        :x="touchGhost.x" :y="touchGhost.y"
        :width="touchGhost.width" :height="touchGhost.height"
        fill="rgba(34,197,94,0.25)"
        stroke="#16a34a"
        stroke-width="1.5"
        stroke-dasharray="4,3"
        rx="2"
        style="pointer-events: none"
      />

      <!-- Drag-select box -->
      <rect
        v-if="selectBoxRect"
        :x="selectBoxRect.x" :y="selectBoxRect.y"
        :width="selectBoxRect.width" :height="selectBoxRect.height"
        fill="rgba(59,130,246,0.08)"
        stroke="#3b82f6"
        stroke-width="1"
        stroke-dasharray="4,3"
        style="pointer-events: none"
      />

      <!-- Multi-select tooltip -->
      <text
        v-if="multiSelectTooltip"
        :x="roomStore.config.width / 2"
        y="-28"
        text-anchor="middle"
        font-size="12"
        fill="#6366f1"
        font-family="sans-serif"
        style="pointer-events: none"
      >{{ multiSelectTooltip }}</text>

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
        @contextmenu.prevent="(e) => handleContextMenu(item, e)"
      >
        <!-- Animation wrapper: CSS transforms here don't interfere with the parent SVG transform -->
        <g :class="{ 'item-deleting': deletingIds.has(item.id) }">
          <!-- Item body -->
          <rect
            x="0" y="0"
            :width="item.width"
            :height="item.height"
            :fill="item.color"
            rx="2"
            stroke="rgba(0,0,0,0.1)"
            stroke-width="1"
          />

          <!-- Primary selection ring -->
          <rect
            v-if="furnitureStore.selectedId === item.id"
            x="-2" y="-2"
            :width="item.width + 4"
            :height="item.height + 4"
            fill="none"
            stroke="#3b82f6"
            stroke-width="2"
            rx="3"
            style="pointer-events: none"
          />

          <!-- Multi-select ring (secondary items) -->
          <rect
            v-else-if="furnitureStore.selectedIds.includes(item.id)"
            x="-2" y="-2"
            :width="item.width + 4"
            :height="item.height + 4"
            fill="none"
            stroke="#3b82f6"
            stroke-width="1.5"
            stroke-dasharray="5,3"
            rx="3"
            opacity="0.7"
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

          <!-- Rotate handle (selected item only) -->
          <template v-if="furnitureStore.selectedId === item.id">
            <!-- Dashed connector line -->
            <line
              :x1="item.width / 2" y1="0"
              :x2="item.width / 2" y2="-20"
              stroke="#6366f1"
              stroke-width="1"
              stroke-dasharray="3,2"
              style="pointer-events: none"
            />
            <!-- Handle circle -->
            <circle
              :cx="item.width / 2" cy="-20" r="6"
              fill="white"
              stroke="#6366f1"
              stroke-width="1.5"
              style="cursor: crosshair"
              @pointerdown.stop="(e) => handleRotatePointerDown(item, e)"
            />
            <!-- Live arc overlay (only during active rotation) -->
            <path
              v-if="rotatingId === item.id && liveAngleDeg !== null"
              :d="buildArcPath(item.width, item.height)"
              fill="none"
              stroke="#6366f1"
              stroke-width="1"
              opacity="0.4"
              style="pointer-events: none"
            />
            <!-- Live angle tooltip -->
            <text
              v-if="rotatingId === item.id && liveAngleDeg !== null"
              :x="item.width / 2" y="-34"
              text-anchor="middle"
              font-size="10"
              fill="#6366f1"
              font-family="sans-serif"
              style="pointer-events: none"
            >{{ liveAngleDeg }}°</text>
          </template>

          <!-- Delete toolbar button (selected item only) -->
          <g
            v-if="furnitureStore.selectedId === item.id"
            :transform="`translate(${item.width / 2}, ${item.y < 50 ? item.height + 16 : -24})`"
            style="cursor: pointer"
            @click.stop="deleteItemsWithAnimation([item.id])"
          >
            <rect x="-14" y="-10" width="28" height="20" rx="4" fill="white" stroke="#ef4444" stroke-width="1.5" />
            <text text-anchor="middle" dy="4" font-size="11" fill="#ef4444" font-family="sans-serif">✕</text>
          </g>
        </g>
      </g>
    </svg>

    <!-- Right-click context menu -->
    <div
      v-if="contextMenuPos"
      class="fixed z-50 bg-white border border-gray-200 rounded shadow-lg py-1 text-sm"
      :style="{ left: contextMenuPos.x + 'px', top: contextMenuPos.y + 'px' }"
      @click.stop
    >
      <button
        class="w-full text-left px-3 py-1.5 text-red-600 hover:bg-red-50 transition-colors"
        @click="handleContextMenuDelete"
      >Delete item</button>
    </div>
  </div>
</template>

<style scoped>
.item-deleting {
  opacity: 0;
  transform: scale(0.8);
  transition: opacity 150ms ease, transform 150ms ease;
  transform-box: fill-box;
  transform-origin: 50% 50%;
  pointer-events: none;
}
</style>
