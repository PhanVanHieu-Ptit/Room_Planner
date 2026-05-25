<script setup lang="ts">
import { RouterView } from 'vue-router'
import { useEventListener } from '@vueuse/core'
import { useFurnitureStore } from '@/stores/furnitureStore'
import { useHistoryStore } from '@/stores/historyStore'

const furnitureStore = useFurnitureStore()
const historyStore = useHistoryStore()

useEventListener(window, 'keydown', (e: KeyboardEvent) => {
  if (!e.ctrlKey && !e.metaKey) return
  if (e.key === 'z' && !e.shiftKey) {
    e.preventDefault()
    const restored = historyStore.undo()
    if (restored !== null) furnitureStore.setItems(restored)
  } else if ((e.key === 'Z' && e.shiftKey) || (e.key === 'y' && !e.shiftKey)) {
    e.preventDefault()
    const restored = historyStore.redo()
    if (restored !== null) furnitureStore.setItems(restored)
  }
})
</script>

<template>
  <div class="h-screen w-screen overflow-hidden bg-gray-100 flex flex-col">
    <RouterView />
  </div>
</template>
