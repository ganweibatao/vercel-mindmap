import React, { memo, useState, useContext, FormEvent, useMemo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { MindMapContext, MindMapContextType } from '@/contexts/MindMapContext';

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

const InputNode = ({ id, data }: NodeProps) => {
  const [question, setQuestion] = useState('');
  const [withWebSearch, setWithWebSearch] = useState(false);
  const { handleSubmit, orientation } = useContext(MindMapContext) as MindMapContextType;
  const { parentId, isRoot } = data as { parentId: string, isRoot?: boolean };

  const targetPos = orientation === 'LR' ? Position.Left : Position.Top;
  const sourcePos = orientation === 'LR' ? Position.Right : Position.Bottom;

  // 生成与节点 id 绑定的随机灰色磨砂背景色，确保同一节点多次渲染颜色保持一致
  const frostedBg = useMemo(() => {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    const blue = 30 + (hash % 10); // 30-39 深蓝灰
    return `rgb(15, 15, ${blue})`;
  }, [id]);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (question.trim()) {
      handleSubmit(e, question, id, parentId, withWebSearch);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (question.trim()) {
        const fakeEvent = {
          preventDefault: () => {},
        } as FormEvent;
        handleSubmit(fakeEvent, question, id, parentId, withWebSearch);
      }
    }
  };

  const handleCancel = () => {
    // 通过设置一个特殊的提交来删除节点
    const fakeEvent = {
      preventDefault: () => {},
    } as FormEvent;
    handleSubmit(fakeEvent, '__CANCEL__', id, parentId);
  };

  return (
    <div
      className={`
        node-input p-4 rounded-2xl shadow-lg border-2 border-zinc-700/50 backdrop-blur-sm
        ${isRoot ? 'w-[700px] p-6' : 'w-[600px] p-4'}
      `}
      style={{
        background: frostedBg,
        boxShadow: isRoot
          ? '0 10px 32px rgba(0,0,0,0.2)'
          : '0 4px 12px rgba(0,0,0,0.1)',
      }}
    >
      <Handle type="target" position={targetPos} isConnectable={!isRoot} />
      <form onSubmit={onSubmit} className="w-full">
        <div className="relative w-full">
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isRoot ? '你正在颠覆传统的探索问题...' : '提出一个跟进的问题...'
            }
            className={`
              w-full bg-zinc-900/70 border border-blue-500/50 rounded-lg p-3
              text-white placeholder-zinc-400 focus:outline-none focus:ring-2
              focus:ring-blue-500/70 resize-none
              ${isRoot ? 'h-28 text-lg' : 'h-20 text-base'}
            `}
          />
        </div>
        <div className="flex items-center justify-between mt-4">
          {/* Left side button */}
          <button
            type="button"
            onClick={() => setWithWebSearch(!withWebSearch)}
            className={`flex items-center justify-center px-5 py-3 rounded-lg text-base transition-colors ${
              withWebSearch
                ? 'bg-blue-600/90 text-white'
                : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
            }`}
          >
            <GlobeIcon />
          </button>

          {/* Right side buttons */}
          <div className="flex items-center space-x-3">
            {!isRoot && (
              <button
                type="button"
                onClick={handleCancel}
                className="px-5 py-3 rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors text-base"
              >
                取消
              </button>
            )}
            <button
              type="submit"
              className="px-6 py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors disabled:bg-zinc-600 disabled:cursor-not-allowed text-base"
              disabled={!question.trim()}
            >
              提问
            </button>
          </div>
        </div>
      </form>
      <Handle type="source" position={sourcePos} isConnectable={false} />
    </div>
  );
};

export default memo(InputNode); 