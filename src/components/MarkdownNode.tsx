'use client';

import React, { memo, useState, useContext, useMemo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import MDXRenderer from './MDXRenderer';
import { MindMapContext, MindMapContextType } from '@/contexts/MindMapContext';

// The component accepts the full NodeProps from ReactFlow
const MarkdownNode = ({ id, data }: NodeProps) => {
  const { question, label, finished, relatedQuestions } = data as { 
    question: string, 
    label: string, 
    finished?: boolean,
    relatedQuestions?: string 
  };
  const [isHovered, setIsHovered] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { addInputNode, deleteNode, relayout, handleRelatedQuestionClick, focusOnNode, orientation } = useContext(MindMapContext) as MindMapContextType;

  // 根据布局方向确定 Handle 位置
  const targetPos = orientation === 'LR' ? Position.Left : Position.Top;
  const sourcePos = orientation === 'LR' ? Position.Right : Position.Bottom;

  const handleDelete = () => {
    deleteNode(id);
  };

  // 解析相关问题字符串为数组
  const parseRelatedQuestions = (questionsStr: string): string[] => {
    if (!questionsStr) return [];
    return questionsStr
      .split('\n')
      .map(q => q.replace(/^•\s*/, '').trim())
      .filter(q => q.length > 0);
  };

  const relatedQuestionsArray = parseRelatedQuestions(relatedQuestions || '');

  const handleRelatedQuestionPress = (relatedQuestion: string) => {
    handleRelatedQuestionClick(id, relatedQuestion);
  };

  // 生成与节点 id 绑定的随机灰色磨砂背景色，确保同一节点多次渲染颜色保持一致
  const frostedBg = useMemo(() => {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    const blue = 40 + (hash % 10); // 30-39 深蓝灰
    return `rgb(15, 15, ${blue})`;
  }, [id]);

  return (
    <div
      className="markdown-node-wrapper"
      style={{
        position: 'relative'
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 主内容盒子 */}
      <div
        style={{
          background: frostedBg,
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '16px',
          padding: '15px',
          fontSize: 'calc(14px / max(var(--flow-scale, 1), 1))',
          width: '600px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
          cursor: 'pointer',
          color: '#ffffff',
        }}
        className="markdown-node"
        onClick={(e) => {
          // 只有当点击的是节点主体内容时才触发缩放，避免按钮点击冲突
          const target = e.target as HTMLElement;
          const isButton = target.closest('button');
          if (!isButton) {
            focusOnNode(id);
          }
        }}
      >
        <Handle type="target" position={targetPos} />
        
        {/* 删除按钮 */}
        {isHovered && (
          <button
            onClick={handleDelete}
            style={{
              position: 'absolute',
              top: '5px',
              right: '5px',
              width: '20px',
              height: '20px',
              border: 'none',
              borderRadius: '50%',
              background: '#ff4444',
              color: 'white',
              cursor: 'pointer',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10,
            }}
            title="删除节点"
          >
            ×
          </button>
        )}
        
        <div style={{ 
          fontWeight: 'bold', 
          marginBottom: '10px', 
          borderBottom: '1px solid #eee', 
          paddingBottom: '10px', 
          fontSize: '26px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <span>{question}</span>
          {finished && label && (
            <button
              onClick={() => {
                setIsCollapsed(!isCollapsed);
                // 在状态改变后延迟触发重新布局，确保DOM已更新
                setTimeout(() => {
                  relayout();
                }, 50);
              }}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '14px',
                color: '#ccc',
                padding: '2px 4px',
                borderRadius: '3px',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'none';
              }}
              title={isCollapsed ? '展开答案' : '折叠答案'}
            >
              {isCollapsed ? '▶' : '▼'}
            </button>
          )}
        </div>
        
        {!isCollapsed && (
          <MDXRenderer content={label} />
        )}

        {/* 相关问题部分 */}
        {finished && relatedQuestionsArray.length > 0 && !isCollapsed && (
          <div style={{
            marginTop: '15px',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            paddingTop: '15px'
          }}>
            <div style={{
              fontSize: '12px',
              color: '#aaa',
              marginBottom: '8px',
              fontWeight: '500'
            }}>
              💡 相关问题
            </div>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
            }}>
              {relatedQuestionsArray.map((relatedQuestion, index) => (
                <button
                  key={index}
                  onClick={() => handleRelatedQuestionPress(relatedQuestion)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    fontSize: '12px',
                    color: '#ddd',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.2s ease',
                    lineHeight: '1.4'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  {relatedQuestion}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 底部源 Handle + 跟进提问按钮，放在内容盒子下方，避免线条穿过按钮 */}
      <Handle
        type="source"
        position={sourcePos}
        style={
          orientation === 'LR'
            ? { right: 0, left: 'auto' }
            : { bottom: 0, top: 'auto' }
        }
      />

      {/* 只有答案生成完毕并且 hover 时才显示按钮 */}
      {finished && isHovered && (
        <button
          onClick={() => addInputNode(id)}
          style={{
            position: 'absolute',
            bottom: '0px',
            left: '50%',
            transform: 'translateX(-50%) translateY(40%)',
            padding: '8px 15px',
            background: '#333',
            color: 'white',
            border: 'none',
            borderRadius: '20px',
            cursor: 'pointer',
            fontSize: '12px',
            whiteSpace: 'nowrap',
            boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
            zIndex: 10,
          }}
        >
          继续提问
        </button>
      )}
    </div>
  );
};

export default memo(MarkdownNode); 
