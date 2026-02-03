import React, { useState, useRef, useCallback } from 'react';
import {
  Upload,
  Camera,
  Video,
  Mic,
  Square,
  Play,
  Pause,
  X,
  Plus,
  Image as ImageIcon,
  Volume2,
  Loader2,
  Check,
} from 'lucide-react';
import { MediaUpload } from '../types';
import { transcribeAudio, analyzeBabySounds } from '../services/geminiService';

interface MediaUploaderProps {
  onMediaChange: (media: File[], babyAudio?: Blob) => void;
  ageMonths: number;
  childName: string;
}

const MediaUploader: React.FC<MediaUploaderProps> = ({ onMediaChange, ageMonths, childName }) => {
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [babyAudioBlob, setBabyAudioBlob] = useState<Blob | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessingAudio, setIsProcessingAudio] = useState(false);
  const [audioAnalysis, setAudioAnalysis] = useState<{
    vocalizations: string[];
    languageObservations: string;
    recommendations: string[];
  } | null>(null);
  const [activeTab, setActiveTab] = useState<'upload' | 'camera' | 'voice'>('upload');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles: File[] = Array.from(e.target.files);
      const validFiles = newFiles.filter((f: File) =>
        f.type.startsWith('image/') || f.type.startsWith('video/')
      );

      const newPreviews = validFiles.map((f: File) => URL.createObjectURL(f));

      setFiles(prev => [...prev, ...validFiles]);
      setPreviews(prev => [...prev, ...newPreviews]);
      onMediaChange([...files, ...validFiles], babyAudioBlob || undefined);
    }
  }, [files, babyAudioBlob, onMediaChange]);

  const removeFile = (index: number) => {
    URL.revokeObjectURL(previews[index]);
    const newFiles = files.filter((_, i) => i !== index);
    const newPreviews = previews.filter((_, i) => i !== index);
    setFiles(newFiles);
    setPreviews(newPreviews);
    onMediaChange(newFiles, babyAudioBlob || undefined);
  };

  const startBabyVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setBabyAudioBlob(audioBlob);
        stream.getTracks().forEach(track => track.stop());

        // Analyze baby sounds
        setIsProcessingAudio(true);
        try {
          const analysis = await analyzeBabySounds(audioBlob, ageMonths);
          setAudioAnalysis(analysis);
        } catch (err) {
          console.error('Audio analysis failed:', err);
        } finally {
          setIsProcessingAudio(false);
        }

        onMediaChange(files, audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Error accessing microphone:', err);
      alert('Could not access microphone. Please check permissions.');
    }
  };

  const stopBabyVoiceRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const clearBabyAudio = () => {
    setBabyAudioBlob(null);
    setAudioAnalysis(null);
    onMediaChange(files, undefined);
  };

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex bg-gray-100 rounded-2xl p-1">
        <button
          onClick={() => setActiveTab('upload')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-all ${
            activeTab === 'upload'
              ? 'bg-white shadow-sm text-emerald-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Upload className="w-5 h-5" />
          <span>Upload</span>
        </button>
        <button
          onClick={() => setActiveTab('camera')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-all ${
            activeTab === 'camera'
              ? 'bg-white shadow-sm text-emerald-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Camera className="w-5 h-5" />
          <span>Capture</span>
        </button>
        <button
          onClick={() => setActiveTab('voice')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-all ${
            activeTab === 'voice'
              ? 'bg-white shadow-sm text-emerald-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Volume2 className="w-5 h-5" />
          <span>Baby Voice</span>
        </button>
      </div>

      {/* Upload Tab */}
      {activeTab === 'upload' && (
        <div className="space-y-4">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,video/*"
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* File Drop Zone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center cursor-pointer hover:border-emerald-300 hover:bg-emerald-50/50 transition-all"
          >
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mb-4">
                <Upload className="w-8 h-8 text-emerald-600" />
              </div>
              <p className="font-semibold text-gray-700 mb-1">Upload Photos or Videos</p>
              <p className="text-sm text-gray-500">of {childName} doing activities</p>
              <p className="text-xs text-gray-400 mt-2">PNG, JPG, MP4 up to 50MB</p>
            </div>
          </div>

          {/* File Previews */}
          {files.length > 0 && (
            <div className="grid grid-cols-3 gap-3">
              {previews.map((preview, index) => (
                <div key={index} className="relative aspect-square rounded-xl overflow-hidden bg-gray-100">
                  {files[index].type.startsWith('video/') ? (
                    <video
                      src={preview}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <img
                      src={preview}
                      alt={`Upload ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  )}
                  <div className="absolute top-2 right-2">
                    <button
                      onClick={() => removeFile(index)}
                      className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-600 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="absolute bottom-2 left-2">
                    <span className="px-2 py-1 bg-black/50 rounded text-xs text-white flex items-center gap-1">
                      {files[index].type.startsWith('video/') ? (
                        <><Video className="w-3 h-3" /> Video</>
                      ) : (
                        <><ImageIcon className="w-3 h-3" /> Photo</>
                      )}
                    </span>
                  </div>
                </div>
              ))}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="aspect-square border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center text-gray-400 hover:border-emerald-300 hover:text-emerald-500 transition-all"
              >
                <Plus className="w-8 h-8" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Camera Tab */}
      {activeTab === 'camera' && (
        <div className="space-y-4">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 text-center">
            <div className="w-20 h-20 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Camera className="w-10 h-10 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-800 mb-2">Capture in the Moment</h3>
            <p className="text-sm text-gray-600 mb-6">
              Record {childName} doing activities like playing, walking, or talking
            </p>

            <div className="flex gap-4 justify-center">
              <button
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = 'image/*';
                  input.capture = 'environment';
                  input.onchange = (e) => handleFileSelect(e as any);
                  input.click();
                }}
                className="flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition-colors"
              >
                <Camera className="w-5 h-5" />
                Take Photo
              </button>
              <button
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = 'video/*';
                  input.capture = 'environment';
                  input.onchange = (e) => handleFileSelect(e as any);
                  input.click();
                }}
                className="flex items-center gap-2 px-6 py-3 bg-indigo-500 text-white rounded-xl font-medium hover:bg-indigo-600 transition-colors"
              >
                <Video className="w-5 h-5" />
                Record Video
              </button>
            </div>
          </div>

          <div className="bg-amber-50 rounded-xl p-4 text-sm text-amber-800">
            <strong>Tip:</strong> For motor skills analysis, capture videos of {childName} walking, crawling, or playing with toys.
          </div>
        </div>
      )}

      {/* Baby Voice Tab */}
      {activeTab === 'voice' && (
        <div className="space-y-4">
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-8 text-center">
            <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4 transition-all ${
              isRecording ? 'bg-red-100 animate-pulse' : 'bg-purple-100'
            }`}>
              {isRecording ? (
                <div className="relative">
                  <Mic className="w-10 h-10 text-red-600" />
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping" />
                </div>
              ) : isProcessingAudio ? (
                <Loader2 className="w-10 h-10 text-purple-600 animate-spin" />
              ) : (
                <Volume2 className="w-10 h-10 text-purple-600" />
              )}
            </div>

            <h3 className="font-semibold text-gray-800 mb-2">
              {isRecording ? 'Recording...' : isProcessingAudio ? 'Analyzing...' : 'Record Baby Sounds'}
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              {isRecording
                ? `Listening to ${childName}'s voice...`
                : `Capture ${childName}'s babbling, words, or sounds for language analysis`
              }
            </p>

            {!babyAudioBlob ? (
              <button
                onClick={isRecording ? stopBabyVoiceRecording : startBabyVoiceRecording}
                disabled={isProcessingAudio}
                className={`flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-bold text-white mx-auto transition-all ${
                  isRecording
                    ? 'bg-red-500 hover:bg-red-600'
                    : 'bg-purple-500 hover:bg-purple-600'
                }`}
              >
                {isRecording ? (
                  <>
                    <Square className="w-5 h-5 fill-current" />
                    Stop Recording
                  </>
                ) : (
                  <>
                    <Mic className="w-5 h-5" />
                    Start Recording
                  </>
                )}
              </button>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-center gap-4">
                  <div className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-full">
                    <Check className="w-4 h-4" />
                    Audio Recorded
                  </div>
                  <button
                    onClick={clearBabyAudio}
                    className="px-4 py-2 bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200 transition-colors"
                  >
                    Record Again
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Audio Analysis Results */}
          {audioAnalysis && (
            <div className="bg-white rounded-2xl border border-purple-100 p-6 space-y-4">
              <h4 className="font-semibold text-purple-800 flex items-center gap-2">
                <Volume2 className="w-5 h-5" />
                Language Analysis
              </h4>

              {audioAnalysis.vocalizations.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-2">Observed Vocalizations:</p>
                  <div className="flex flex-wrap gap-2">
                    {audioAnalysis.vocalizations.map((v, i) => (
                      <span key={i} className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
                        {v}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <p className="text-sm font-medium text-gray-600 mb-2">Observations:</p>
                <p className="text-gray-700">{audioAnalysis.languageObservations}</p>
              </div>

              {audioAnalysis.recommendations.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-2">Suggestions:</p>
                  <ul className="space-y-2">
                    {audioAnalysis.recommendations.map((rec, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                        <span className="w-5 h-5 bg-purple-100 rounded-full flex items-center justify-center text-xs text-purple-600 flex-shrink-0 mt-0.5">
                          {i + 1}
                        </span>
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          <div className="bg-purple-50 rounded-xl p-4 text-sm text-purple-800">
            <strong>Why baby voice?</strong> Analyzing {childName}'s vocalizations helps assess language development
            based on WHO milestones for {ageMonths}-month-olds.
          </div>
        </div>
      )}

      {/* Summary */}
      {(files.length > 0 || babyAudioBlob) && (
        <div className="bg-emerald-50 rounded-xl p-4">
          <p className="text-sm text-emerald-800 font-medium">
            Ready to analyze:
            {files.length > 0 && ` ${files.length} media file${files.length > 1 ? 's' : ''}`}
            {files.length > 0 && babyAudioBlob && ' and'}
            {babyAudioBlob && ' baby audio recording'}
          </p>
        </div>
      )}
    </div>
  );
};

export default MediaUploader;
