import { ref } from 'vue'
import type { Ref } from 'vue'
import type { FurnitureItem, RoomConfig } from '@/types'
import { useRoomStore } from '@/stores/roomStore'
import { useFurnitureStore } from '@/stores/furnitureStore'

interface RoomLayout {
  version: string
  exportedAt: string
  room: RoomConfig
  furniture: FurnitureItem[]
}

function isRoomConfig(v: unknown): v is RoomConfig {
  if (!v || typeof v !== 'object') return false
  const c = v as Record<string, unknown>
  return (
    typeof c.id === 'string' &&
    typeof c.name === 'string' &&
    typeof c.width === 'number' &&
    typeof c.height === 'number' &&
    typeof c.gridSize === 'number' &&
    typeof c.snapEnabled === 'boolean' &&
    typeof c.backgroundColor === 'string'
  )
}

function isFurnitureItem(v: unknown): v is FurnitureItem {
  if (!v || typeof v !== 'object') return false
  const i = v as Record<string, unknown>
  return (
    typeof i.id === 'string' &&
    typeof i.name === 'string' &&
    typeof i.type === 'string' &&
    typeof i.x === 'number' &&
    typeof i.y === 'number' &&
    typeof i.width === 'number' &&
    typeof i.height === 'number' &&
    typeof i.rotation === 'number' &&
    typeof i.color === 'string' &&
    typeof i.locked === 'boolean'
  )
}

function triggerDownload(url: string, filename: string): void {
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function useExport(): {
  isExporting: Ref<boolean>
  exportSVGtoPNG: (svgEl: SVGSVGElement | null, filename?: string) => Promise<void>
  exportJSON: () => void
  importJSON: (file: File) => Promise<void>
} {
  const isExporting = ref(false)
  const roomStore = useRoomStore()
  const furnitureStore = useFurnitureStore()

  async function exportSVGtoPNG(svgEl: SVGSVGElement | null, filename = 'room-layout'): Promise<void> {
    if (!svgEl) return

    isExporting.value = true
    try {
      const serialized = new XMLSerializer().serializeToString(svgEl)
      const svgBlob = new Blob([serialized], { type: 'image/svg+xml;charset=utf-8' })
      const svgUrl = URL.createObjectURL(svgBlob)

      await new Promise<void>((resolve, reject) => {
        const img = new Image()
        img.crossOrigin = 'anonymous'
        img.onload = () => {
          const scale = window.devicePixelRatio || 2
          const canvas = document.createElement('canvas')
          canvas.width = svgEl.clientWidth * scale
          canvas.height = svgEl.clientHeight * scale

          const ctx = canvas.getContext('2d')
          if (!ctx) { reject(new Error('No 2D context')); return }

          ctx.scale(scale, scale)
          ctx.drawImage(img, 0, 0)
          URL.revokeObjectURL(svgUrl)

          canvas.toBlob((blob) => {
            if (!blob) { reject(new Error('toBlob failed')); return }
            const pngUrl = URL.createObjectURL(blob)
            triggerDownload(pngUrl, `${filename}.png`)
            resolve()
          }, 'image/png')
        }
        img.onerror = () => { URL.revokeObjectURL(svgUrl); reject(new Error('SVG load failed')) }
        img.src = svgUrl
      })
    } finally {
      isExporting.value = false
    }
  }

  function exportJSON(): void {
    const payload: RoomLayout = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      room: { ...roomStore.config },
      furniture: furnitureStore.items.map(item => ({ ...item })),
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    triggerDownload(url, 'room-layout.json')
  }

  async function importJSON(file: File): Promise<void> {
    const text = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => resolve(e.target?.result as string)
      reader.onerror = () => reject(new Error('File read failed'))
      reader.readAsText(file)
    })

    const parsed: unknown = JSON.parse(text)
    if (!parsed || typeof parsed !== 'object') throw new Error('Invalid file: not an object')

    const layout = parsed as Record<string, unknown>
    if (!isRoomConfig(layout.room)) throw new Error('Invalid file: malformed room config')
    if (!Array.isArray(layout.furniture)) throw new Error('Invalid file: furniture must be an array')

    const furniture = layout.furniture as unknown[]
    if (!furniture.every(isFurnitureItem)) throw new Error('Invalid file: malformed furniture items')

    roomStore.updateConfig(layout.room)
    furnitureStore.setItems(layout.furniture as FurnitureItem[])
  }

  return { isExporting, exportSVGtoPNG, exportJSON, importJSON }
}
