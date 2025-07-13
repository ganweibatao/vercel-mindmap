import { ChatMessage } from './models/ModelAdapter';
import { ModelFactory } from './models/ModelFactory';

export class ChatService {
  // 生成聊天回复
  static async generateChatResponse(
    prompt: string,
    history: ChatMessage[],
    modelName: string,
    stream: boolean = true
  ): Promise<Response> {
    const adapter = ModelFactory.getModelAdapter(modelName);
    
    if (!adapter.isConfigured()) {
      throw new Error(`${modelName} API is not configured properly`);
    }
    
    const messages = [...history, { role: 'user', content: prompt }];
    return await adapter.generateCompletion(messages, stream);
  }
  
  // 生成相关问题
  static async generateRelatedQuestions(
    prompt: string,
    history: ChatMessage[],
    modelName: string
  ): Promise<string> {
    const adapter = ModelFactory.getModelAdapter(modelName);
    
    if (!adapter.isConfigured()) {
      throw new Error(`${modelName} API is not configured properly`);
    }
    
    const relatedQuestionsPrompt = `基于这个问题："${prompt}"，请生成2个相关的后续问题，这些问题应该：
1. 与原问题相关但从不同角度深入
2. 能够帮助用户更深入地理解这个话题
3. 简洁明了，易于理解
请只返回问题列表，不要其他说明文字。`;

    const messages = [...history, { role: 'user', content: relatedQuestionsPrompt }];
    return await adapter.generateRelatedQuestions(messages);
  }
  
  // 获取所有可用的模型名称
  static getAvailableModels(): string[] {
    const adapters = ModelFactory.getConfiguredAdapters();
    return adapters.map(adapter => adapter.getModelName());
  }
}