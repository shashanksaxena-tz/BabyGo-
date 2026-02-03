import React, { useState, useRef } from 'react';
import { Mic, Square, Loader2 } from 'lucide-react';
import { transcribeAudio } from '../services/geminiService';

interface RecordButtonProps {
  onTranscription: (text: string) => void;
}

const RecordButton: React.FC<RecordButtonProps> = ({ onTranscription }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setIsProcessing(true);
        try {
          const text = await transcribeAudio(audioBlob);
          onTranscription(text);
        } catch (err) {
          console.error("Failed to transcribe", err);
        } finally {
          setIsProcessing(false);
          stream.getTracks().forEach(track => track.stop());
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing microphone", err);
      alert("Could not access microphone. Please check permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  return (
    <div className="flex items-center gap-2 mt-2">
      <button
        onClick={isRecording ? stopRecording : startRecording}
        disabled={isProcessing}
        className={`flex items-center justify-center p-3 rounded-full transition-all duration-300 ${
          isRecording 
            ? 'bg-red-100 text-red-600 animate-pulse hover:bg-red-200' 
            : 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200'
        }`}
        title={isRecording ? "Stop Recording" : "Add Voice Note"}
      >
        {isProcessing ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : isRecording ? (
          <Square className="w-5 h-5 fill-current" />
        ) : (
          <Mic className="w-5 h-5" />
        )}
      </button>
      <span className="text-sm text-gray-500 font-medium">
        {isProcessing ? "Transcribing..." : isRecording ? "Listening..." : "Add voice note"}
      </span>
    </div>
  );
};

export default RecordButton;