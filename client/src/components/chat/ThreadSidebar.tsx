import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  MessageCircle, 
  ChevronLeft, 
  ChevronRight,
  Trash2,
  Edit3,
  Search,
  Filter,
  MoreVertical,
  Image,
  Video,
  BarChart3,
  Network
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ChatThread } from "@shared/schema";

interface ThreadSidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
  threads: ChatThread[];
  currentThreadId?: string;
  onThreadSelect: (threadId: string) => void;
  onNewChat: () => void;
  onDeleteThread?: (threadId: string) => void;
  onEditThread?: (threadId: string, newTitle: string) => void;
  onImageEditor?: () => void;
  onVideoEditor?: () => void;
  onDataAnalytics?: () => void;
  onGraphGenerator?: () => void;
}

export function ThreadSidebar({
  isCollapsed,
  onToggle,
  threads,
  currentThreadId,
  onThreadSelect,
  onNewChat,
  onDeleteThread,
  onEditThread,
  onImageEditor,
  onVideoEditor,
  onDataAnalytics,
  onGraphGenerator
}: ThreadSidebarProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  const filteredThreads = threads.filter(thread =>
    thread.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const startEdit = (thread: ChatThread) => {
    setEditingId(thread.id);
    setEditValue(thread.title);
  };

  const saveEdit = () => {
    if (editingId && onEditThread) {
      onEditThread(editingId, editValue);
    }
    setEditingId(null);
    setEditValue("");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditValue("");
  };

  if (isCollapsed) {
    return (
      <div className="w-16 bg-black/60 backdrop-blur-md border-r border-white/10 flex flex-col items-center py-4 space-y-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className="text-white hover:bg-white/10"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={onNewChat}
          className="text-white hover:bg-white/10"
          title="New Chat"
        >
          <Plus className="w-4 h-4" />
        </Button>

        {/* Tool shortcuts */}
        <div className="border-t border-white/10 pt-4 space-y-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={onImageEditor}
            className="text-white hover:bg-white/10"
            title="Image Editor"
          >
            <Image className="w-4 h-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={onVideoEditor}
            className="text-white hover:bg-white/10"
            title="Video Editor"
          >
            <Video className="w-4 h-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={onDataAnalytics}
            className="text-white hover:bg-white/10"
            title="Data Analytics"
          >
            <BarChart3 className="w-4 h-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={onGraphGenerator}
            className="text-white hover:bg-white/10"
            title="Graph Generator"
          >
            <Network className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-80 bg-black/60 backdrop-blur-md border-r border-white/10 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Elora AI</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className="text-white hover:bg-white/10"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
        </div>
        
        <Button
          onClick={onNewChat}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Chat
        </Button>
      </div>

      {/* Advanced Tools */}
      <div className="p-4 border-b border-white/10">
        <div className="text-sm text-white/60 mb-3">Advanced Tools</div>
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onImageEditor}
            className="flex flex-col items-center p-3 h-auto bg-white/5 border-white/20 hover:bg-white/10"
          >
            <Image className="w-4 h-4 mb-1" />
            <span className="text-xs">Image Editor</span>
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={onVideoEditor}
            className="flex flex-col items-center p-3 h-auto bg-white/5 border-white/20 hover:bg-white/10"
          >
            <Video className="w-4 h-4 mb-1" />
            <span className="text-xs">Video Editor</span>
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={onDataAnalytics}
            className="flex flex-col items-center p-3 h-auto bg-white/5 border-white/20 hover:bg-white/10"
          >
            <BarChart3 className="w-4 h-4 mb-1" />
            <span className="text-xs">Analytics</span>
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={onGraphGenerator}
            className="flex flex-col items-center p-3 h-auto bg-white/5 border-white/20 hover:bg-white/10"
          >
            <Network className="w-4 h-4 mb-1" />
            <span className="text-xs">Graphs</span>
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="p-4 border-b border-white/10">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/40" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Thread List */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {filteredThreads.length === 0 ? (
            <div className="text-center text-white/40 py-8">
              <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No conversations yet</p>
            </div>
          ) : (
            filteredThreads.map((thread) => (
              <div
                key={thread.id}
                className={cn(
                  "group relative p-3 rounded-lg cursor-pointer transition-colors",
                  currentThreadId === thread.id
                    ? "bg-blue-600/20 border border-blue-500/30"
                    : "hover:bg-white/5"
                )}
                onClick={() => !editingId && onThreadSelect(thread.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    {editingId === thread.id ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="w-full px-2 py-1 bg-white/10 border border-white/20 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') saveEdit();
                            if (e.key === 'Escape') cancelEdit();
                          }}
                          autoFocus
                        />
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            onClick={saveEdit}
                            className="h-6 px-2 text-xs"
                          >
                            Save
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={cancelEdit}
                            className="h-6 px-2 text-xs text-white hover:bg-white/10"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="font-medium text-sm text-white truncate">
                          {thread.title}
                        </div>
                        <div className="text-xs text-white/60 mt-1">
                          {new Date(thread.updatedAt).toLocaleDateString()}
                        </div>
                        {thread.messageCount && (
                          <Badge variant="secondary" className="mt-1 text-xs">
                            {thread.messageCount} messages
                          </Badge>
                        )}
                      </>
                    )}
                  </div>
                  
                  {!editingId && (
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 ml-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          startEdit(thread);
                        }}
                        className="h-6 w-6 text-white/60 hover:text-white hover:bg-white/10"
                      >
                        <Edit3 className="w-3 h-3" />
                      </Button>
                      {onDeleteThread && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteThread(thread.id);
                          }}
                          className="h-6 w-6 text-white/60 hover:text-red-400 hover:bg-red-500/10"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}