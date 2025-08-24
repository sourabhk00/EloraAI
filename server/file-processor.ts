import mammoth from 'mammoth';
import sharp from 'sharp';
import { promises as fs } from 'fs';
import path from 'path';

export interface ProcessedFile {
  name: string;
  type: string;
  size: number;
  content: string;
  metadata?: any;
}

export async function processFile(filePath: string, originalName: string, mimeType: string): Promise<ProcessedFile> {
  const stats = await fs.stat(filePath);
  const baseResult: ProcessedFile = {
    name: originalName,
    type: mimeType,
    size: stats.size,
    content: '',
  };

  try {
    switch (true) {
      case mimeType.startsWith('text/'):
        baseResult.content = await fs.readFile(filePath, 'utf-8');
        break;

      case mimeType === 'application/pdf':
        // PDF processing will be added later - for now just indicate PDF uploaded
        baseResult.content = `[PDF Document: ${originalName}] - PDF processing will be available in the next update.`;
        baseResult.metadata = {
          type: 'pdf',
          size: stats.size,
        };
        break;

      case mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        const docxBuffer = await fs.readFile(filePath);
        const docxResult = await mammoth.extractRawText({ buffer: docxBuffer });
        baseResult.content = docxResult.value;
        break;

      case mimeType.startsWith('image/'):
        const imageBuffer = await fs.readFile(filePath);
        const imageMetadata = await sharp(imageBuffer).metadata();
        baseResult.content = `[Image: ${originalName}]`;
        baseResult.metadata = {
          width: imageMetadata.width,
          height: imageMetadata.height,
          format: imageMetadata.format,
          size: stats.size,
        };
        break;

      case mimeType.startsWith('video/'):
        baseResult.content = `[Video: ${originalName}]`;
        baseResult.metadata = {
          size: stats.size,
          format: path.extname(originalName).slice(1),
        };
        break;

      case mimeType.startsWith('audio/'):
        baseResult.content = `[Audio: ${originalName}]`;
        baseResult.metadata = {
          size: stats.size,
          format: path.extname(originalName).slice(1),
        };
        break;

      case mimeType === 'application/json':
        const jsonContent = await fs.readFile(filePath, 'utf-8');
        baseResult.content = jsonContent;
        try {
          baseResult.metadata = { isValidJson: true, parsed: JSON.parse(jsonContent) };
        } catch {
          baseResult.metadata = { isValidJson: false };
        }
        break;

      case mimeType === 'text/csv':
        baseResult.content = await fs.readFile(filePath, 'utf-8');
        const lines = baseResult.content.split('\n').filter(line => line.trim());
        baseResult.metadata = {
          rows: lines.length,
          columns: lines[0]?.split(',').length || 0,
        };
        break;

      case originalName.endsWith('.py'):
        baseResult.content = await fs.readFile(filePath, 'utf-8');
        baseResult.metadata = { language: 'python' };
        break;

      case originalName.endsWith('.cpp') || originalName.endsWith('.cc') || originalName.endsWith('.cxx'):
        baseResult.content = await fs.readFile(filePath, 'utf-8');
        baseResult.metadata = { language: 'cpp' };
        break;

      case originalName.endsWith('.java'):
        baseResult.content = await fs.readFile(filePath, 'utf-8');
        baseResult.metadata = { language: 'java' };
        break;

      case originalName.endsWith('.js') || originalName.endsWith('.ts'):
        baseResult.content = await fs.readFile(filePath, 'utf-8');
        baseResult.metadata = { language: originalName.endsWith('.ts') ? 'typescript' : 'javascript' };
        break;

      case originalName.endsWith('.yaml') || originalName.endsWith('.yml'):
        baseResult.content = await fs.readFile(filePath, 'utf-8');
        baseResult.metadata = { language: 'yaml' };
        break;

      case originalName.endsWith('.xml'):
        baseResult.content = await fs.readFile(filePath, 'utf-8');
        baseResult.metadata = { language: 'xml' };
        break;

      case originalName.endsWith('.html') || originalName.endsWith('.htm'):
        baseResult.content = await fs.readFile(filePath, 'utf-8');
        baseResult.metadata = { language: 'html' };
        break;

      case originalName.endsWith('.css'):
        baseResult.content = await fs.readFile(filePath, 'utf-8');
        baseResult.metadata = { language: 'css' };
        break;

      case originalName.endsWith('.sql'):
        baseResult.content = await fs.readFile(filePath, 'utf-8');
        baseResult.metadata = { language: 'sql' };
        break;

      case originalName.endsWith('.md'):
        baseResult.content = await fs.readFile(filePath, 'utf-8');
        baseResult.metadata = { language: 'markdown' };
        break;

      default:
        // Try to read as text for other files
        try {
          baseResult.content = await fs.readFile(filePath, 'utf-8');
        } catch {
          baseResult.content = `[Binary file: ${originalName}]`;
        }
        break;
    }
  } catch (error) {
    console.error(`Error processing file ${originalName}:`, error);
    baseResult.content = `[Error processing file: ${originalName}]`;
  }

  return baseResult;
}

export function getFileIcon(mimeType: string, fileName: string): string {
  if (mimeType.startsWith('image/')) return '🖼️';
  if (mimeType.startsWith('video/')) return '🎥';
  if (mimeType.startsWith('audio/')) return '🎵';
  if (mimeType === 'application/pdf') return '📄';
  if (mimeType.includes('word') || fileName.endsWith('.docx')) return '📝';
  if (mimeType.includes('sheet') || fileName.endsWith('.xlsx')) return '📊';
  if (mimeType.includes('presentation') || fileName.endsWith('.pptx')) return '📽️';
  if (fileName.endsWith('.py')) return '🐍';
  if (fileName.endsWith('.js') || fileName.endsWith('.ts')) return '⚡';
  if (fileName.endsWith('.java')) return '☕';
  if (fileName.endsWith('.cpp') || fileName.endsWith('.c')) return '⚙️';
  if (fileName.endsWith('.html')) return '🌐';
  if (fileName.endsWith('.css')) return '🎨';
  if (fileName.endsWith('.json')) return '📋';
  if (fileName.endsWith('.xml')) return '📰';
  if (fileName.endsWith('.yaml') || fileName.endsWith('.yml')) return '⚙️';
  if (fileName.endsWith('.md')) return '📖';
  if (mimeType.startsWith('text/')) return '📄';
  return '📁';
}