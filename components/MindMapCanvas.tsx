'use client'

import React, { useRef, useEffect, useState } from 'react'
import * as d3 from 'd3'
import { useMindMap } from '../contexts/MindMapContext'
import { MindMapNode } from '../types/mindmap'

export default function MindMapCanvas() {
  const svgRef = useRef<SVGSVGElement>(null)
  const { state, actions } = useMindMap()
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

  useEffect(() => {
    if (!svgRef.current) return

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const width = svgRef.current.clientWidth
    const height = svgRef.current.clientHeight

    // 创建主组，应用平移和缩放
    const g = svg.append('g')
      .attr('transform', `translate(${width/2 + state.panX}, ${height/2 + state.panY}) scale(${state.zoom})`)

    // 计算节点位置
    const nodes = calculateNodePositions(state.data.nodes, state.data.rootId)
    
    // 绘制连接线
    drawLinks(g, nodes)
    
    // 绘制节点
    drawNodes(g, nodes)

  }, [state.data, state.zoom, state.panX, state.panY, state.selectedNode])

  // 计算节点位置的函数
  function calculateNodePositions(nodes: MindMapNode[], rootId: string) {
    const nodeMap = new Map(nodes.map(node => [node.id, { ...node }]))
    const root = nodeMap.get(rootId)
    if (!root) return []

    // 使用简单的径向布局
    const positioned: Array<MindMapNode & { x: number; y: number }> = []
    
    function positionNode(node: MindMapNode, angle: number, radius: number, level: number) {
      const x = level === 0 ? 0 : radius * Math.cos(angle)
      const y = level === 0 ? 0 : radius * Math.sin(angle)
      
      positioned.push({ ...node, x, y })
      
      if (node.children.length > 0) {
        const angleStep = (2 * Math.PI) / Math.max(node.children.length, 1)
        const startAngle = level === 0 ? 0 : angle - angleStep * (node.children.length - 1) / 2
        
        node.children.forEach((child, index) => {
          const childAngle = level === 0 ? index * angleStep : startAngle + index * angleStep
          positionNode(child, childAngle, radius + 150, level + 1)
        })
      }
    }

    positionNode(root, 0, 0, 0)
    return positioned
  }

  // 绘制连接线
  function drawLinks(g: d3.Selection<SVGGElement, unknown, null, undefined>, nodes: Array<MindMapNode & { x: number; y: number }>) {
    const links: Array<{ source: { x: number; y: number }, target: { x: number; y: number } }> = []
    
    nodes.forEach(node => {
      node.children.forEach(child => {
        const childNode = nodes.find(n => n.id === child.id)
        if (childNode) {
          links.push({
            source: { x: node.x, y: node.y },
            target: { x: childNode.x, y: childNode.y }
          })
        }
      })
    })

    g.selectAll('.link')
      .data(links)
      .enter()
      .append('line')
      .attr('class', 'link mindmap-link')
      .attr('x1', d => d.source.x)
      .attr('y1', d => d.source.y)
      .attr('x2', d => d.target.x)
      .attr('y2', d => d.target.y)
      .attr('stroke', '#999')
      .attr('stroke-width', 2)
  }

  // 绘制节点
  function drawNodes(g: d3.Selection<SVGGElement, unknown, null, undefined>, nodes: Array<MindMapNode & { x: number; y: number }>) {
    const nodeGroups = g.selectAll('.node')
      .data(nodes)
      .enter()
      .append('g')
      .attr('class', 'node mindmap-node')
      .attr('transform', d => `translate(${d.x}, ${d.y})`)
      .style('cursor', 'pointer')

    // 节点背景
    nodeGroups.append('rect')
      .attr('width', d => Math.max(100, d.text.length * 8 + 20))
      .attr('height', 40)
      .attr('x', d => -(Math.max(100, d.text.length * 8 + 20) / 2))
      .attr('y', -20)
      .attr('rx', 8)
      .attr('fill', d => d.color)
      .attr('stroke', d => state.selectedNode === d.id ? '#ef4444' : 'transparent')
      .attr('stroke-width', 3)

    // 节点文本
    nodeGroups.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .attr('fill', 'white')
      .attr('font-size', '14px')
      .attr('font-weight', 'bold')
      .text(d => d.text)

    // 添加点击事件
    nodeGroups.on('click', (event, d) => {
      event.stopPropagation()
      actions.selectNode(d.id)
    })

    // 添加双击事件（编辑）
    nodeGroups.on('dblclick', (event, d) => {
      event.stopPropagation()
      const newText = prompt('编辑节点文本:', d.text)
      if (newText && newText !== d.text) {
        actions.updateNode(d.id, { text: newText })
      }
    })
  }

  // 处理画布拖拽
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === svgRef.current) {
      setIsDragging(true)
      setDragStart({ x: e.clientX - state.panX, y: e.clientY - state.panY })
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      actions.setPan(e.clientX - dragStart.x, e.clientY - dragStart.y)
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  // 处理滚轮缩放
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    actions.setZoom(state.zoom * delta)
  }

  // 点击空白处取消选择
  const handleSvgClick = (e: React.MouseEvent) => {
    if (e.target === svgRef.current) {
      actions.selectNode(null)
    }
  }

  return (
    <svg
      ref={svgRef}
      className="w-full h-full bg-white cursor-grab"
      style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
      onClick={handleSvgClick}
    />
  )
} 