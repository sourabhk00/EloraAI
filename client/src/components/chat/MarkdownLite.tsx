"use client";

import { useEffect, useState } from "react";

interface MarkdownLiteProps {
  text: string;
}

export default function MarkdownLite({ text }: MarkdownLiteProps) {
  const [copiedBlocks, setCopiedBlocks] = useState<Set<number>>(new Set());

  const copyToClipboard = async (code: string, index: number) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedBlocks(prev => new Set(prev).add(index));
      setTimeout(() => {
        setCopiedBlocks(prev => {
          const newSet = new Set(prev);
          newSet.delete(index);
          return newSet;
        });
      }, 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const processMarkdown = (input: string) => {
    let processed = input;
    
    // Code blocks with language
    processed = processed.replace(
      /```(\w+)?\n([\s\S]*?)```/g,
      (match, lang, code, offset, string) => {
        const index = string.substring(0, offset).split('```').length - 1;
        const language = lang || 'text';
        return `<div class="code-block-container">
          <div class="code-block-header">
            <span class="code-language">${language}</span>
            <button class="copy-button" data-code="${encodeURIComponent(code)}" data-index="${index}">
              <span class="copy-icon">📋</span>
              <span class="copy-text">Copy</span>
            </button>
          </div>
          <pre class="code-block"><code class="language-${language}">${escapeHtml(code.trim())}</code></pre>
        </div>`;
      }
    );
    
    // Inline code
    processed = processed.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');
    
    // Bold text
    processed = processed.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Italic text
    processed = processed.replace(/\*(.*?)\*/g, '<em>$1</em>');
    
    // Headers
    processed = processed.replace(/^### (.*$)/gm, '<h3 class="heading-3">$1</h3>');
    processed = processed.replace(/^## (.*$)/gm, '<h2 class="heading-2">$1</h2>');
    processed = processed.replace(/^# (.*$)/gm, '<h1 class="heading-1">$1</h1>');
    
    // Lists
    processed = processed.replace(/^\* (.*$)/gm, '<li class="list-item">$1</li>');
    processed = processed.replace(/(<li class="list-item">.*<\/li>)[\s\S]*/g, '<ul class="list">$1</ul>');
    
    // Numbered lists
    processed = processed.replace(/^\d+\. (.*$)/gm, '<li class="list-item-ordered">$1</li>');
    processed = processed.replace(/(<li class="list-item-ordered">.*<\/li>)[\s\S]*/g, '<ol class="list-ordered">$1</ol>');
    
    // Links
    processed = processed.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="link" target="_blank" rel="noopener noreferrer">$1</a>');
    
    // Line breaks
    processed = processed.replace(/\n/g, '<br>');
    
    return processed;
  };

  const escapeHtml = (text: string) => {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  };

  useEffect(() => {
    const handleCopyClick = (event: Event) => {
      const target = event.target as HTMLElement;
      const button = target.closest('.copy-button') as HTMLButtonElement;
      if (button) {
        event.preventDefault();
        const code = decodeURIComponent(button.dataset.code || '');
        const index = parseInt(button.dataset.index || '0');
        copyToClipboard(code, index);
      }
    };

    document.addEventListener('click', handleCopyClick);
    return () => document.removeEventListener('click', handleCopyClick);
  }, []);

  return (
    <div 
      className="markdown-content prose prose-invert max-w-none"
      dangerouslySetInnerHTML={{ __html: processMarkdown(text) }}
      style={{
        '--copy-button-display': 'inline-flex'
      } as React.CSSProperties}
    />
  );
}