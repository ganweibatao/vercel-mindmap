import { ModelAdapter } from './ModelAdapter';
import { DeepSeekAdapter } from './DeepSeekAdapter';
import { WenxinAdapter } from './WenxinAdapter';

export class ModelFactory {
  // 缓存已创建的适配器实例
  private static adapters: Map<string, ModelAdapter> = new Map();
  
  // 获取模型适配器实例
  static getModelAdapter(modelName: string): ModelAdapter {
    // 检查缓存中是否已有此适配器
    if (this.adapters.has(modelName)) {
      return this.adapters.get(modelName)!;
    }
    
    // 创建新的适配器实例
    let adapter: ModelAdapter;
    
    switch (modelName.toLowerCase()) {
      case 'deepseek':
        adapter = new DeepSeekAdapter();
        break;
      case 'wenxin':
        adapter = new WenxinAdapter();
        break;
      // 未来可以在这里添加更多模型
      default:
        throw new Error(`Unsupported model: ${modelName}`);
    }
    
    // 缓存适配器实例
    this.adapters.set(modelName, adapter);
    return adapter;
  }
  
  // 获取所有已配置的模型适配器
  static getConfiguredAdapters(): ModelAdapter[] {
    const adapters: ModelAdapter[] = [];
    
    // 检查DeepSeek
    try {
      const deepseek = new DeepSeekAdapter();
      if (deepseek.isConfigured()) {
        adapters.push(deepseek);
      }
    } catch (e) {
      console.warn('DeepSeek adapter initialization failed:', e);
    }
    
    // 检查文心一言
    try {
      const wenxin = new WenxinAdapter();
      if (wenxin.isConfigured()) {
        adapters.push(wenxin);
      }
    } catch (e) {
      console.warn('Wenxin adapter initialization failed:', e);
    }
    
    return adapters;
  }
}