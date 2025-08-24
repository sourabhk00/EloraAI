"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Eye,
  EyeOff,
  Check,
  Loader2,
  Copy as CopyIcon,
  Pencil,
  Save,
  X,
  Star,
  Trash,
  ChevronDown,
  ChevronUp,
  Download,
  Edit3,
  Image as ImageIcon,
  Video,
  FileText,
  Volume2
} from "lucide-react";
import MarkdownLite from "./MarkdownLite";
import ConfirmDialog from "@/components/modals/ConfirmDialog";
import type { AiModel, ChatMessage } from "@/lib/types";

export type ChatGridProps = {
  selectedModels: AiModel[];
  headerTemplate: string;
  collapsedIds: string[];
  setCollapsedIds: (updater: (prev: string[]) => string[]) => void;
  loadingIds: string[];
  pairs: { user: ChatMessage; answers: ChatMessage[] }[];
  copyToClipboard: (text: string) => Promise<void> | void;
  copiedAllIdx: number | null;
  setCopiedAllIdx: (v: number | null) => void;
  copiedKey: string | null;
  setCopiedKey: (
    v: string | null | ((prev: string | null) => string | null)
  ) => void;
  onEditUser: (turnIndex: number, newText: string) => void;
  onDeleteUser: (turnIndex: number) => void;
  onDeleteAnswer: (turnIndex: number, modelId: string) => void;
  onPlayAudio?: (text: string) => void;
  onImageEdit?: (imageUrl: string) => void;
  onVideoEdit?: (videoUrl: string) => void;
  onFileAnalysis?: (fileUrl: string, fileType: string) => void;
};

const getContentType = (content: string): 'text' | 'image' | 'video' | 'audio' | 'file' => {
  if (content.includes('data:image/') || content.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) return 'image';
  if (content.includes('data:video/') || content.match(/\.(mp4|avi|mov|wmv|flv|webm)$/i)) return 'video';
  if (content.includes('data:audio/') || content.match(/\.(mp3|wav|ogg|m4a|aac)$/i)) return 'audio';
  if (content.match(/\.(pdf|doc|docx|xls|xlsx|ppt|pptx)$/i)) return 'file';
  return 'text';
};

const MediaRenderer = ({ 
  content, 
  type, 
  onEdit, 
  onPlayAudio, 
  onFileAnalysis 
}: { 
  content: string; 
  type: 'image' | 'video' | 'audio' | 'file'; 
  onEdit?: (url: string) => void;
  onPlayAudio?: (text: string) => void;
  onFileAnalysis?: (url: string, type: string) => void;
}) => {
  switch (type) {
    case 'image':
      return (
        <div className="relative group mb-3">
          <img 
            src={content} 
            alt="Generated content" 
            className="max-w-full h-auto rounded-lg border border-white/10"
          />
          {onEdit && (
            <button
              onClick={() => onEdit(content)}
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-2 bg-black/50 hover:bg-black/70 rounded-lg text-white"
              title="Edit image"
            >
              <Edit3 size={16} />
            </button>
          )}
        </div>
      );
    case 'video':
      return (
        <div className="relative group mb-3">
          <video 
            src={content} 
            controls 
            className="max-w-full h-auto rounded-lg border border-white/10"
          />
          {onEdit && (
            <button
              onClick={() => onEdit(content)}
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-2 bg-black/50 hover:bg-black/70 rounded-lg text-white"
              title="Edit video"
            >
              <Edit3 size={16} />
            </button>
          )}
        </div>
      );
    case 'audio':
      return (
        <div className="flex items-center gap-3 p-3 bg-black/20 rounded-lg border border-white/10 mb-3">
          <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
            <Volume2 size={18} />
          </div>
          <div className="flex-1">
            <audio src={content} controls className="w-full" />
          </div>
          {onPlayAudio && (
            <button
              onClick={() => onPlayAudio(content)}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              title="Play audio"
            >
              <Volume2 size={16} />
            </button>
          )}
        </div>
      );
    case 'file':
      return (
        <div className="flex items-center gap-3 p-3 bg-black/20 rounded-lg border border-white/10 mb-3">
          <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
            <FileText size={18} />
          </div>
          <div className="flex-1">
            <div className="text-sm font-medium">Document</div>
            <div className="text-xs text-white/60">Click to download or analyze</div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => window.open(content, '_blank')}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              title="Download file"
            >
              <Download size={16} />
            </button>
            {onFileAnalysis && (
              <button
                onClick={() => onFileAnalysis(content, 'file')}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                title="Analyze file"
              >
                <Eye size={16} />
              </button>
            )}
          </div>
        </div>
      );
    default:
      return null;
  }
};

export default function ChatGrid({
  selectedModels,
  headerTemplate,
  collapsedIds,
  setCollapsedIds,
  loadingIds,
  pairs,
  copyToClipboard,
  copiedAllIdx,
  setCopiedAllIdx,
  copiedKey,
  setCopiedKey,
  onEditUser,
  onDeleteUser,
  onDeleteAnswer,
  onPlayAudio,
  onImageEdit,
  onVideoEdit,
  onFileAnalysis,
}: ChatGridProps) {
  const [pendingDelete, setPendingDelete] = useState<
    | { type: "turn"; turnIndex: number }
    | { type: "answer"; turnIndex: number; modelId: string }
    | null
  >(null);
  
  // Sanitize certain provider-specific XML-ish wrappers
  const sanitizeContent = (s: string): string => {
    try {
      let t = String(s ?? "");
      t = t.replace(/<\/?answer[^>]*>/gi, "");
      t = t.replace(/<\/?think[^>]*>/gi, "");
      return t.trim();
    } catch {
      return s;
    }
  };
  
  // Approximate token estimator
  const estimateTokens = (text: string): number => {
    try {
      const t = (text || "").replace(/\s+/g, " ").trim();
      return t.length > 0 ? Math.ceil(t.length / 4) : 0;
    } catch {
      return 0;
    }
  };
  
  const headerCols = useMemo(
    () =>
      headerTemplate || `repeat(${selectedModels.length}, minmax(280px, 1fr))`,
    [headerTemplate, selectedModels.length]
  );
  
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [draft, setDraft] = useState<string>("");
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [pairs]);

  return (
    <>
      <div
        ref={scrollRef} 
        className="relative rounded-lg border border-black/5 dark:border-white/5 bg-black/5 dark:bg-white/5 px-3 lg:px-4 pt-2 overflow-x-auto flex-1 overflow-y-auto pb-28 sm:scroll-stable-gutter"
      >
        {selectedModels.length === 0 ? (
          <div className="p-4 text-zinc-500 dark:text-zinc-400 text-center">
            <div className="max-w-md mx-auto">
              <h3 className="text-lg font-medium mb-2">Welcome to Elora AI</h3>
              <p className="text-sm mb-4">Select up to 5 AI models to compare their responses. Upload images, videos, documents, and more for comprehensive analysis.</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 bg-black/10 dark:bg-white/10 rounded">
                  <ImageIcon className="w-4 h-4 mb-1 mx-auto" />
                  <div>Image Editing</div>
                </div>
                <div className="p-2 bg-black/10 dark:bg-white/10 rounded">
                  <Video className="w-4 h-4 mb-1 mx-auto" />
                  <div>Video Processing</div>
                </div>
                <div className="p-2 bg-black/10 dark:bg-white/10 rounded">
                  <FileText className="w-4 h-4 mb-1 mx-auto" />
                  <div>Document Analysis</div>
                </div>
                <div className="p-2 bg-black/10 dark:bg-white/10 rounded">
                  <Volume2 className="w-4 h-4 mb-1 mx-auto" />
                  <div>Audio Generation</div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="min-w-full space-y-3">
            {/* Enhanced Header row */}
            <div
              className="relative grid min-w-full gap-3 items-center overflow-visible mt-0 sticky top-0 left-0 right-0 z-30 -mx-3 px-3 lg:-mx-4 lg:px-4 py-2 rounded-t-lg shadow-[0_2px_8px_rgba(0,0,0,0.3)] bg-black/60 dark:bg-black/60 backdrop-blur-md border-b border-black/20 dark:border-white/20"
              style={{ gridTemplateColumns: headerCols }}
            >
              {selectedModels.map((m) => {
                const isFree = /(\(|\s)free\)/i.test(m.label);
                const isCollapsed = collapsedIds.includes(m.id);
                return (
                  <div
                    key={m.id}
                    className={`px-3 py-2 min-h-[44px] border-b flex items-center ${
                      isCollapsed ? "justify-center" : "justify-between"
                    } overflow-visible bg-black/80 dark:bg-black/80 rounded-lg border border-black/20 dark:border-white/20 ${
                      m.good ? "border-amber-300/40 bg-gradient-to-r from-amber-500/10 to-yellow-500/10" : ""
                    }`}
                  >
                    {!isCollapsed && (
                      <div
                        className={`text-sm leading-normal font-medium pr-2 inline-flex items-center gap-2 min-w-0 text-white ${
                          m.good || isFree ? "opacity-100" : "opacity-90"
                        }`}
                      >
                        {m.good && (
                          <span className="badge-base badge-pro inline-flex items-center gap-1 px-2 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30">
                            <Star size={11} fill="currentColor" />
                            <span className="hidden sm:inline text-xs">Pro</span>
                          </span>
                        )}
                        {isFree && (
                          <span className="badge-base badge-free inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-500/20 text-green-300 border border-green-400/30">
                            <span className="h-2 w-2 rounded-full bg-current opacity-80" />
                            <span className="hidden sm:inline text-xs">Free</span>
                          </span>
                        )}
                        <span className="truncate font-semibold" title={m.label}>
                          {m.label}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      {isCollapsed ? (
                        <button
                          onClick={() =>
                            setCollapsedIds((prev) =>
                              prev.filter((id) => id !== m.id)
                            )
                          }
                          className="icon-btn h-8 w-8 accent-focus bg-white/10 hover:bg-white/20 rounded-full transition-colors"
                          title={`Expand ${m.label}`}
                        >
                          <ChevronDown size={16} />
                        </button>
                      ) : (
                        <button
                          onClick={() =>
                            setCollapsedIds((prev) => [...prev, m.id])
                          }
                          className="icon-btn h-8 w-8 accent-focus bg-white/10 hover:bg-white/20 rounded-full transition-colors"
                          title={`Collapse ${m.label}`}
                        >
                          <ChevronUp size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {pairs.map((row, i) => (
              <div key={i} className="space-y-4">
                {/* Enhanced User Prompt */}
                <div className="relative flex items-start justify-between gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-400/20 backdrop-blur-sm">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div className="flex-shrink-0">
                      <span className="inline-flex items-center gap-2 h-8 px-3 rounded-full text-xs font-semibold text-white bg-gradient-to-r from-blue-500 to-purple-500 shadow-lg">
                        <span className="h-2 w-2 rounded-full bg-white/90 animate-pulse" />
                        You
                      </span>
                    </div>
                    <div className="flex-1 min-w-0 mt-1">
                      <div className="text-sm leading-relaxed text-white font-medium">
                        {row.user.content}
                      </div>
                      {/* Show attached files if any */}
                      {row.user.attachments && row.user.attachments.length > 0 && (
                        <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                          {row.user.attachments.map((attachment, idx) => (
                            <div key={idx} className="flex items-center gap-2 p-2 bg-black/20 rounded-lg border border-white/10">
                              {getContentType(attachment.url) === 'image' && <ImageIcon size={14} />}
                              {getContentType(attachment.url) === 'video' && <Video size={14} />}
                              {getContentType(attachment.url) === 'file' && <FileText size={14} />}
                              <span className="text-xs truncate" title={attachment.name}>
                                {attachment.name}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => onEditUser(i, row.user.content)}
                      className="icon-btn h-8 w-8 accent-focus bg-white/10 hover:bg-white/20 rounded-full transition-colors"
                      title="Edit message"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => onDeleteUser(i)}
                      className="icon-btn h-8 w-8 accent-focus bg-white/10 hover:bg-red-500/20 hover:border-red-400/30 rounded-full transition-colors"
                      title="Delete message"
                    >
                      <Trash size={14} />
                    </button>
                    <button
                      onClick={() => copyToClipboard(row.user.content)}
                      className="icon-btn h-8 w-8 accent-focus bg-white/10 hover:bg-white/20 rounded-full transition-colors"
                      title="Copy message"
                    >
                      <CopyIcon size={14} />
                    </button>
                  </div>
                </div>

                {/* Enhanced Responses Grid */}
                <div
                  className="grid gap-4 items-stretch"
                  style={{ gridTemplateColumns: headerCols }}
                >
                  {selectedModels.map((m) => {
                    const ans = row.answers.find((a) => a.modelId === m.id);
                    const isCollapsed = collapsedIds.includes(m.id);
                    const isLoading = loadingIds.includes(m.id);
                    const contentType = ans ? getContentType(ans.content) : 'text';
                    
                    return (
                      <div key={m.id} className="h-full">
                        <div
                          className={`group relative rounded-xl ${
                            isCollapsed ? "p-3" : "p-4"
                          } h-full min-h-[160px] flex overflow-hidden transition-all duration-200 ${
                            isCollapsed 
                              ? "cursor-pointer bg-gradient-to-b from-black/60 to-black/40 border border-white/10 hover:border-white/20" 
                              : "bg-gradient-to-b from-black/50 to-black/30 border border-white/15 hover:border-white/25"
                          } backdrop-blur-sm shadow-lg`}
                          onClick={() => {
                            if (isCollapsed)
                              setCollapsedIds((prev) =>
                                prev.filter((id) => id !== m.id)
                              );
                          }}
                          title={isCollapsed ? "Click to expand" : undefined}
                        >
                          {/* Response Actions */}
                          {ans && String(ans.content || "").length > 0 && (
                            <div
                              className={`absolute top-3 right-3 z-10 flex gap-2 ${
                                isCollapsed
                                  ? "opacity-0 pointer-events-none"
                                  : "opacity-0 group-hover:opacity-100"
                              } transition-opacity`}
                            >
                              {contentType === 'text' && onPlayAudio && (
                                <button
                                  onClick={() => onPlayAudio(sanitizeContent(ans.content))}
                                  className="icon-btn h-8 w-8 accent-focus bg-black/50 hover:bg-black/70 rounded-full transition-colors"
                                  title="Play as audio"
                                >
                                  <Volume2 size={12} />
                                </button>
                              )}
                              {contentType === 'image' && onImageEdit && (
                                <button
                                  onClick={() => onImageEdit(ans.content)}
                                  className="icon-btn h-8 w-8 accent-focus bg-black/50 hover:bg-black/70 rounded-full transition-colors"
                                  title="Edit image"
                                >
                                  <Edit3 size={12} />
                                </button>
                              )}
                              {contentType === 'video' && onVideoEdit && (
                                <button
                                  onClick={() => onVideoEdit(ans.content)}
                                  className="icon-btn h-8 w-8 accent-focus bg-black/50 hover:bg-black/70 rounded-full transition-colors"
                                  title="Edit video"
                                >
                                  <Edit3 size={12} />
                                </button>
                              )}
                              <button
                                onClick={() =>
                                  setPendingDelete({
                                    type: "answer",
                                    turnIndex: i,
                                    modelId: m.id,
                                  })
                                }
                                className="icon-btn h-8 w-8 accent-focus bg-black/50 hover:bg-red-500/70 rounded-full transition-colors"
                                title={`Delete ${m.label} response`}
                              >
                                <Trash size={12} />
                              </button>
                              <button
                                onClick={() => {
                                  copyToClipboard(sanitizeContent(ans.content));
                                  const key = `${i}:${m.id}`;
                                  setCopiedKey(key);
                                  window.setTimeout(
                                    () =>
                                      setCopiedKey((prev) =>
                                        typeof prev === "string" && prev === key
                                          ? null
                                          : prev
                                      ),
                                    1200
                                  );
                                }}
                                className={`icon-btn h-8 w-8 ${
                                  copiedKey === `${i}:${m.id}`
                                    ? "bg-emerald-500/20 border-emerald-300/30 text-emerald-100"
                                    : "bg-black/50 hover:bg-black/70"
                                } accent-focus rounded-full transition-colors`}
                                title={`Copy ${m.label} response`}
                              >
                                {copiedKey === `${i}:${m.id}` ? (
                                  <Check size={12} />
                                ) : (
                                  <CopyIcon size={12} />
                                )}
                              </button>
                            </div>
                          )}

                          {/* Response Content */}
                          <div className={`flex flex-col ${isCollapsed ? "items-center justify-center text-center" : "w-full"}`}>
                            {isLoading ? (
                              <div className="flex flex-col items-center justify-center gap-3 text-white/60">
                                <Loader2 size={24} className="animate-spin" />
                                <span className="text-sm">Generating response...</span>
                              </div>
                            ) : ans && String(ans.content || "").length > 0 ? (
                              <div className={`w-full ${isCollapsed ? "text-center" : ""}`}>
                                {isCollapsed ? (
                                  <div className="text-sm text-white/80 line-clamp-3">
                                    {contentType !== 'text' ? (
                                      <div className="flex items-center gap-2 justify-center">
                                        {contentType === 'image' && <ImageIcon size={16} />}
                                        {contentType === 'video' && <Video size={16} />}
                                        {contentType === 'audio' && <Volume2 size={16} />}
                                        {contentType === 'file' && <FileText size={16} />}
                                        <span className="capitalize">{contentType} content</span>
                                      </div>
                                    ) : (
                                      sanitizeContent(ans.content).substring(0, 100) + "..."
                                    )}
                                  </div>
                                ) : (
                                  <div className="prose prose-invert prose-sm max-w-none">
                                    {contentType === 'text' ? (
                                      <MarkdownLite text={sanitizeContent(ans.content)} />
                                    ) : (
                                      <MediaRenderer
                                        content={ans.content}
                                        type={contentType}
                                        onEdit={contentType === 'image' ? onImageEdit : contentType === 'video' ? onVideoEdit : undefined}
                                        onPlayAudio={onPlayAudio}
                                        onFileAnalysis={onFileAnalysis}
                                      />
                                    )}
                                    
                                    {/* Token count and timing info */}
                                    <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-white/50">
                                      <span>~{estimateTokens(sanitizeContent(ans.content))} tokens</span>
                                      {ans.timestamp && (
                                        <span>{new Date(ans.timestamp).toLocaleTimeString()}</span>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="flex items-center justify-center h-full text-white/40">
                                <span className="text-sm">No response</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <ConfirmDialog
        open={!!pendingDelete}
        title={pendingDelete?.type === "turn" ? "Delete this message?" : "Delete this response?"}
        message="This cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => {
          if (pendingDelete) {
            if (pendingDelete.type === "turn") {
              onDeleteUser(pendingDelete.turnIndex);
            } else {
              onDeleteAnswer(pendingDelete.turnIndex, pendingDelete.modelId);
            }
          }
          setPendingDelete(null);
        }}
      />
    </>
  );
}