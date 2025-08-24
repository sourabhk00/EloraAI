"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Image from "next/image"
import { AnimatePresence, motion } from "framer-motion"
import { Globe, Paperclip, Send, Loader2, X, FileText, Video, FileAudio, Image as ImageIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Textarea } from "@/components/ui/textarea"

interface UseAutoResizeTextareaProps {
  minHeight: number
  maxHeight?: number
}

function useAutoResizeTextarea({
  minHeight,
  maxHeight,
}: UseAutoResizeTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const adjustHeight = useCallback(
    (reset?: boolean) => {
      const textarea = textareaRef.current
      if (!textarea) return

      if (reset) {
        textarea.style.height = `${minHeight}px`
        return
      }

      textarea.style.height = `${minHeight}px`
      const newHeight = Math.max(
        minHeight,
        Math.min(textarea.scrollHeight, maxHeight ?? Number.POSITIVE_INFINITY)
      )

      textarea.style.height = `${newHeight}px`
    },
    [minHeight, maxHeight]
  )

  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = `${minHeight}px`
    }
  }, [minHeight])

  useEffect(() => {
    const handleResize = () => adjustHeight()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [adjustHeight])

  return { textareaRef, adjustHeight }
}

const MIN_HEIGHT = 58;
const MAX_HEIGHT = 197;

const AnimatedPlaceholder = ({ showSearch }: { showSearch: boolean }) => (
  <AnimatePresence mode="wait">
    <motion.p
      key={showSearch ? "search" : "ask"}
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -5 }}
      transition={{ duration: 0.1 }}
      className="pointer-events-none w-[150px] text-sm absolute text-black/30 dark:text-white/30 sm:text-black/70 sm:dark:text-white/70 drop-shadow-sm"
    >
      {showSearch ? "Search the web..." : "Ask Elora AI..."}
    </motion.p>
  </AnimatePresence>
);

const getFileIcon = (fileType: string) => {
  if (fileType.startsWith('image/')) return <ImageIcon className="w-4 h-4" />
  if (fileType.startsWith('video/')) return <Video className="w-4 h-4" />
  if (fileType.startsWith('audio/')) return <FileAudio className="w-4 h-4" />
  return <FileText className="w-4 h-4" />
}

const getFileTypeLabel = (fileType: string) => {
  if (fileType.startsWith('image/')) return 'Image'
  if (fileType.startsWith('video/')) return 'Video'
  if (fileType.startsWith('audio/')) return 'Audio'
  if (fileType === 'application/pdf') return 'PDF'
  if (fileType.includes('document') || fileType.includes('word')) return 'Document'
  if (fileType.includes('spreadsheet') || fileType.includes('excel')) return 'Spreadsheet'
  return 'File'
}

export function AiInput({
  onSubmit,
  loading = false,
}: {
  onSubmit: (text: string, files?: File[], webSearch?: boolean) => void;
  loading?: boolean;
}) {
  const [value, setValue] = useState("");
  const { textareaRef, adjustHeight } = useAutoResizeTextarea({
    minHeight: MIN_HEIGHT,
    maxHeight: MAX_HEIGHT,
  });
  const [showSearch, setShowSearch] = useState(true);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [barVisible, setBarVisible] = useState(true);
  const lastScrollY = useRef(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const removeFile = (index: number) => {
    const file = attachedFiles[index];
    const fileId = `${file.name}-${file.size}`;
    
    // Revoke preview URL
    if (previewUrls[fileId]) {
      URL.revokeObjectURL(previewUrls[fileId]);
    }
    
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
    setPreviewUrls(prev => {
      const newUrls = { ...prev };
      delete newUrls[fileId];
      return newUrls;
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Enhanced file type validation
    const allowedTypes = [
      // Images
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
      // Videos  
      'video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/flv', 'video/webm',
      // Audio
      'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/m4a', 'audio/aac',
      // Documents
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain', 'text/csv',
      // Code files
      'text/javascript', 'text/typescript', 'application/json',
      'text/html', 'text/css', 'text/python', 'text/java',
    ];

    const invalidFiles = files.filter(file => !allowedTypes.includes(file.type) && !file.name.match(/\.(js|ts|jsx|tsx|py|java|cpp|c|html|css|json|xml|yaml|yml|md|txt)$/i));
    
    if (invalidFiles.length > 0) {
      setErrorMsg(`Unsupported file types: ${invalidFiles.map(f => f.name).join(', ')}`);
      setTimeout(() => setErrorMsg(null), 4000);
      return;
    }

    // Check file size (50MB limit)
    const oversizedFiles = files.filter(file => file.size > 50 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      setErrorMsg(`Files too large (max 50MB): ${oversizedFiles.map(f => f.name).join(', ')}`);
      setTimeout(() => setErrorMsg(null), 4000);
      return;
    }

    // Add files and create preview URLs for images/videos
    const newFiles = [...attachedFiles, ...files].slice(0, 10); // Max 10 files
    setAttachedFiles(newFiles);

    // Create preview URLs for new files
    const newPreviewUrls = { ...previewUrls };
    files.forEach(file => {
      const fileId = `${file.name}-${file.size}`;
      if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
        newPreviewUrls[fileId] = URL.createObjectURL(file);
      }
    });
    setPreviewUrls(newPreviewUrls);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async () => {
    if (!value.trim() && attachedFiles.length === 0) return;
    
    onSubmit(value.trim(), attachedFiles, showSearch);
    setValue("");
    setAttachedFiles([]);
    
    // Clean up preview URLs
    Object.values(previewUrls).forEach(url => URL.revokeObjectURL(url));
    setPreviewUrls({});
    
    adjustHeight(true);
  };

  // Cleanup preview URLs on unmount
  useEffect(() => {
    return () => {
      Object.values(previewUrls).forEach(url => URL.revokeObjectURL(url));
    };
  }, []);

  // Hide bar on scroll down, show on scroll up
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY || 0;
      const delta = y - lastScrollY.current;
      const threshold = 6;
      if (y < 8) {
        setBarVisible(true);
      } else if (delta > threshold) {
        setBarVisible(false);
      } else if (delta < -threshold) {
        setBarVisible(true);
      }
      lastScrollY.current = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.div
      className="w-full py-4"
      initial={{ y: 0, opacity: 1 }}
      animate={{ y: barVisible ? 0 : 72, opacity: barVisible ? 1 : 0.9 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      <div className="relative max-w-4xl border rounded-[22px] border-black/5 dark:border-white/5 p-1 w-full mx-auto chat-input-shell">
        <div className="relative rounded-2xl border border-black/5 dark:border-white/5 overflow-hidden">
          <div
            className="ai-grow-area"
            style={
              { "--ai-input-max": `${MAX_HEIGHT}px` } as React.CSSProperties
            }
          >
            {/* Content area with bottom padding for fixed toolbar */}
            <div className="pb-12">
              {/* Attached Files Preview */}
              {attachedFiles.length > 0 && (
                <div className="border-b border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 p-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {attachedFiles.map((file, index) => {
                      const fileId = `${file.name}-${file.size}`;
                      const isImage = file.type.startsWith('image/');
                      const isVideo = file.type.startsWith('video/');
                      const previewUrl = previewUrls[fileId];
                      
                      return (
                        <div key={fileId} className="relative group">
                          <div className="flex items-center gap-2 p-2 bg-black/10 dark:bg-white/10 rounded-lg border border-black/10 dark:border-white/10">
                            {isImage && previewUrl ? (
                              <div className="relative w-10 h-10 rounded overflow-hidden bg-black/20 dark:bg-white/20">
                                <Image
                                  src={previewUrl}
                                  alt={file.name}
                                  fill
                                  className="object-cover"
                                />
                              </div>
                            ) : isVideo && previewUrl ? (
                              <div className="relative w-10 h-10 rounded overflow-hidden bg-black/20 dark:bg-white/20">
                                <video
                                  src={previewUrl}
                                  className="w-full h-full object-cover"
                                  muted
                                />
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <Video className="w-4 h-4 text-white" />
                                </div>
                              </div>
                            ) : (
                              <div className="w-10 h-10 rounded bg-black/20 dark:bg-white/20 flex items-center justify-center">
                                {getFileIcon(file.type)}
                              </div>
                            )}
                            
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-medium text-black/90 dark:text-white/90 truncate" title={file.name}>
                                {file.name}
                              </div>
                              <div className="text-xs text-black/60 dark:text-white/60">
                                {getFileTypeLabel(file.type)} • {Math.round(file.size / 1024)} KB
                              </div>
                            </div>
                            
                            <button
                              onClick={() => removeFile(index)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-black/20 dark:hover:bg-white/20 rounded"
                              title="Remove file"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Main textarea */}
              <div className="relative">
                <Textarea
                  id="ai-input-enhanced"
                  value={value}
                  placeholder=""
                  className="w-full rounded-2xl rounded-b-none px-4 py-3 bg-black/90 dark:bg-white/15 border-none text-white resize-none focus-visible:ring-0 leading-[1.2]"
                  ref={textareaRef}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit();
                    }
                  }}
                  onChange={(e) => {
                    setValue(e.target.value);
                    adjustHeight();
                  }}
                  disabled={loading}
                />
                {!value && (
                  <div className="absolute left-4 top-3">
                    <AnimatedPlaceholder showSearch={showSearch} />
                  </div>
                )}
              </div>

              {/* Error message */}
              {errorMsg && (
                <div className="px-4 py-2 text-[13px] text-rose-700 dark:text-rose-200 bg-rose-500/10 border-t border-black/10 dark:border-white/10">
                  {errorMsg}
                </div>
              )}
            </div>
          </div>

          {/* Fixed toolbar */}
          <div className="absolute inset-x-0 bottom-0 h-12 rounded-b-2xl backdrop-blur-sm flex items-center justify-between px-3 ai-toolbar-bg">
            <div className="flex items-center gap-2">
              <label
                title="Attach files"
                className={cn(
                  "cursor-pointer relative rounded-full p-1.5 bg-black/30 dark:bg-white/10 transition-colors",
                  attachedFiles.length > 0
                    ? "bg-[var(--accent-interactive-primary)]/15 border border-[var(--accent-interactive-primary)] text-[var(--accent-interactive-primary)]"
                    : "text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white",
                  loading && "opacity-50 cursor-not-allowed"
                )}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*,video/*,audio/*,application/pdf,text/*,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,.js,.ts,.jsx,.tsx,.py,.java,.cpp,.c,.html,.css,.json,.xml,.yaml,.yml,.md"
                  className="hidden"
                  multiple
                  disabled={loading}
                  aria-label="Attach files"
                />
                <Paperclip
                  className={cn(
                    "w-3.5 h-3.5 transition-colors",
                    attachedFiles.length > 0
                      ? "text-[var(--accent-interactive-primary)]"
                      : "text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white"
                  )}
                />
                {attachedFiles.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-[var(--accent-interactive-primary)] text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                    {attachedFiles.length}
                  </span>
                )}
              </label>
              
              <button
                type="button"
                onClick={() => setShowSearch(!showSearch)}
                disabled={loading}
                className={cn(
                  "rounded-full transition-all flex items-center gap-1.5 px-1.5 py-1 h-7 search-toggle",
                  showSearch && "data-[active=true]:shadow"
                )}
                data-active={showSearch}
                aria-pressed={showSearch ? "true" : "false"}
                title={showSearch ? "Disable web search" : "Enable web search"}
              >
                <div className="w-4 h-4 flex items-center justify-center flex-shrink-0">
                  <motion.div
                    animate={{
                      rotate: showSearch ? 180 : 0,
                      scale: showSearch ? 1.1 : 1,
                    }}
                    transition={{
                      type: "spring",
                      stiffness: 260,
                      damping: 25,
                    }}
                  >
                    <Globe
                      className={cn(
                        "w-4 h-4",
                        showSearch
                          ? "text-white"
                          : "text-black/60 dark:text-white/50"
                      )}
                    />
                  </motion.div>
                </div>
                <AnimatePresence>
                  {showSearch && (
                    <motion.span
                      initial={{ width: 0, opacity: 0 }}
                      animate={{
                        width: "auto",
                        opacity: 1,
                      }}
                      exit={{ width: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="text-sm overflow-hidden whitespace-nowrap search-toggle-label flex-shrink-0"
                    >
                      Search
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
            </div>
            
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading || (!value.trim() && attachedFiles.length === 0)}
              aria-label="Send message"
              className={cn(
                "rounded-full p-2 transition-colors",
                (value.trim() || attachedFiles.length > 0) && !loading
                  ? "bg-[var(--accent-interactive-primary)] text-white hover:bg-[var(--accent-interactive-hover)] accent-glow-soft"
                  : "bg-black/5 dark:bg-white/5 text-black/40 dark:text-white/40 cursor-not-allowed"
              )}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}