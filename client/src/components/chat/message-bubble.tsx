import { Button } from "@/components/ui/button";
import { User, Volume2, Copy, Check } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";
import { TextToSpeech } from "./text-to-speech";
import { useToast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { ChatMessage } from "@shared/schema";

interface MessageBubbleProps {
  message: ChatMessage;
  isUser: boolean;
}

export function MessageBubble({ message, isUser }: MessageBubbleProps) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: "Copied",
        description: "Message copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Unable to copy message",
        variant: "destructive",
      });
    }
  };

  const extractGraphs = (content: string) => {
    // Extract graph URLs from content
    const graphUrlPattern = /!\[Graph of ([^\]]+)\]\((https:\/\/quickchart\.io\/chart[^)]+)\)/g;
    const graphs: Array<{ alt: string; url: string }> = [];
    let match;
    
    while ((match = graphUrlPattern.exec(content)) !== null) {
      graphs.push({
        alt: match[1],
        url: match[2]
      });
    }
    
    return graphs;
  };

  const removeGraphUrls = (content: string) => {
    // Remove graph URLs from content to avoid showing them as text
    return content.replace(/!\[Graph of ([^\]]+)\]\((https:\/\/quickchart\.io\/chart[^)]+)\)/g, '');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex items-start space-x-3 mb-4"
    >
      {/* Avatar */}
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
        isUser 
          ? "bg-gradient-to-br from-purple-400 to-pink-400" 
          : "bg-gradient-to-br from-cyan-400 to-blue-500"
      }`}>
        {isUser ? (
          <User className="h-4 w-4 text-white" />
        ) : (
          <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
          </svg>
        )}
      </div>

      {/* Message Content */}
      <div className={`rounded-2xl rounded-tl-md px-4 py-3 max-w-3xl transition-colors duration-300 ${
        isUser 
          ? "message-bubble-user" 
          : "message-bubble-assistant"
      }`}>
        <div className="text-white dark:text-white prose prose-invert dark:prose-invert max-w-none transition-colors duration-300">
          <ReactMarkdown 
            remarkPlugins={[remarkGfm]}
            components={{
              // Custom styles for markdown elements
              h1: ({children}) => <h1 className="text-xl font-bold mb-2 text-white">{children}</h1>,
              h2: ({children}) => <h2 className="text-lg font-semibold mb-2 text-white">{children}</h2>,
              h3: ({children}) => <h3 className="text-md font-medium mb-1 text-white">{children}</h3>,
              p: ({children}) => <p className="mb-2 text-white">{children}</p>,
              ul: ({children}) => <ul className="list-disc pl-4 mb-2 text-white">{children}</ul>,
              ol: ({children}) => <ol className="list-decimal pl-4 mb-2 text-white">{children}</ol>,
              li: ({children}) => <li className="mb-1 text-white">{children}</li>,
              strong: ({children}) => <strong className="font-bold text-white">{children}</strong>,
              em: ({children}) => <em className="italic text-white">{children}</em>,
              code: ({children}) => <code className="bg-slate-600 px-1 py-0.5 rounded text-sm text-gray-200">{children}</code>,
              pre: ({children}) => <pre className="bg-slate-700 p-3 rounded-lg overflow-x-auto mb-2">{children}</pre>,
              blockquote: ({children}) => <blockquote className="border-l-4 border-cyan-400 pl-3 italic text-gray-300 mb-2">{children}</blockquote>,
            }}
          >
            {removeGraphUrls(message.content)}
          </ReactMarkdown>
        </div>

        {/* Render graphs as images */}
        {extractGraphs(message.content).map((graph, index) => (
          <div key={index} className="mt-4 graph-container p-4 transition-colors duration-300">
            <img 
              src={graph.url} 
              alt={graph.alt}
              className="w-full max-w-lg mx-auto rounded-lg shadow-sm"
              onError={(e) => {
                console.error('Graph image failed to load:', graph.url);
                e.currentTarget.style.display = 'none';
              }}
            />
            <div className="text-gray-600 dark:text-gray-600 text-sm text-center mt-2 font-medium">
              Graph of {graph.alt}
            </div>
          </div>
        ))}
        
        {/* File attachments */}
        {message.metadata && (message.metadata as any).files && (
          <div className="mt-3 space-y-2">
            {(message.metadata as any).files.map((file: any, index: number) => (
              <div key={index} className="flex items-center space-x-2 text-sm text-gray-300">
                <span>📎</span>
                <span>{file.name}</span>
                <span className="text-gray-500">({file.size})</span>
              </div>
            ))}
          </div>
        )}

        {/* Charts or visualizations */}
        {message.metadata && (message.metadata as any).chart && (
          <div className="mt-3 bg-white rounded-lg p-4">
            <div className="h-48 flex items-end justify-center space-x-2">
              {(message.metadata as any).chart.data?.map((value: number, index: number) => (
                <div
                  key={index}
                  className="w-8 bg-cyan-400 rounded-t"
                  style={{ height: `${value}%` }}
                ></div>
              ))}
            </div>
            <div className="text-gray-600 text-sm text-center mt-2">
              {(message.metadata as any).chart.title || "Data Visualization"}
            </div>
          </div>
        )}

        {/* Action buttons for AI responses */}
        {!isUser && (
          <div className="flex items-center space-x-2 mt-3 pt-2 border-t border-slate-600">
            <TextToSpeech 
              text={message.content} 
              className="p-1 hover:bg-slate-600" 
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              className="p-1 hover:bg-slate-600"
            >
              {copied ? (
                <Check className="h-3 w-3 text-green-400" />
              ) : (
                <Copy className="h-3 w-3 text-gray-400" />
              )}
            </Button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
