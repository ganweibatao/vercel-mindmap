# AI Mind Map with Multi-Model Support

This is a [Next.js](https://nextjs.org) project that creates an interactive mind map powered by multiple AI models including DeepSeek and Wenxin (文心一言).

## Features

- Interactive mind map visualization using ReactFlow
- Multiple AI model support (DeepSeek, Wenxin/文心一言)
- **Web Search Integration** - DuckDuckGo search powered responses
- Model selection interface
- Real-time streaming responses
- Related questions generation
- Modern UI with Tailwind CSS

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure AI Models:**
   - Copy `.env.example` to `.env.local`
   - **For DeepSeek:** Get your API key from [DeepSeek Platform](https://platform.deepseek.com/api_keys)
   - **For Wenxin (文心一言):** Get your API credentials from [Baidu AI Cloud](https://console.bce.baidu.com/qianfan/ais/console/applicationConsole/application)
   - Fill in the appropriate API keys in `.env.local`

3. **Run the development server:**
   ```bash
   npm run dev
   ```

4. **Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.**

## API Configuration

This project supports multiple AI models. The configuration is in `src/app/api/chat/route.ts`:

### DeepSeek API
- **Model**: `deepseek-chat` (DeepSeek V3)
- **Base URL**: `https://api.deepseek.com`
- **Authentication**: API Key

### Wenxin API (文心一言)
- **Model**: `ERNIE-Bot` series
- **Base URL**: `https://aip.baidubce.com`
- **Authentication**: API Key + Secret Key (OAuth 2.0)

Both models support:
- **Streaming**: Enabled for real-time responses
- **Chat History**: Context-aware conversations
- **Related Questions**: Auto-generated follow-up questions
- **Web Search**: DuckDuckGo integration for up-to-date information

## Web Search Feature

The application includes integrated web search functionality powered by DuckDuckGo:

### How it works:
1. **Toggle Search**: Click the "联网" (Web Search) button when asking questions
2. **Automatic Search**: The system searches DuckDuckGo for relevant information
3. **Enhanced Responses**: AI models use search results to provide more accurate, up-to-date answers
4. **No API Keys Required**: DuckDuckGo search works without additional configuration

### Search Implementation:
- Uses DuckDuckGo's instant answer API
- Fallback mechanisms for reliability
- Results are formatted and integrated into AI prompts
- Supports both Chinese and English queries

### Testing:
Visit `/test-search` to test the search functionality independently.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
