import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { FurnitureItem } from '@/types'

export const useFurnitureStore = defineStore('furniture', () => {
  const items = ref<FurnitureItem[]>([])
  const selectedId = ref<string | null>(null)

  const selectedItem = computed<FurnitureItem | null>(() => {
    if (selectedId.value === null) return null
    return items.value.find(item => item.id === selectedId.value) ?? null
  })

  function addItem(template: Omit<FurnitureItem, 'id'>): FurnitureItem {
    const newItem: FurnitureItem = { ...template, id: crypto.randomUUID() }
    items.value.push(newItem)
    selectedId.value = newItem.id
    return newItem
  }

  function updateItem(id: string, partial: Partial<FurnitureItem>): void {
    const index = items.value.findIndex(item => item.id === id)
    if (index === -1) return
    items.value[index] = { ...items.value[index], ...partial }
  }

  function removeItem(id: string): void {
    items.value = items.value.filter(item => item.id !== id)
    if (selectedId.value === id) selectedId.value = null
  }

  function selectItem(id: string | null): void {
    selectedId.value = id
  }

  function clearAll(): void {
    items.value = []
    selectedId.value = null
  }

  function setItems(newItems: FurnitureItem[]): void {
    items.value = newItems.map(item => ({ ...item }))
    selectedId.value = null
  }

  return {
    items,
    selectedId,
    selectedItem,
    addItem,
    updateItem,
    removeItem,
    selectItem,
    clearAll,
    setItems
  }
})
