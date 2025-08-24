import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useQuery } from "@tanstack/react-query";
import { 
  PanelLeftClose, 
  PanelLeftOpen, 
  Plus, 
  MessageSquare, 
  Video, 
  Image, 
  BarChart3,
  Settings,
  User
} from "lucide-react";
import type { ChatThread } from "@shared/schema";
import { motion, AnimatePresence } from "framer-motion";

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
  currentThreadId?: string;
  onThreadSelect: (threadId: string) => void;
  onNewChat: () => void;
  userEmail?: string;
}

export function Sidebar({ 
  isCollapsed, 
  onToggle, 
  currentThreadId, 
  onThreadSelect, 
  onNewChat,
  userEmail 
}: SidebarProps) {
  const sidebarRef = useRef<HTMLDivElement>(null);
  const [startX, setStartX] = useState<number | null>(null);
  const [currentX, setCurrentX] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const { data: chatThreads = [] } = useQuery<ChatThread[]>({
    queryKey: ['/api/chat/threads'],
    refetchOnWindowFocus: false,
  });

  // Touch event handlers for swipe functionality
  const handleTouchStart = (e: React.TouchEvent) => {
    setStartX(e.touches[0].clientX);
    setCurrentX(e.touches[0].clientX);
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!startX || !isDragging) return;
    setCurrentX(e.touches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!startX || !currentX || !isDragging) return;
    
    const deltaX = currentX - startX;
    const threshold = 50; // Minimum swipe distance
    
    if (Math.abs(deltaX) > threshold) {
      if (deltaX > 0 && isCollapsed) {
        // Swipe right to open
        onToggle();
      } else if (deltaX < 0 && !isCollapsed) {
        // Swipe left to close
        onToggle();
      }
    }
    
    setStartX(null);
    setCurrentX(null);
    setIsDragging(false);
  };

  const formatDate = (date: string) => {
    const now = new Date();
    const messageDate = new Date(date);
    const diffHours = Math.abs(now.getTime() - messageDate.getTime()) / 36e5;
    
    if (diffHours < 24) {
      return `${Math.floor(diffHours)} hours ago`;
    } else if (diffHours < 72) {
      return `${Math.floor(diffHours / 24)} days ago`;
    } else {
      return messageDate.toLocaleDateString();
    }
  };

  return (
    <motion.div
      ref={sidebarRef}
      className="bg-slate-800 dark:bg-slate-800 border-r border-slate-700 dark:border-slate-700 flex flex-col h-full transition-colors duration-300 relative"
      animate={{ 
        width: isCollapsed ? 60 : 280
      }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-700 dark:border-slate-700 transition-colors duration-300">
        <AnimatePresence>
          {!isCollapsed && (
            <motion.div 
              className="flex items-center space-x-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                </svg>
              </div>
              <span className="font-bold text-white dark:text-white text-lg transition-colors duration-300">Elora.AI</span>
            </motion.div>
          )}
        </AnimatePresence>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggle}
          className="p-2 hover:bg-slate-700 dark:hover:bg-slate-700 text-slate-400 dark:text-slate-400 hover:text-white dark:hover:text-white transition-colors duration-300"
        >
          {isCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
        </Button>
      </div>

      {/* New Chat Button */}
      <div className="p-4">
        <Button
          onClick={onNewChat}
          className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
          size={isCollapsed ? "sm" : "default"}
        >
          <Plus className="h-4 w-4" />
          <AnimatePresence>
            {!isCollapsed && (
              <motion.span
                className="ml-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                New Chat
              </motion.span>
            )}
          </AnimatePresence>
        </Button>
      </div>

      {/* Chat History */}
      <div className="flex-1 overflow-hidden">
        <AnimatePresence>
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="px-4 pb-2"
            >
              <h3 className="text-sm font-medium text-gray-400">Recent Chats</h3>
            </motion.div>
          )}
        </AnimatePresence>
        
        <ScrollArea className="flex-1 px-4">
          <div className="space-y-2 py-2">
            {chatThreads.map((thread) => (
              <div
                key={thread.id}
                onClick={() => onThreadSelect(thread.id)}
                className={`p-3 rounded-lg cursor-pointer transition-all duration-200 hover:scale-[1.02] ${
                  currentThreadId === thread.id
                    ? "bg-slate-700 dark:bg-slate-700 border border-cyan-500/30 shadow-lg"
                    : "hover:bg-slate-700/50 dark:hover:bg-slate-700/50"
                }`}
              >
                <div className="flex items-center space-x-3">
                  <MessageSquare className="h-4 w-4 text-slate-400 dark:text-slate-400 flex-shrink-0" />
                  <AnimatePresence>
                    {!isCollapsed && (
                      <motion.div
                        className="flex-1 min-w-0"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <p className="text-sm font-medium text-white dark:text-white truncate transition-colors duration-300">
                          {thread.title || "New Conversation"}
                        </p>
                        <p className="text-xs text-slate-400 dark:text-slate-400 mt-1 transition-colors duration-300">
                          {formatDate(thread.updatedAt || thread.createdAt)}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            ))}
            
            {/* Expandable space for long content */}
            {chatThreads.length === 0 && (
              <div className="text-center py-8">
                <MessageSquare className="h-8 w-8 text-slate-500 dark:text-slate-500 mx-auto mb-2" />
                <p className="text-sm text-slate-500 dark:text-slate-500">No conversations yet</p>
                <p className="text-xs text-slate-600 dark:text-slate-600 mt-1">Start a new chat to begin</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Library Section */}
      <div className="border-t border-slate-700">
        <AnimatePresence>
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="p-4"
            >
              <h3 className="text-sm font-medium text-gray-400 mb-3">Library</h3>
            </motion.div>
          )}
        </AnimatePresence>
        
        <div className="space-y-2 px-4 pb-4">
          <Button variant="ghost" className="w-full justify-start" size={isCollapsed ? "sm" : "default"}>
            <Video className="h-4 w-4 text-purple-400" />
            <AnimatePresence>
              {!isCollapsed && (
                <motion.span
                  className="ml-3 text-white text-sm"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  Video Generator
                </motion.span>
              )}
            </AnimatePresence>
          </Button>
          
          <Button variant="ghost" className="w-full justify-start" size={isCollapsed ? "sm" : "default"}>
            <Image className="h-4 w-4 text-green-400" />
            <AnimatePresence>
              {!isCollapsed && (
                <motion.span
                  className="ml-3 text-white text-sm"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  Image Editor
                </motion.span>
              )}
            </AnimatePresence>
          </Button>
          
          <Button variant="ghost" className="w-full justify-start" size={isCollapsed ? "sm" : "default"}>
            <BarChart3 className="h-4 w-4 text-blue-400" />
            <AnimatePresence>
              {!isCollapsed && (
                <motion.span
                  className="ml-3 text-white text-sm"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  Analytics
                </motion.span>
              )}
            </AnimatePresence>
          </Button>
        </div>
      </div>

      {/* User Account Section - Fixed at Bottom Left */}
      <div className="border-t border-slate-700 dark:border-slate-700 transition-colors duration-300">
        <AnimatePresence>
          {!isCollapsed && userEmail && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.2 }}
              className="p-4"
            >
              <div className="flex items-center space-x-3 bg-slate-700/50 dark:bg-slate-700/50 rounded-lg p-3 transition-colors duration-300">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-sm font-medium">
                    {userEmail.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white dark:text-white truncate transition-colors duration-300">
                    {userEmail.split('@')[0]}
                  </p>
                  <p className="text-xs text-slate-400 dark:text-slate-400 truncate transition-colors duration-300">
                    {userEmail}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="p-1 hover:bg-slate-600 dark:hover:bg-slate-600 transition-colors duration-300"
                >
                  <Settings className="h-3 w-3 text-slate-400 dark:text-slate-400" />
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Collapsed State User Indicator */}
        {isCollapsed && userEmail && (
          <div className="p-2 flex justify-center">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-medium">
                {userEmail.charAt(0).toUpperCase()}
              </span>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
