import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { FurnitureItem } from '@/types'

const MAX_HISTORY = 50

export const useHistoryStore = defineStore('history', () => {
  const past = ref<FurnitureItem[][]>([])
  const future = ref<FurnitureItem[][]>([])

  const canUndo = computed<boolean>(() => past.value.length > 0)
  const canRedo = computed<boolean>(() => future.value.length > 0)

  function saveSnapshot(items: FurnitureItem[]): void {
    past.value.push(structuredClone(items))
    future.value = []
    if (past.value.length > MAX_HISTORY) past.value.shift()
  }

  function undo(): FurnitureItem[] | null {
    if (!canUndo.value) return null
    const current = past.value.pop()!
    future.value.push(current)
    return past.value.length > 0
      ? structuredClone(past.value[past.value.length - 1])
      : []
  }

  function redo(): FurnitureItem[] | null {
    if (!canRedo.value) return null
    const next = future.value.pop()!
    past.value.push(next)
    return structuredClone(next)
  }

  function clear(): void {
    past.value = []
    future.value = []
  }

  return { past, future, canUndo, canRedo, saveSnapshot, undo, redo, clear }
})
