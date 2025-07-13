// 定义统一的消息格式
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

// 模型适配器接口 - 所有模型实现的统一接口
export interface ModelAdapter {
  // 检查模型是否配置正确
  isConfigured(): boolean;
  
  // 生成聊天回复（流式或非流式）
  generateCompletion(messages: ChatMessage[], stream: boolean): Promise<Response>;
  
  // 生成相关问题
  generateRelatedQuestions(messages: ChatMessage[]): Promise<string>;
  
  // 获取模型名称
  getModelName(): string;
}