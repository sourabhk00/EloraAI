import type { ChatMessage, AiModel } from "@shared/schema";

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
    name: 'Advanced AI Model',
    provider: 'openrouter',
    maxTokens: 200000,
    supportsImages: true,
    supportsVideo: false,
  },
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

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
}
