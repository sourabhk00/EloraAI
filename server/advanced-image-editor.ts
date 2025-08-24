import sharp from 'sharp';

export interface ImageAdjustments {
  brightness?: number;
  contrast?: number;
  saturation?: number;
  hue?: number;
  warmth?: number;
  tint?: number;
  highlights?: number;
  shadows?: number;
  whites?: number;
  blacks?: number;
  sharpen?: number;
  denoise?: number;
  vignette?: number;
}

export interface CropOptions {
  x: number;
  y: number;
  width: number;
  height: number;
  flipHorizontal?: boolean;
  flipVertical?: boolean;
  expand?: boolean;
}

export interface FilterOptions {
  filter: 'vivid' | 'playa' | 'honey' | 'isla' | 'desert' | 'clay' | 'palma' | 'modena' | 'metro' | 'west' | 'ollie' | 'onyx' | 'eiffel' | 'vogue' | 'vista' | 'none';
  intensity?: number;
}

export interface EffectOptions {
  effect: 'dynamic' | 'enhance' | 'warm' | 'cool' | 'ultraHdr' | 'blur' | 'unblur' | 'magicEraser';
  intensity?: number;
  region?: { x: number; y: number; width: number; height: number };
}

export class AdvancedImageEditor {
  private buffer: Buffer;
  private metadata: sharp.Metadata;

  constructor(buffer: Buffer) {
    this.buffer = buffer;
  }

  async initialize() {
    const image = sharp(this.buffer);
    this.metadata = await image.metadata();
    return this;
  }

  async applyAdjustments(adjustments: ImageAdjustments): Promise<Buffer> {
    let image = sharp(this.buffer);

    // Basic adjustments
    if (adjustments.brightness !== undefined || adjustments.contrast !== undefined) {
      const brightnessValue = adjustments.brightness ? (adjustments.brightness / 100) : 1;
      const contrastValue = adjustments.contrast ? (adjustments.contrast / 100) + 1 : 1;
      
      image = image.linear(contrastValue, -(128 * contrastValue) + 128 + (brightnessValue * 100));
    }

    // Saturation using modulate
    if (adjustments.saturation !== undefined) {
      const saturationValue = (adjustments.saturation / 100) + 1;
      image = image.modulate({ saturation: saturationValue });
    }

    // Hue rotation
    if (adjustments.hue !== undefined) {
      image = image.modulate({ hue: adjustments.hue });
    }

    // Color temperature adjustments (warmth/tint)
    if (adjustments.warmth !== undefined || adjustments.tint !== undefined) {
      const warmth = adjustments.warmth || 0;
      const tint = adjustments.tint || 0;
      
      // Apply color matrix for temperature adjustment
      const tempMatrix = this.getTemperatureMatrix(warmth, tint);
      image = image.recomb(tempMatrix);
    }

    // Highlights and shadows using gamma correction
    if (adjustments.highlights !== undefined || adjustments.shadows !== undefined) {
      const gamma = this.calculateGamma(adjustments.highlights || 0, adjustments.shadows || 0);
      image = image.gamma(gamma);
    }

    // Sharpen
    if (adjustments.sharpen !== undefined && adjustments.sharpen > 0) {
      const sharpenAmount = Math.max(0.5, adjustments.sharpen / 50);
      image = image.sharpen({ sigma: sharpenAmount });
    }

    // Denoise using blur
    if (adjustments.denoise !== undefined && adjustments.denoise > 0) {
      const denoiseAmount = Math.max(0.3, adjustments.denoise / 100);
      image = image.blur(denoiseAmount);
    }

    // Vignette effect
    if (adjustments.vignette !== undefined && adjustments.vignette > 0) {
      image = await this.applyVignette(image, adjustments.vignette);
    }

    return await image.jpeg({ quality: 95 }).toBuffer();
  }

  async applyCrop(options: CropOptions): Promise<Buffer> {
    let image = sharp(this.buffer);

    // Apply crop
    image = image.extract({
      left: Math.round(options.x),
      top: Math.round(options.y),
      width: Math.round(options.width),
      height: Math.round(options.height)
    });

    // Apply flips
    if (options.flipHorizontal) {
      image = image.flop();
    }
    if (options.flipVertical) {
      image = image.flip();
    }

    // Expand (resize with padding)
    if (options.expand) {
      const newWidth = Math.round(options.width * 1.2);
      const newHeight = Math.round(options.height * 1.2);
      image = image.resize(newWidth, newHeight, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      });
    }

    return await image.jpeg({ quality: 95 }).toBuffer();
  }

  async applyFilter(options: FilterOptions): Promise<Buffer> {
    let image = sharp(this.buffer);
    const intensity = options.intensity || 100;

    switch (options.filter) {
      case 'vivid':
        image = image.modulate({ saturation: 1 + (intensity / 200) });
        break;
      case 'warm':
        image = image.tint({ r: 255, g: 220, b: 180 });
        break;
      case 'cool':
        image = image.tint({ r: 180, g: 220, b: 255 });
        break;
      case 'vintage':
        image = image.modulate({ saturation: 0.8 })
                   .tint({ r: 255, g: 240, b: 200 });
        break;
      case 'dramatic':
        image = image.linear(1.2, -20)
                   .modulate({ saturation: 1.3 });
        break;
      default:
        // Apply custom filter based on name
        image = await this.applyCustomFilter(image, options.filter, intensity);
    }

    return await image.jpeg({ quality: 95 }).toBuffer();
  }

  async applyEffect(options: EffectOptions): Promise<Buffer> {
    let image = sharp(this.buffer);

    switch (options.effect) {
      case 'dynamic':
        image = image.linear(1.3, -15)
                   .modulate({ saturation: 1.2 });
        break;
      case 'enhance':
        image = image.sharpen({ sigma: 1.5 })
                   .linear(1.1, 5);
        break;
      case 'warm':
        image = image.tint({ r: 255, g: 220, b: 180 });
        break;
      case 'cool':
        image = image.tint({ r: 180, g: 220, b: 255 });
        break;
      case 'ultraHdr':
        image = image.linear(1.4, -20)
                   .modulate({ saturation: 1.3 })
                   .sharpen({ sigma: 1.2 });
        break;
      case 'blur':
        const blurAmount = (options.intensity || 50) / 10;
        image = image.blur(blurAmount);
        break;
      case 'unblur':
        image = image.sharpen({ sigma: 2.0 });
        break;
      case 'magicEraser':
        // Simplified magic eraser - in real implementation, this would use AI
        if (options.region) {
          image = await this.applyInpainting(image, options.region);
        }
        break;
    }

    return await image.jpeg({ quality: 95 }).toBuffer();
  }

  async removeBackground(): Promise<Buffer> {
    // This is a simplified background removal
    // In production, you'd use AI services like Remove.bg or similar
    const image = sharp(this.buffer);
    
    // Create a simple mask based on edges (very basic implementation)
    const mask = await image
      .clone()
      .greyscale()
      .convolve({
        width: 3,
        height: 3,
        kernel: [-1, -1, -1, -1, 8, -1, -1, -1, -1]
      })
      .threshold(30)
      .toBuffer();

    return await image
      .composite([{ input: mask, blend: 'dest-in' }])
      .png()
      .toBuffer();
  }

  private getTemperatureMatrix(warmth: number, tint: number): number[][] {
    // Color temperature matrix calculation
    const temp = warmth / 100;
    const tintValue = tint / 100;
    
    return [
      [1 + temp * 0.3, tintValue * 0.1, 0],
      [0, 1, tintValue * 0.1],
      [0, -temp * 0.2, 1 - temp * 0.1]
    ];
  }

  private calculateGamma(highlights: number, shadows: number): number {
    // Simple gamma calculation for highlight/shadow adjustment
    const highlightAdjust = highlights / 100;
    const shadowAdjust = shadows / 100;
    return 1 + (highlightAdjust - shadowAdjust) * 0.5;
  }

  private async applyVignette(image: sharp.Sharp, intensity: number): Promise<sharp.Sharp> {
    const { width, height } = this.metadata;
    if (!width || !height) return image;

    // Create vignette mask
    const vignetteRadius = Math.min(width, height) * 0.6;
    const centerX = width / 2;
    const centerY = height / 2;
    
    const vignetteSvg = `
      <svg width="${width}" height="${height}">
        <defs>
          <radialGradient id="vignette" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="white" stop-opacity="1"/>
            <stop offset="70%" stop-color="white" stop-opacity="1"/>
            <stop offset="100%" stop-color="black" stop-opacity="${intensity / 100}"/>
          </radialGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#vignette)"/>
      </svg>
    `;

    const vignetteBuffer = Buffer.from(vignetteSvg);
    
    return image.composite([{
      input: vignetteBuffer,
      blend: 'multiply'
    }]);
  }

  private async applyCustomFilter(image: sharp.Sharp, filterName: string, intensity: number): Promise<sharp.Sharp> {
    // Custom filter implementations
    switch (filterName) {
      case 'playa':
        return image.modulate({ saturation: 1.2, brightness: 1.1 })
                   .tint({ r: 255, g: 245, b: 220 });
      case 'honey':
        return image.modulate({ saturation: 1.1 })
                   .tint({ r: 255, g: 215, b: 0 });
      case 'isla':
        return image.modulate({ saturation: 1.3 })
                   .tint({ r: 135, g: 206, b: 235 });
      case 'desert':
        return image.modulate({ saturation: 0.9 })
                   .tint({ r: 222, g: 184, b: 135 });
      case 'clay':
        return image.modulate({ saturation: 0.8 })
                   .tint({ r: 210, g: 180, b: 140 });
      default:
        return image;
    }
  }

  private async applyInpainting(image: sharp.Sharp, region: { x: number; y: number; width: number; height: number }): Promise<sharp.Sharp> {
    // Simplified inpainting - replace region with blurred surrounding content
    const { width, height } = this.metadata;
    if (!width || !height) return image;

    // Create a mask for the region
    const maskSvg = `
      <svg width="${width}" height="${height}">
        <rect x="0" y="0" width="${width}" height="${height}" fill="white"/>
        <rect x="${region.x}" y="${region.y}" width="${region.width}" height="${region.height}" fill="black"/>
      </svg>
    `;

    const maskBuffer = Buffer.from(maskSvg);
    
    // Blur the original image
    const blurredImage = await image.clone().blur(5).toBuffer();
    
    // Composite the blurred image only in the erased region
    return image.composite([{
      input: blurredImage,
      blend: 'over'
    }, {
      input: maskBuffer,
      blend: 'dest-in'
    }]);
  }

  async addMarkup(markups: Array<{
    type: 'pen' | 'highlighter' | 'text';
    points?: Array<{ x: number; y: number }>;
    text?: string;
    position?: { x: number; y: number };
    color?: string;
    size?: number;
  }>): Promise<Buffer> {
    const { width, height } = this.metadata;
    if (!width || !height) return this.buffer;

    let svgContent = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">`;
    
    markups.forEach(markup => {
      switch (markup.type) {
        case 'pen':
          if (markup.points && markup.points.length > 1) {
            const path = markup.points.map((p, i) => 
              i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`
            ).join(' ');
            svgContent += `<path d="${path}" stroke="${markup.color || '#000'}" stroke-width="${markup.size || 3}" fill="none"/>`;
          }
          break;
        case 'highlighter':
          if (markup.points && markup.points.length > 1) {
            const path = markup.points.map((p, i) => 
              i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`
            ).join(' ');
            svgContent += `<path d="${path}" stroke="${markup.color || '#ffff00'}" stroke-width="${markup.size || 10}" opacity="0.5" fill="none"/>`;
          }
          break;
        case 'text':
          if (markup.text && markup.position) {
            svgContent += `<text x="${markup.position.x}" y="${markup.position.y}" font-size="${markup.size || 16}" fill="${markup.color || '#000'}">${markup.text}</text>`;
          }
          break;
      }
    });
    
    svgContent += '</svg>';
    
    const svgBuffer = Buffer.from(svgContent);
    
    return await sharp(this.buffer)
      .composite([{ input: svgBuffer, blend: 'over' }])
      .jpeg({ quality: 95 })
      .toBuffer();
  }

  async getImageInfo() {
    return {
      width: this.metadata.width,
      height: this.metadata.height,
      format: this.metadata.format,
      colorSpace: this.metadata.space,
      hasAlpha: this.metadata.hasAlpha,
      channels: this.metadata.channels
    };
  }
}