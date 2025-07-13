import { createContext, FormEvent } from 'react';

export interface MindMapContextType {
  addInputNode: (parentNodeId: string) => void;
  handleSubmit: (event: FormEvent, question: string, nodeIdToReplace: string, parentNodeId: string, withWebSearch?: boolean) => Promise<void>;
  handleRelatedQuestionClick: (parentNodeId: string, relatedQuestion: string) => Promise<void>;
  deleteNode: (nodeId: string) => void;
  relayout: () => void;
  focusOnNode: (nodeId: string) => void;
  /** 当前布局方向，'TB' 为纵向，'LR' 为横向 */
  orientation: 'TB' | 'LR';
  /** 切换布局方向 */
  toggleOrientation: () => void;
}

export const MindMapContext = createContext<MindMapContextType | null>(null); 