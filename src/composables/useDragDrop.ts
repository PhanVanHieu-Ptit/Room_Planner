import { ref, computed } from 'vue'
import type { Ref, ComputedRef } from 'vue'
import type { FurnitureItem } from '@/types'
import { useFurnitureStore } from '@/stores/furnitureStore'
import { useRoomStore } from '@/stores/roomStore'

interface DragState {
  itemId: string | null
  itemWidth: number
  itemHeight: number
  offsetX: number
  offsetY: number
}

const IDLE: DragState = { itemId: null, itemWidth: 0, itemHeight: 0, offsetX: 0, offsetY: 0 }

export function useDragDrop(svgRef: Ref<SVGSVGElement | null>): {
  onPointerDown: (item: FurnitureItem, event: PointerEvent) => void
  onPointerMove: (event: PointerEvent) => void
  onPointerUp: (event: PointerEvent) => void
  isDragging: ComputedRef<boolean>
  toSVGCoords: (clientX: number, clientY: number) => { x: number; y: number }
} {
  const furnitureStore = useFurnitureStore()
  const roomStore = useRoomStore()

  const dragState = ref<DragState>({ ...IDLE })
  const isDragging = computed(() => dragState.value.itemId !== null)

  function toSVGCoords(clientX: number, clientY: number) {
    const svg = svgRef.value!
    const pt = svg.createSVGPoint()
    pt.x = clientX
    pt.y = clientY
    return pt.matrixTransform(svg.getScreenCTM()!.inverse())
  }

  function onPointerDown(item: FurnitureItem, event: PointerEvent): void {
    if (item.locked || !svgRef.value) return
    event.preventDefault()
    const svgPos = toSVGCoords(event.clientX, event.clientY)
    dragState.value = {
      itemId: item.id,
      itemWidth: item.width,
      itemHeight: item.height,
      offsetX: svgPos.x - item.x,
      offsetY: svgPos.y - item.y,
    }
    ;(event.target as Element).setPointerCapture(event.pointerId)
  }

  function onPointerMove(event: PointerEvent): void {
    const { itemId, itemWidth, itemHeight, offsetX, offsetY } = dragState.value
    if (!itemId) return
    const svgPos = toSVGCoords(event.clientX, event.clientY)
    const { width: roomW, height: roomH, snapEnabled, gridSize } = roomStore.config
    const rawX = svgPos.x - offsetX
    const rawY = svgPos.y - offsetY
    const snap = (v: number) => snapEnabled ? Math.round(v / gridSize) * gridSize : v
    const x = Math.max(0, Math.min(snap(rawX), roomW - itemWidth))
    const y = Math.max(0, Math.min(snap(rawY), roomH - itemHeight))
    furnitureStore.updateItem(itemId, { x, y })
  }

  function onPointerUp(_event: PointerEvent): void {
    dragState.value = { ...IDLE }
  }

  return { onPointerDown, onPointerMove, onPointerUp, isDragging, toSVGCoords }
}
