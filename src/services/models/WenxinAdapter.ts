import { ModelAdapter, ChatMessage } from './ModelAdapter';

export class WenxinAdapter implements ModelAdapter {
  private apiKey: string | undefined;
  private secretKey: string | undefined;
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;
  
  constructor() {
    this.apiKey = process.env.WENXIN_API_KEY;
    this.secretKey = process.env.WENXIN_SECRET_KEY;
  }
  
  isConfigured(): boolean {
    return !!this.apiKey && !!this.secretKey;
  }
  
  getModelName(): string {
    return 'wenxin';
  }
  
  // 获取文心一言access token
  private async getAccessToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    if (!this.apiKey || !this.secretKey) {
      throw new Error('WENXIN_API_KEY and WENXIN_SECRET_KEY are required');
    }

    const response = await fetch(
      `https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=${this.apiKey}&client_secret=${this.secretKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to get Wenxin access token');
    }

    const data = await response.json();
    this.accessToken = data.access_token;
    this.tokenExpiry = Date.now() + (data.expires_in - 300) * 1000; // 提前5分钟刷新
    
    return this.accessToken!;
  }
  
  // 将OpenAI格式消息转换为文心一言格式
  private convertMessages(messages: ChatMessage[]): any[] {
    return messages.map(msg => ({
      role: msg.role === 'assistant' ? 'assistant' : 'user',
      content: msg.content
    }));
  }
  
  async generateCompletion(messages: ChatMessage[], stream: boolean): Promise<Response> {
    const accessToken = await this.getAccessToken();
    const wenxinMessages = this.convertMessages(messages);
    
    const response = await fetch(
      `https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/completions?access_token=${accessToken}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: wenxinMessages,
          stream: stream,
          temperature: 0.7,
          max_output_tokens: 2048,
        }),
      }
    );

    if (!response.ok) {
      throw new Error('Failed to call Wenxin API');
    }
    
    if (!stream) {
      const data = await response.json();
      const text = data.result || '';
      return new Response(text, {
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      });
    }
    
    // 处理流式响应
    const readableStream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        const reader = response.body?.getReader();
        
        if (!reader) {
          controller.close();
          return;
        }

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = new TextDecoder().decode(value);
            const lines = chunk.split('\n');
            
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') {
                  controller.close();
                  return;
                }
                
                try {
                  const parsed = JSON.parse(data);
                  const text = parsed.result || '';
                  if (text) {
                    controller.enqueue(encoder.encode(text));
                  }
                } catch (e) {
                  // 忽略解析错误
                }
              }
            }
          }
        } catch (error) {
          console.error('Error reading Wenxin stream:', error);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readableStream, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }
  
  async generateRelatedQuestions(messages: ChatMessage[]): Promise<string> {
    const accessToken = await this.getAccessToken();
    const wenxinMessages = this.convertMessages(messages);
    
    const response = await fetch(
      `https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/completions?access_token=${accessToken}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: wenxinMessages,
          stream: false,
          temperature: 0.7,
          max_output_tokens: 2048,
        }),
      }
    );

    if (!response.ok) {
      throw new Error('Failed to call Wenxin API');
    }
    
    const data = await response.json();
    return data.result || '';
  }
}
