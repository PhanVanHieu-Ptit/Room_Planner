import { ref } from 'vue'
import type { Ref } from 'vue'
import type { FurnitureItem, RoomConfig } from '@/types'

export function useExport(): {
  isExporting: Ref<boolean>
  exportToJSON: (items: FurnitureItem[], config: RoomConfig) => void
  exportToPNG: (canvasEl: HTMLElement, filename?: string) => Promise<void>
} {
  const isExporting = ref<boolean>(false)

  function exportToJSON(items: FurnitureItem[], config: RoomConfig): void {
    const payload = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      room: config,
      furniture: items
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `${config.name.replace(/\s+/g, '_')}_room.json`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  async function exportToPNG(canvasEl: HTMLElement, filename = 'room_plan'): Promise<void> {
    isExporting.value = true
    try {
      const { default: html2canvas } = await import('html2canvas')
      const canvas = await html2canvas(canvasEl, {
        backgroundColor: null,
        scale: 2,
        useCORS: true,
        logging: false
      })
      canvas.toBlob((blob) => {
        if (!blob) return
        const url = URL.createObjectURL(blob)
        const anchor = document.createElement('a')
        anchor.href = url
        anchor.download = `${filename}.png`
        anchor.click()
        URL.revokeObjectURL(url)
      }, 'image/png')
    } finally {
      isExporting.value = false
    }
  }

  return { isExporting, exportToJSON, exportToPNG }
}
