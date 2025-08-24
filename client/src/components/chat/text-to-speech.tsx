import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Volume2, VolumeX, Play, Pause } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface TextToSpeechProps {
  text: string;
  className?: string;
}

export function TextToSpeech({ text, className = "" }: TextToSpeechProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [speechSynthesis, setSpeechSynthesis] = useState<SpeechSynthesis | null>(null);
  const { toast } = useToast();

  const speakText = () => {
    if (!window.speechSynthesis) {
      toast({
        title: "Speech not supported",
        description: "Your browser doesn't support text-to-speech",
        variant: "destructive",
      });
      return;
    }

    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Configure speech settings
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 0.8;
    
    // Try to use a more natural voice
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(voice => 
      voice.name.includes('Neural') || 
      voice.name.includes('Premium') ||
      voice.lang.startsWith('en-')
    );
    
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.onstart = () => setIsPlaying(true);
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => {
      setIsPlaying(false);
      toast({
        title: "Speech error",
        description: "Failed to play text-to-speech",
        variant: "destructive",
      });
    };

    window.speechSynthesis.speak(utterance);
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={speakText}
      className={`p-2 hover:bg-slate-700 ${className}`}
      title={isPlaying ? "Stop speaking" : "Read aloud"}
    >
      {isPlaying ? (
        <Pause className="h-3 w-3 text-blue-400" />
      ) : (
        <Volume2 className="h-3 w-3 text-gray-400 hover:text-blue-400" />
      )}
    </Button>
  );
}