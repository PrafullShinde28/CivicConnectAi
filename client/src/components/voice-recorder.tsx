import { useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mic, Square, Play, Pause } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { TranscriptionResult } from "@/lib/types";

interface VoiceRecorderProps {
  onTranscriptionResult: (result: TranscriptionResult) => void;
  language: string;
}

export default function VoiceRecorder({ onTranscriptionResult, language }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [transcription, setTranscription] = useState<string>("");
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  const transcribeAudioMutation = useMutation({
    mutationFn: async (audioBlob: Blob) => {
      const formData = new FormData();
      formData.append("audio", audioBlob, "recording.webm");
      
      const response = await apiRequest("POST", "/api/transcribe-audio", formData);
      return response.json();
    },
    onSuccess: (result: TranscriptionResult) => {
      setTranscription(result.transcription);
      onTranscriptionResult(result);
      toast({
        title: "Transcription Complete",
        description: `Language detected: ${result.language}`,
      });
    },
    onError: (error) => {
      console.error("Transcription failed:", error);
      toast({
        title: "Transcription Failed",
        description: "Could not transcribe the audio. Please try again.",
        variant: "destructive",
      });
    },
  });

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      const chunks: BlobPart[] = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: "audio/webm" });
        setAudioBlob(blob);
        transcribeAudioMutation.mutate(blob);
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
    } catch (error) {
      console.error("Failed to start recording:", error);
      toast({
        title: "Recording Failed",
        description: "Could not access microphone. Please check permissions.",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-foreground">Voice Description</h3>
      
      <Card className="bg-muted">
        <CardContent className="p-6">
          <div className="flex items-center justify-center space-x-4">
            <Button
              onClick={isRecording ? stopRecording : startRecording}
              className={`p-4 rounded-full ${
                isRecording 
                  ? "bg-destructive hover:bg-destructive/90" 
                  : "bg-primary hover:bg-primary/90"
              }`}
              data-testid={isRecording ? "stop-recording-button" : "start-recording-button"}
            >
              {isRecording ? (
                <Square className="h-6 w-6" />
              ) : (
                <Mic className="h-6 w-6" />
              )}
            </Button>
            
            <div className="text-center">
              <p className="font-medium text-foreground">
                {isRecording ? "Recording..." : "Press to record"}
              </p>
              <p className="text-sm text-muted-foreground">
                Supports Hindi, English, Marathi
              </p>
            </div>
          </div>
          
          {/* Recording Status */}
          {isRecording && (
            <div className="mt-4 text-center">
              <div className="flex items-center justify-center space-x-2">
                <div className="w-3 h-3 bg-destructive rounded-full animate-pulse"></div>
                <span className="text-sm text-foreground">
                  Recording... {formatTime(recordingTime)}
                </span>
              </div>
            </div>
          )}
          
          {/* Transcription Processing */}
          {transcribeAudioMutation.isPending && (
            <div className="mt-4 text-center">
              <p className="text-sm text-muted-foreground">Processing audio...</p>
            </div>
          )}
          
          {/* Transcription Result */}
          {transcription && (
            <div className="mt-4 bg-background rounded-md p-3">
              <p className="text-sm text-muted-foreground mb-1">Transcription:</p>
              <p className="text-foreground" data-testid="transcription-text">
                "{transcription}"
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
