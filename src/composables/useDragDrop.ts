import { ref } from 'vue'
import type { Ref } from 'vue'
import type { DragState, FurnitureItem, Position } from '@/types'

export function useDragDrop(): {
  dragState: Ref<DragState>
  startDrag: (item: FurnitureItem, event: MouseEvent) => void
  onDragMove: (event: MouseEvent, canvasEl: HTMLElement) => Position | null
  endDrag: () => void
} {
  const dragState = ref<DragState>({
    isDragging: false,
    itemId: null,
    offsetX: 0,
    offsetY: 0
  })

  function startDrag(item: FurnitureItem, event: MouseEvent): void {
    event.preventDefault()
    const target = event.currentTarget as HTMLElement
    const rect = target.getBoundingClientRect()
    dragState.value = {
      isDragging: true,
      itemId: item.id,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top
    }
  }

  function onDragMove(event: MouseEvent, canvasEl: HTMLElement): Position | null {
    if (!dragState.value.isDragging) return null
    const canvasRect = canvasEl.getBoundingClientRect()
    return {
      x: event.clientX - canvasRect.left - dragState.value.offsetX,
      y: event.clientY - canvasRect.top - dragState.value.offsetY
    }
  }

  function endDrag(): void {
    dragState.value = { isDragging: false, itemId: null, offsetX: 0, offsetY: 0 }
  }

  return { dragState, startDrag, onDragMove, endDrag }
}
