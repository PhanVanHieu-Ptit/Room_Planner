import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { RoomConfig } from '@/types'

const DEFAULT_CONFIG: RoomConfig = {
  id: crypto.randomUUID(),
  name: 'My Room',
  width: 800,
  height: 600,
  gridSize: 20,
  snapEnabled: true,
  backgroundColor: '#ffffff'
}

export const useRoomStore = defineStore('room', () => {
  const config = ref<RoomConfig>({ ...DEFAULT_CONFIG })

  function updateConfig(partial: Partial<RoomConfig>): void {
    config.value = { ...config.value, ...partial }
  }

  function resetRoom(): void {
    config.value = { ...DEFAULT_CONFIG, id: crypto.randomUUID() }
  }

  return { config, updateConfig, resetRoom }
})
