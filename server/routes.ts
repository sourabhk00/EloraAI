import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import { storage } from "./storage";
import { callGemini, callOpenRouter, streamOpenRouter, generateVideo, generateImage, AI_MODELS } from "./ai-client";
import { processFile } from "./file-processor";
import { getPredefinedResponse } from "./predefined-responses-improved";
import { generateSmartResponse, generateHelpResponse } from "./smart-response-generator";
import { VideoGenerator } from "./video-generator";
import { ImageEditor } from "./image-editor";
import { EnhancedImageAnalyzer } from "./enhanced-image-analyzer";
import { EnhancedPDFAnalyzer } from "./enhanced-pdf-analyzer";
import { DataAnalytics } from "./data-analytics";
import { EnhancedGraphGenerator } from "./enhanced-graph-generator";
import { codexAgent } from './expanded-codex-agent';
import { researchAgent } from './deep-research-agent';
import { advancedCodexAgent } from './advanced-codex-agent';
// Temporarily disable HuggingFace import until service is fixed
// import { huggingFaceService } from './huggingface-service';
// Temporarily disable MongoDB import until service is fixed
// import { mongoDBChatService } from './mongodb-chat-service';


const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

// Initialize specialized modules
const videoGenerator = new VideoGenerator();
const imageEditor = new ImageEditor();
const imageAnalyzer = new EnhancedImageAnalyzer();
const pdfAnalyzer = new EnhancedPDFAnalyzer();
const dataAnalytics = new DataAnalytics();
const graphGenerator = new EnhancedGraphGenerator();

// Import advanced editors
import { AdvancedImageEditor } from './advanced-image-editor';
import { AdvancedVideoEditor } from './advanced-video-editor';
import { AdvancedDataAnalyzer } from './advanced-data-analytics';

// Initialize premium services (MongoDB temporarily disabled)
// mongoDBChatService.connect().catch(console.error);

export async function registerRoutes(app: Express): Promise<Server> {
  // Chat endpoints
  app.get("/api/chat/threads", async (req, res) => {
    try {
      const userId = req.headers['x-user-id'] as string || 'demo-user';
      const threads = await storage.getChatThreadsByUserId(userId);
      res.json(threads);
    } catch (error) {
      console.error("Error fetching chat threads:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/chat/messages/:threadId", async (req, res) => {
    try {
      const { threadId } = req.params;
      const messages = await storage.getChatMessagesByThreadId(threadId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching chat messages:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/chat/send", upload.array('files', 10), async (req, res) => {
    try {
      const { threadId, content, webSearch } = req.body;
      const files = req.files as Express.Multer.File[];
      const userId = req.headers['x-user-id'] as string || 'demo-user';

      let currentThreadId = threadId;
      let thread = null;

      // Create new thread if none exists
      if (!currentThreadId) {
        const title = content.slice(0, 50) + (content.length > 50 ? "..." : "");
        thread = await storage.createChatThread({
          userId,
          title,
        });
        currentThreadId = thread.id;
      }

      // Process uploaded files
      let processedFiles: Array<{name: string, type: string, content: string}> = [];
      if (files && files.length > 0) {
        for (const file of files) {
          try {
            const processed = await processFile(file.buffer, file.originalname);
            processedFiles.push({
              name: file.originalname,
              type: file.mimetype,
              content: processed.content
            });
          } catch (error) {
            console.error(`Error processing file ${file.originalname}:`, error);
          }
        }
      }

      // Enhance content with file information
      let enhancedContent = content;
      if (processedFiles.length > 0) {
        enhancedContent += '\n\nAttached files:\n';
        processedFiles.forEach(file => {
          enhancedContent += `- ${file.name} (${file.type}): ${file.content.substring(0, 500)}${file.content.length > 500 ? '...' : ''}\n`;
        });
      }

      // Save user message
      const userMessage = await storage.createChatMessage({
        threadId: currentThreadId,
        role: 'user',
        content: enhancedContent,
        metadata: files ? { files } : undefined,
      });

      // Get chat history for context
      const messages = await storage.getChatMessagesByThreadId(currentThreadId);
      
      // Format messages for AI
      const formattedMessages = messages.map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      }));

      // Use smart response system for intelligent routing
      const apiKeys = await storage.getApiKeysByUserId(userId);
      const geminiKey = apiKeys.find(k => k.provider === 'gemini')?.keyValue || process.env.GEMINI_API_KEY;
      const openrouterKey = apiKeys.find(k => k.provider === 'openrouter')?.keyValue;

      let aiResponse: string;
      
      try {
        const smartResponse = await generateSmartResponse(content, geminiKey, openrouterKey);
        
        if (smartResponse.content) {
          // Smart response generated (predefined, graph, or image)
          aiResponse = smartResponse.content;
        } else {
          // Fallback to AI APIs
          aiResponse = "I'm here to help! I can assist with video generation, image creation, coding, math graphs, and much more. Try asking me about specific topics or use commands like '/help' to get started.";

          try {
            if (geminiKey) {
              aiResponse = await callGemini(formattedMessages, geminiKey);
            } else if (openrouterKey) {
              aiResponse = await callOpenRouter(formattedMessages, openrouterKey);
            }
          } catch (apiError) {
            console.error("AI API error:", apiError);
            aiResponse = "I'm experiencing technical difficulties with external APIs, but I can still help with predefined responses and basic assistance. Try asking me about programming, math, or science topics!";
          }
        }
      } catch (smartError) {
        console.error("Smart response error:", smartError);
        aiResponse = "I'm here to help! Try asking me about graphs, images, programming, or science topics.";
      }

      // Save AI response
      await storage.createChatMessage({
        threadId: currentThreadId,
        role: 'assistant',
        content: aiResponse,
      });

      // Update thread timestamp
      if (currentThreadId) {
        await storage.updateChatThread(currentThreadId, { updatedAt: new Date() });
      }

      res.json({ 
        success: true, 
        thread: thread ? thread : undefined,
        threadId: currentThreadId 
      });
    } catch (error) {
      console.error("Error sending message:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/chat/stream", async (req, res) => {
    try {
      const { messages, model } = req.body;
      const userId = req.headers['x-user-id'] as string || 'demo-user';

      res.setHeader('Content-Type', 'text/plain');
      res.setHeader('Transfer-Encoding', 'chunked');

      const apiKeys = await storage.getApiKeysByUserId(userId);
      const openrouterKey = apiKeys.find(k => k.provider === 'openrouter')?.keyValue;

      if (!openrouterKey) {
        res.write("Error: OpenRouter API key not configured");
        res.end();
        return;
      }

      await streamOpenRouter(messages, openrouterKey, model, (chunk) => {
        res.write(chunk);
      });

      res.end();
    } catch (error) {
      console.error("Error streaming response:", error);
      res.write("Error: Failed to stream response");
      res.end();
    }
  });

  // File processing endpoint
  app.post("/api/files/process", upload.array('files'), async (req, res) => {
    try {
      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        return res.status(400).json({ message: "No files uploaded" });
      }

      const processedFiles = await Promise.all(
        files.map(file => processFile(file.path, file.originalname, file.mimetype))
      );

      res.json(processedFiles);
    } catch (error) {
      console.error("Error processing files:", error);
      res.status(500).json({ message: "Failed to process files" });
    }
  });

  // User management endpoints
  app.post("/api/users", async (req, res) => {
    try {
      const { email, displayName, photoURL, firebaseUid } = req.body;
      
      const user = await storage.createUser({
        email,
        displayName,
        photoURL,
        firebaseUid,
      });
      
      res.json(user);
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/users/:firebaseUid", async (req, res) => {
    try {
      const { firebaseUid } = req.params;
      const user = await storage.getUserByFirebaseUid(firebaseUid);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // API Keys management
  app.post("/api/api-keys", async (req, res) => {
    try {
      const { userId, provider, keyValue } = req.body;
      
      const apiKey = await storage.createApiKey({
        userId,
        provider,
        keyValue,
      });
      
      res.json(apiKey);
    } catch (error) {
      console.error("Error creating API key:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/api-keys/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const apiKeys = await storage.getApiKeysByUserId(userId);
      res.json(apiKeys);
    } catch (error) {
      console.error("Error fetching API keys:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Video generation endpoint
  app.post("/api/generate-video", async (req, res) => {
    try {
      const { prompt } = req.body;
      const userId = req.headers['x-user-id'] as string;
      
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      if (!prompt) {
        return res.status(400).json({ message: "Prompt is required" });
      }

      // Use environment variable for API key
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ 
          status: 'error',
          message: "Video generation service is not configured" 
        });
      }

      const result = await generateVideo(prompt, apiKey);
      res.json(result);
    } catch (error) {
      console.error("Error generating video:", error);
      res.status(500).json({ 
        status: 'error',
        message: "Failed to generate video" 
      });
    }
  });

  // Image generation endpoint
  app.post("/api/generate-image", async (req, res) => {
    try {
      const { prompt } = req.body;
      const userId = req.headers['x-user-id'] as string;
      
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      if (!prompt) {
        return res.status(400).json({ message: "Prompt is required" });
      }

      // Use environment variable for API key
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ 
          status: 'error',
          message: "Image generation service is not configured" 
        });
      }

      const result = await generateImage(prompt, apiKey);
      res.json(result);
    } catch (error) {
      console.error("Error generating image:", error);
      res.status(500).json({ 
        status: 'error',
        message: "Failed to generate image" 
      });
    }
  });

  // Enhanced video generation endpoint
  app.post("/api/multimedia/video", async (req, res) => {
    try {
      const result = await videoGenerator.generateVideo(req.body);
      res.json(result);
    } catch (error) {
      console.error("Video generation error:", error);
      res.status(500).json({ 
        success: false, 
        message: "Video generation failed" 
      });
    }
  });

  // Image editing endpoint
  app.post("/api/multimedia/image-edit", upload.single('image'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: "No image provided" });
      }

      const imageData = req.file.buffer;
      const editRequest = {
        imageData,
        operation: req.body.operation,
        parameters: JSON.parse(req.body.parameters || '{}')
      };

      const result = await imageEditor.editImage(editRequest);
      
      if (result.success && result.editedImageData) {
        // Convert buffer to base64 for response
        const base64Image = result.editedImageData.toString('base64');
        res.json({
          ...result,
          editedImageData: `data:image/jpeg;base64,${base64Image}`
        });
      } else {
        res.json(result);
      }
    } catch (error) {
      console.error("Image editing error:", error);
      res.status(500).json({ 
        success: false, 
        message: "Image editing failed" 
      });
    }
  });

  // Enhanced image analysis endpoint
  app.post("/api/multimedia/image-analyze", upload.single('image'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: "No image provided" });
      }

      const result = await imageAnalyzer.analyzeImage(req.file.buffer);
      res.json(result);
    } catch (error) {
      console.error("Image analysis error:", error);
      res.status(500).json({ 
        success: false, 
        message: "Image analysis failed" 
      });
    }
  });

  // Lens search endpoint
  app.post("/api/multimedia/lens-search", upload.single('image'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: "No image provided" });
      }

      const result = await imageAnalyzer.performLensSearch(req.file.buffer);
      res.json(result);
    } catch (error) {
      console.error("Lens search error:", error);
      res.status(500).json({ 
        message: "Lens search failed" 
      });
    }
  });

  // Enhanced PDF analysis endpoint
  app.post("/api/multimedia/pdf-analyze", upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: "No file provided" });
      }

      const result = await pdfAnalyzer.analyzePDF(req.file.buffer, req.file.originalname);
      res.json(result);
    } catch (error) {
      console.error("PDF analysis error:", error);
      res.status(500).json({ 
        success: false, 
        message: "PDF analysis failed" 
      });
    }
  });

  // Document comparison endpoint
  app.post("/api/multimedia/document-compare", upload.fields([
    { name: 'doc1', maxCount: 1 },
    { name: 'doc2', maxCount: 1 }
  ]), async (req, res) => {
    try {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      
      if (!files.doc1 || !files.doc2) {
        return res.status(400).json({ message: "Two documents required for comparison" });
      }

      const result = await pdfAnalyzer.compareDocuments(
        files.doc1[0].buffer,
        files.doc2[0].buffer,
        files.doc1[0].originalname,
        files.doc2[0].originalname
      );
      
      res.json(result);
    } catch (error) {
      console.error("Document comparison error:", error);
      res.status(500).json({ 
        message: "Document comparison failed" 
      });
    }
  });

  // Data analytics endpoint
  app.post("/api/multimedia/data-analyze", async (req, res) => {
    try {
      const result = await dataAnalytics.analyzeData(req.body);
      res.json(result);
    } catch (error) {
      console.error("Data analysis error:", error);
      res.status(500).json({ 
        success: false, 
        message: "Data analysis failed" 
      });
    }
  });

  // Visualization generation endpoint
  app.post("/api/multimedia/visualize", async (req, res) => {
    try {
      const result = await dataAnalytics.generateVisualization(req.body);
      res.json(result);
    } catch (error) {
      console.error("Visualization error:", error);
      res.status(500).json({ 
        success: false, 
        message: "Visualization generation failed" 
      });
    }
  });

  // Enhanced graph generation endpoint
  app.post("/api/multimedia/graph-generate", async (req, res) => {
    try {
      const result = await graphGenerator.generateGraph(req.body);
      res.json(result);
    } catch (error) {
      console.error("Graph generation error:", error);
      res.status(500).json({ 
        success: false, 
        message: "Graph generation failed" 
      });
    }
  });

  // Multiple graph generation endpoint
  app.post("/api/multimedia/graph-multiple", async (req, res) => {
    try {
      const { equation, graphTypes } = req.body;
      const result = await graphGenerator.generateMultipleGraphs(equation, graphTypes);
      res.json(result);
    } catch (error) {
      console.error("Multiple graph generation error:", error);
      res.status(500).json({ 
        message: "Multiple graph generation failed" 
      });
    }
  });

  // Premium Codex Agent endpoints
  app.post("/api/codex/analyze", async (req, res) => {
    try {
      const result = await codexAgent.processCodexRequest({ ...req.body, action: 'analyze' });
      res.json(result);
    } catch (error) {
      console.error("Codex analysis error:", error);
      res.status(500).json({ 
        success: false, 
        message: "Codex analysis failed",
        attribution: "This model is trained by Sourabh Kumar"
      });
    }
  });

  app.post("/api/codex/debug", async (req, res) => {
    try {
      const result = await codexAgent.processCodexRequest({ ...req.body, action: 'debug' });
      res.json(result);
    } catch (error) {
      console.error("Codex debug error:", error);
      res.status(500).json({ 
        success: false, 
        message: "Codex debugging failed",
        attribution: "This model is trained by Sourabh Kumar"
      });
    }
  });

  app.post("/api/codex/optimize", async (req, res) => {
    try {
      const result = await codexAgent.processCodexRequest({ ...req.body, action: 'optimize' });
      res.json(result);
    } catch (error) {
      console.error("Codex optimization error:", error);
      res.status(500).json({ 
        success: false, 
        message: "Codex optimization failed",
        attribution: "This model is trained by Sourabh Kumar"
      });
    }
  });

  app.post("/api/codex/generate", async (req, res) => {
    try {
      const result = await codexAgent.processCodexRequest({ ...req.body, action: 'generate' });
      res.json(result);
    } catch (error) {
      console.error("Codex generation error:", error);
      res.status(500).json({ 
        success: false, 
        message: "Codex code generation failed",
        attribution: "This model is trained by Sourabh Kumar"
      });
    }
  });

  // Deep Research Agent endpoints
  app.post("/api/research/conduct", async (req, res) => {
    try {
      const result = await researchAgent.conductResearch(req.body);
      res.json(result);
    } catch (error) {
      console.error("Research error:", error);
      res.status(500).json({ 
        success: false, 
        message: "Deep research failed",
        attribution: "This model is trained by Sourabh Kumar"
      });
    }
  });

  // Advanced Codex Agent (Real-world actions)
  app.post("/api/advanced-codex/execute", async (req, res) => {
    try {
      const result = await advancedCodexAgent.executeAction(req.body);
      res.json(result);
    } catch (error) {
      console.error("Advanced Codex error:", error);
      res.status(500).json({
        success: false,
        message: "Advanced action execution failed",
        attribution: "This model is trained by Sourabh Kumar"
      });
    }
  });

  // HuggingFace Image Generation
  app.post("/api/huggingface/generate-image", async (req, res) => {
    try {
      const result = await huggingFaceService.generateImage(req.body);
      res.json(result);
    } catch (error) {
      console.error("HuggingFace image generation error:", error);
      res.status(500).json({
        success: false,
        message: "HuggingFace image generation failed",
        attribution: "This model is trained by Sourabh Kumar"
      });
    }
  });

  // MongoDB Chat Service endpoints
  app.get("/api/mongo/threads/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const threads = await mongoDBChatService.getThreads(userId);
      res.json(threads);
    } catch (error) {
      console.error("MongoDB threads error:", error);
      res.status(500).json({ error: "Failed to fetch threads" });
    }
  });

  app.get("/api/mongo/messages/:threadId", async (req, res) => {
    try {
      const { threadId } = req.params;
      const messages = await mongoDBChatService.getMessages(threadId);
      res.json(messages);
    } catch (error) {
      console.error("MongoDB messages error:", error);
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });

  app.post("/api/mongo/messages", async (req, res) => {
    try {
      const messageId = await mongoDBChatService.saveMessage(req.body);
      res.json({ success: true, messageId });
    } catch (error) {
      console.error("MongoDB save message error:", error);
      res.status(500).json({ error: "Failed to save message" });
    }
  });

  // Advanced Image Editor endpoints
  app.post("/api/editor/image/adjust", upload.single('image'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: "No image provided" });
      }

      const adjustments = req.body.adjustments;
      const editor = new AdvancedImageEditor(req.file.buffer);
      await editor.initialize();
      
      const result = await editor.applyAdjustments(adjustments);
      
      res.set({
        'Content-Type': 'image/jpeg',
        'Content-Disposition': 'attachment; filename="adjusted-image.jpg"'
      });
      res.send(result);
    } catch (error) {
      console.error("Image adjustment error:", error);
      res.status(500).json({ success: false, message: "Image adjustment failed" });
    }
  });

  app.post("/api/editor/image/crop", upload.single('image'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: "No image provided" });
      }

      const cropOptions = req.body.options;
      const editor = new AdvancedImageEditor(req.file.buffer);
      await editor.initialize();
      
      const result = await editor.applyCrop(cropOptions);
      
      res.set({
        'Content-Type': 'image/jpeg',
        'Content-Disposition': 'attachment; filename="cropped-image.jpg"'
      });
      res.send(result);
    } catch (error) {
      console.error("Image crop error:", error);
      res.status(500).json({ success: false, message: "Image crop failed" });
    }
  });

  app.post("/api/editor/image/filter", upload.single('image'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: "No image provided" });
      }

      const filterOptions = req.body.options;
      const editor = new AdvancedImageEditor(req.file.buffer);
      await editor.initialize();
      
      const result = await editor.applyFilter(filterOptions);
      
      res.set({
        'Content-Type': 'image/jpeg',
        'Content-Disposition': 'attachment; filename="filtered-image.jpg"'
      });
      res.send(result);
    } catch (error) {
      console.error("Image filter error:", error);
      res.status(500).json({ success: false, message: "Image filter failed" });
    }
  });

  app.post("/api/editor/image/effect", upload.single('image'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: "No image provided" });
      }

      const effectOptions = req.body.options;
      const editor = new AdvancedImageEditor(req.file.buffer);
      await editor.initialize();
      
      const result = await editor.applyEffect(effectOptions);
      
      res.set({
        'Content-Type': 'image/jpeg',
        'Content-Disposition': 'attachment; filename="effect-image.jpg"'
      });
      res.send(result);
    } catch (error) {
      console.error("Image effect error:", error);
      res.status(500).json({ success: false, message: "Image effect failed" });
    }
  });

  app.post("/api/editor/image/markup", upload.single('image'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: "No image provided" });
      }

      const markups = req.body.markups;
      const editor = new AdvancedImageEditor(req.file.buffer);
      await editor.initialize();
      
      const result = await editor.addMarkup(markups);
      
      res.set({
        'Content-Type': 'image/jpeg',
        'Content-Disposition': 'attachment; filename="markup-image.jpg"'
      });
      res.send(result);
    } catch (error) {
      console.error("Image markup error:", error);
      res.status(500).json({ success: false, message: "Image markup failed" });
    }
  });

  app.post("/api/editor/image/background-remove", upload.single('image'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: "No image provided" });
      }

      const editor = new AdvancedImageEditor(req.file.buffer);
      await editor.initialize();
      
      const result = await editor.removeBackground();
      
      res.set({
        'Content-Type': 'image/png',
        'Content-Disposition': 'attachment; filename="no-background.png"'
      });
      res.send(result);
    } catch (error) {
      console.error("Background removal error:", error);
      res.status(500).json({ success: false, message: "Background removal failed" });
    }
  });

  // Advanced Video Editor endpoints
  app.post("/api/editor/video/edit", upload.single('video'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: "No video provided" });
      }

      const editOptions = req.body.options;
      const editor = new AdvancedVideoEditor();
      await editor.initialize();
      
      // Save uploaded video temporarily
      const tempPath = `./temp/video_${Date.now()}.mp4`;
      const fs = require('fs');
      fs.writeFileSync(tempPath, req.file.buffer);
      
      const result = await editor.editVideo({
        input: tempPath,
        output: `./temp/edited_${Date.now()}.mp4`,
        ...editOptions
      });
      
      // Send the edited video back
      const editedVideo = fs.readFileSync(result);
      res.set({
        'Content-Type': 'video/mp4',
        'Content-Disposition': 'attachment; filename="edited-video.mp4"'
      });
      res.send(editedVideo);
      
      // Cleanup
      fs.unlinkSync(tempPath);
      fs.unlinkSync(result);
    } catch (error) {
      console.error("Video edit error:", error);
      res.status(500).json({ success: false, message: "Video editing failed" });
    }
  });

  app.post("/api/editor/video/merge", upload.array('videos', 10), async (req, res) => {
    try {
      const files = req.files as Express.Multer.File[];
      if (!files || files.length < 2) {
        return res.status(400).json({ success: false, message: "At least 2 videos required" });
      }

      const editor = new AdvancedVideoEditor();
      await editor.initialize();
      
      // Save uploaded videos temporarily
      const tempPaths: string[] = [];
      const fs = require('fs');
      
      files.forEach((file, index) => {
        const tempPath = `./temp/video_${Date.now()}_${index}.mp4`;
        fs.writeFileSync(tempPath, file.buffer);
        tempPaths.push(tempPath);
      });
      
      const clips = tempPaths.map((path, index) => ({
        path,
        startTime: 0,
        duration: 60, // Default duration
        position: index * 60
      }));
      
      const outputPath = `./temp/merged_${Date.now()}.mp4`;
      const result = await editor.mergeVideos(clips, outputPath);
      
      // Send the merged video back
      const mergedVideo = fs.readFileSync(result);
      res.set({
        'Content-Type': 'video/mp4',
        'Content-Disposition': 'attachment; filename="merged-video.mp4"'
      });
      res.send(mergedVideo);
      
      // Cleanup
      tempPaths.forEach(path => fs.unlinkSync(path));
      fs.unlinkSync(result);
    } catch (error) {
      console.error("Video merge error:", error);
      res.status(500).json({ success: false, message: "Video merge failed" });
    }
  });

  app.post("/api/editor/video/thumbnail", upload.single('video'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: "No video provided" });
      }

      const timeOffset = parseFloat(req.body.timeOffset) || 1;
      const editor = new AdvancedVideoEditor();
      await editor.initialize();
      
      // Save uploaded video temporarily
      const tempPath = `./temp/video_${Date.now()}.mp4`;
      const fs = require('fs');
      fs.writeFileSync(tempPath, req.file.buffer);
      
      const thumbnail = await editor.createThumbnail(tempPath, timeOffset);
      
      res.set({
        'Content-Type': 'image/png',
        'Content-Disposition': 'attachment; filename="thumbnail.png"'
      });
      res.send(thumbnail);
      
      // Cleanup
      fs.unlinkSync(tempPath);
    } catch (error) {
      console.error("Thumbnail creation error:", error);
      res.status(500).json({ success: false, message: "Thumbnail creation failed" });
    }
  });

  // Advanced Data Analytics endpoints
  app.post("/api/analytics/load-data", upload.single('file'), async (req, res) => {
    try {
      const analyzer = new AdvancedDataAnalyzer();
      
      if (req.file) {
        // File upload
        const dataSource = {
          type: req.body.type || 'csv',
          data: req.file.buffer.toString('utf-8')
        };
        await analyzer.loadData(dataSource);
      } else {
        // Direct data or URL
        await analyzer.loadData(req.body.dataSource);
      }
      
      const metadata = analyzer.getMetadata();
      res.json({ success: true, metadata });
    } catch (error) {
      console.error("Data loading error:", error);
      res.status(500).json({ success: false, message: "Data loading failed" });
    }
  });

  app.post("/api/analytics/analyze", async (req, res) => {
    try {
      const { dataSource, analysisOptions } = req.body;
      const analyzer = new AdvancedDataAnalyzer();
      
      await analyzer.loadData(dataSource);
      const insights = await analyzer.performAnalysis(analysisOptions);
      
      res.json({ success: true, insights });
    } catch (error) {
      console.error("Analysis error:", error);
      res.status(500).json({ success: false, message: "Analysis failed" });
    }
  });

  app.post("/api/analytics/visualize", async (req, res) => {
    try {
      const { dataSource, visualizationOptions } = req.body;
      const analyzer = new AdvancedDataAnalyzer();
      
      await analyzer.loadData(dataSource);
      const visualization = await analyzer.generateVisualization(visualizationOptions);
      
      res.json({ success: true, visualization });
    } catch (error) {
      console.error("Visualization error:", error);
      res.status(500).json({ success: false, message: "Visualization failed" });
    }
  });

  // Enhanced Graph Generator endpoints
  app.post("/api/graph/generate", async (req, res) => {
    try {
      const { type, parameters } = req.body;
      const generator = new EnhancedGraphGenerator();
      
      let graph;
      switch (type) {
        case 'random':
          graph = generator.generateRandomGraph(parameters.nodeCount, parameters.edgeCount);
          break;
        case 'scale-free':
          graph = generator.generateScaleFreeGraph(parameters.nodeCount, parameters.attachmentRate);
          break;
        case 'small-world':
          graph = generator.generateSmallWorldGraph(parameters.nodeCount, parameters.nearestNeighbors, parameters.rewireProb);
          break;
        case 'hierarchical':
          graph = generator.generateHierarchicalGraph(parameters.levels, parameters.branchingFactor);
          break;
        case 'community':
          graph = generator.generateCommunityGraph(parameters.communities, parameters.nodesPerCommunity, parameters.interCommunityEdges);
          break;
        default:
          return res.status(400).json({ success: false, message: "Invalid graph type" });
      }
      
      res.json({ success: true, graph });
    } catch (error) {
      console.error("Graph generation error:", error);
      res.status(500).json({ success: false, message: "Graph generation failed" });
    }
  });

  app.post("/api/graph/analyze", async (req, res) => {
    try {
      const { graph } = req.body;
      const generator = new EnhancedGraphGenerator();
      generator.setGraph(graph);
      
      const analysis = generator.analyzeNetwork();
      res.json({ success: true, analysis });
    } catch (error) {
      console.error("Graph analysis error:", error);
      res.status(500).json({ success: false, message: "Graph analysis failed" });
    }
  });

  app.post("/api/graph/layout", async (req, res) => {
    try {
      const { graph, layout } = req.body;
      const generator = new EnhancedGraphGenerator();
      generator.setGraph(graph);
      generator.applyLayout(layout);
      
      const updatedGraph = generator.getGraph();
      res.json({ success: true, graph: updatedGraph });
    } catch (error) {
      console.error("Graph layout error:", error);
      res.status(500).json({ success: false, message: "Graph layout failed" });
    }
  });

  // Get AI models endpoint
  app.get("/api/models", async (req, res) => {
    try {
      res.json(AI_MODELS);
    } catch (error) {
      console.error("Error fetching models:", error);
      res.status(500).json({ message: "Failed to fetch models" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
