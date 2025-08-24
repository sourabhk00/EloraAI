import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  displayName: text("display_name"),
  photoURL: text("photo_url"),
  firebaseUid: text("firebase_uid").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const chatThreads = pgTable("chat_threads", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const chatMessages = pgTable("chat_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  threadId: varchar("thread_id").notNull().references(() => chatThreads.id),
  role: text("role").notNull(), // 'user' | 'assistant'
  content: text("content").notNull(),
  metadata: jsonb("metadata"), // For file attachments, analysis results, etc.
  createdAt: timestamp("created_at").defaultNow(),
});

export const apiKeys = pgTable("api_keys", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  provider: text("provider").notNull(), // 'openrouter' | 'gemini'
  keyValue: text("key_value").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  displayName: true,
  photoURL: true,
  firebaseUid: true,
});

export const insertChatThreadSchema = createInsertSchema(chatThreads).pick({
  userId: true,
  title: true,
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).pick({
  threadId: true,
  role: true,
  content: true,
  metadata: true,
});

export const insertApiKeySchema = createInsertSchema(apiKeys).pick({
  userId: true,
  provider: true,
  keyValue: true,
});

export const graphGenerationRequestSchema = z.object({
  type: z.enum(['mathematical', 'network', 'data', 'custom']),
  equation: z.string().optional(),
  data: z.any().optional(),
  options: z.object({
    interactive: z.boolean().default(true),
    animation: z.boolean().default(false),
    theme: z.enum(['light', 'dark', 'colorful']).default('colorful'),
    dimensions: z.enum(['2d', '3d']).default('2d')
  }).optional()
});

export const imageGenerationRequestSchema = z.object({
  prompt: z.string().min(1),
  model: z.enum(['big-asp-v2', 'stable-diffusion', 'custom']).default('big-asp-v2'),
  style: z.string().optional(),
  quality: z.enum(['standard', 'hd', 'ultra']).default('hd'),
  size: z.enum(['512x512', '1024x1024', '1920x1080']).default('1024x1024')
});

export const videoGenerationRequestSchema = z.object({
  prompt: z.string().min(1),
  duration: z.number().min(5).max(60).default(15),
  quality: z.enum(['standard', 'hd', '4k']).default('hd'),
  style: z.enum(['realistic', 'artistic', 'cinematic']).default('cinematic'),
  fps: z.enum([24, 30, 60]).default(30)
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type ChatThread = typeof chatThreads.$inferSelect;
export type InsertChatThread = z.infer<typeof insertChatThreadSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type ApiKeys = typeof apiKeys.$inferSelect;
export type InsertApiKey = z.infer<typeof insertApiKeySchema>;
export type GraphGenerationRequest = z.infer<typeof graphGenerationRequestSchema>;
export type ImageGenerationRequest = z.infer<typeof imageGenerationRequestSchema>;
export type VideoGenerationRequest = z.infer<typeof videoGenerationRequestSchema>;

export interface AiModel {
  id: string;
  name: string;
  provider: 'gemini' | 'openrouter';
  maxTokens: number;
  supportsImages: boolean;
  supportsVideo: boolean;
  features?: string[];
}

export interface ProcessedFile {
  name: string;
  type: string;
  size: number;
  content: string;
  metadata?: any;
}

export interface PremiumFeatures {
  unlimitedMessages: boolean;
  fasterImageCreation: boolean;
  maximumMemory: boolean;
  maximumContext: boolean;
  deepResearchMode: boolean;
  expandedProjects: boolean;
  customAiModels: boolean;
  soraVideoGeneration: boolean;
  expandedCodex: boolean;
  newFeaturesPreview: boolean;
}

export interface GraphGenerationRequest {
  type: 'mathematical' | 'network' | 'data' | 'custom';
  equation?: string;
  data?: any;
  options?: {
    interactive: boolean;
    animation: boolean;
    theme: 'light' | 'dark' | 'colorful';
    dimensions: '2d' | '3d';
  };
}

export interface ImageGenerationRequest {
  prompt: string;
  model?: 'big-asp-v2' | 'stable-diffusion' | 'custom';
  style?: string;
  quality?: 'standard' | 'hd' | 'ultra';
  size?: '512x512' | '1024x1024' | '1920x1080';
}

export interface VideoGenerationRequest {
  prompt: string;
  duration?: number;
  quality?: 'standard' | 'hd' | '4k';
  style?: 'realistic' | 'artistic' | 'cinematic';
  fps?: 24 | 30 | 60;
}
