import { describe, it, expect, beforeEach, beforeAll, vi } from 'vitest'
import { createApp } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import { createPersistedState } from 'pinia-plugin-persistedstate'
import { useFurnitureStore } from '../furnitureStore'

// Vitest v4 replaces jsdom's localStorage with its own implementation that
// omits some methods (notably clear). This stable in-memory mock ensures all
// Storage methods work consistently across environments.
let _store: Record<string, string> = {}
const localStorageMock: Storage = {
  get length() { return Object.keys(_store).length },
  key: (i: number) => Object.keys(_store)[i] ?? null,
  getItem: (key: string) => _store[key] ?? null,
  setItem: (key: string, value: string) => { _store[key] = String(value) },
  removeItem: (key: string) => { delete _store[key] },
  clear: () => { _store = {} },
}

beforeAll(() => {
  vi.stubGlobal('localStorage', localStorageMock)
  // jsdom's structuredClone can't clone Vue's reactive Proxy arrays; JSON round-trip works correctly.
  vi.stubGlobal('structuredClone', <T>(val: T): T => JSON.parse(JSON.stringify(val)))
})

describe('furnitureStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorageMock.clear()
  })

  // ─── addItem() ───────────────────────────────────────────────────────────────

  describe('addItem()', () => {
    it('creates a bed with correct default dimensions', () => {
      const store = useFurnitureStore()
      const item = store.addItem('bed', 10, 20)
      expect(item).toMatchObject({
        type: 'bed',
        name: 'Queen Bed',
        width: 120,
        height: 180,
        color: '#B8C4BB',
        x: 10,
        y: 20,
        rotation: 0,
        locked: false,
      })
    })

    it('creates a chair with correct default dimensions', () => {
      const store = useFurnitureStore()
      const item = store.addItem('chair', 0, 0)
      expect(item).toMatchObject({
        type: 'chair',
        name: 'Chair',
        width: 50,
        height: 50,
        color: '#C9B99A',
      })
    })

    it('creates an unknown type with generic fallback defaults', () => {
      const store = useFurnitureStore()
      const item = store.addItem('custom', 5, 5)
      expect(item).toMatchObject({
        type: 'custom',
        name: 'Custom',
        width: 100,
        height: 60,
        color: '#CCCCCC',
      })
    })

    it('assigns a non-empty string id', () => {
      const store = useFurnitureStore()
      const item = store.addItem('table', 0, 0)
      expect(typeof item.id).toBe('string')
      expect(item.id.length).toBeGreaterThan(0)
    })

    it('auto-selects the newly added item', () => {
      const store = useFurnitureStore()
      const item = store.addItem('sofa', 0, 0)
      expect(store.selectedId).toBe(item.id)
    })
  })

  // ─── updateItem() ────────────────────────────────────────────────────────────

  describe('updateItem()', () => {
    it('merges patch without mutating unrelated fields', () => {
      const store = useFurnitureStore()
      const item = store.addItem('table', 10, 20)
      store.updateItem(item.id, { x: 50 })
      const updated = store.items.find(i => i.id === item.id)!
      expect(updated).toMatchObject({
        x: 50,
        y: 20,
        width: 100,
        height: 60,
        type: 'table',
        name: 'Table',
        rotation: 0,
        locked: false,
      })
    })

    it('does nothing and does not throw for an unknown id', () => {
      const store = useFurnitureStore()
      expect(() => store.updateItem('nonexistent-id', { x: 1 })).not.toThrow()
    })
  })

  // ─── removeItem() ────────────────────────────────────────────────────────────

  describe('removeItem()', () => {
    it('removes the item from the items array', () => {
      const store = useFurnitureStore()
      const item = store.addItem('chair', 0, 0)
      store.removeItem(item.id)
      expect(store.items.find(i => i.id === item.id)).toBeUndefined()
    })

    it('clears selectedId when the removed item was selected', () => {
      const store = useFurnitureStore()
      const item = store.addItem('chair', 0, 0) // addItem auto-selects
      expect(store.selectedId).toBe(item.id)
      store.removeItem(item.id)
      expect(store.selectedId).toBeNull()
    })

    it('does not clear selectedId when a different item is removed', () => {
      const store = useFurnitureStore()
      const item1 = store.addItem('chair', 0, 0)
      const item2 = store.addItem('table', 50, 50)
      store.selectItem(item1.id)
      store.removeItem(item2.id)
      expect(store.selectedId).toBe(item1.id)
    })
  })

  // ─── duplicateItem() ─────────────────────────────────────────────────────────

  describe('duplicateItem()', () => {
    it('creates a new item with a UUID different from the original', () => {
      const store = useFurnitureStore()
      const item = store.addItem('sofa', 0, 0)
      const clone = store.duplicateItem(item.id)!
      expect(clone.id).not.toBe(item.id)
    })

    it('offsets the duplicate by +20 on both axes', () => {
      const store = useFurnitureStore()
      const item = store.addItem('sofa', 10, 30)
      const clone = store.duplicateItem(item.id)!
      expect(clone).toMatchObject({ x: 30, y: 50 })
    })

    it('copies all other fields from the original', () => {
      const store = useFurnitureStore()
      const item = store.addItem('desk', 0, 0)
      const clone = store.duplicateItem(item.id)!
      expect(clone).toMatchObject({
        type: item.type,
        name: item.name,
        width: item.width,
        height: item.height,
        color: item.color,
        rotation: item.rotation,
        locked: item.locked,
      })
    })

    it('returns null for an unknown id', () => {
      const store = useFurnitureStore()
      expect(store.duplicateItem('nonexistent-id')).toBeNull()
    })
  })

  // ─── selectedItem getter ──────────────────────────────────────────────────────

  describe('selectedItem getter', () => {
    it('returns null when selectedId is null', () => {
      const store = useFurnitureStore()
      expect(store.selectedItem).toBeNull()
    })

    it('returns the correct item when selectedId is set', () => {
      const store = useFurnitureStore()
      const item = store.addItem('desk', 5, 10)
      store.selectItem(item.id)
      expect(store.selectedItem).toMatchObject({ id: item.id, type: 'desk' })
    })

    it('returns null after the selected item is removed', () => {
      const store = useFurnitureStore()
      const item = store.addItem('desk', 0, 0)
      store.removeItem(item.id)
      expect(store.selectedItem).toBeNull()
    })
  })

  // ─── localStorage persistence ─────────────────────────────────────────────────

  describe('localStorage persistence', () => {
    it('persists items to localStorage after addItem()', () => {
      // In jsdom (IS_CLIENT=true), pinia.use() puts plugins in toBeInstalled which
      // only moves to _p when app.use(pinia) is called. We must install onto a Vue
      // app so the persistedstate plugin is active. $persist() flushes synchronously.
      const pinia = createPinia().use(createPersistedState({ storage: localStorageMock }))
      createApp({}).use(pinia)
      setActivePinia(pinia)
      const store = useFurnitureStore()
      store.addItem('bed', 0, 0)
      ;(store as any).$persist()
      const raw = localStorageMock.getItem('furniture')
      expect(raw).not.toBeNull()
      const stored = JSON.parse(raw!)
      expect(stored.items).toHaveLength(1)
      expect(stored.items[0]).toMatchObject({ type: 'bed' })
    })
  })
})
