'use client'

import React, { useState } from 'react'
import { 
  Plus, 
  Trash2, 
  Download, 
  Upload, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw,
  Edit3,
  Eye,
  Palette
} from 'lucide-react'
import { useMindMap } from '../contexts/MindMapContext'

export default function Toolbar() {
  const { state, actions } = useMindMap()
  const [showColorPicker, setShowColorPicker] = useState(false)

  const colors = [
    '#3b82f6', '#ef4444', '#10b981', '#f59e0b', 
    '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'
  ]

  const handleAddNode = () => {
    if (state.selectedNode) {
      const text = prompt('输入新节点文本:')
      if (text) {
        actions.addNode(state.selectedNode, text)
      }
    } else {
      alert('请先选择一个节点作为父节点')
    }
  }

  const handleDeleteNode = () => {
    if (state.selectedNode && state.selectedNode !== state.data.rootId) {
      if (confirm('确定要删除这个节点及其所有子节点吗？')) {
        actions.deleteNode(state.selectedNode)
      }
    } else {
      alert('无法删除根节点，请选择其他节点')
    }
  }

  const handleExport = () => {
    const data = actions.exportData()
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${state.data.title || 'mindmap'}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const data = e.target?.result as string
          actions.importData(data)
          alert('导入成功！')
        } catch (error) {
          alert('导入失败：文件格式不正确')
        }
      }
      reader.readAsText(file)
    }
  }

  const handleColorChange = (color: string) => {
    if (state.selectedNode) {
      actions.updateNode(state.selectedNode, { color })
      setShowColorPicker(false)
    }
  }

  return (
    <div className="bg-white border-b shadow-sm">
      <div className="px-6 py-3 flex items-center gap-4 flex-wrap">
        {/* 基础操作 */}
        <div className="flex items-center gap-2 border-r pr-4">
          <button
            onClick={handleAddNode}
            disabled={!state.selectedNode}
            className="flex items-center gap-2 px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus size={16} />
            添加节点
          </button>
          
          <button
            onClick={handleDeleteNode}
            disabled={!state.selectedNode || state.selectedNode === state.data.rootId}
            className="flex items-center gap-2 px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Trash2 size={16} />
            删除节点
          </button>
        </div>

        {/* 视图控制 */}
        <div className="flex items-center gap-2 border-r pr-4">
          <button
            onClick={() => actions.setZoom(state.zoom * 1.2)}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-md"
            title="放大"
          >
            <ZoomIn size={16} />
          </button>
          
          <span className="text-sm text-gray-600 min-w-[50px] text-center">
            {Math.round(state.zoom * 100)}%
          </span>
          
          <button
            onClick={() => actions.setZoom(state.zoom * 0.8)}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-md"
            title="缩小"
          >
            <ZoomOut size={16} />
          </button>
          
          <button
            onClick={() => {
              actions.setZoom(1)
              actions.setPan(0, 0)
            }}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-md"
            title="重置视图"
          >
            <RotateCcw size={16} />
          </button>
        </div>

        {/* 样式控制 */}
        <div className="flex items-center gap-2 border-r pr-4 relative">
          <button
            onClick={() => setShowColorPicker(!showColorPicker)}
            disabled={!state.selectedNode}
            className="flex items-center gap-2 p-2 text-gray-600 hover:bg-gray-100 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
            title="修改颜色"
          >
            <Palette size={16} />
          </button>

          {showColorPicker && (
            <div className="absolute top-full left-0 mt-2 p-3 bg-white border rounded-lg shadow-lg z-10">
              <div className="grid grid-cols-4 gap-2">
                {colors.map(color => (
                  <button
                    key={color}
                    onClick={() => handleColorChange(color)}
                    className="w-8 h-8 rounded-md border-2 border-gray-200 hover:border-gray-400"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 文件操作 */}
        <div className="flex items-center gap-2 border-r pr-4">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 p-2 text-gray-600 hover:bg-gray-100 rounded-md"
            title="导出"
          >
            <Download size={16} />
          </button>
          
          <label className="flex items-center gap-2 p-2 text-gray-600 hover:bg-gray-100 rounded-md cursor-pointer">
            <Upload size={16} />
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
            />
          </label>
        </div>

        {/* 重置 */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (confirm('确定要重置思维导图吗？这将清除所有数据。')) {
                actions.resetMap()
              }
            }}
            className="flex items-center gap-2 px-3 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            <RotateCcw size={16} />
            重置
          </button>
        </div>

        {/* 显示当前选中的节点 */}
        {state.selectedNode && (
          <div className="ml-auto text-sm text-gray-600">
            已选中: {state.data.nodes.find(n => n.id === state.selectedNode)?.text || '未知节点'}
          </div>
        )}
      </div>

      {/* 颜色选择器背景遮罩 */}
      {showColorPicker && (
        <div 
          className="fixed inset-0 z-5"
          onClick={() => setShowColorPicker(false)}
        />
      )}
    </div>
  )
} 