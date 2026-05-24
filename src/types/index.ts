export interface FurnitureItem {
  id: string
  name: string
  type: string
  x: number
  y: number
  width: number
  height: number
  rotation: number
  color: string
  locked: boolean
}

export interface RoomConfig {
  id: string
  name: string
  width: number
  height: number
  gridSize: number
  snapEnabled: boolean
  backgroundColor: string
}

export interface FurnitureTemplate {
  type: string
  name: string
  defaultWidth: number
  defaultHeight: number
  color: string
  icon: string
}

export interface HistoryEntry {
  items: FurnitureItem[]
  timestamp: number
}

export interface DragState {
  isDragging: boolean
  itemId: string | null
  offsetX: number
  offsetY: number
}

export interface Position {
  x: number
  y: number
}
