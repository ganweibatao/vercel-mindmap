'use client'

import React, { createContext, useContext, useReducer, useEffect } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { MindMapState, MindMapActions, MindMapNode, MindMapData } from '@/types/mindmap'

// 初始数据
const initialData: MindMapData = {
  title: '我的思维导图',
  rootId: 'root',
  nodes: [
    {
      id: 'root',
      text: '中心主题',
      x: 0,
      y: 0,
      color: '#3b82f6',
      children: [],
      level: 0,
      expanded: true
    }
  ]
}

const initialState: MindMapState = {
  data: initialData,
  selectedNode: null,
  mode: 'view',
  zoom: 1,
  panX: 0,
  panY: 0
}

// Action types
type Action =
  | { type: 'ADD_NODE'; parentId: string; text: string }
  | { type: 'DELETE_NODE'; nodeId: string }
  | { type: 'UPDATE_NODE'; nodeId: string; updates: Partial<MindMapNode> }
  | { type: 'SELECT_NODE'; nodeId: string | null }
  | { type: 'SET_MODE'; mode: 'view' | 'edit' }
  | { type: 'SET_ZOOM'; zoom: number }
  | { type: 'SET_PAN'; x: number; y: number }
  | { type: 'IMPORT_DATA'; data: MindMapData }
  | { type: 'RESET_MAP' }

// Reducer
function mindMapReducer(state: MindMapState, action: Action): MindMapState {
  switch (action.type) {
    case 'ADD_NODE': {
      const newNode: MindMapNode = {
        id: uuidv4(),
        text: action.text,
        x: 0,
        y: 0,
        color: '#10b981',
        children: [],
        parent: action.parentId,
        level: 0,
        expanded: true
      }

      const updatedNodes = [...state.data.nodes]
      const parentIndex = updatedNodes.findIndex(n => n.id === action.parentId)
      
      if (parentIndex !== -1) {
        newNode.level = updatedNodes[parentIndex].level + 1
        updatedNodes[parentIndex].children.push(newNode)
        updatedNodes.push(newNode)
      }

      return {
        ...state,
        data: {
          ...state.data,
          nodes: updatedNodes
        }
      }
    }

    case 'DELETE_NODE': {
      if (action.nodeId === state.data.rootId) return state
      
      const updatedNodes = state.data.nodes.filter(node => {
        // 删除节点及其所有子节点
        const isDescendant = (nodeId: string, targetId: string): boolean => {
          const node = state.data.nodes.find(n => n.id === nodeId)
          if (!node) return false
          if (node.id === targetId) return true
          return node.children.some(child => isDescendant(child.id, targetId))
        }
        return !isDescendant(node.id, action.nodeId)
      })

      // 从父节点的 children 中移除
      updatedNodes.forEach(node => {
        node.children = node.children.filter(child => child.id !== action.nodeId)
      })

      return {
        ...state,
        data: {
          ...state.data,
          nodes: updatedNodes
        },
        selectedNode: state.selectedNode === action.nodeId ? null : state.selectedNode
      }
    }

    case 'UPDATE_NODE': {
      const updatedNodes = state.data.nodes.map(node =>
        node.id === action.nodeId ? { ...node, ...action.updates } : node
      )

      return {
        ...state,
        data: {
          ...state.data,
          nodes: updatedNodes
        }
      }
    }

    case 'SELECT_NODE':
      return { ...state, selectedNode: action.nodeId }

    case 'SET_MODE':
      return { ...state, mode: action.mode }

    case 'SET_ZOOM':
      return { ...state, zoom: Math.max(0.1, Math.min(3, action.zoom)) }

    case 'SET_PAN':
      return { ...state, panX: action.x, panY: action.y }

    case 'IMPORT_DATA':
      return { ...state, data: action.data }

    case 'RESET_MAP':
      return { ...initialState }

    default:
      return state
  }
}

// Context
const MindMapContext = createContext<{
  state: MindMapState
  actions: MindMapActions
} | null>(null)

// Provider
export function MindMapProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(mindMapReducer, initialState)

  // 保存到本地存储
  useEffect(() => {
    localStorage.setItem('mindmap-data', JSON.stringify(state.data))
  }, [state.data])

  // 从本地存储加载
  useEffect(() => {
    const saved = localStorage.getItem('mindmap-data')
    if (saved) {
      try {
        const data = JSON.parse(saved)
        dispatch({ type: 'IMPORT_DATA', data })
      } catch (e) {
        console.error('Failed to load saved data:', e)
      }
    }
  }, [])

  const actions: MindMapActions = {
    addNode: (parentId: string, text: string) =>
      dispatch({ type: 'ADD_NODE', parentId, text }),
    
    deleteNode: (nodeId: string) =>
      dispatch({ type: 'DELETE_NODE', nodeId }),
    
    updateNode: (nodeId: string, updates: Partial<MindMapNode>) =>
      dispatch({ type: 'UPDATE_NODE', nodeId, updates }),
    
    selectNode: (nodeId: string | null) =>
      dispatch({ type: 'SELECT_NODE', nodeId }),
    
    setMode: (mode: 'view' | 'edit') =>
      dispatch({ type: 'SET_MODE', mode }),
    
    setZoom: (zoom: number) =>
      dispatch({ type: 'SET_ZOOM', zoom }),
    
    setPan: (x: number, y: number) =>
      dispatch({ type: 'SET_PAN', x, y }),
    
    exportData: () => JSON.stringify(state.data, null, 2),
    
    importData: (data: string) => {
      try {
        const parsed = JSON.parse(data)
        dispatch({ type: 'IMPORT_DATA', data: parsed })
      } catch (e) {
        throw new Error('Invalid data format')
      }
    },
    
    resetMap: () => dispatch({ type: 'RESET_MAP' })
  }

  return (
    <MindMapContext.Provider value={{ state, actions }}>
      {children}
    </MindMapContext.Provider>
  )
}

// Hook
export function useMindMap() {
  const context = useContext(MindMapContext)
  if (!context) {
    throw new Error('useMindMap must be used within a MindMapProvider')
  }
  return context
} 