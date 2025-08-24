import type { ChatMessage, AiModel } from "@shared/schema";

export const AI_MODELS: AiModel[] = [
  {
    id: 'gemini-2.0-flash-exp',
    name: 'Elora AI Pro - Premium Model',
    provider: 'gemini',
    maxTokens: 2000000,
    supportsImages: true,
    supportsVideo: true,
    features: ['unlimited_messages', 'faster_image_creation', 'maximum_memory', 'deep_research']
  },
  {
    id: 'google/gemini-2.0-flash-exp:free',
    name: 'Elora AI - Advanced Model',
    provider: 'openrouter',
    maxTokens: 1000000,
    supportsImages: true,
    supportsVideo: true,
    features: ['unlimited_messages', 'expanded_projects']
  },
  {
    id: 'anthropic/claude-3.5-sonnet',
    name: 'Elora AI Plus - Claude Enhanced',
    provider: 'openrouter',
    maxTokens: 500000,
    supportsImages: true,
    supportsVideo: false,
    features: ['maximum_context', 'deep_research', 'codex_agent']
  },
  {
    id: 'openai/gpt-4o',
    name: 'Elora AI Ultra - GPT Enhanced',
    provider: 'openrouter',
    maxTokens: 256000,
    supportsImages: true,
    supportsVideo: false,
    features: ['expanded_codex', 'custom_models']
  },
  {
    id: 'meta-llama/llama-3.3-70b-instruct',
    name: 'Elora AI Llama - Code Specialist',
    provider: 'openrouter',
    maxTokens: 128000,
    supportsImages: false,
    supportsVideo: false,
    features: ['codex_agent', 'expanded_projects']
  },
  {
    id: 'qwen/qwen-2.5-coder-32b-instruct',
    name: 'Elora AI Coder - Programming Expert',
    provider: 'openrouter',
    maxTokens: 128000,
    supportsImages: false,
    supportsVideo: false,
    features: ['codex_agent', 'custom_models']
  }
];

export async function sendChatMessage(
  messages: ChatMessage[],
  model: string = 'gemini-2.0-flash-exp',
  files?: File[]
): Promise<string> {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messages,
      model,
      files: files ? await Promise.all(files.map(f => fileToBase64(f))) : undefined,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to send message');
  }

  return await response.text();
}

export async function streamChatMessage(
  messages: ChatMessage[],
  model: string = 'gemini-2.0-flash-exp',
  onChunk: (chunk: string) => void
): Promise<void> {
  const response = await fetch('/api/chat/stream', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messages,
      model,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to stream message');
  }

  const reader = response.body?.getReader();
  if (!reader) return;

  const decoder = new TextDecoder();
  
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const chunk = decoder.decode(value);
      onChunk(chunk);
    }
  } finally {
    reader.releaseLock();
  }
}

export async function processFiles(files: File[]): Promise<any[]> {
  const formData = new FormData();
  files.forEach(file => {
    formData.append('files', file);
  });

  const response = await fetch('/api/files/process', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Failed to process files');
  }

  return await response.json();
}

export function textToSpeech(text: string): void {
  if ('speechSynthesis' in window) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 0.8;
    speechSynthesis.speak(utterance);
  }
}

// Premium feature: Enhanced image generation with diffusers
export async function generateImageWithDiffusers(
  prompt: string
): Promise<{ success: boolean; message: string; code?: string }> {
  try {
    const response = await fetch('/api/generate-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': 'demo-user'
      },
      body: JSON.stringify({ prompt })
    });

    if (!response.ok) {
      throw new Error('Failed to generate image');
    }

    const result = await response.json();
    return {
      success: true,
      message: result.message,
      code: result.diffusersCode
    };
  } catch (error) {
    return {
      success: false,
      message: `Image generation failed: ${error}`
    };
  }
}

// Premium feature: Enhanced video generation with Sora
export async function generateVideoWithSora(
  prompt: string
): Promise<{ success: boolean; message: string; code?: string }> {
  try {
    const response = await fetch('/api/generate-video', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': 'demo-user'
      },
      body: JSON.stringify({ prompt })
    });

    if (!response.ok) {
      throw new Error('Failed to generate video');
    }

    const result = await response.json();
    return {
      success: true,
      message: result.message,
      code: result.soraCode
    };
  } catch (error) {
    return {
      success: false,
      message: `Video generation failed: ${error}`
    };
  }
}

// Premium feature: Enhanced graph generation
export async function generateInteractiveGraph(
  request: any
): Promise<{ success: boolean; message: string; graphData?: any }> {
  try {
    const response = await fetch('/api/multimedia/graph-generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      throw new Error('Failed to generate graph');
    }

    const result = await response.json();
    return result;
  } catch (error) {
    return {
      success: false,
      message: `Graph generation failed: ${error}`
    };
  }
}

// Premium features configuration
export const PREMIUM_FEATURES = {
  unlimitedMessages: true,
  fasterImageCreation: true,
  maximumMemory: true,
  maximumContext: true,
  deepResearchMode: true,
  expandedProjects: true,
  customAiModels: true,
  soraVideoGeneration: true,
  expandedCodex: true,
  newFeaturesPreview: true
};

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
}

// Enhanced file processing for premium features
export async function processAdvancedFiles(files: File[]): Promise<any[]> {
  const formData = new FormData();
  files.forEach(file => {
    formData.append('files', file);
  });

  const response = await fetch('/api/files/process', {
    method: 'POST',
    body: formData,
    headers: {
      'X-Premium-Features': 'enabled'
    }
  });

  if (!response.ok) {
    throw new Error('Failed to process files with premium features');
  }

  return await response.json();
}
