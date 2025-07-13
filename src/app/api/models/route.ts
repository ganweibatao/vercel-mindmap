import { NextRequest } from 'next/server';
import { ChatService } from '@/services/ChatService';

export const runtime = 'edge';

export async function GET() {
  try {
    const availableModels = ChatService.getAvailableModels();
    
    return new Response(
      JSON.stringify({ models: availableModels }),
      { 
        headers: { 'Content-Type': 'application/json' },
        status: 200
      }
    );
  } catch (error) {
    console.error('Error getting available models:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to get available models' }),
      { 
        headers: { 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
}