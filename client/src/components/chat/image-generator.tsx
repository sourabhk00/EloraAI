import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Image, Loader2, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ImageGeneratorProps {
  onImageGenerated?: (imageUrl: string) => void;
}

export function ImageGenerator({ onImageGenerated }: ImageGeneratorProps) {
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const { toast } = useToast();

  const handleGenerateImage = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Image prompt required",
        description: "Please enter a description for the image you want to generate.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    
    try {
      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      });

      const result = await response.json();
      
      if (result.status === 'success' && result.imageUrl) {
        setGeneratedImage(result.imageUrl);
        onImageGenerated?.(result.imageUrl);
        toast({
          title: "Image generated successfully",
          description: "Your image has been created!",
        });
      } else {
        toast({
          title: "Image generation",
          description: result.message || "Image generation completed",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card className="w-full bg-slate-800 border-slate-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Image className="h-5 w-5" />
          Advanced Image Generation
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Input
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe the image you want to generate..."
            className="bg-slate-900 border-slate-600 text-white placeholder:text-gray-400"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !isGenerating) {
                handleGenerateImage();
              }
            }}
          />
        </div>

        <Button
          onClick={handleGenerateImage}
          disabled={isGenerating || !prompt.trim()}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating Image...
            </>
          ) : (
            <>
              <Image className="mr-2 h-4 w-4" />
              Generate Image
            </>
          )}
        </Button>

        {generatedImage && (
          <div className="space-y-2">
            <div className="bg-slate-900 rounded-lg p-4">
              <img
                src={generatedImage}
                alt="Generated content"
                className="w-full rounded-lg max-h-80 object-contain"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full border-slate-600 text-gray-300 hover:bg-slate-700"
              onClick={() => {
                const link = document.createElement('a');
                link.href = generatedImage;
                link.download = 'generated-image.png';
                link.click();
              }}
            >
              <Download className="mr-2 h-4 w-4" />
              Download Image
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}