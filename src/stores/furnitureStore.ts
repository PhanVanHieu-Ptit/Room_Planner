import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { FurnitureItem } from '@/types'
import { useHistoryStore } from './historyStore'

interface TypeDefaults {
  name: string
  width: number
  height: number
  color: string
}

const TYPE_DEFAULTS: Record<string, TypeDefaults> = {
  bed:       { name: 'Queen Bed',  width: 120, height: 180, color: '#B8C4BB' },
  table:     { name: 'Table',      width: 100, height: 60,  color: '#D4A373' },
  chair:     { name: 'Chair',      width: 50,  height: 50,  color: '#C9B99A' },
  sofa:      { name: 'Sofa',       width: 160, height: 70,  color: '#8B7355' },
  wardrobe:  { name: 'Wardrobe',   width: 80,  height: 50,  color: '#9B8B7A' },
  armchair:  { name: 'Armchair',   width: 80,  height: 80,  color: '#A0845C' },
  desk:      { name: 'Desk',       width: 120, height: 60,  color: '#E8D5B7' },
  bookshelf: { name: 'Bookshelf',  width: 120, height: 30,  color: '#8B6914' },
  tvstand:   { name: 'TV Stand',   width: 150, height: 40,  color: '#6B7280' },
}

function defaultsForType(type: string): TypeDefaults {
  return TYPE_DEFAULTS[type] ?? {
    name: type.charAt(0).toUpperCase() + type.slice(1),
    width: 100,
    height: 60,
    color: '#CCCCCC',
  }
}

export const useFurnitureStore = defineStore('furniture', () => {
  const items = ref<FurnitureItem[]>([])
  const selectedId = ref<string | null>(null)
  const historyStore = useHistoryStore()

  const selectedItem = computed<FurnitureItem | null>(() => {
    if (selectedId.value === null) return null
    return items.value.find(item => item.id === selectedId.value) ?? null
  })

  const itemCount = computed<number>(() => items.value.length)

  function addItem(type: string, x: number, y: number): FurnitureItem {
    const defaults = defaultsForType(type)
    const newItem: FurnitureItem = {
      id: crypto.randomUUID(),
      type,
      name: defaults.name,
      x,
      y,
      width: defaults.width,
      height: defaults.height,
      rotation: 0,
      color: defaults.color,
      locked: false,
    }
    items.value.push(newItem)
    historyStore.saveSnapshot(items.value)
    selectedId.value = newItem.id
    return newItem
  }

  function updateItem(id: string, patch: Partial<FurnitureItem>): void {
    const index = items.value.findIndex(item => item.id === id)
    if (index === -1) return
    items.value[index] = { ...items.value[index], ...patch }
  }

  function removeItem(id: string): void {
    items.value = items.value.filter(item => item.id !== id)
    historyStore.saveSnapshot(items.value)
    if (selectedId.value === id) selectedId.value = null
  }

  function duplicateItem(id: string): FurnitureItem | null {
    const source = items.value.find(item => item.id === id)
    if (!source) return null
    const clone: FurnitureItem = { ...source, id: crypto.randomUUID(), x: source.x + 20, y: source.y + 20 }
    items.value.push(clone)
    historyStore.saveSnapshot(items.value)
    selectedId.value = clone.id
    return clone
  }

  function clearAll(): void {
    items.value = []
    selectedId.value = null
  }

  function selectItem(id: string | null): void {
    selectedId.value = id
  }

  function setItems(newItems: FurnitureItem[]): void {
    items.value = newItems.map(item => ({ ...item }))
    selectedId.value = null
  }

  return {
    items,
    selectedId,
    selectedItem,
    itemCount,
    addItem,
    updateItem,
    removeItem,
    duplicateItem,
    clearAll,
    selectItem,
    setItems,
  }
}, {
  persist: { pick: ['items'] },
})
