import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Paperclip, X } from "lucide-react";
import { processFiles } from "@/lib/ai-client";
import { motion, AnimatePresence } from "framer-motion";

interface FileUploadProps {
  onFilesSelected: (files: File[]) => void;
  acceptedTypes?: string;
}

export function FileUpload({ onFilesSelected, acceptedTypes = "*/*" }: FileUploadProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    handleFiles(files);
  };

  const handleFiles = (files: File[]) => {
    setSelectedFiles(prev => [...prev, ...files]);
    onFilesSelected(files);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return '🖼️';
    if (file.type.startsWith('video/')) return '🎥';
    if (file.type.startsWith('audio/')) return '🎵';
    if (file.type === 'application/pdf') return '📄';
    if (file.type.includes('word')) return '📝';
    if (file.type.includes('sheet')) return '📊';
    if (file.name.endsWith('.py')) return '🐍';
    if (file.name.endsWith('.js') || file.name.endsWith('.ts')) return '⚡';
    if (file.name.endsWith('.java')) return '☕';
    if (file.name.endsWith('.cpp') || file.name.endsWith('.c')) return '⚙️';
    if (file.name.endsWith('.html')) return '🌐';
    if (file.name.endsWith('.css')) return '🎨';
    return '📁';
  };

  return (
    <div className="space-y-3">
      {/* File Drop Zone */}
      <AnimatePresence>
        {isDragOver && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="bg-slate-800 border-2 border-dashed border-cyan-400 rounded-2xl p-8 text-center">
              <div className="text-4xl mb-4">📁</div>
              <p className="text-white text-lg">Drop files here</p>
              <p className="text-gray-400">Supports images, videos, documents, code files, and more</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upload Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => fileInputRef.current?.click()}
        className="p-3 bg-slate-700 hover:bg-slate-600"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <Paperclip className="h-4 w-4 text-gray-400" />
      </Button>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={acceptedTypes}
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Selected Files Display */}
      <AnimatePresence>
        {selectedFiles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2"
          >
            {selectedFiles.map((file, index) => (
              <motion.div
                key={`${file.name}-${index}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex items-center justify-between bg-slate-700 rounded-lg p-3"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-lg">{getFileIcon(file)}</span>
                  <div>
                    <div className="text-white text-sm font-medium">{file.name}</div>
                    <div className="text-gray-400 text-xs">{formatFileSize(file.size)}</div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(index)}
                  className="text-gray-400 hover:text-red-400"
                >
                  <X className="h-4 w-4" />
                </Button>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
