import { type User, type InsertUser, type ChatThread, type InsertChatThread, type ChatMessage, type InsertChatMessage, type ApiKeys, type InsertApiKey } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByFirebaseUid(firebaseUid: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Chat Threads
  getChatThreadsByUserId(userId: string): Promise<ChatThread[]>;
  getChatThread(id: string): Promise<ChatThread | undefined>;
  createChatThread(thread: InsertChatThread): Promise<ChatThread>;
  updateChatThread(id: string, updates: Partial<ChatThread>): Promise<ChatThread | undefined>;

  // Chat Messages
  getChatMessagesByThreadId(threadId: string): Promise<ChatMessage[]>;
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;

  // API Keys
  getApiKeysByUserId(userId: string): Promise<ApiKeys[]>;
  createApiKey(apiKey: InsertApiKey): Promise<ApiKeys>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private chatThreads: Map<string, ChatThread>;
  private chatMessages: Map<string, ChatMessage>;
  private apiKeys: Map<string, ApiKeys>;

  constructor() {
    this.users = new Map();
    this.chatThreads = new Map();
    this.chatMessages = new Map();
    this.apiKeys = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByFirebaseUid(firebaseUid: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.firebaseUid === firebaseUid
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      ...insertUser, 
      id,
      createdAt: new Date().toISOString()
    };
    this.users.set(id, user);
    return user;
  }

  async getChatThreadsByUserId(userId: string): Promise<ChatThread[]> {
    return Array.from(this.chatThreads.values())
      .filter(thread => thread.userId === userId)
      .sort((a, b) => new Date(b.updatedAt || b.createdAt!).getTime() - new Date(a.updatedAt || a.createdAt!).getTime());
  }

  async getChatThread(id: string): Promise<ChatThread | undefined> {
    return this.chatThreads.get(id);
  }

  async createChatThread(insertThread: InsertChatThread): Promise<ChatThread> {
    const id = randomUUID();
    const now = new Date().toISOString();
    const thread: ChatThread = {
      ...insertThread,
      id,
      createdAt: now,
      updatedAt: now,
    };
    this.chatThreads.set(id, thread);
    return thread;
  }

  async updateChatThread(id: string, updates: Partial<ChatThread>): Promise<ChatThread | undefined> {
    const thread = this.chatThreads.get(id);
    if (!thread) return undefined;

    const updatedThread = {
      ...thread,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.chatThreads.set(id, updatedThread);
    return updatedThread;
  }

  async getChatMessagesByThreadId(threadId: string): Promise<ChatMessage[]> {
    return Array.from(this.chatMessages.values())
      .filter(message => message.threadId === threadId)
      .sort((a, b) => new Date(a.createdAt!).getTime() - new Date(b.createdAt!).getTime());
  }

  async createChatMessage(insertMessage: InsertChatMessage): Promise<ChatMessage> {
    const id = randomUUID();
    const message: ChatMessage = {
      ...insertMessage,
      id,
      createdAt: new Date().toISOString(),
    };
    this.chatMessages.set(id, message);
    return message;
  }

  async getApiKeysByUserId(userId: string): Promise<ApiKeys[]> {
    return Array.from(this.apiKeys.values())
      .filter(apiKey => apiKey.userId === userId);
  }

  async createApiKey(insertApiKey: InsertApiKey): Promise<ApiKeys> {
    const id = randomUUID();
    const apiKey: ApiKeys = {
      ...insertApiKey,
      id,
      createdAt: new Date().toISOString(),
    };
    this.apiKeys.set(id, apiKey);
    return apiKey;
  }
}

export const storage = new MemStorage();
