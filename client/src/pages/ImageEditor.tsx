import { useState, useRef, useEffect } from 'react';
import { 
  Upload, 
  Download, 
  RotateCcw, 
  Crop, 
  Palette, 
  Sliders, 
  Filter,
  Eraser,
  Type,
  Save,
  Undo,
  Redo,
  Eye,
  EyeOff
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

interface ImageEditorProps {
  initialImage?: string;
  onSave?: (editedImage: string) => void;
  onClose?: () => void;
}

export default function ImageEditor({ initialImage, onSave, onClose }: ImageEditorProps) {
  const [image, setImage] = useState<string | null>(initialImage || null);
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [adjustments, setAdjustments] = useState({
    brightness: 100,
    contrast: 100,
    saturation: 100,
    hue: 0,
    warmth: 0,
    tint: 0,
    highlights: 0,
    shadows: 0,
    whites: 0,
    blacks: 0,
    sharpen: 0,
    denoise: 0,
    vignette: 0
  });
  const [activeFilter, setActiveFilter] = useState<string>('none');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isProcessing, setIsProcessing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filters = [
    { id: 'none', name: 'Original', preview: '🎨' },
    { id: 'vivid', name: 'Vivid', preview: '🌈' },
    { id: 'warm', name: 'Warm', preview: '🔥' },
    { id: 'cool', name: 'Cool', preview: '❄️' },
    { id: 'vintage', name: 'Vintage', preview: '📷' },
    { id: 'dramatic', name: 'Dramatic', preview: '🎭' },
    { id: 'soft', name: 'Soft', preview: '☁️' },
    { id: 'sharp', name: 'Sharp', preview: '⚡' },
    { id: 'mono', name: 'Mono', preview: '⚫' },
    { id: 'sepia', name: 'Sepia', preview: '🟤' }
  ];

  const effects = [
    { id: 'enhance', name: 'Auto Enhance', icon: '✨' },
    { id: 'blur', name: 'Blur', icon: '🌪️' },
    { id: 'unblur', name: 'Unblur', icon: '🔍' },
    { id: 'remove-bg', name: 'Remove Background', icon: '🎭' },
    { id: 'upscale', name: 'Upscale', icon: '📈' }
  ];

  useEffect(() => {
    if (image && !originalImage) {
      setOriginalImage(image);
      addToHistory(image);
    }
  }, [image]);

  const addToHistory = (imageData: string) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(imageData);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setImage(history[historyIndex - 1]);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setImage(history[historyIndex + 1]);
    }
  };

  const resetToOriginal = () => {
    if (originalImage) {
      setImage(originalImage);
      setAdjustments({
        brightness: 100,
        contrast: 100,
        saturation: 100,
        hue: 0,
        warmth: 0,
        tint: 0,
        highlights: 0,
        shadows: 0,
        whites: 0,
        blacks: 0,
        sharpen: 0,
        denoise: 0,
        vignette: 0
      });
      setActiveFilter('none');
      addToHistory(originalImage);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageData = e.target?.result as string;
        setImage(imageData);
        setOriginalImage(imageData);
        addToHistory(imageData);
      };
      reader.readAsDataURL(file);
    }
  };

  const applyAdjustments = async () => {
    if (!image) return;
    
    setIsProcessing(true);
    
    // Simulate image processing with adjustments
    try {
      const response = await fetch('/api/image/adjust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageData: image,
          adjustments,
          filter: activeFilter
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        setImage(result.processedImage);
        addToHistory(result.processedImage);
      }
    } catch (error) {
      console.error('Error applying adjustments:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const applyEffect = async (effectId: string) => {
    if (!image) return;
    
    setIsProcessing(true);
    
    try {
      const response = await fetch('/api/image/effect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageData: image,
          effect: effectId
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        setImage(result.processedImage);
        addToHistory(result.processedImage);
      }
    } catch (error) {
      console.error('Error applying effect:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadImage = () => {
    if (!image) return;
    
    const link = document.createElement('a');
    link.href = image;
    link.download = 'edited-image.png';
    link.click();
  };

  const saveImage = () => {
    if (image && onSave) {
      onSave(image);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 bg-black/80 backdrop-blur-md border-b border-white/10 p-4 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-white">Image Editor</h1>
            <Badge variant="pro">Advanced</Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={undo}
              disabled={historyIndex <= 0}
              className="text-white hover:bg-white/10"
            >
              <Undo className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={redo}
              disabled={historyIndex >= history.length - 1}
              className="text-white hover:bg-white/10"
            >
              <Redo className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={resetToOriginal}
              className="text-white hover:bg-white/10"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={downloadImage}
              disabled={!image}
              className="text-white hover:bg-white/10"
            >
              <Download className="w-4 h-4" />
            </Button>
            <Button
              onClick={saveImage}
              disabled={!image}
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
          {!image && (
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Upload Image</CardTitle>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full"
                  variant="outline"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Choose Image
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </CardContent>
            </Card>
          )}

          {image && (
            <Tabs defaultValue="adjustments" className="space-y-4">
              <TabsList className="grid w-full grid-cols-3 bg-white/10">
                <TabsTrigger value="adjustments" className="text-white">
                  <Sliders className="w-4 h-4 mr-1" />
                  Adjust
                </TabsTrigger>
                <TabsTrigger value="filters" className="text-white">
                  <Filter className="w-4 h-4 mr-1" />
                  Filters
                </TabsTrigger>
                <TabsTrigger value="effects" className="text-white">
                  <Palette className="w-4 h-4 mr-1" />
                  Effects
                </TabsTrigger>
              </TabsList>

              <TabsContent value="adjustments" className="space-y-4">
                <Card className="bg-white/5 border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white text-sm">Basic Adjustments</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
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
                          min={key === 'hue' ? -180 : (key.includes('warmth') || key.includes('tint') || key.includes('highlights') || key.includes('shadows') || key.includes('whites') || key.includes('blacks') || key.includes('sharpen') || key.includes('denoise') || key.includes('vignette') ? -100 : 0)}
                          max={key === 'hue' ? 180 : (key === 'brightness' || key === 'contrast' || key === 'saturation' ? 200 : 100)}
                          step={1}
                          className="w-full"
                        />
                      </div>
                    ))}
                    <Button
                      onClick={applyAdjustments}
                      className="w-full"
                      disabled={isProcessing}
                    >
                      {isProcessing ? 'Processing...' : 'Apply Adjustments'}
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="filters" className="space-y-4">
                <Card className="bg-white/5 border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white text-sm">Filters</CardTitle>
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

              <TabsContent value="effects" className="space-y-4">
                <Card className="bg-white/5 border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white text-sm">AI Effects</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {effects.map((effect) => (
                      <Button
                        key={effect.id}
                        variant="outline"
                        onClick={() => applyEffect(effect.id)}
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

      {/* Main Canvas */}
      <div className="flex-1 pt-20 flex items-center justify-center p-8">
        {image ? (
          <div className="max-w-full max-h-full flex items-center justify-center">
            <img
              src={image}
              alt="Editing canvas"
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
              style={{
                filter: `
                  brightness(${adjustments.brightness}%)
                  contrast(${adjustments.contrast}%)
                  saturate(${adjustments.saturation}%)
                  hue-rotate(${adjustments.hue}deg)
                `
              }}
            />
          </div>
        ) : (
          <div className="text-center text-white/60">
            <Upload className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <h3 className="text-xl mb-2">No Image Loaded</h3>
            <p>Upload an image to start editing</p>
          </div>
        )}
      </div>
    </div>
  );
}