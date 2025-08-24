import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff } from "lucide-react";
import { motion } from "framer-motion";

interface VoiceInputProps {
  onTranscript: (text: string) => void;
  isDisabled?: boolean;
}

export function VoiceInput({ onTranscript, isDisabled = false }: VoiceInputProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Check if speech recognition is supported
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      setIsSupported(true);
      const recognition = new SpeechRecognition();
      
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        const result = event.results[event.results.length - 1];
        if (result.isFinal) {
          onTranscript(result[0].transcript);
        }
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [onTranscript]);

  const toggleRecording = () => {
    if (!isSupported || isDisabled) {
      alert('Speech recognition is not supported in this browser.');
      return;
    }

    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
    } else {
      recognitionRef.current?.start();
      setIsRecording(true);
    }
  };

  if (!isSupported) {
    return (
      <Button
        variant="ghost"
        size="sm"
        disabled
        className="p-3 bg-slate-700 opacity-50 cursor-not-allowed"
      >
        <MicOff className="h-4 w-4 text-gray-500" />
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleRecording}
      disabled={isDisabled}
      className={`p-3 transition-all duration-200 ${
        isRecording 
          ? "bg-red-500 hover:bg-red-600" 
          : "bg-slate-700 hover:bg-slate-600"
      }`}
    >
      <motion.div
        animate={isRecording ? { scale: [1, 1.2, 1] } : { scale: 1 }}
        transition={{ 
          duration: 1,
          repeat: isRecording ? Infinity : 0,
          ease: "easeInOut"
        }}
      >
        {isRecording ? (
          <Mic className="h-4 w-4 text-white" />
        ) : (
          <Mic className="h-4 w-4 text-gray-400" />
        )}
      </motion.div>
    </Button>
  );
}
