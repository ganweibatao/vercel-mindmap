export interface MindMapNode {
  id: string
  text: string
  x: number
  y: number
  color: string
  children: MindMapNode[]
  parent?: string
  level: number
  expanded: boolean
}

export interface MindMapData {
  nodes: MindMapNode[]
  rootId: string
  title: string
}

export interface MindMapState {
  data: MindMapData
  selectedNode: string | null
  mode: 'view' | 'edit'
  zoom: number
  panX: number
  panY: number
}

export interface MindMapActions {
  addNode: (parentId: string, text: string) => void
  deleteNode: (nodeId: string) => void
  updateNode: (nodeId: string, updates: Partial<MindMapNode>) => void
  selectNode: (nodeId: string | null) => void
  setMode: (mode: 'view' | 'edit') => void
  setZoom: (zoom: number) => void
  setPan: (x: number, y: number) => void
  exportData: () => string
  importData: (data: string) => void
  resetMap: () => void
} 