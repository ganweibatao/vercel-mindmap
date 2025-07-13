import { ModelAdapter, ChatMessage } from './ModelAdapter';
import OpenAI from 'openai';

export class DeepSeekAdapter implements ModelAdapter {
  private client: OpenAI | null;
  private modelName: string = 'deepseek-chat';
  
  constructor() {
    const apiKey = process.env.DEEPSEEK_API_KEY;
    this.client = apiKey ? new OpenAI({
      apiKey,
      baseURL: 'https://api.deepseek.com',
    }) : null;
  }
  
  isConfigured(): boolean {
    return this.client !== null;
  }
  
  getModelName(): string {
    return 'deepseek';
  }
  
  async generateCompletion(messages: ChatMessage[], stream: boolean): Promise<Response> {
    if (!this.client) {
      throw new Error('DeepSeek API key is not configured');
    }
    
    if (!stream) {
      // 非流式响应
      const response = await this.client.chat.completions.create({
        model: this.modelName,
        messages,
        stream: false,
      });
      
      const text = response.choices[0]?.message?.content || '';
      return new Response(text, {
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      });
    }
    
    // 流式响应
    const streamResponse = await this.client.chat.completions.create({
      model: this.modelName,
      messages,
      stream: true,
    });

    const readableStream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        for await (const chunk of streamResponse) {
          const text = chunk.choices[0]?.delta?.content || '';
          if (text) {
            controller.enqueue(encoder.encode(text));
          }
        }
        controller.close();
      },
    });

    return new Response(readableStream, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }
  
  async generateRelatedQuestions(messages: ChatMessage[]): Promise<string> {
    if (!this.client) {
      throw new Error('DeepSeek API key is not configured');
    }
    
    const response = await this.client.chat.completions.create({
      model: this.modelName,
      messages,
      stream: false,
    });
    
    return response.choices[0]?.message?.content || '';
  }
}