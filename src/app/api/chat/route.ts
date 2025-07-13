import { NextRequest } from 'next/server';
import { ChatService } from '@/services/ChatService';
import { ChatMessage } from '@/services/models/ModelAdapter';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    // 解析请求参数
    const { 
      prompt, 
      history = [], 
      getRelatedQuestions = false, 
      model = 'deepseek' 
    } = await req.json();

    // 验证必要参数
    if (!prompt) {
      return new Response('Prompt is required', { status: 400 });
    }

    // 将历史记录转换为标准格式
    const chatHistory: ChatMessage[] = history.map((msg: any) => ({
      role: msg.role,
      content: msg.content
    }));

    try {
      // 处理相关问题请求
      if (getRelatedQuestions) {
        const questions = await ChatService.generateRelatedQuestions(
          prompt,
          chatHistory,
          model
        );
        
        return new Response(
          JSON.stringify({ relatedQuestions: questions }),
          { headers: { 'Content-Type': 'application/json' } }
        );
      }
      
      // 处理常规聊天请求
      const response = await ChatService.generateChatResponse(
        prompt,
        chatHistory,
        model,
        true // 使用流式响应
      );
      
      return response;
      
    } catch (error: any) {
      // 处理特定错误
      if (error.message.includes('not configured')) {
        return new Response(error.message, { status: 400 });
      }
      throw error; // 重新抛出其他错误
    }

  } catch (error) {
    console.error('Error from AI service:', error);
    return new Response('Error from upstream AI service', { status: 500 });
  }
} 
