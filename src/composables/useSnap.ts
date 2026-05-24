import { computed } from 'vue'
import type { ComputedRef } from 'vue'
import { useRoomStore } from '@/stores/roomStore'
import type { Position } from '@/types'

export function useSnap(): {
  snapEnabled: ComputedRef<boolean>
  toggleSnap: () => void
  snapToGrid: (value: number, gridSize: number) => number
  snapPosition: (x: number, y: number, gridSize: number) => Position
} {
  const roomStore = useRoomStore()

  const snapEnabled = computed<boolean>(() => roomStore.config.snapEnabled)

  function toggleSnap(): void {
    roomStore.updateConfig({ snapEnabled: !roomStore.config.snapEnabled })
  }

  function snapToGrid(value: number, gridSize: number): number {
    return Math.round(value / gridSize) * gridSize
  }

  function snapPosition(x: number, y: number, gridSize: number): Position {
    if (!snapEnabled.value) return { x, y }
    return { x: snapToGrid(x, gridSize), y: snapToGrid(y, gridSize) }
  }

  return { snapEnabled, toggleSnap, snapToGrid, snapPosition }
}
