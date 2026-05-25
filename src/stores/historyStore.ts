import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { FurnitureItem } from '@/types'

const MAX_HISTORY = 50

export const useHistoryStore = defineStore('history', () => {
  const historyStack = ref<FurnitureItem[][]>([])
  const redoStack = ref<FurnitureItem[][]>([])

  const canUndo = computed<boolean>(() => historyStack.value.length > 0)
  const canRedo = computed<boolean>(() => redoStack.value.length > 0)

  function saveSnapshot(items: FurnitureItem[]): void {
    historyStack.value.push(JSON.parse(JSON.stringify(items)))
    redoStack.value = []
    if (historyStack.value.length > MAX_HISTORY) historyStack.value.shift()
  }

  function undo(): FurnitureItem[] | null {
    if (!canUndo.value) return null
    const current = historyStack.value.pop()!
    redoStack.value.push(current)
    return historyStack.value.length > 0
      ? JSON.parse(JSON.stringify(historyStack.value[historyStack.value.length - 1]))
      : []
  }

  function redo(): FurnitureItem[] | null {
    if (!canRedo.value) return null
    const next = redoStack.value.pop()!
    historyStack.value.push(next)
    return JSON.parse(JSON.stringify(next))
  }

  function clear(): void {
    historyStack.value = []
    redoStack.value = []
  }

  return { historyStack, redoStack, canUndo, canRedo, saveSnapshot, undo, redo, clear }
})
