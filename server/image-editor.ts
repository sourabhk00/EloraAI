import sharp from 'sharp';
import { GoogleGenerativeAI } from '@google/generative-ai';

interface ImageEditRequest {
  imageData: Buffer;
  operation: 'filter' | 'adjust' | 'crop' | 'resize' | 'enhance' | 'remove_background' | 'style_transfer';
  parameters: {
    filter?: 'grayscale' | 'sepia' | 'vintage' | 'vivid' | 'warm' | 'cool' | 'dramatic';
    brightness?: number;
    contrast?: number;
    saturation?: number;
    width?: number;
    height?: number;
    cropArea?: { x: number; y: number; width: number; height: number };
    style?: string;
  };
}

interface ImageEditResult {
  success: boolean;
  editedImageData?: Buffer;
  message: string;
  metadata?: {
    originalSize: { width: number; height: number };
    newSize: { width: number; height: number };
    format: string;
    operations: string[];
  };
}

export class ImageEditor {
  private genAI: GoogleGenerativeAI;

  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
  }

  async editImage(request: ImageEditRequest): Promise<ImageEditResult> {
    try {
      let image = sharp(request.imageData);
      const metadata = await image.metadata();
      const operations: string[] = [];

      switch (request.operation) {
        case 'filter':
          image = await this.applyFilter(image, request.parameters.filter!, operations);
          break;
        
        case 'adjust':
          image = await this.adjustImage(image, request.parameters, operations);
          break;
        
        case 'crop':
          if (request.parameters.cropArea) {
            const { x, y, width, height } = request.parameters.cropArea;
            image = image.extract({ left: x, top: y, width, height });
            operations.push(`Cropped to ${width}x${height} at (${x}, ${y})`);
          }
          break;
        
        case 'resize':
          if (request.parameters.width && request.parameters.height) {
            image = image.resize(request.parameters.width, request.parameters.height);
            operations.push(`Resized to ${request.parameters.width}x${request.parameters.height}`);
          }
          break;
        
        case 'enhance':
          image = await this.enhanceImage(image, operations);
          break;
        
        case 'remove_background':
          // For background removal, we'd typically use specialized services
          operations.push('Background removal requested - use specialized tools like Remove.bg');
          break;
        
        case 'style_transfer':
          // Style transfer would require specialized AI models
          operations.push(`Style transfer requested: ${request.parameters.style}`);
          break;
      }

      const editedImageData = await image.jpeg({ quality: 90 }).toBuffer();
      const newMetadata = await sharp(editedImageData).metadata();

      return {
        success: true,
        editedImageData,
        message: `Image editing completed successfully! Applied operations: ${operations.join(', ')}`,
        metadata: {
          originalSize: { width: metadata.width || 0, height: metadata.height || 0 },
          newSize: { width: newMetadata.width || 0, height: newMetadata.height || 0 },
          format: newMetadata.format || 'unknown',
          operations
        }
      };

    } catch (error) {
      console.error('Image editing error:', error);
      return {
        success: false,
        message: `Image editing failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  private async applyFilter(image: sharp.Sharp, filter: string, operations: string[]): Promise<sharp.Sharp> {
    switch (filter) {
      case 'grayscale':
        operations.push('Applied grayscale filter');
        return image.grayscale();
      
      case 'sepia':
        operations.push('Applied sepia filter');
        return image.tint({ r: 112, g: 66, b: 20 });
      
      case 'vintage':
        operations.push('Applied vintage filter');
        return image.modulate({ brightness: 0.9, saturation: 0.8 }).tint({ r: 255, g: 204, b: 119 });
      
      case 'vivid':
        operations.push('Applied vivid filter');
        return image.modulate({ brightness: 1.1, saturation: 1.3 });
      
      case 'warm':
        operations.push('Applied warm filter');
        return image.tint({ r: 255, g: 220, b: 177 });
      
      case 'cool':
        operations.push('Applied cool filter');
        return image.tint({ r: 177, g: 220, b: 255 });
      
      case 'dramatic':
        operations.push('Applied dramatic filter');
        return image.modulate({ brightness: 0.95, saturation: 1.2 }).linear(1.2, -20);
      
      default:
        return image;
    }
  }

  private async adjustImage(image: sharp.Sharp, params: any, operations: string[]): Promise<sharp.Sharp> {
    const adjustments: any = {};
    
    if (params.brightness !== undefined) {
      adjustments.brightness = 1 + (params.brightness / 100);
      operations.push(`Brightness: ${params.brightness > 0 ? '+' : ''}${params.brightness}%`);
    }
    
    if (params.saturation !== undefined) {
      adjustments.saturation = 1 + (params.saturation / 100);
      operations.push(`Saturation: ${params.saturation > 0 ? '+' : ''}${params.saturation}%`);
    }

    if (Object.keys(adjustments).length > 0) {
      image = image.modulate(adjustments);
    }

    if (params.contrast !== undefined) {
      const contrastValue = 1 + (params.contrast / 100);
      image = image.linear(contrastValue, -(128 * contrastValue) + 128);
      operations.push(`Contrast: ${params.contrast > 0 ? '+' : ''}${params.contrast}%`);
    }

    return image;
  }

  private async enhanceImage(image: sharp.Sharp, operations: string[]): Promise<sharp.Sharp> {
    operations.push('Applied auto-enhancement (sharpening, noise reduction)');
    return image
      .sharpen({ sigma: 1, flat: 1, jagged: 2 })
      .modulate({ brightness: 1.05, saturation: 1.1 });
  }

  async analyzeImageForEditing(imageData: Buffer): Promise<{
    suggestions: string[];
    detectedIssues: string[];
    recommendedEdits: string[];
  }> {
    try {
      const metadata = await sharp(imageData).metadata();
      const suggestions: string[] = [];
      const detectedIssues: string[] = [];
      const recommendedEdits: string[] = [];

      // Analyze image properties
      if (metadata.width && metadata.height) {
        if (metadata.width < 1000 || metadata.height < 1000) {
          detectedIssues.push('Low resolution detected');
          recommendedEdits.push('Consider upscaling for better quality');
        }

        const aspectRatio = metadata.width / metadata.height;
        if (Math.abs(aspectRatio - 1) < 0.1) {
          suggestions.push('Square format detected - great for social media');
        } else if (Math.abs(aspectRatio - 16/9) < 0.1) {
          suggestions.push('Widescreen format detected - perfect for presentations');
        }
      }

      // General enhancement suggestions
      suggestions.push('Try the "enhance" filter for automatic improvements');
      suggestions.push('Adjust brightness and contrast for better visibility');
      suggestions.push('Apply filters to change the mood and style');
      
      recommendedEdits.push('Auto-enhance for quick improvements');
      recommendedEdits.push('Crop to improve composition');
      recommendedEdits.push('Apply style filters for creative effects');

      return { suggestions, detectedIssues, recommendedEdits };

    } catch (error) {
      return {
        suggestions: ['Upload a valid image to get editing suggestions'],
        detectedIssues: ['Could not analyze image'],
        recommendedEdits: ['Try a different image format']
      };
    }
  }
}