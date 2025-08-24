import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';

export interface VideoEditOptions {
  input: string;
  output: string;
  startTime?: number;
  duration?: number;
  effects?: VideoEffect[];
  filters?: VideoFilter[];
  audio?: AudioOptions;
  transitions?: Transition[];
}

export interface VideoEffect {
  type: 'brightness' | 'contrast' | 'saturation' | 'hue' | 'blur' | 'sharpen' | 'colorCorrection' | 'stabilization';
  intensity?: number;
  startTime?: number;
  duration?: number;
}

export interface VideoFilter {
  name: 'vintage' | 'cinematic' | 'warm' | 'cool' | 'dramatic' | 'softening' | 'clarity';
  intensity?: number;
  startTime?: number;
  duration?: number;
}

export interface AudioOptions {
  volume?: number;
  fadeIn?: number;
  fadeOut?: number;
  backgroundMusic?: string;
  voiceEnhancement?: boolean;
  noiseReduction?: boolean;
}

export interface Transition {
  type: 'fade' | 'crossfade' | 'dissolve' | 'slide' | 'zoom' | 'spin';
  duration: number;
  position: number;
}

export interface VideoClip {
  path: string;
  startTime: number;
  duration: number;
  position: number;
}

export class AdvancedVideoEditor {
  private tempDir: string;

  constructor() {
    this.tempDir = path.join(__dirname, '..', 'temp', 'video');
  }

  async initialize(): Promise<void> {
    try {
      await fs.mkdir(this.tempDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create temp directory:', error);
    }
  }

  async editVideo(options: VideoEditOptions): Promise<string> {
    await this.initialize();
    
    const outputPath = path.join(this.tempDir, `edited_${Date.now()}.mp4`);
    
    // Build FFmpeg command
    const ffmpegArgs = this.buildFFmpegCommand(options, outputPath);
    
    return new Promise((resolve, reject) => {
      const ffmpeg = spawn('ffmpeg', ffmpegArgs);
      
      let stderr = '';
      
      ffmpeg.stderr.on('data', (data) => {
        stderr += data.toString();
      });
      
      ffmpeg.on('close', (code) => {
        if (code === 0) {
          resolve(outputPath);
        } else {
          reject(new Error(`FFmpeg failed with code ${code}: ${stderr}`));
        }
      });
      
      ffmpeg.on('error', (error) => {
        reject(new Error(`FFmpeg spawn error: ${error.message}`));
      });
    });
  }

  private buildFFmpegCommand(options: VideoEditOptions, outputPath: string): string[] {
    const args: string[] = ['-y']; // Overwrite output file
    
    // Input file
    args.push('-i', options.input);
    
    // Time trimming
    if (options.startTime !== undefined) {
      args.push('-ss', options.startTime.toString());
    }
    if (options.duration !== undefined) {
      args.push('-t', options.duration.toString());
    }
    
    // Build filter complex
    const filters: string[] = [];
    
    // Video effects
    if (options.effects) {
      options.effects.forEach(effect => {
        filters.push(this.getEffectFilter(effect));
      });
    }
    
    // Video filters
    if (options.filters) {
      options.filters.forEach(filter => {
        filters.push(this.getVideoFilter(filter));
      });
    }
    
    // Audio processing
    if (options.audio) {
      const audioFilters = this.getAudioFilters(options.audio);
      if (audioFilters.length > 0) {
        filters.push(...audioFilters);
      }
    }
    
    // Apply filters if any exist
    if (filters.length > 0) {
      args.push('-vf', filters.join(','));
    }
    
    // Audio options
    if (options.audio?.volume !== undefined) {
      args.push('-af', `volume=${options.audio.volume}`);
    }
    
    // Output settings
    args.push('-c:v', 'libx264');
    args.push('-preset', 'medium');
    args.push('-crf', '23');
    args.push('-c:a', 'aac');
    args.push('-b:a', '128k');
    
    args.push(outputPath);
    
    return args;
  }

  private getEffectFilter(effect: VideoEffect): string {
    switch (effect.type) {
      case 'brightness':
        return `eq=brightness=${(effect.intensity || 0) / 100}`;
      case 'contrast':
        return `eq=contrast=${1 + (effect.intensity || 0) / 100}`;
      case 'saturation':
        return `eq=saturation=${1 + (effect.intensity || 0) / 100}`;
      case 'hue':
        return `hue=h=${effect.intensity || 0}`;
      case 'blur':
        const blurAmount = Math.max(0.5, (effect.intensity || 50) / 20);
        return `gblur=sigma=${blurAmount}`;
      case 'sharpen':
        return `unsharp=5:5:${(effect.intensity || 50) / 25}:5:5:0`;
      case 'colorCorrection':
        return `colorbalance=rs=${effect.intensity || 0}:gs=0:bs=0`;
      case 'stabilization':
        return 'vidstabdetect=stepsize=32:shakiness=10:accuracy=10:result=/tmp/transforms.trf';
      default:
        return '';
    }
  }

  private getVideoFilter(filter: VideoFilter): string {
    const intensity = filter.intensity || 50;
    
    switch (filter.name) {
      case 'vintage':
        return `eq=contrast=1.2:brightness=0.1:saturation=0.8,colorchannelmixer=.393:.769:.189:0:.349:.686:.168:0:.272:.534:.131`;
      case 'cinematic':
        return `eq=contrast=1.3:saturation=1.2,curves=all='0/0 0.5/0.4 1/1'`;
      case 'warm':
        return `colorbalance=rs=0.3:gs=0:bs=-0.3`;
      case 'cool':
        return `colorbalance=rs=-0.3:gs=0:bs=0.3`;
      case 'dramatic':
        return `eq=contrast=1.4:brightness=-0.1:saturation=1.3`;
      case 'softening':
        return `gblur=sigma=0.5:steps=1`;
      case 'clarity':
        return `unsharp=5:5:1.0:5:5:0.0`;
      default:
        return '';
    }
  }

  private getAudioFilters(audio: AudioOptions): string[] {
    const filters: string[] = [];
    
    if (audio.noiseReduction) {
      filters.push('afftdn=nr=10:nf=-25');
    }
    
    if (audio.voiceEnhancement) {
      filters.push('highpass=f=100,lowpass=f=3000');
    }
    
    if (audio.fadeIn) {
      filters.push(`afade=t=in:d=${audio.fadeIn}`);
    }
    
    if (audio.fadeOut) {
      filters.push(`afade=t=out:d=${audio.fadeOut}`);
    }
    
    return filters;
  }

  async mergeVideos(clips: VideoClip[], outputPath: string): Promise<string> {
    await this.initialize();
    
    const tempListFile = path.join(this.tempDir, `playlist_${Date.now()}.txt`);
    const clipList = clips.map(clip => `file '${clip.path}'`).join('\n');
    
    await fs.writeFile(tempListFile, clipList);
    
    const args = [
      '-y',
      '-f', 'concat',
      '-safe', '0',
      '-i', tempListFile,
      '-c', 'copy',
      outputPath
    ];
    
    return new Promise((resolve, reject) => {
      const ffmpeg = spawn('ffmpeg', args);
      
      ffmpeg.on('close', (code) => {
        if (code === 0) {
          // Clean up temp file
          fs.unlink(tempListFile).catch(console.error);
          resolve(outputPath);
        } else {
          reject(new Error(`FFmpeg failed with code ${code}`));
        }
      });
      
      ffmpeg.on('error', (error) => {
        reject(new Error(`FFmpeg spawn error: ${error.message}`));
      });
    });
  }

  async addTransitions(inputVideos: string[], transitions: Transition[], outputPath: string): Promise<string> {
    await this.initialize();
    
    const args = ['-y'];
    
    // Add all input videos
    inputVideos.forEach(video => {
      args.push('-i', video);
    });
    
    // Build complex filter for transitions
    let filterComplex = '';
    let videoCount = inputVideos.length;
    
    for (let i = 0; i < videoCount - 1; i++) {
      const transition = transitions[i];
      if (transition) {
        filterComplex += this.getTransitionFilter(i, i + 1, transition);
        if (i < videoCount - 2) filterComplex += ';';
      }
    }
    
    if (filterComplex) {
      args.push('-filter_complex', filterComplex);
    }
    
    args.push('-c:v', 'libx264', '-preset', 'medium', '-crf', '23');
    args.push(outputPath);
    
    return new Promise((resolve, reject) => {
      const ffmpeg = spawn('ffmpeg', args);
      
      ffmpeg.on('close', (code) => {
        if (code === 0) {
          resolve(outputPath);
        } else {
          reject(new Error(`FFmpeg failed with code ${code}`));
        }
      });
      
      ffmpeg.on('error', (error) => {
        reject(new Error(`FFmpeg spawn error: ${error.message}`));
      });
    });
  }

  private getTransitionFilter(input1: number, input2: number, transition: Transition): string {
    const duration = transition.duration;
    
    switch (transition.type) {
      case 'fade':
        return `[${input1}:v][${input2}:v]xfade=transition=fade:duration=${duration}:offset=${transition.position}[v${input1}${input2}]`;
      case 'crossfade':
        return `[${input1}:v][${input2}:v]xfade=transition=fadegrays:duration=${duration}:offset=${transition.position}[v${input1}${input2}]`;
      case 'dissolve':
        return `[${input1}:v][${input2}:v]xfade=transition=dissolve:duration=${duration}:offset=${transition.position}[v${input1}${input2}]`;
      case 'slide':
        return `[${input1}:v][${input2}:v]xfade=transition=slideleft:duration=${duration}:offset=${transition.position}[v${input1}${input2}]`;
      case 'zoom':
        return `[${input1}:v][${input2}:v]xfade=transition=smoothleft:duration=${duration}:offset=${transition.position}[v${input1}${input2}]`;
      case 'spin':
        return `[${input1}:v][${input2}:v]xfade=transition=circleopen:duration=${duration}:offset=${transition.position}[v${input1}${input2}]`;
      default:
        return `[${input1}:v][${input2}:v]xfade=transition=fade:duration=${duration}:offset=${transition.position}[v${input1}${input2}]`;
    }
  }

  async extractAudio(videoPath: string, outputPath: string): Promise<string> {
    const args = [
      '-y',
      '-i', videoPath,
      '-vn',
      '-acodec', 'mp3',
      '-ab', '192k',
      outputPath
    ];
    
    return new Promise((resolve, reject) => {
      const ffmpeg = spawn('ffmpeg', args);
      
      ffmpeg.on('close', (code) => {
        if (code === 0) {
          resolve(outputPath);
        } else {
          reject(new Error(`Audio extraction failed with code ${code}`));
        }
      });
    });
  }

  async addSubtitles(videoPath: string, subtitlePath: string, outputPath: string): Promise<string> {
    const args = [
      '-y',
      '-i', videoPath,
      '-i', subtitlePath,
      '-c:v', 'copy',
      '-c:a', 'copy',
      '-c:s', 'mov_text',
      outputPath
    ];
    
    return new Promise((resolve, reject) => {
      const ffmpeg = spawn('ffmpeg', args);
      
      ffmpeg.on('close', (code) => {
        if (code === 0) {
          resolve(outputPath);
        } else {
          reject(new Error(`Subtitle addition failed with code ${code}`));
        }
      });
    });
  }

  async getVideoInfo(videoPath: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const args = [
        '-v', 'quiet',
        '-print_format', 'json',
        '-show_format',
        '-show_streams',
        videoPath
      ];
      
      const ffprobe = spawn('ffprobe', args);
      let stdout = '';
      
      ffprobe.stdout.on('data', (data) => {
        stdout += data.toString();
      });
      
      ffprobe.on('close', (code) => {
        if (code === 0) {
          try {
            const info = JSON.parse(stdout);
            resolve(info);
          } catch (error) {
            reject(new Error('Failed to parse video info'));
          }
        } else {
          reject(new Error(`FFprobe failed with code ${code}`));
        }
      });
    });
  }

  async createThumbnail(videoPath: string, timeOffset: number = 1): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const args = [
        '-y',
        '-i', videoPath,
        '-ss', timeOffset.toString(),
        '-vframes', '1',
        '-f', 'image2pipe',
        '-vcodec', 'png',
        'pipe:1'
      ];
      
      const ffmpeg = spawn('ffmpeg', args);
      const chunks: Buffer[] = [];
      
      ffmpeg.stdout.on('data', (chunk) => {
        chunks.push(chunk);
      });
      
      ffmpeg.on('close', (code) => {
        if (code === 0) {
          resolve(Buffer.concat(chunks));
        } else {
          reject(new Error(`Thumbnail creation failed with code ${code}`));
        }
      });
    });
  }

  async generateVideoFromImages(imagePaths: string[], duration: number, outputPath: string): Promise<string> {
    const framerate = imagePaths.length / duration;
    
    const args = [
      '-y',
      '-framerate', framerate.toString(),
      '-pattern_type', 'glob',
      '-i', `${path.dirname(imagePaths[0])}/*.{jpg,png}`,
      '-c:v', 'libx264',
      '-pix_fmt', 'yuv420p',
      '-t', duration.toString(),
      outputPath
    ];
    
    return new Promise((resolve, reject) => {
      const ffmpeg = spawn('ffmpeg', args);
      
      ffmpeg.on('close', (code) => {
        if (code === 0) {
          resolve(outputPath);
        } else {
          reject(new Error(`Video generation failed with code ${code}`));
        }
      });
    });
  }

  async cleanup(): Promise<void> {
    try {
      const files = await fs.readdir(this.tempDir);
      await Promise.all(
        files.map(file => fs.unlink(path.join(this.tempDir, file)))
      );
    } catch (error) {
      console.error('Cleanup failed:', error);
    }
  }
}