import { useState, useRef, useEffect } from 'react';
import { 
  Upload, 
  Download, 
  Play, 
  Pause, 
  Volume2, 
  VolumeX,
  Scissors, 
  Layers,
  Settings,
  Save,
  RotateCcw,
  Filter,
  Music
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

interface VideoEditorProps {
  initialVideo?: string;
  onSave?: (editedVideo: string) => void;
  onClose?: () => void;
}

export default function VideoEditor({ initialVideo, onSave, onClose }: VideoEditorProps) {
  const [video, setVideo] = useState<string | null>(initialVideo || null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(100);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [adjustments, setAdjustments] = useState({
    brightness: 100,
    contrast: 100,
    saturation: 100,
    hue: 0,
    blur: 0,
    sharpen: 0,
    stability: 0
  });

  const [activeFilter, setActiveFilter] = useState<string>('none');
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(100);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filters = [
    { id: 'none', name: 'Original', preview: '🎬' },
    { id: 'vintage', name: 'Vintage', preview: '📽️' },
    { id: 'cinematic', name: 'Cinematic', preview: '🎭' },
    { id: 'warm', name: 'Warm', preview: '🌅' },
    { id: 'cool', name: 'Cool', preview: '🌊' },
    { id: 'dramatic', name: 'Dramatic', preview: '⚡' },
    { id: 'soft', name: 'Soft', preview: '☁️' },
    { id: 'clarity', name: 'Clarity', preview: '💎' }
  ];

  const transitions = [
    { id: 'fade', name: 'Fade', icon: '🌀' },
    { id: 'crossfade', name: 'Crossfade', icon: '🔄' },
    { id: 'dissolve', name: 'Dissolve', icon: '💫' },
    { id: 'slide', name: 'Slide', icon: '➡️' },
    { id: 'zoom', name: 'Zoom', icon: '🔍' },
    { id: 'spin', name: 'Spin', icon: '🌪️' }
  ];

  const audioEffects = [
    { id: 'fade-in', name: 'Fade In', icon: '📈' },
    { id: 'fade-out', name: 'Fade Out', icon: '📉' },
    { id: 'enhance', name: 'Voice Enhance', icon: '🎤' },
    { id: 'noise-reduce', name: 'Noise Reduction', icon: '🔇' },
    { id: 'bass-boost', name: 'Bass Boost', icon: '🔊' }
  ];

  useEffect(() => {
    if (videoRef.current) {
      const video = videoRef.current;
      
      const updateTime = () => setCurrentTime(video.currentTime);
      const updateDuration = () => setDuration(video.duration);
      
      video.addEventListener('timeupdate', updateTime);
      video.addEventListener('loadedmetadata', updateDuration);
      
      return () => {
        video.removeEventListener('timeupdate', updateTime);
        video.removeEventListener('loadedmetadata', updateDuration);
      };
    }
  }, [video]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setVideo(url);
    }
  };

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleSeek = (value: number[]) => {
    if (videoRef.current) {
      const newTime = (value[0] / 100) * duration;
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume / 100;
    }
  };

  const applyEffects = async () => {
    if (!video) return;
    
    setIsProcessing(true);
    
    try {
      const response = await fetch('/api/video/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoUrl: video,
          adjustments,
          filter: activeFilter,
          trimStart: (trimStart / 100) * duration,
          trimEnd: (trimEnd / 100) * duration
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        setVideo(result.processedVideo);
      }
    } catch (error) {
      console.error('Error processing video:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const addTransition = async (transitionId: string) => {
    if (!video) return;
    
    setIsProcessing(true);
    
    try {
      const response = await fetch('/api/video/transition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoUrl: video,
          transition: transitionId,
          position: currentTime
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        setVideo(result.processedVideo);
      }
    } catch (error) {
      console.error('Error adding transition:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const applyAudioEffect = async (effectId: string) => {
    if (!video) return;
    
    setIsProcessing(true);
    
    try {
      const response = await fetch('/api/video/audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoUrl: video,
          effect: effectId,
          volume: volume / 100
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        setVideo(result.processedVideo);
      }
    } catch (error) {
      console.error('Error applying audio effect:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadVideo = () => {
    if (!video) return;
    
    const link = document.createElement('a');
    link.href = video;
    link.download = 'edited-video.mp4';
    link.click();
  };

  const saveVideo = () => {
    if (video && onSave) {
      onSave(video);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 bg-black/80 backdrop-blur-md border-b border-white/10 p-4 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-white">Video Editor</h1>
            <Badge variant="pro">Professional</Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setAdjustments({
                  brightness: 100,
                  contrast: 100,
                  saturation: 100,
                  hue: 0,
                  blur: 0,
                  sharpen: 0,
                  stability: 0
                });
                setActiveFilter('none');
              }}
              className="text-white hover:bg-white/10"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={downloadVideo}
              disabled={!video}
              className="text-white hover:bg-white/10"
            >
              <Download className="w-4 h-4" />
            </Button>
            <Button
              onClick={saveVideo}
              disabled={!video}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Save className="w-4 h-4 mr-2" />
              Save
            </Button>
            {onClose && (
              <Button
                variant="ghost"
                onClick={onClose}
                className="text-white hover:bg-white/10"
              >
                ✕
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <div className="w-80 bg-black/60 backdrop-blur-md border-r border-white/10 pt-20 overflow-y-auto">
        <div className="p-4 space-y-4">
          {/* Upload */}
          {!video && (
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Upload Video</CardTitle>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full"
                  variant="outline"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Choose Video
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </CardContent>
            </Card>
          )}

          {video && (
            <Tabs defaultValue="effects" className="space-y-4">
              <TabsList className="grid w-full grid-cols-4 bg-white/10">
                <TabsTrigger value="effects" className="text-white text-xs">
                  <Settings className="w-3 h-3" />
                </TabsTrigger>
                <TabsTrigger value="filters" className="text-white text-xs">
                  <Filter className="w-3 h-3" />
                </TabsTrigger>
                <TabsTrigger value="transitions" className="text-white text-xs">
                  <Layers className="w-3 h-3" />
                </TabsTrigger>
                <TabsTrigger value="audio" className="text-white text-xs">
                  <Music className="w-3 h-3" />
                </TabsTrigger>
              </TabsList>

              <TabsContent value="effects" className="space-y-4">
                <Card className="bg-white/5 border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white text-sm">Video Effects</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Trim Controls */}
                    <div className="space-y-2">
                      <div className="text-sm text-white">Trim Video</div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs text-white/60">
                          <span>Start: {formatTime((trimStart / 100) * duration)}</span>
                          <span>End: {formatTime((trimEnd / 100) * duration)}</span>
                        </div>
                        <Slider
                          value={[trimStart, trimEnd]}
                          onValueChange={([start, end]) => {
                            setTrimStart(start);
                            setTrimEnd(end);
                          }}
                          min={0}
                          max={100}
                          step={1}
                          className="w-full"
                        />
                      </div>
                    </div>

                    {/* Video Adjustments */}
                    {Object.entries(adjustments).map(([key, value]) => (
                      <div key={key} className="space-y-2">
                        <div className="flex justify-between text-sm text-white">
                          <span className="capitalize">{key}</span>
                          <span>{value}%</span>
                        </div>
                        <Slider
                          value={[value]}
                          onValueChange={([newValue]) => 
                            setAdjustments(prev => ({ ...prev, [key]: newValue }))
                          }
                          min={key === 'hue' ? -180 : 0}
                          max={key === 'hue' ? 180 : (key === 'brightness' || key === 'contrast' || key === 'saturation' ? 200 : 100)}
                          step={1}
                          className="w-full"
                        />
                      </div>
                    ))}
                    
                    <Button
                      onClick={applyEffects}
                      className="w-full"
                      disabled={isProcessing}
                    >
                      {isProcessing ? 'Processing...' : 'Apply Effects'}
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="filters" className="space-y-4">
                <Card className="bg-white/5 border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white text-sm">Video Filters</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-2">
                      {filters.map((filter) => (
                        <Button
                          key={filter.id}
                          variant={activeFilter === filter.id ? "default" : "outline"}
                          size="sm"
                          onClick={() => setActiveFilter(filter.id)}
                          className="flex flex-col items-center p-3 h-auto"
                        >
                          <span className="text-lg mb-1">{filter.preview}</span>
                          <span className="text-xs">{filter.name}</span>
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="transitions" className="space-y-4">
                <Card className="bg-white/5 border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white text-sm">Transitions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {transitions.map((transition) => (
                      <Button
                        key={transition.id}
                        variant="outline"
                        onClick={() => addTransition(transition.id)}
                        disabled={isProcessing}
                        className="w-full justify-start"
                      >
                        <span className="mr-2">{transition.icon}</span>
                        {transition.name}
                      </Button>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="audio" className="space-y-4">
                <Card className="bg-white/5 border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white text-sm">Audio Effects</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Volume Control */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm text-white">
                        <span>Volume</span>
                        <span>{volume}%</span>
                      </div>
                      <Slider
                        value={[volume]}
                        onValueChange={handleVolumeChange}
                        min={0}
                        max={200}
                        step={1}
                        className="w-full"
                      />
                    </div>

                    {/* Audio Effects */}
                    {audioEffects.map((effect) => (
                      <Button
                        key={effect.id}
                        variant="outline"
                        onClick={() => applyAudioEffect(effect.id)}
                        disabled={isProcessing}
                        className="w-full justify-start"
                      >
                        <span className="mr-2">{effect.icon}</span>
                        {effect.name}
                      </Button>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>

      {/* Main Video Player */}
      <div className="flex-1 pt-20 flex flex-col">
        {video ? (
          <>
            {/* Video Display */}
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="max-w-full max-h-full">
                <video
                  ref={videoRef}
                  src={video}
                  className="max-w-full max-h-full rounded-lg shadow-2xl"
                  style={{
                    filter: `
                      brightness(${adjustments.brightness}%)
                      contrast(${adjustments.contrast}%)
                      saturate(${adjustments.saturation}%)
                      hue-rotate(${adjustments.hue}deg)
                      blur(${adjustments.blur}px)
                    `
                  }}
                />
              </div>
            </div>

            {/* Video Controls */}
            <div className="bg-black/60 backdrop-blur-md border-t border-white/10 p-4">
              <div className="max-w-4xl mx-auto space-y-4">
                {/* Progress Bar */}
                <div className="space-y-2">
                  <Slider
                    value={[duration > 0 ? (currentTime / duration) * 100 : 0]}
                    onValueChange={handleSeek}
                    min={0}
                    max={100}
                    step={0.1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-white/60">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                </div>

                {/* Control Buttons */}
                <div className="flex items-center justify-center gap-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={togglePlayPause}
                    className="text-white hover:bg-white/10"
                  >
                    {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleMute}
                    className="text-white hover:bg-white/10"
                  >
                    {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                  </Button>

                  <div className="flex items-center gap-2 text-white">
                    <Volume2 className="w-4 h-4" />
                    <Slider
                      value={[volume]}
                      onValueChange={handleVolumeChange}
                      min={0}
                      max={100}
                      step={1}
                      className="w-20"
                    />
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-center text-white/60">
            <div>
              <Upload className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-xl mb-2">No Video Loaded</h3>
              <p>Upload a video to start editing</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}