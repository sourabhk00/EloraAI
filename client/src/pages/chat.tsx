import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Sidebar } from "@/components/chat/sidebar";
import { ChatInterface } from "@/components/chat/chat-interface";
import { useTheme } from "@/components/ui/theme-provider";
import { authService, auth } from "@/lib/firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import { Bell, Moon, Sun, LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { NotificationBell } from "@/components/notifications/notification-bell";
import type { ChatThread } from "@shared/schema";

export default function ChatPage() {
  const [user] = useAuthState(auth);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [currentThreadId, setCurrentThreadId] = useState<string | undefined>();
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();

  const handleNewChat = () => {
    setCurrentThreadId(undefined);
  };

  const handleThreadSelect = (threadId: string) => {
    setCurrentThreadId(threadId);
  };

  const handleThreadCreated = (thread: ChatThread) => {
    setCurrentThreadId(thread.id);
  };

  const handleSignOut = async () => {
    try {
      await authService.signOut();
      toast({
        title: "Signed out",
        description: "You have been successfully signed out.",
      });
    } catch (error: any) {
      toast({
        title: "Sign out failed",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    }
  };

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-slate-900 dark:bg-slate-900 text-gray-100 dark:text-gray-100 transition-colors duration-300">
      {/* Sidebar */}
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        currentThreadId={currentThreadId}
        onThreadSelect={handleThreadSelect}
        onNewChat={handleNewChat}
        userEmail={user.email || undefined}

      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-slate-800 dark:bg-slate-800 border-b border-slate-700 dark:border-slate-700 px-6 py-4 flex items-center justify-between transition-colors duration-300">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-bold text-white dark:text-white transition-colors duration-300">Elora.AI</h1>
          </div>

          <div className="flex items-center space-x-4">
            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              className="p-2 hover:bg-slate-700 dark:hover:bg-slate-700 transition-colors duration-300"
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4 text-gray-400 dark:text-gray-400" />
              ) : (
                <Moon className="h-4 w-4 text-gray-400 dark:text-gray-400" />
              )}
            </Button>

            {/* Notifications */}
            <NotificationBell />

            {/* User Menu */}
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  {user.displayName?.charAt(0) || user.email?.charAt(0) || "U"}
                </span>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="p-2 hover:bg-slate-700 dark:hover:bg-slate-700 transition-colors duration-300"
              >
                <LogOut className="h-4 w-4 text-gray-400 dark:text-gray-400" />
              </Button>
            </div>
          </div>
        </header>

        {/* Chat Interface */}
        <ChatInterface
          threadId={currentThreadId}
          onThreadCreated={handleThreadCreated}
        />
      </div>
    </div>
  );
}
