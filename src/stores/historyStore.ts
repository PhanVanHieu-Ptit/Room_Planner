import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { FurnitureItem, HistoryEntry } from '@/types'

const MAX_HISTORY = 50

export const useHistoryStore = defineStore('history', () => {
  const entries = ref<HistoryEntry[]>([])
  const cursor = ref<number>(-1)

  const canUndo = computed<boolean>(() => cursor.value > 0)
  const canRedo = computed<boolean>(() => cursor.value < entries.value.length - 1)

  function snapshot(items: FurnitureItem[]): void {
    entries.value = entries.value.slice(0, cursor.value + 1)
    entries.value.push({
      items: items.map(item => ({ ...item })),
      timestamp: Date.now()
    })
    if (entries.value.length > MAX_HISTORY) {
      entries.value.shift()
    } else {
      cursor.value = entries.value.length - 1
    }
  }

  function undo(): FurnitureItem[] | null {
    if (!canUndo.value) return null
    cursor.value -= 1
    return entries.value[cursor.value].items.map(item => ({ ...item }))
  }

  function redo(): FurnitureItem[] | null {
    if (!canRedo.value) return null
    cursor.value += 1
    return entries.value[cursor.value].items.map(item => ({ ...item }))
  }

  function clear(): void {
    entries.value = []
    cursor.value = -1
  }

  return { entries, cursor, canUndo, canRedo, snapshot, undo, redo, clear }
})
