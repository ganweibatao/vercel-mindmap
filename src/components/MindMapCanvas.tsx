'use client';

import React, { useState, useCallback, FormEvent, useRef, useEffect } from 'react';
import {
  ReactFlow,
  Node,
  Edge,
  useNodesState,
  useEdgesState,
  MiniMap,
  Controls,
  Background,
  addEdge,
  useReactFlow,
  ReactFlowProvider,
  BackgroundVariant,
  NodeChange,
  Connection,
} from '@xyflow/react';
import MarkdownNode from './MarkdownNode';
import InputNode from './InputNode';
import { MindMapContext } from '@/contexts/MindMapContext';
import dagre from '@dagrejs/dagre';

const GlobeIcon = ({ className = '' }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);

import '@xyflow/react/dist/style.css';

const nodeTypes = {
  markdown: MarkdownNode,
  input: InputNode,
};

// 科技感主题的默认边线配置
const defaultEdgeOptions = {
  animated: true,
  type: 'smoothstep',
  style: { strokeWidth: 1.5, stroke: '#555' },
};

// 对话消息结构，符合 OpenAI / DeepSeek 规范
interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

const createInitialNodes = (): Node[] => [];

const createInitialEdges = (): Edge[] => [];

// 基于 dagre 的自动布局函数
const layoutGraph = (nodes: Node[], edges: Edge[], direction: 'TB' | 'LR' = 'TB'): Node[] => {
  const g = new dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));
  // 只用 dagre 计算水平布局，垂直布局我们自己处理
  const NODE_SEP = direction === 'LR' ? 60 : 120; // 横向布局时同层间距减半

  g.setGraph({ 
    rankdir: direction, 
    nodesep: NODE_SEP,  // 同层节点间距
    ranksep: 50,        // 层级间距（dagre 用于另一维度）
    marginx: 50,        // 图形边距
    marginy: 50
  });

  // 获取视口缩放比例的辅助函数
  const getScale = () => {
    const viewport = document.querySelector('.react-flow__viewport') as HTMLElement | null;
    if (!viewport) return 1;
    const transform = window.getComputedStyle(viewport).transform;
    if (!transform || transform === 'none') return 1;
    const match2d = transform.match(/matrix\(([^)]+)\)/);
    if (match2d && match2d[1]) {
      const values = match2d[1].split(',').map(v => parseFloat(v.trim()));
      return values.length > 0 && !Number.isNaN(values[0]) ? values[0] : 1;
    }
    return 1;
  };

  // 获取节点标题位置偏移量的函数
  const getTitleOffset = (node: Node): number => {
    if (node.type === 'markdown') {
      // MarkdownNode 的标题位置：padding(15px) + 标题高度的一半
      return 15 + 13; // 约 28px 从顶部到标题中心
    } else if (node.type === 'input') {
      // InputNode 的输入框位置：padding + 一点点边距
      return 25; // 从顶部到输入框中心位置
    }
    return 0;
  };

  // 为每个节点计算尺寸信息
  const nodeData: { [key: string]: { width: number; height: number; titleOffset: number } } = {};
  
  nodes.forEach((node) => {
    let width = 600;  // 默认宽度
    let height = 200; // 默认高度
    
    // 尝试获取节点的实际渲染尺寸
    const nodeWrapper = document.querySelector(`[data-id="${node.id}"]`);
    const contentBox = nodeWrapper?.querySelector('.markdown-node');
    const measureTarget = (contentBox as HTMLElement) || (nodeWrapper as HTMLElement | null);

    if (measureTarget) {
      const rect = measureTarget.getBoundingClientRect();
      const scale = getScale();
      width = Math.max(rect.width / scale, 600);
      height = Math.max(rect.height / scale, 200);
    } else {
      // 如果无法获取实际尺寸，根据节点类型和内容估算
      if (node.type === 'input') {
        width = 600;
        height = 150;
      } else if (node.type === 'markdown' && node.data?.label) {
        // 根据文本长度估算节点尺寸
        const label = String(node.data.label);
        const textLength = label.length;
        const estimatedLines = Math.ceil(textLength / 60); // 假设每行60字符（因为宽度增加了）
        width = Math.min(Math.max(textLength * 8, 600), 1000); // 根据文本长度，但限制在600-1000px之间
        height = Math.max(estimatedLines * 25 + 80, 150); // 每行25px高度 + 80px padding
      }
    }
    
    // 存储节点数据
    nodeData[node.id] = { 
      width, 
      height, 
      titleOffset: getTitleOffset(node) 
    };
    
    // 为 dagre 设置节点尺寸（用于水平布局计算）
    g.setNode(node.id, { 
      width: width + 40,  // 增加40px水平padding
      height: height + 40 // 增加40px垂直padding
    });
  });

  edges.forEach((edge) => {
    g.setEdge(edge.source, edge.target);
  });

  // 让 dagre 进行布局（主要用于获取水平分布）
  dagre.layout(g);

  // 获取 dagre 计算的水平位置
  const dagrePositions: { [key: string]: { x: number; y: number } } = {};
  nodes.forEach((node) => {
    const dagreNode = g.node(node.id);
    if (dagreNode) {
      dagrePositions[node.id] = { x: dagreNode.x, y: dagreNode.y };
    }
  });

  // 构建父子关系映射
  const childrenMap: { [parentId: string]: string[] } = {};
  const parentMap: { [childId: string]: string } = {};
  
  edges.forEach(edge => {
    if (!childrenMap[edge.source]) {
      childrenMap[edge.source] = [];
    }
    childrenMap[edge.source].push(edge.target);
    parentMap[edge.target] = edge.source;
  });

  // 找到根节点（没有父节点的节点）
  const rootNodes = nodes.filter(node => !parentMap[node.id]);
  
  const finalPositions: { [nodeId: string]: { x: number; y: number } } = {};

  if (direction === 'TB') {
    // ---------- 纵向布局 ----------
    const LEVEL_SPACING_V = 150; // 从父节点底部到子节点标题的距离

    const calcVertical = (nodeId: string, parentBottom?: number) => {
      const nodeInfo = nodeData[nodeId];
      const dagrePos = dagrePositions[nodeId];
      if (!nodeInfo || !dagrePos) return;

      let nodeY: number;
      if (parentBottom === undefined) {
        nodeY = dagrePos.y - nodeInfo.height / 2;
      } else {
        const titleY = parentBottom + LEVEL_SPACING_V;
        nodeY = titleY - nodeInfo.titleOffset;
      }

      finalPositions[nodeId] = {
        x: dagrePos.x - nodeInfo.width / 2,
        y: nodeY,
      };

      const currentBottom = nodeY + nodeInfo.height;
      (childrenMap[nodeId] || []).forEach(child => calcVertical(child, currentBottom));
    };

    rootNodes.forEach(r => calcVertical(r.id));
  } else {
    // ---------- 横向布局 ----------
    const LEVEL_SPACING_H = 150; // 从父节点右侧到子节点标题的水平距离

    const calcHorizontal = (nodeId: string, parentRight?: number) => {
      const nodeInfo = nodeData[nodeId];
      const dagrePos = dagrePositions[nodeId];
      if (!nodeInfo || !dagrePos) return;

      let nodeX: number;
      if (parentRight === undefined) {
        nodeX = dagrePos.x - nodeInfo.width / 2;
      } else {
        nodeX = parentRight + LEVEL_SPACING_H;
      }

      // y 坐标直接使用 dagre 结果
      const nodeY = dagrePos.y - nodeInfo.height / 2;

      finalPositions[nodeId] = { x: nodeX, y: nodeY };

      const currentRight = nodeX + nodeInfo.width;
      (childrenMap[nodeId] || []).forEach(child => calcHorizontal(child, currentRight));
    };

    rootNodes.forEach(r => calcHorizontal(r.id));
  }

  // 应用最终位置
  return nodes.map((node) => {
    const finalPos = finalPositions[node.id];
    const nodeInfo = nodeData[node.id];
    
    if (!finalPos || !nodeInfo) return node;
    
    return {
      ...node,
      position: {
        x: finalPos.x,
        y: finalPos.y,
      },
      // 更新节点的实际尺寸信息
      width: nodeInfo.width,
      height: nodeInfo.height,
    };
  });
};

const getId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Helper to find a node and its dimensions
const findNode = (nodes: Node[], id: string) => nodes.find((n) => n.id === id);

// 内部组件，用于使用 useReactFlow hook
function MindMapFlow() {
  // 布局方向: TB(纵向) / LR(横向)
  const [orientation, setOrientation] = useState<'TB' | 'LR'>('LR');

  const toggleOrientation = useCallback(() => {
    setOrientation(prev => (prev === 'TB' ? 'LR' : 'TB'));
  }, []);

  const [nodes, setNodes, onNodesChange] = useNodesState(createInitialNodes());
  const [edges, setEdges, onEdgesChange] = useEdgesState(createInitialEdges());
  const [question, setQuestion] = useState('');
  const [withWebSearch, setWithWebSearch] = useState(false);
  const [selectedModel, setSelectedModel] = useState<'deepseek' | 'wenxin'>('deepseek');
  // 全局对话历史，供发送给后端做上下文
  const [chatHistory, setChatHistory] = useState<Message[]>([]);
  const lastNodeId = useRef('1');
  const { setCenter, getZoom } = useReactFlow();

  const relayout = useCallback(() => {
    // 使用 setTimeout 延迟执行，避免与 React Flow 的 DOM 操作冲突
    setTimeout(() => {
      setNodes((currentNodes) => {
        // 只有当节点数量大于0时才进行布局
        if (currentNodes.length === 0) return currentNodes;
        
        try {
          return layoutGraph(currentNodes, edges, orientation);
        } catch (error) {
          console.warn('Layout error:', error);
          return currentNodes; // 发生错误时返回原节点
        }
      });
    }, 50);
  }, [edges, orientation, setNodes]);

  // 包装 onNodesChange，增加布局触发逻辑
  const onNodesChangeWithLayout = useCallback((changes: NodeChange[]) => {
    onNodesChange(changes);
    // 检查是否有节点尺寸变化事件
    const hasDimensionChange = changes.some(change => change.type === 'dimensions');
    if (hasDimensionChange) {
      relayout();
    }
  }, [onNodesChange, relayout]);

  // 确保只有一个根节点的useEffect
  useEffect(() => {
    const rootNodes = nodes.filter(node => node.data.isRoot);
    if (rootNodes.length > 1) {
      // 如果有多个根节点，保留第一个，删除其他的
      const duplicateRootNodes = rootNodes.slice(1);
      setNodes(currentNodes => 
        currentNodes.filter(node => 
          !duplicateRootNodes.some(duplicate => duplicate.id === node.id)
        )
      );
    }
  }, [nodes, setNodes]);
  
  // 触摸拖动相关状态
  const [touchState, setTouchState] = useState({
    isTouching: false,
    touchCount: 0,
    lastTouchDistance: 0,
    initialTouches: [] as { x: number; y: number }[],
    lastPanPosition: { x: 0, y: 0 },
  });
  
  const reactFlowWrapper = useRef<HTMLDivElement>(null);

  // 获取当前 ReactFlow 视口的缩放比例（scale）。
  // 如果没有检测到 transform，则返回 1。
  const getViewportScale = () => {
    const viewport = document.querySelector('.react-flow__viewport') as HTMLElement | null;
    if (!viewport) return 1;
    const transform = window.getComputedStyle(viewport).transform;
    if (!transform || transform === 'none') {
      return 1;
    }
    // matrix(a, b, c, d, e, f) 格式，a 与 d 为缩放系数（通常 a === d）
    const match2d = transform.match(/matrix\(([^)]+)\)/);
    if (match2d && match2d[1]) {
      const values = match2d[1].split(',').map(v => parseFloat(v.trim()));
      return values.length > 0 && !Number.isNaN(values[0]) ? values[0] : 1;
    }
    // matrix3d(....) 的情况，缩放系数位于第 1、6、11 位，这里取第 1 位
    const match3d = transform.match(/matrix3d\(([^)]+)\)/);
    if (match3d && match3d[1]) {
      const values = match3d[1].split(',').map(v => parseFloat(v.trim()));
      return values.length > 0 && !Number.isNaN(values[0]) ? values[0] : 1;
    }
    return 1;
  };

  const addInputNode = (parentNodeId: string) => {
    const parentNode = findNode(nodes, parentNodeId);
    if (!parentNode) return;

    // 找到当前父节点已有的子节点
    const existingChildren = edges
      .filter(edge => edge.source === parentNodeId)
      .map(edge => nodes.find(node => node.id === edge.target))
      .filter(Boolean);

    // 检查是否已经有子输入节点连接到这个父节点
    const hasChildInputNode = existingChildren.some(child => child?.type === 'input');

    if (hasChildInputNode) {
      // 如果已经有子输入节点，不要添加新的
      return;
    }

    // 添加小延迟确保父节点DOM完全渲染
    setTimeout(() => {
      addInputNodeInternal(parentNodeId);
    }, 50);
  };

  const addInputNodeInternal = (parentNodeId: string) => {
    const newNodeId = getId();
    
    // 创建新的输入节点（初始位置可以随意设置，会被 dagre 重新计算）
    const newNode: Node = {
        id: newNodeId,
        type: 'input',
        position: { x: 0, y: 0 }, // 临时位置，会被 dagre 重新计算
        data: { parentId: parentNodeId, isRoot: false },
    };

    const newEdge: Edge = { id: `${parentNodeId}-${newNodeId}`, source: parentNodeId, target: newNodeId };

    // 使用 dagre 自动布局
    const layoutedNodes = layoutGraph([...nodes, newNode], [...edges, newEdge], orientation);
    setNodes(layoutedNodes);
    setEdges((eds) => eds.concat(newEdge));
    
    // 🎯 精确居中: 新节点会精确地出现在屏幕的正中央
    setTimeout(() => {
      // 找到新节点的布局后位置
      const newNodeLayouted = layoutedNodes.find(node => node.id === newNodeId);
      if (newNodeLayouted) {
        // 计算节点中心位置（考虑节点尺寸）
        const nodeWidth = 600; // 默认输入节点宽度
        const nodeHeight = 200; // 默认输入节点高度
        const centerX = newNodeLayouted.position.x + nodeWidth / 2;
        const centerY = newNodeLayouted.position.y + nodeHeight / 2;

        // 获取当前的缩放级别
        const currentZoom = getZoom();
        
        // 🎯 计算适合输入的缩放比例
        // 输入节点宽度600px，我们希望它在屏幕上显示得足够大以便输入
        // 目标：让输入框占屏幕宽度的35%左右，确保字体清晰可见
        const screenWidth = window.innerWidth;
        const displayWidth = screenWidth * 0.6; // 目标宽度为屏幕的60%，以获得更大放大倍数
        const optimalZoomFactor = Math.min(displayWidth / nodeWidth, 1.5); // 最大 1.5 倍
        
        // 选择合适的缩放比例：当前缩放和最优缩放中的较大值，但不超过 1.5 倍
        const finalZoom = Math.max(Math.min(currentZoom, 1.5), Math.max(optimalZoomFactor, 0.8));

        // 🎯 精确居中: 新节点会精确地出现在屏幕的正中央
        // 📏 智能缩放: 自动调整到便于输入的缩放比例
        setCenter(centerX, centerY, {
          zoom: finalZoom,   // 智能缩放：确保输入框足够大以便用户输入
          duration: 800,     // 🌊 流畅动画: 800ms 的丝滑动画
        });
        
        // 🎪 自动聚焦: 动画进行到一半时，输入框自动获得焦点
        setTimeout(() => {
          const inputElement = document.querySelector(`[data-id="${newNodeId}"] textarea`);
          if (inputElement) {
            (inputElement as HTMLTextAreaElement).focus();
          }
        }, 400); // 在800ms动画进行到一半时聚焦
      }
    }, 100); // 稍微延迟确保节点已经渲染和布局完成
  };

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );

  // 双指触摸拖动处理函数
  const handleTouchStart = useCallback((event: TouchEvent) => {
    if (event.touches.length === 2) {
      event.preventDefault();
      
      const touch1 = event.touches[0];
      const touch2 = event.touches[1];
      
      const centerX = (touch1.clientX + touch2.clientX) / 2;
      const centerY = (touch1.clientY + touch2.clientY) / 2;
      
      setTouchState({
        isTouching: true,
        touchCount: 2,
        lastTouchDistance: 0,
        initialTouches: [],
        lastPanPosition: { x: centerX, y: centerY },
      });
    }
  }, []);

  const handleTouchMove = useCallback((event: TouchEvent) => {
    if (event.touches.length === 2 && touchState.isTouching) {
      event.preventDefault();
      
      const touch1 = event.touches[0];
      const touch2 = event.touches[1];
      
      const centerX = (touch1.clientX + touch2.clientX) / 2;
      const centerY = (touch1.clientY + touch2.clientY) / 2;
      
      // 计算拖动距离
      const deltaX = centerX - touchState.lastPanPosition.x;
      const deltaY = centerY - touchState.lastPanPosition.y;
      
             // 更新画布位置 - 直接操作ReactFlow的viewport
       if (reactFlowWrapper.current && (Math.abs(deltaX) > 1 || Math.abs(deltaY) > 1)) {
        const reactFlowViewport = reactFlowWrapper.current.querySelector('.react-flow__viewport') as HTMLElement;
        if (reactFlowViewport) {
          // 获取当前的transform值
          const style = window.getComputedStyle(reactFlowViewport);
          const transform = style.transform;
          
          let currentX = 0;
          let currentY = 0;
          let currentScale = 1;
          
          if (transform && transform !== 'none') {
            const matrix = transform.match(/matrix.*\((.+)\)/);
            if (matrix) {
              const values = matrix[1].split(', ');
              currentX = parseFloat(values[4]) || 0;
              currentY = parseFloat(values[5]) || 0;
              currentScale = parseFloat(values[0]) || 1;
            }
          }
          
          const newX = currentX + deltaX;
          const newY = currentY + deltaY;
          
          reactFlowViewport.style.transform = `translate(${newX}px, ${newY}px) scale(${currentScale})`;
        }
      }
      
      setTouchState(prev => ({
        ...prev,
        lastPanPosition: { x: centerX, y: centerY },
      }));
    }
  }, [touchState]);

  const handleTouchEnd = useCallback((event: TouchEvent) => {
    if (event.touches.length < 2) {
      setTouchState({
        isTouching: false,
        touchCount: 0,
        lastTouchDistance: 0,
        initialTouches: [],
        lastPanPosition: { x: 0, y: 0 },
      });
    }
  }, []);

  // 添加和移除事件监听器
  useEffect(() => {
    const wrapper = reactFlowWrapper.current;
    if (wrapper) {
      wrapper.addEventListener('touchstart', handleTouchStart, { passive: false });
      wrapper.addEventListener('touchmove', handleTouchMove, { passive: false });
      wrapper.addEventListener('touchend', handleTouchEnd, { passive: false });
      
      return () => {
        wrapper.removeEventListener('touchstart', handleTouchStart);
        wrapper.removeEventListener('touchmove', handleTouchMove);
        wrapper.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  // 处理相关问题点击的新函数
  const handleRelatedQuestionClick = useCallback(async (parentNodeId: string, relatedQuestion: string) => {
    const newNodeId = getId();
    
    const newNode: Node = {
      id: newNodeId,
      type: 'markdown',
      position: { x: 0, y: 0 }, // 会被重新布局
      data: { question: relatedQuestion, label: '思考中...', finished: false },
    };

    const newEdge: Edge = { 
      id: `${parentNodeId}-${newNodeId}`, 
      source: parentNodeId, 
      target: newNodeId 
    };

    // 添加节点和边
    const layoutedNodes = layoutGraph([...nodes, newNode], [...edges, newEdge], orientation);
    setNodes(layoutedNodes);
    setEdges((eds) => eds.concat(newEdge));
    
    relayout();

    // 居中到新节点
    setTimeout(() => {
      const newNodeLayouted = layoutedNodes.find(node => node.id === newNodeId);
      if (newNodeLayouted) {
        const nodeWidth = 600;
        const nodeHeight = 200;
        const centerX = newNodeLayouted.position.x + nodeWidth / 2;
        const centerY = newNodeLayouted.position.y + nodeHeight / 2;
        const currentZoom = getZoom();

        setCenter(centerX, centerY, {
          zoom: currentZoom,
          duration: 800,
        });
      }
    }, 100);

    // 1️⃣ 更新并发送对话历史
    const historyForRequest = [...chatHistory, { role: 'user' as const, content: relatedQuestion }];
    setChatHistory(prev => [...prev, { role: 'user', content: relatedQuestion }]);
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: relatedQuestion, history: historyForRequest, model: selectedModel }),
    });

    if (!response.body) return;

    // 清空"思考中..."
    setNodes((currentNodes) =>
      currentNodes.map((node) => {
        if (node.id === newNodeId) {
          return { ...node, data: { ...node.data, label: '' } };
        }
        return node;
      })
    );

    // 处理流式响应
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    
    let assistantAnswer = '';
    const read = async () => {
      const { done, value } = await reader.read();
      if (done) {
        setNodes((currentNodes) =>
          currentNodes.map((node) => {
            if (node.id === newNodeId) {
              return { ...node, data: { ...node.data, finished: true } };
            }
            return node;
          })
        );
        
        // 答案完成后，获取相关问题
        try {
          const relatedResponse = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              prompt: relatedQuestion, 
              getRelatedQuestions: true,
              model: selectedModel
            }),
          });
          
          if (relatedResponse.ok) {
            const { relatedQuestions } = await relatedResponse.json();
            setNodes((currentNodes) =>
              currentNodes.map((node) => {
                if (node.id === newNodeId) {
                  return { 
                    ...node, 
                    data: { 
                      ...node.data, 
                      relatedQuestions: relatedQuestions 
                    } 
                  };
                }
                return node;
              })
            );
          }
        } catch (error) {
          console.error('Error fetching related questions:', error);
        }
        
        // 将模型回答追加到历史中
        setChatHistory(prev => [...prev, { role: 'assistant', content: assistantAnswer }]);
        relayout();
        return;
      }
      const chunk = decoder.decode(value, { stream: true });
      assistantAnswer += chunk;
      setNodes((currentNodes) =>
        currentNodes.map((node) => {
          if (node.id === newNodeId) {
            const newLabel = node.data.label + chunk;
            return { ...node, data: { ...node.data, label: newLabel } };
          }
          return node;
        })
      );
      read();
    };
    
    read();
  }, [nodes, edges, setNodes, setEdges, relayout, getZoom, setCenter, orientation, chatHistory, selectedModel]);

  const handleSubmit = async (event: FormEvent, question: string, nodeIdToReplace: string, parentNodeId: string, withWebSearch?: boolean) => {
    event.preventDefault();
    
    // 处理取消操作
    if (question === '__CANCEL__') {
      // 删除节点和相关连线
      setNodes((nds) => nds.filter(n => n.id !== nodeIdToReplace));
      setEdges((eds) => eds.filter(e => e.target !== nodeIdToReplace && e.source !== nodeIdToReplace));
      
      // 删除后重新布局
      relayout();
      return;
    }
    
    if (!question.trim()) return;

    // 找到要替换的input节点，保持其位置不变
    const inputNode = findNode(nodes, nodeIdToReplace);
    let newNodePosition: { x: number; y: number };
    
    if (inputNode) {
      // 如果找到input节点，使用其位置
      newNodePosition = inputNode.position;
    } else if (parentNodeId === 'root') {
      newNodePosition = { x: 0, y: 0 };
    } else {
      const parentNode = findNode(nodes, parentNodeId);
      if (!parentNode) return;
      // 备用逻辑：如果找不到input节点，按原来的方式计算位置
      newNodePosition = {
          x: parentNode.position.x,
          y: parentNode.position.y + 150,
      };
    }
    
    const newNode: Node = {
      id: nodeIdToReplace,
      type: 'markdown',
      position: newNodePosition,
      data: { question: question, label: '思考中...', finished: false },
    };

    // Replace the input node with the new markdown node
    setNodes((nds) => nds.map(n => n.id === nodeIdToReplace ? newNode : n));
    // 初步重新布局（节点内容尚在加载中）
    relayout();

    // 1️⃣ 更新并发送对话历史
    const historyForRequest2 = [...chatHistory, { role: 'user' as const, content: question }];
    setChatHistory(prev => [...prev, { role: 'user', content: question }]);
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: question, history: historyForRequest2, use_web_search: withWebSearch, model: selectedModel }),
    });

    if (!response.body) return;

    // Clear "Thinking..."
    setNodes((currentNodes) =>
        currentNodes.map((node) => {
          if (node.id === nodeIdToReplace) {
            return { ...node, data: { ...node.data, label: '' } };
          }
          return node;
        })
    );

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    
    let assistantAnswer2 = '';
    const read = async () => {
      const { done, value } = await reader.read();
      if (done) {
        setNodes((currentNodes) =>
            currentNodes.map((node) => {
              if (node.id === nodeIdToReplace) {
                return { ...node, data: { ...node.data, finished: true } };
              }
              return node;
            })
        );
        
        // 答案完成后，获取相关问题
        try {
          const relatedResponse = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              prompt: question, 
              getRelatedQuestions: true,
              model: selectedModel
            }),
          });
          
          if (relatedResponse.ok) {
            const { relatedQuestions } = await relatedResponse.json();
            setNodes((currentNodes) =>
              currentNodes.map((node) => {
                if (node.id === nodeIdToReplace) {
                  return { 
                    ...node, 
                    data: { 
                      ...node.data, 
                      relatedQuestions: relatedQuestions 
                    } 
                  };
                }
                return node;
              })
            );
          }
        } catch (error) {
          console.error('Error fetching related questions:', error);
        }
        
        // 将模型回答追加到历史中
        setChatHistory(prev => [...prev, { role: 'assistant', content: assistantAnswer2 }]);
        relayout();
        return;
      }
      const chunk = decoder.decode(value, { stream: true });
      assistantAnswer2 += chunk;
      setNodes((currentNodes) =>
        currentNodes.map((node) => {
          if (node.id === nodeIdToReplace) {
            const newLabel = node.data.label + chunk;
            return { ...node, data: { ...node.data, label: newLabel } };
          }
          return node;
        })
      );
      read();
    };
    
    read();
  };

  const handleInitialSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!question.trim()) return;

    const newNodeId = getId();
    const newNode: Node = {
      id: newNodeId,
      type: 'markdown',
      position: { x: 0, y: 0 },
      data: { question: question, label: '思考中...', finished: false },
    };

    setNodes([newNode]);
    setQuestion(''); // Reset input
    lastNodeId.current = newNodeId;
    relayout();

    // 🎯 立即将新创建的节点居中显示，设置适当的缩放倍数
    setTimeout(() => {
      // 使用 setNodes 回调获取最新的节点状态
      setNodes(currentNodes => {
        const actualNode = currentNodes.find(n => n.id === newNodeId);
        if (actualNode) {
          // 估算节点尺寸（因为此时可能还没完全渲染）
          const nodeWidth = 600; // 默认节点宽度
          const nodeHeight = 200; // 默认节点高度
          
          // 计算节点中心位置（基于实际位置）
          const centerX = actualNode.position.x + nodeWidth / 2;
          const centerY = actualNode.position.y + nodeHeight / 2;
          
          // 🎯 精确居中到屏幕正中央，设置适当的缩放倍数
          setCenter(centerX, centerY, {
            zoom: 1.2, // 适当的放大倍数，既能看清内容又不会太大
            duration: 800, // 流畅的动画效果
          });
        }
        return currentNodes; // 返回不变的节点数组
      });
    }, 150); // 稍微增加延迟确保 relayout 完成

    // 1️⃣ 更新并发送对话历史
    const historyForRequest3 = [...chatHistory, { role: 'user' as const, content: question }];
    setChatHistory(prev => [...prev, { role: 'user', content: question }]);
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: question, history: historyForRequest3, use_web_search: withWebSearch, model: selectedModel }),
    });

    if (!response.body) return;

    // Clear "Thinking..."
    setNodes((currentNodes) =>
        currentNodes.map((node) => {
          if (node.id === newNodeId) {
            return { ...node, data: { ...node.data, label: '' } };
          }
          return node;
        })
    );

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    
    let assistantAnswer3 = '';
    const read = async () => {
      const { done, value } = await reader.read();
      if (done) {
        setNodes((currentNodes) =>
            currentNodes.map((node) => {
              if (node.id === newNodeId) {
                return { ...node, data: { ...node.data, finished: true } };
              }
              return node;
            })
        );
        
        // 答案完成后，获取相关问题
        try {
          const relatedResponse = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              prompt: question, 
              getRelatedQuestions: true,
              model: selectedModel
            }),
          });
          
          if (relatedResponse.ok) {
            const { relatedQuestions } = await relatedResponse.json();
            setNodes((currentNodes) =>
              currentNodes.map((node) => {
                if (node.id === newNodeId) {
                  return { 
                    ...node, 
                    data: { 
                      ...node.data, 
                      relatedQuestions: relatedQuestions 
                    } 
                  };
                }
                return node;
              })
            );
          }
        } catch (error) {
          console.error('Error fetching related questions:', error);
        }
        
        // 将模型回答追加到历史中
        setChatHistory(prev => [...prev, { role: 'assistant', content: assistantAnswer3 }]);
        relayout();
        
        // 🎯 答案完成后，根据实际节点尺寸微调居中位置（保持当前缩放）
        setTimeout(() => {
          // 使用 setNodes 回调获取最新的节点状态
          setNodes(currentNodes => {
            const actualNode = currentNodes.find(n => n.id === newNodeId);
            if (!actualNode) return currentNodes;
            
            const nodeElement = document.querySelector(`[data-id="${newNodeId}"]`);
            const contentBox = nodeElement?.querySelector('.markdown-node');
            const measureTarget = (contentBox as HTMLElement) || (nodeElement as HTMLElement | null);
            
            let nodeWidth = 600;
            let nodeHeight = 200;
            
            if (measureTarget) {
              const rect = measureTarget.getBoundingClientRect();
              const scale = getViewportScale();
              nodeWidth = Math.max(rect.width / scale, 600);
              nodeHeight = Math.max(rect.height / scale, 200);
            }
            
            // 计算节点中心位置（基于实际位置）
            const centerX = actualNode.position.x + nodeWidth / 2;
            const centerY = actualNode.position.y + nodeHeight / 2;
            
            // 获取当前缩放级别，保持不变
            const currentZoom = getZoom();
            
            // 🎯 微调居中位置，保持当前缩放级别
            setCenter(centerX, centerY, {
              zoom: currentZoom, // 保持当前缩放级别
              duration: 500, // 较短的微调动画
            });
            
            return currentNodes; // 返回不变的节点数组
          });
        }, 200); // 延迟确保节点完全渲染
        return;
      }
      const chunk = decoder.decode(value, { stream: true });
      assistantAnswer3 += chunk;
      setNodes((currentNodes) =>
        currentNodes.map((node) => {
          if (node.id === newNodeId) {
            const newLabel = node.data.label + chunk;
            return { ...node, data: { ...node.data, label: newLabel } };
          }
          return node;
        })
      );
      read();
    };
    
    read();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleInitialSubmit(e as FormEvent);
    }
  };

  const deleteNode = (nodeIdToDelete: string) => {
    // 递归删除节点及其所有子节点
    const deleteNodeAndChildren = (nodeId: string) => {
      // 找到该节点的所有子节点
      const childEdges = edges.filter(edge => edge.source === nodeId);
      const childNodeIds = childEdges.map(edge => edge.target);
      
      // 递归删除所有子节点
      childNodeIds.forEach(childId => {
        deleteNodeAndChildren(childId);
      });
      
      // 删除当前节点和相关连线
      setNodes((nds) => nds.filter(n => n.id !== nodeId));
      setEdges((eds) => eds.filter(e => e.source !== nodeId && e.target !== nodeId));
    };
    
    deleteNodeAndChildren(nodeIdToDelete);
    // 删除后重新布局
    setTimeout(relayout, 50);
  };

  const focusOnNode = (nodeId: string) => {
    const targetNode = nodes.find(node => node.id === nodeId);
    if (!targetNode) return;

    // 获取节点的实际渲染尺寸
    const nodeElement = document.querySelector(`[data-id="${nodeId}"]`);
    const contentBox = nodeElement?.querySelector('.markdown-node');
    const measureTarget = (contentBox as HTMLElement) || (nodeElement as HTMLElement | null);
    
    let nodeWidth = 600;
    // 移除未使用的变量
    // let nodeHeight = 200;
    
    if (measureTarget) {
      const rect = measureTarget.getBoundingClientRect();
      const scale = getViewportScale();
      nodeWidth = Math.max(rect.width / scale, 600);
      // nodeHeight = Math.max(rect.height / scale, 200);
    }
    
    const viewportHeight = window.innerHeight;

    // 计算合适的缩放倍数让节点在视口中占据合适比例 - 重新使用与 addInputNode 相同算法
    const currentZoom = getZoom();
    const screenWidth = window.innerWidth;
    const displayWidth = screenWidth * 0.6; // 目标宽度为屏幕的60%
    const optimalZoomFactor = Math.min(displayWidth / nodeWidth, 1.5); // 最大1.5倍
    // finalZoom 逻辑：与 addInputNode 完全相同，且上限提升至 1.5
    const finalZoom = Math.max(Math.min(currentZoom, 1.5), Math.max(optimalZoomFactor, 0.8));
    
    // 计算让节点标题靠近视口顶部的中心坐标
    const desiredMargin = 60; // px margin from top
    const nodeTopWorldY = targetNode.position.y;
    const centerY = nodeTopWorldY + (viewportHeight / 2 - desiredMargin) / finalZoom;
    const centerX = targetNode.position.x + nodeWidth / 2;
    
    setCenter(centerX, centerY, {
      zoom: finalZoom,
      duration: 800,
    });
  };

  // 当布局方向改变时，重新布局现有节点
  useEffect(() => {
    relayout();
  }, [orientation, relayout]);

  return (
    <MindMapContext.Provider value={{ 
      addInputNode, 
      handleSubmit, 
      handleRelatedQuestionClick,
      deleteNode, 
      relayout,
      focusOnNode,
      orientation,
      toggleOrientation
    }}>
        <div 
          ref={reactFlowWrapper}
          style={{ 
            height: '100vh', 
            width: '100vw',
            position: 'relative',
            touchAction: 'none' // 禁用默认触摸行为
          }}
        >
        {/* 布局切换按钮 */}
        <button
          onClick={toggleOrientation}
          style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            zIndex: 1000,
            padding: '6px 12px',
            background: '#2563eb',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
          }}
        >
          {orientation === 'TB' ? '横向布局' : '纵向布局'}
        </button>
        <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChangeWithLayout}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            defaultEdgeOptions={defaultEdgeOptions}
            fitView
            className="mindmap-flow"
            proOptions={{ hideAttribution: true }}
            minZoom={0.05}
            panOnScroll
            zoomOnScroll={false}
            nodesDraggable={false}
        >
            <MiniMap nodeStrokeWidth={3} zoomable pannable />
            <Controls />
            <Background variant={BackgroundVariant.Cross} gap={18} size={1.5} color="#2a2a2a" />
        </ReactFlow>
        {nodes.length === 0 && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 w-full max-w-2xl px-4 text-center">
            <h1 className="text-4xl font-bold text-white mb-4">MindMap</h1>
            <p className="text-lg text-zinc-300 mb-8">你确定知道自己在问什么吗？</p>
            <div className="bg-zinc-900/70 border border-zinc-700/50 rounded-2xl p-4 text-left">
              <form onSubmit={handleInitialSubmit}>
                <textarea
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="输入您的问题"
                  className="w-full bg-transparent focus:outline-none text-white text-lg resize-none"
                  rows={1}
                />
                <div className="flex justify-between items-center mt-4">
                  <div className="flex gap-2">
                    <select
                      value={selectedModel}
                      onChange={(e) => setSelectedModel(e.target.value as 'deepseek' | 'wenxin')}
                      className="bg-zinc-800 text-zinc-300 border border-zinc-600 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500"
                    >
                      <option value="deepseek">DeepSeek</option>
                      <option value="wenxin">文心一言</option>
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setWithWebSearch(!withWebSearch)}
                      className={`flex items-center px-3 py-1.5 rounded-lg text-sm transition-colors ${
                        withWebSearch
                          ? 'bg-blue-500/80 text-white'
                          : 'bg-zinc-800 text-zinc-400'
                      }`}
                    >
                      <GlobeIcon />
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}
        </div>
    </MindMapContext.Provider>
  );
}

// 主组件，包装 ReactFlowProvider
function MindMapCanvas() {
  return (
    <ReactFlowProvider>
      <MindMapFlow />
    </ReactFlowProvider>
  );
}

export default React.memo(MindMapCanvas); 
