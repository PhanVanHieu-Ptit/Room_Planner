<script setup lang="ts">
import { RouterView } from 'vue-router'
import { useEventListener } from '@vueuse/core'
import { useFurnitureStore } from '@/stores/furnitureStore'
import { useHistoryStore } from '@/stores/historyStore'

const furnitureStore = useFurnitureStore()
const historyStore = useHistoryStore()

useEventListener(window, 'keydown', (e: KeyboardEvent) => {
  const tag = (e.target as Element)?.tagName ?? ''
  if (tag === 'INPUT' || tag === 'TEXTAREA') return

  // Undo / Redo
  if (e.ctrlKey || e.metaKey) {
    if (e.key === 'z' && !e.shiftKey) {
      e.preventDefault()
      const restored = historyStore.undo()
      if (restored !== null) furnitureStore.setItems(restored)
    } else if ((e.key === 'Z' && e.shiftKey) || (e.key === 'y' && !e.shiftKey)) {
      e.preventDefault()
      const restored = historyStore.redo()
      if (restored !== null) furnitureStore.setItems(restored)
    }
    return
  }

  // R / Shift+R — rotate selected item ±90°
  if (e.key === 'r' || e.key === 'R') {
    const item = furnitureStore.selectedItem
    if (item) {
      e.preventDefault()
      const delta = e.shiftKey ? -90 : 90
      historyStore.saveSnapshot(furnitureStore.items)
      furnitureStore.updateItem(item.id, { rotation: ((item.rotation + delta) % 360 + 360) % 360 })
    }
  }
})
</script>

<template>
  <div class="h-screen w-screen overflow-hidden bg-gray-100 flex flex-col">
    <RouterView />
  </div>
</template>
