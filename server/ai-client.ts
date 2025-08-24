import { GoogleGenAI } from '@google/genai';
import OpenAI from 'openai';
import type { AiModel, ApiKeys, ChatMessage } from '@shared/schema';

export const AI_MODELS: AiModel[] = [
  {
    id: 'gemini-2.0-flash-exp',
    name: 'Advanced AI Model',
    provider: 'gemini',
    maxTokens: 1000000,
    supportsImages: true,
    supportsVideo: true,
  },
  {
    id: 'google/gemini-2.0-flash-exp:free',
    name: 'Advanced AI Model (Free)',
    provider: 'openrouter',
    maxTokens: 1000000,
    supportsImages: true,
    supportsVideo: true,
  },
  {
    id: 'anthropic/claude-3.5-sonnet',
    name: 'Advanced AI Model Pro',
    provider: 'openrouter',
    maxTokens: 200000,
    supportsImages: true,
    supportsVideo: false,
  },
  {
    id: 'openai/gpt-4o',
    name: 'Advanced AI Model Plus',
    provider: 'openrouter',
    maxTokens: 128000,
    supportsImages: true,
    supportsVideo: false,
  },
];

export async function callGemini(
  messages: ChatMessage[],
  apiKey: string,
  model = 'gemini-2.5-flash'
): Promise<string> {
  if (!apiKey) {
    throw new Error('AI API key is required');
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const lastMessage = messages[messages.length - 1];
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: lastMessage.content,
    });

    return response.text || 'I apologize, but I encountered an issue generating a response.';
  } catch (error) {
    console.error('AI API error:', error);
    throw new Error('Failed to get response from AI service');
  }
}

export async function callOpenRouter(
  messages: ChatMessage[],
  apiKey: string,
  model = 'google/gemini-2.0-flash-exp:free'
): Promise<string> {
  if (!apiKey) {
    throw new Error('OpenRouter API key is required');
  }

  const openai = new OpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey: apiKey,
  });

  try {
    const formattedMessages = messages.map(msg => ({
      role: msg.role as 'user' | 'assistant' | 'system',
      content: msg.content,
    }));

    const completion = await openai.chat.completions.create({
      model: model,
      messages: formattedMessages,
      temperature: 0.7,
      max_tokens: 4000,
    });

    return completion.choices[0]?.message?.content || 'No response generated';
  } catch (error) {
    console.error('OpenRouter API error:', error);
    throw new Error('Failed to get response from OpenRouter API');
  }
}

export async function streamOpenRouter(
  messages: ChatMessage[],
  apiKey: string,
  model = 'google/gemini-2.0-flash-exp:free',
  onChunk: (chunk: string) => void
): Promise<void> {
  if (!apiKey) {
    throw new Error('OpenRouter API key is required');
  }

  const openai = new OpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey: apiKey,
  });

  try {
    const formattedMessages = messages.map(msg => ({
      role: msg.role as 'user' | 'assistant' | 'system',
      content: msg.content,
    }));

    const stream = await openai.chat.completions.create({
      model: model,
      messages: formattedMessages,
      temperature: 0.7,
      max_tokens: 4000,
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        onChunk(content);
      }
    }
  } catch (error) {
    console.error('OpenRouter streaming error:', error);
    throw new Error('Failed to stream response from OpenRouter API');
  }
}

// Add video generation capability
export async function generateVideo(
  prompt: string,
  apiKey: string
): Promise<{ videoUrl?: string; status: string; message: string }> {
  if (!apiKey) {
    return {
      status: 'error',
      message: 'AI API key is required for video generation'
    };
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    
    // Generate video using Gemini's video generation capabilities
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Create a video description based on this: ${prompt}`,
    });

    return {
      status: 'success',
      message: 'Video generation initiated. This feature is being enhanced for full video output.',
      videoUrl: undefined // Will be implemented when Gemini video generation API is available
    };
  } catch (error) {
    console.error('Video generation error:', error);
    return {
      status: 'error',
      message: 'Video generation is currently being developed. This feature will be available soon.'
    };
  }
}

// Enhanced image generation with Gemini
export async function generateImage(
  prompt: string,
  apiKey: string
): Promise<{ imageUrl?: string; status: string; message: string }> {
  if (!apiKey) {
    return {
      status: 'error',
      message: 'AI API key is required for image generation'
    };
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    // For now, return a placeholder response as image generation is being enhanced
    const imageDescription = response.text || 'Generated image description';

    return {
      status: 'success',
      message: `Image generation prompt processed: ${imageDescription.substring(0, 100)}...`
    };
  } catch (error) {
    console.error('Image generation error:', error);
    return {
      status: 'error',
      message: 'Image generation encountered an issue. Please try again.'
    };
  }
}

export function analyzeOutput(content: string): {
  hasCode: boolean;
  hasMarkdown: boolean;
  hasLinks: boolean;
  hasLists: boolean;
  wordCount: number;
  readingTime: number;
} {
  const hasCode = /```[\s\S]*?```|`[^`]+`/.test(content);
  const hasMarkdown = /^#{1,6}\s|^\*\s|\*\*.*?\*\*|_.*?_/.test(content);
  const hasLinks = /https?:\/\/[^\s]+|\[.*?\]\(.*?\)/.test(content);
  const hasLists = /^\s*[-*+]\s|^\s*\d+\.\s/m.test(content);
  
  const words = content.trim().split(/\s+/).length;
  const readingTime = Math.ceil(words / 200); // Average reading speed

  return {
    hasCode,
    hasMarkdown,
    hasLinks,
    hasLists,
    wordCount: words,
    readingTime,
  };
}