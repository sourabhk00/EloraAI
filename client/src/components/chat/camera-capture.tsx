import React, { useRef, useState, useCallback } from 'react';
import { Camera, CameraOff, Download, RotateCcw, Zap, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

interface CameraCaptureProps {
  onImageCaptured: (imageData: string, imageFile: File) => void;
  onLensSearch?: (imageData: string) => void;
}

export const CameraCapture: React.FC<CameraCaptureProps> = ({
  onImageCaptured,
  onLensSearch
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const { toast } = useToast();

  const [isStreaming, setIsStreaming] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [isCapturing, setIsCapturing] = useState(false);

  const startCamera = useCallback(async () => {
    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setIsStreaming(true);
      }

      toast({
        title: "Camera Started",
        description: "Camera is ready for capture",
      });

    } catch (error) {
      console.error('Error starting camera:', error);
      toast({
        title: "Camera Error",
        description: "Failed to start camera. Please check permissions.",
        variant: "destructive"
      });
    }
  }, [facingMode, toast]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setIsStreaming(false);
    setCapturedImage(null);
  }, []);

  const capturePhoto = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || !isStreaming) return;

    setIsCapturing(true);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw the video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Get image data
    const imageDataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setCapturedImage(imageDataUrl);

    // Convert to File object
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `camera-capture-${Date.now()}.jpg`, {
          type: 'image/jpeg'
        });

        onImageCaptured(imageDataUrl, file);

        toast({
          title: "Photo Captured",
          description: "Image captured successfully!",
        });
      }
      setIsCapturing(false);
    }, 'image/jpeg', 0.9);

  }, [isStreaming, onImageCaptured, toast]);

  const switchCamera = useCallback(() => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
    if (isStreaming) {
      stopCamera();
      // Restart with new facing mode after a brief delay
      setTimeout(startCamera, 100);
    }
  }, [isStreaming, startCamera, stopCamera]);

  const downloadImage = useCallback(() => {
    if (!capturedImage) return;

    const link = document.createElement('a');
    link.href = capturedImage;
    link.download = `camera-capture-${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Download Started",
      description: "Image download initiated",
    });
  }, [capturedImage, toast]);

  const performLensSearch = useCallback(() => {
    if (!capturedImage || !onLensSearch) return;

    onLensSearch(capturedImage);
    toast({
      title: "Lens Search",
      description: "Performing visual search on captured image...",
    });
  }, [capturedImage, onLensSearch, toast]);

  const retakePhoto = useCallback(() => {
    setCapturedImage(null);
  }, []);

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Camera Controls */}
          <div className="flex justify-center space-x-3">
            {!isStreaming ? (
              <Button 
                onClick={startCamera}
                className="bg-green-600 hover:bg-green-700"
                data-testid="button-start-camera"
              >
                <Camera className="h-4 w-4 mr-2" />
                Start Camera
              </Button>
            ) : (
              <Button 
                onClick={stopCamera}
                variant="destructive"
                data-testid="button-stop-camera"
              >
                <CameraOff className="h-4 w-4 mr-2" />
                Stop Camera
              </Button>
            )}

            {isStreaming && (
              <Button 
                onClick={switchCamera}
                variant="outline"
                data-testid="button-switch-camera"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Switch Camera
              </Button>
            )}
          </div>

          {/* Camera View */}
          <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
            {isStreaming && (
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                autoPlay
                playsInline
                muted
                data-testid="video-camera-preview"
              />
            )}
            
            {capturedImage && (
              <img
                src={capturedImage}
                alt="Captured"
                className="w-full h-full object-cover"
                data-testid="img-captured-photo"
              />
            )}

            {!isStreaming && !capturedImage && (
              <div className="flex items-center justify-center h-full text-white">
                <div className="text-center">
                  <Camera className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg">Camera Preview</p>
                  <p className="text-sm opacity-75">Click "Start Camera" to begin</p>
                </div>
              </div>
            )}

            {/* Capture Button Overlay */}
            {isStreaming && !capturedImage && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                <Button
                  onClick={capturePhoto}
                  disabled={isCapturing}
                  className="bg-white text-black hover:bg-gray-100 rounded-full p-4"
                  data-testid="button-capture-photo"
                >
                  <Zap className="h-6 w-6" />
                </Button>
              </div>
            )}
          </div>

          {/* Hidden canvas for image processing */}
          <canvas
            ref={canvasRef}
            className="hidden"
            data-testid="canvas-image-capture"
          />

          {/* Action Buttons for Captured Image */}
          {capturedImage && (
            <div className="flex justify-center space-x-3">
              <Button 
                onClick={retakePhoto}
                variant="outline"
                data-testid="button-retake-photo"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Retake
              </Button>

              <Button 
                onClick={downloadImage}
                variant="outline"
                data-testid="button-download-image"
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>

              {onLensSearch && (
                <Button 
                  onClick={performLensSearch}
                  className="bg-blue-600 hover:bg-blue-700"
                  data-testid="button-lens-search"
                >
                  <Search className="h-4 w-4 mr-2" />
                  Lens Search
                </Button>
              )}
            </div>
          )}

          {/* Instructions */}
          <div className="text-center text-sm text-gray-600 dark:text-gray-400 space-y-1">
            <p>📸 <strong>Camera Features:</strong></p>
            <div className="text-xs space-y-1">
              <p>• Click "Start Camera" to begin photo capture</p>
              <p>• Use "Switch Camera" to toggle between front/back cameras</p>
              <p>• Tap the capture button to take a photo</p>
              <p>• Use "Lens Search" for AI-powered visual search</p>
              <p>• Download captured images to your device</p>
            </div>
          </div>

          {/* Status Indicators */}
          <div className="flex justify-center space-x-4 text-xs">
            <div className={`flex items-center space-x-1 ${isStreaming ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-2 h-2 rounded-full ${isStreaming ? 'bg-green-600' : 'bg-gray-400'}`}></div>
              <span>Camera {isStreaming ? 'Active' : 'Inactive'}</span>
            </div>
            
            <div className={`flex items-center space-x-1 ${capturedImage ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-2 h-2 rounded-full ${capturedImage ? 'bg-blue-600' : 'bg-gray-400'}`}></div>
              <span>Image {capturedImage ? 'Captured' : 'None'}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};