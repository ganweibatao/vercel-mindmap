# AI 模型服务架构

本文档介绍了项目中AI模型服务的架构设计和使用方法。

## 架构概述

我们使用了适配器模式和工厂模式来设计AI模型服务，主要组件包括：

- `ModelAdapter`: 所有模型适配器必须实现的接口
- `DeepSeekAdapter`: DeepSeek模型的适配器实现
- `WenxinAdapter`: 文心一言模型的适配器实现
- `ModelFactory`: 负责创建和管理模型适配器实例
- `ChatService`: 提供高级聊天功能的服务类

## 使用方法

### 在API路由中使用

```typescript
import { ChatService } from '@/services/ChatService';
import { ChatMessage } from '@/services/models/ModelAdapter';

// 生成聊天回复
const response = await ChatService.generateChatResponse(
  "用户问题",
  previousMessages, // 聊天历史
  "deepseek",      // 模型名称
  true             // 是否使用流式响应
);

// 生成相关问题
const questions = await ChatService.generateRelatedQuestions(
  "用户问题",
  previousMessages, // 聊天历史
  "deepseek"       // 模型名称
);

// 获取所有可用模型
const availableModels = ChatService.getAvailableModels();
```

### 添加新模型

1. 创建新的适配器类，实现`ModelAdapter`接口
2. 在`ModelFactory`中添加新模型的case
3. 在环境变量中添加新模型的API密钥

## 错误处理

- 如果模型未配置，会抛出包含"not configured"的错误
- 如果模型不支持，会抛出包含"Unsupported model"的错误
- 其他API调用错误会被传递给调用者

## 环境变量

- `DEEPSEEK_API_KEY`: DeepSeek模型的API密钥
- `WENXIN_API_KEY`: 文心一言的API密钥
- `WENXIN_SECRET_KEY`: 文心一言的密钥