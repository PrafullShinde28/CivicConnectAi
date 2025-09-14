import { useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Camera, Upload, Bot } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { IssueDetectionResult } from "@/lib/types";

interface PhotoUploadProps {
  onDetectionResult: (result: IssueDetectionResult) => void;
  onImageSelected: (file: File) => void;
}

export default function PhotoUpload({ onDetectionResult, onImageSelected }: PhotoUploadProps) {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const analyzeImageMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("image", file);
      
      const response = await apiRequest("POST", "/api/analyze-image", formData);
      return response.json();
    },
    onSuccess: (result: IssueDetectionResult) => {
      onDetectionResult(result);
      toast({
        title: "AI Analysis Complete",
        description: `Detected: ${result.issueType} (${Math.round(result.confidence * 100)}% confidence)`,
      });
    },
    onError: (error) => {
      console.error("Image analysis failed:", error);
      toast({
        title: "Analysis Failed",
        description: "Could not analyze the image. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      onImageSelected(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      
      // Analyze image
      analyzeImageMutation.mutate(file);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-foreground">Upload Photo</h3>
      
      {!selectedImage ? (
        <Card 
          className="border-2 border-dashed border-border hover:border-primary transition-colors cursor-pointer"
          onClick={handleUploadClick}
        >
          <CardContent className="p-8 text-center">
            <Camera className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-2">Take a photo or upload from gallery</p>
            <p className="text-sm text-muted-foreground mb-4">AI will automatically detect the issue type</p>
            <Button 
              type="button"
              className="mt-4"
              data-testid="upload-photo-button"
            >
              <Upload className="mr-2 h-4 w-4" />
              Choose Photo
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <Card>
            <CardContent className="p-4">
              <img 
                src={imagePreview || ""} 
                alt="Selected issue" 
                className="w-full h-48 object-cover rounded-lg"
                data-testid="image-preview"
              />
            </CardContent>
          </Card>
          
          <Button 
            variant="outline" 
            onClick={handleUploadClick}
            data-testid="change-photo-button"
          >
            <Camera className="mr-2 h-4 w-4" />
            Change Photo
          </Button>
        </div>
      )}

      {analyzeImageMutation.isPending && (
        <Card className="bg-muted">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <Bot className="h-5 w-5 text-primary animate-pulse" />
              <div>
                <p className="font-medium text-foreground">Analyzing Image...</p>
                <p className="text-sm text-muted-foreground">AI is detecting the issue type</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        data-testid="file-input"
      />
    </div>
  );
}
