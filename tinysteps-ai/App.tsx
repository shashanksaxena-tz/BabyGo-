import React, { useState } from 'react';
import { Upload, FileVideo, FileImage, Baby, AlertCircle } from 'lucide-react';
import { AppStep, AnalysisResult } from './types';
import { analyzeDevelopment } from './services/geminiService';
import AnalysisView from './components/AnalysisView';
import ResultsView from './components/ResultsView';
import RecordButton from './components/RecordButton';

const App: React.FC = () => {
  const [step, setStep] = useState<AppStep>(AppStep.UPLOAD);
  const [file, setFile] = useState<File | null>(null);
  const [age, setAge] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleTranscription = (text: string) => {
    setNotes((prev) => prev ? `${prev} ${text}` : text);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !age) {
      setError("Please provide both media and child's age.");
      return;
    }

    setStep(AppStep.ANALYZING);
    try {
      const data = await analyzeDevelopment(file, age, notes);
      setResult(data);
      setStep(AppStep.RESULTS);
    } catch (err) {
      console.error(err);
      setError("Something went wrong during analysis. Please try again.");
      setStep(AppStep.UPLOAD);
    }
  };

  const handleReset = () => {
    setFile(null);
    setAge('');
    setNotes('');
    setResult(null);
    setStep(AppStep.UPLOAD);
    setError(null);
  };

  if (step === AppStep.ANALYZING) {
    return <AnalysisView />;
  }

  if (step === AppStep.RESULTS && result) {
    return <ResultsView result={result} onReset={handleReset} />;
  }

  return (
    <div className="min-h-screen bg-[#f0fdf4] text-gray-800 font-sans">
      <div className="max-w-md mx-auto min-h-screen flex flex-col p-6">
        
        {/* Header */}
        <div className="flex items-center justify-center gap-2 mb-8 mt-4">
           <div className="bg-emerald-500 p-2 rounded-xl shadow-lg shadow-emerald-200">
             <Baby className="w-8 h-8 text-white" />
           </div>
           <h1 className="text-2xl font-bold tracking-tight text-emerald-900">TinySteps AI</h1>
        </div>

        {/* Upload Form */}
        <div className="flex-1 bg-white rounded-3xl shadow-xl p-8 border border-emerald-50/50">
          <h2 className="text-xl font-bold mb-1">New Analysis</h2>
          <p className="text-gray-500 text-sm mb-6">Upload a photo or video to get started.</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* File Input */}
            <div className="group relative">
              <input 
                type="file" 
                id="media-upload" 
                className="hidden" 
                accept="image/*,video/*"
                onChange={handleFileChange}
              />
              <label 
                htmlFor="media-upload" 
                className={`block w-full border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-300 ${
                  file ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 hover:border-emerald-300 hover:bg-gray-50'
                }`}
              >
                {file ? (
                   <div className="flex flex-col items-center text-emerald-700">
                      {file.type.startsWith('video') ? <FileVideo className="w-10 h-10 mb-2" /> : <FileImage className="w-10 h-10 mb-2" />}
                      <span className="font-semibold truncate w-full px-4">{file.name}</span>
                      <span className="text-xs opacity-70 mt-1">Tap to change</span>
                   </div>
                ) : (
                  <div className="flex flex-col items-center text-gray-400 group-hover:text-emerald-500">
                    <Upload className="w-10 h-10 mb-2 transition-transform group-hover:-translate-y-1" />
                    <span className="font-medium">Upload Photo/Video</span>
                  </div>
                )}
              </label>
            </div>

            {/* Age Input */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Child's Age</label>
              <input
                type="text"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="e.g. 18 months"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all"
              />
            </div>

            {/* Context/Notes Input */}
            <div>
               <label className="block text-sm font-bold text-gray-700 mb-2">
                 Any Context? <span className="text-gray-400 font-normal">(Optional)</span>
               </label>
               <textarea 
                 value={notes}
                 onChange={(e) => setNotes(e.target.value)}
                 className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all resize-none text-sm"
                 placeholder="e.g. Trying to walk but wobbles..."
                 rows={3}
               />
               <RecordButton onTranscription={handleTranscription} />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-500 bg-red-50 p-3 rounded-xl text-sm">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={!file || !age}
              className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg shadow-emerald-200 transition-all transform hover:scale-[1.02] ${
                !file || !age 
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none' 
                  : 'bg-emerald-500 text-white hover:bg-emerald-600'
              }`}
            >
              Start Analysis
            </button>

          </form>
        </div>
      </div>
    </div>
  );
};

export default App;