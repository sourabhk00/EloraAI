import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Video, Loader2, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface VideoGeneratorProps {
  onVideoGenerated?: (videoUrl: string) => void;
}

export function VideoGenerator({ onVideoGenerated }: VideoGeneratorProps) {
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedVideo, setGeneratedVideo] = useState<string | null>(null);
  const { toast } = useToast();

  const handleGenerateVideo = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Video prompt required",
        description: "Please enter a description for the video you want to generate.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    
    try {
      const response = await fetch('/api/generate-video', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      });

      const result = await response.json();
      
      if (result.status === 'success') {
        if (result.videoUrl) {
          setGeneratedVideo(result.videoUrl);
          onVideoGenerated?.(result.videoUrl);
        }
        toast({
          title: "Video Generation",
          description: result.message,
        });
      } else {
        toast({
          title: "Video generation info",
          description: result.message,
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate video. Please try again.",
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
          <Video className="h-5 w-5" />
          Advanced Video Generation
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Input
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe the video you want to generate..."
            className="bg-slate-900 border-slate-600 text-white placeholder:text-gray-400"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !isGenerating) {
                handleGenerateVideo();
              }
            }}
          />
        </div>

        <Button
          onClick={handleGenerateVideo}
          disabled={isGenerating || !prompt.trim()}
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating Video...
            </>
          ) : (
            <>
              <Video className="mr-2 h-4 w-4" />
              Generate Video
            </>
          )}
        </Button>

        {generatedVideo && (
          <div className="space-y-2">
            <div className="bg-slate-900 rounded-lg p-4">
              <video
                src={generatedVideo}
                controls
                className="w-full rounded-lg"
                style={{ maxHeight: '300px' }}
              >
                Your browser does not support the video tag.
              </video>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full border-slate-600 text-gray-300 hover:bg-slate-700"
              onClick={() => {
                const link = document.createElement('a');
                link.href = generatedVideo;
                link.download = 'generated-video.mp4';
                link.click();
              }}
            >
              <Download className="mr-2 h-4 w-4" />
              Download Video
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}