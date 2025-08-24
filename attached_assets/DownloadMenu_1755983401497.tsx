"use client";
import { useState } from "react";
import { Download, FileText, FileDown, X } from "lucide-react";
import type { ChatThread, AiModel } from "@/lib/types";
import { downloadAsMarkdown, downloadAsPdf } from "@/lib/exportUtils";

type Props = {
  thread: ChatThread | null;
  selectedModels: AiModel[];
};

export default function DownloadMenu({ thread, selectedModels }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  if (!thread || thread.messages.length === 0) {
    return null;
  }

  const handleDownloadMarkdown = () => {
    downloadAsMarkdown(thread, selectedModels);
    setIsOpen(false);
  };

  const handleDownloadPdf = () => {
    downloadAsPdf(thread, selectedModels);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        title="Download chat"
        className="h-7 w-7 shrink-0 inline-flex items-center justify-center rounded-md border border-white/10 bg-white/5 hover:bg-white/20 text-zinc-300 hover:text-white transition-colors"
      >
        <Download size={14} />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Menu */}
          <div className="absolute right-0 top-8 z-50 w-48 rounded-lg border border-white/10 bg-zinc-900/95 backdrop-blur-sm shadow-xl">
            <div className="p-2">
              <div className="flex items-center justify-between px-2 py-1 mb-1">
                <span className="text-xs font-medium text-zinc-300">Export Chat</span>
                <button
                  onClick={() => setIsOpen(false)}
                  className="h-5 w-5 inline-flex items-center justify-center rounded hover:bg-white/10 text-zinc-400 hover:text-zinc-200"
                >
                  <X size={12} />
                </button>
              </div>
              
              <div className="space-y-1">
                <button
                  onClick={handleDownloadMarkdown}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm text-left rounded-md hover:bg-white/10 text-zinc-200 hover:text-white transition-colors"
                >
                  <FileText size={16} />
                  <div>
                    <div className="font-medium">Markdown (.md)</div>
                    <div className="text-xs text-zinc-400">Plain text format</div>
                  </div>
                </button>
                
                <button
                  onClick={handleDownloadPdf}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm text-left rounded-md hover:bg-white/10 text-zinc-200 hover:text-white transition-colors"
                >
                  <FileDown size={16} />
                  <div>
                    <div className="font-medium">PDF (.pdf)</div>
                    <div className="text-xs text-zinc-400">Formatted document</div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
