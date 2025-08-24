import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageBubble } from "./message-bubble";
import { FileUpload } from "./file-upload";
import { VoiceInput } from "./voice-input";
import { VideoGenerator } from "./video-generator";
import { ImageGenerator } from "./image-generator";
import { CameraCapture } from "./camera-capture";
import { LensSearch } from "./lens-search";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { sendChatMessage } from "@/lib/ai-client";
import { Send, Image, Code, BarChart3, Camera, Search } from "lucide-react";
import { motion } from "framer-motion";
import type { ChatMessage, ChatThread } from "@shared/schema";

interface ChatInterfaceProps {
  threadId?: string;
  onThreadCreated?: (thread: ChatThread) => void;
}

export function ChatInterface({ threadId, onThreadCreated }: ChatInterfaceProps) {
  const [message, setMessage] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [showVideoGenerator, setShowVideoGenerator] = useState(false);
  const [showImageGenerator, setShowImageGenerator] = useState(false);
  const [showCameraCapture, setShowCameraCapture] = useState(false);
  const [showLensSearch, setShowLensSearch] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [lensSearchResults, setLensSearchResults] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const { data: messages = [] } = useQuery<ChatMessage[]>({
    queryKey: ['/api/chat/messages', threadId],
    enabled: !!threadId,
    refetchOnWindowFocus: false,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async ({ content, files }: { content: string; files?: File[] }) => {
      const response = await fetch('/api/chat/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          threadId,
          content,
          files: files ? files.map(f => ({ name: f.name, size: f.size, type: f.type })) : undefined,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      return response.json();
    },
    onSuccess: (data) => {
      if (data.thread && onThreadCreated) {
        onThreadCreated(data.thread);
      }
      queryClient.invalidateQueries({ queryKey: ['/api/chat/messages', threadId || data.thread?.id] });
      queryClient.invalidateQueries({ queryKey: ['/api/chat/threads'] });
    },
  });

  const handleSendMessage = () => {
    if (!message.trim() && selectedFiles.length === 0) return;

    sendMessageMutation.mutate({
      content: message,
      files: selectedFiles.length > 0 ? selectedFiles : undefined,
    });

    setMessage("");
    setSelectedFiles([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleVoiceTranscript = (transcript: string) => {
    setMessage(prev => prev + (prev ? ' ' : '') + transcript);
  };

  const insertQuickAction = (type: string) => {
    const actions = {
      image: "Generate an image of ",
      code: "Write code to ",
      chart: "Create a chart showing ",
    };
    
    setMessage(prev => prev + (actions as any)[type]);
  };

  const handleImageCaptured = (imageData: string, imageFile: File) => {
    setCapturedImage(imageData);
    setSelectedFiles(prev => [...prev, imageFile]);
    setShowCameraCapture(false);
  };

  const handleLensSearch = async (imageData: string) => {
    try {
      // Convert base64 to file for API
      const response = await fetch(imageData);
      const blob = await response.blob();
      const file = new File([blob], 'lens-search.jpg', { type: 'image/jpeg' });
      
      const formData = new FormData();
      formData.append('image', file);

      const apiResponse = await fetch('/api/multimedia/lens-search', {
        method: 'POST',
        body: formData,
      });

      if (apiResponse.ok) {
        const results = await apiResponse.json();
        setLensSearchResults(results);
        setShowLensSearch(true);
      }
    } catch (error) {
      console.error('Lens search error:', error);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!threadId && messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col">
        {/* Welcome Screen */}
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-2xl mx-auto px-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-2xl mb-6 relative">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-2xl blur-lg opacity-30"></div>
              <svg className="w-8 h-8 text-white relative z-10" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-white mb-4">Welcome to Elora.AI</h2>
            <p className="text-gray-400 text-lg mb-8">
              Your advanced AI assistant is ready to help with text, images, videos, code analysis, and more. 
              What would you like to explore today?
            </p>
            
            {/* Quick Start Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="bg-slate-800 border border-slate-700 rounded-xl p-6 cursor-pointer hover:border-cyan-400 transition-colors"
                onClick={() => insertQuickAction('image')}
              >
                <Image className="h-8 w-8 text-purple-400 mb-3 mx-auto" />
                <h3 className="text-white font-medium mb-2">Image Generation</h3>
                <p className="text-gray-400 text-sm">Create stunning visuals with AI</p>
              </motion.div>
              
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="bg-slate-800 border border-slate-700 rounded-xl p-6 cursor-pointer hover:border-cyan-400 transition-colors"
                onClick={() => insertQuickAction('code')}
              >
                <Code className="h-8 w-8 text-green-400 mb-3 mx-auto" />
                <h3 className="text-white font-medium mb-2">Code Assistant</h3>
                <p className="text-gray-400 text-sm">Get help with programming</p>
              </motion.div>
              
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="bg-slate-800 border border-slate-700 rounded-xl p-6 cursor-pointer hover:border-cyan-400 transition-colors"
                onClick={() => insertQuickAction('chart')}
              >
                <BarChart3 className="h-8 w-8 text-blue-400 mb-3 mx-auto" />
                <h3 className="text-white font-medium mb-2">Data Analysis</h3>
                <p className="text-gray-400 text-sm">Analyze and visualize data</p>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Input Area - Dark/Light Mode Support */}
        <div className="border-t border-slate-700 dark:border-slate-700 bg-slate-800 dark:bg-slate-800 p-6 transition-colors duration-300">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-end space-x-3">
              <FileUpload onFilesSelected={setSelectedFiles} />
              <VoiceInput onTranscript={handleVoiceTranscript} />
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCameraCapture(true)}
                className="text-gray-400 hover:text-orange-400 border-slate-600"
                data-testid="button-camera-capture"
              >
                <Camera className="h-4 w-4" />
              </Button>
              
              <div className="flex-1 relative">
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask me anything..."
                  className="min-h-[50px] max-h-32 bg-slate-700 dark:bg-slate-700 border-slate-600 dark:border-slate-600 text-white dark:text-white placeholder-gray-400 dark:placeholder-gray-400 resize-none focus:ring-2 focus:ring-cyan-500 dark:focus:ring-cyan-500 focus:border-transparent transition-colors duration-300"
                />
                
                {/* Quick Actions */}
                <div className="absolute right-2 bottom-2 flex space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => insertQuickAction('image')}
                    className="p-1 h-6 text-gray-400 hover:text-purple-400"
                  >
                    <Image className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => insertQuickAction('code')}
                    className="p-1 h-6 text-gray-400 hover:text-green-400"
                  >
                    <Code className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => insertQuickAction('chart')}
                    className="p-1 h-6 text-gray-400 hover:text-blue-400"
                  >
                    <BarChart3 className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowCameraCapture(true)}
                    className="p-1 h-6 text-gray-400 hover:text-orange-400"
                    data-testid="button-camera-quick-access"
                  >
                    <Camera className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowLensSearch(true)}
                    className="p-1 h-6 text-gray-400 hover:text-pink-400"
                    data-testid="button-lens-search-quick-access"
                  >
                    <Search className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              
              <Button
                onClick={handleSendMessage}
                disabled={(!message.trim() && selectedFiles.length === 0) || sendMessageMutation.isPending}
                className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
              <div className="flex items-center space-x-4">
                <span>Powered by advanced AI models</span>
                <span>•</span>
                <span>Supports 100+ file formats</span>
              </div>
              <div>
                <span>{message.length}</span> / 4000
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Messages Area */}
      <ScrollArea className="flex-1 p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              isUser={msg.role === 'user'}
            />
          ))}
          
          {/* Typing Indicator */}
          {sendMessageMutation.isPending && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-start space-x-3"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                </svg>
              </div>
              <div className="bg-slate-800 rounded-2xl rounded-tl-md px-4 py-3">
                <div className="flex space-x-1">
                  <motion.span
                    className="w-2 h-2 bg-gray-400 rounded-full"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1, repeat: Infinity, delay: 0 }}
                  />
                  <motion.span
                    className="w-2 h-2 bg-gray-400 rounded-full"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
                  />
                  <motion.span
                    className="w-2 h-2 bg-gray-400 rounded-full"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
                  />
                </div>
              </div>
            </motion.div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input Area - Dark/Light Mode Support */}
      <div className="border-t border-slate-700 dark:border-slate-700 bg-slate-800 dark:bg-slate-800 p-6 transition-colors duration-300">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-end space-x-3">
            <FileUpload onFilesSelected={setSelectedFiles} />
            <VoiceInput onTranscript={handleVoiceTranscript} />
            
            <div className="flex-1 relative">
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your message..."
                className="min-h-[50px] max-h-32 bg-slate-700 dark:bg-slate-700 border-slate-600 dark:border-slate-600 text-white dark:text-white placeholder-gray-400 dark:placeholder-gray-400 resize-none focus:ring-2 focus:ring-cyan-500 dark:focus:ring-cyan-500 focus:border-transparent transition-colors duration-300"
              />
              
              {/* Quick Actions */}
              <div className="absolute right-2 bottom-2 flex space-x-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => insertQuickAction('image')}
                  className="p-1 h-6 text-gray-400 hover:text-purple-400"
                >
                  <Image className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => insertQuickAction('code')}
                  className="p-1 h-6 text-gray-400 hover:text-green-400"
                >
                  <Code className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => insertQuickAction('chart')}
                  className="p-1 h-6 text-gray-400 hover:text-blue-400"
                >
                  <BarChart3 className="h-3 w-3" />
                </Button>
              </div>
            </div>
            
            <Button
              onClick={handleSendMessage}
              disabled={(!message.trim() && selectedFiles.length === 0) || sendMessageMutation.isPending}
              className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
            <div className="flex items-center space-x-4">
              <span>Powered by advanced AI models</span>
              <span>•</span>
              <span>Supports 100+ file formats</span>
            </div>
            <div>
              <span>{message.length}</span> / 4000
            </div>
          </div>
          
          {/* Enhanced Features Panel */}
          <div className="mt-4 space-y-3">
            <div className="flex gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowVideoGenerator(!showVideoGenerator)}
                className="border-slate-600 text-gray-300 hover:bg-slate-700"
              >
                <BarChart3 className="mr-2 h-4 w-4" />
                Video Generator
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowImageGenerator(!showImageGenerator)}
                className="border-slate-600 text-gray-300 hover:bg-slate-700"
              >
                <Image className="mr-2 h-4 w-4" />
                Image Generator
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCameraCapture(true)}
                className="border-slate-600 text-gray-300 hover:bg-slate-700"
                data-testid="button-camera-capture-enhanced"
              >
                <Camera className="mr-2 h-4 w-4" />
                Camera Capture
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowLensSearch(true)}
                className="border-slate-600 text-gray-300 hover:bg-slate-700"
                data-testid="button-lens-search-enhanced"
              >
                <Search className="mr-2 h-4 w-4" />
                Lens Search
              </Button>
            </div>
            
            {showVideoGenerator && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <VideoGenerator />
              </motion.div>
            )}
            
            {showImageGenerator && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <ImageGenerator />
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Camera Capture Modal */}
      {showCameraCapture && (
        <CameraCapture
          onClose={() => setShowCameraCapture(false)}
          onImageCaptured={handleImageCaptured}
        />
      )}

      {/* Lens Search Modal */}
      {showLensSearch && (
        <LensSearch
          onClose={() => setShowLensSearch(false)}
          onSearch={handleLensSearch}
          searchResults={lensSearchResults}
        />
      )}
    </div>
  );
}
