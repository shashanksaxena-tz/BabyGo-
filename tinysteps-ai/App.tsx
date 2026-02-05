import React, { useState, useEffect } from 'react';
import { AppStep, ChildProfile, AnalysisResult } from './types';
import { getCurrentChild, isOnboardingComplete, setOnboardingComplete, saveAnalysis, getAnalysisById, getChildren } from './services/storageService';
import { analyzeDevelopment } from './services/geminiService';

// Components
import ProfileSetup from './components/ProfileSetup';
import HomeDashboard from './components/HomeDashboard';
import MediaUploader from './components/MediaUploader';
import AnalysisView from './components/AnalysisView';
import ResultsView from './components/ResultsView';
import TimelineView from './components/TimelineView';
import BedtimeStories from './components/BedtimeStories';
import RecipesView from './components/RecipesView';
import RecommendationsView from './components/RecommendationsView';
import MilestonesView from './components/MilestonesView';
import GrowthChartsView from './components/GrowthChartsView';
import EditProfile from './components/EditProfile';

import {
  Baby,
  AlertCircle,
  ArrowLeft,
  Mic,
  Loader2,
} from 'lucide-react';
import RecordButton from './components/RecordButton';

const App: React.FC = () => {
  const [step, setStep] = useState<AppStep>(AppStep.ONBOARDING);
  const [currentChild, setCurrentChild] = useState<ChildProfile | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Upload state
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [babyAudio, setBabyAudio] = useState<Blob | undefined>();
  const [contextNotes, setContextNotes] = useState('');

  // Navigation data
  const [navData, setNavData] = useState<any>(null);

  useEffect(() => {
    // Check if onboarding is complete and load current child
    const child = getCurrentChild();
    if (child && isOnboardingComplete()) {
      setCurrentChild(child);
      setStep(AppStep.HOME);
    } else {
      setStep(AppStep.ONBOARDING);
    }
  }, []);

  const handleProfileComplete = (child: ChildProfile) => {
    setCurrentChild(child);
    setOnboardingComplete();
    setStep(AppStep.HOME);
  };

  const handleMediaChange = (files: File[], audio?: Blob) => {
    setMediaFiles(files);
    setBabyAudio(audio);
  };

  const handleTranscription = (text: string) => {
    setContextNotes(prev => prev ? `${prev} ${text}` : text);
  };

  const handleStartAnalysis = async () => {
    if (!currentChild || mediaFiles.length === 0) {
      setError('Please upload at least one photo or video.');
      return;
    }

    setStep(AppStep.ANALYZING);
    setError(null);

    try {
      const analysisResult = await analyzeDevelopment(
        mediaFiles,
        currentChild,
        contextNotes,
        babyAudio
      );

      const savedAnalysis = saveAnalysis(analysisResult);
      setResult(savedAnalysis);
      setStep(AppStep.RESULTS);
    } catch (err) {
      console.error('Analysis failed:', err);
      setError('Analysis failed. Please try again.');
      setStep(AppStep.UPLOAD);
    }
  };

  const handleReset = () => {
    setMediaFiles([]);
    setBabyAudio(undefined);
    setContextNotes('');
    setResult(null);
    setError(null);
    setStep(AppStep.HOME);
  };

  const handleNavigate = (screen: string, data?: any) => {
    setNavData(data);
    switch (screen) {
      case 'home':
        setStep(AppStep.HOME);
        break;
      case 'upload':
        setStep(AppStep.UPLOAD);
        break;
      case 'timeline':
        setStep(AppStep.TIMELINE);
        break;
      case 'stories':
        setStep(AppStep.STORIES);
        break;
      case 'recommendations':
        setStep(AppStep.RECOMMENDATIONS);
        break;
      case 'recipes':
        setStep(AppStep.RECIPES);
        break;
      case 'milestones':
        setStep(AppStep.MILESTONES);
        break;
      case 'growth':
        setStep(AppStep.GROWTH_CHARTS);
        break;
      case 'settings':
        setStep(AppStep.SETTINGS);
        break;
      case 'results':
        if (data?.analysisId) {
          const analysis = getAnalysisById(data.analysisId);
          if (analysis) {
            setResult(analysis);
            setStep(AppStep.RESULTS);
          }
        }
        break;
      default:
        break;
    }
  };

  // Onboarding / Profile Setup
  if (step === AppStep.ONBOARDING || step === AppStep.PROFILE_SETUP) {
    return (
      <ProfileSetup
        onComplete={handleProfileComplete}
        onBack={() => setStep(AppStep.HOME)}
      />
    );
  }

  const handleSwitchChild = (childId: string) => {
    const children = getChildren();
    const child = children.find(c => c.id === childId);
    if (child) {
      setCurrentChild(child);
      localStorage.setItem('tinysteps_current_child', childId);
    }
  };

  const handleAddChild = () => {
    setStep(AppStep.PROFILE_SETUP);
  };

  // Home Dashboard
  if (step === AppStep.HOME && currentChild) {
    return (
      <HomeDashboard
        child={currentChild}
        onNavigate={handleNavigate}
        onStartAnalysis={() => setStep(AppStep.UPLOAD)}
        onSwitchChild={handleSwitchChild}
        onAddChild={handleAddChild}
      />
    );
  }

  // Upload Screen
  if (step === AppStep.UPLOAD && currentChild) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
        <div className="max-w-lg mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex items-center gap-3 mb-8">
            <button
              onClick={() => setStep(AppStep.HOME)}
              className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center hover:bg-gray-200 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-800">New Analysis</h1>
              <p className="text-sm text-gray-500">Upload media of {currentChild.name}</p>
            </div>
          </div>

          {/* Media Uploader */}
          <div className="bg-white rounded-3xl shadow-xl p-6 mb-6">
            <MediaUploader
              onMediaChange={handleMediaChange}
              ageMonths={currentChild.ageMonths}
              childName={currentChild.name}
            />
          </div>

          {/* Context Notes */}
          <div className="bg-white rounded-3xl shadow-xl p-6 mb-6">
            <h3 className="font-semibold text-gray-800 mb-3">Add Context (Optional)</h3>
            <textarea
              value={contextNotes}
              onChange={(e) => setContextNotes(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all resize-none text-sm"
              placeholder={`What is ${currentChild.name} doing? Any concerns?`}
              rows={3}
            />
            <RecordButton onTranscription={handleTranscription} />
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 text-red-500 bg-red-50 p-4 rounded-xl mb-6">
              <AlertCircle className="w-5 h-5" />
              {error}
            </div>
          )}

          {/* Submit Button */}
          <button
            onClick={handleStartAnalysis}
            disabled={mediaFiles.length === 0}
            className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${mediaFiles.length === 0
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:shadow-lg hover:shadow-emerald-200 transform hover:scale-[1.02]'
              }`}
          >
            Analyze {currentChild.name}'s Development
          </button>
        </div>
      </div>
    );
  }

  // Analyzing
  if (step === AppStep.ANALYZING) {
    return <AnalysisView childName={currentChild?.name} />;
  }

  // Results
  if (step === AppStep.RESULTS && result && currentChild) {
    return (
      <ResultsView
        result={result}
        child={currentChild}
        onReset={handleReset}
        onNavigate={handleNavigate}
      />
    );
  }

  // Timeline
  if (step === AppStep.TIMELINE && currentChild) {
    return (
      <TimelineView
        child={currentChild}
        onBack={() => setStep(AppStep.HOME)}
        onNavigate={handleNavigate}
      />
    );
  }

  // Bedtime Stories
  if (step === AppStep.STORIES && currentChild) {
    return (
      <BedtimeStories
        child={currentChild}
        onBack={() => setStep(AppStep.HOME)}
      />
    );
  }

  // Recommendations
  if (step === AppStep.RECOMMENDATIONS && currentChild) {
    return (
      <RecommendationsView
        child={currentChild}
        onBack={() => setStep(AppStep.HOME)}
      />
    );
  }

  // Recipes
  if (step === AppStep.RECIPES && currentChild) {
    return (
      <RecipesView
        child={currentChild}
        onBack={() => setStep(AppStep.HOME)}
      />
    );
  }

  // Milestones
  if (step === AppStep.MILESTONES && currentChild) {
    return (
      <MilestonesView
        child={currentChild}
        onBack={() => setStep(AppStep.HOME)}
      />
    );
  }

  // Growth Charts
  if (step === AppStep.GROWTH_CHARTS && currentChild) {
    return (
      <GrowthChartsView
        child={currentChild}
        onBack={() => setStep(AppStep.HOME)}
      />
    );
  }

  // Settings / Edit Profile
  if (step === AppStep.SETTINGS && currentChild) {
    return (
      <EditProfile
        child={currentChild}
        onSave={(updatedChild) => {
          setCurrentChild(updatedChild);
          setStep(AppStep.HOME);
        }}
        onBack={() => setStep(AppStep.HOME)}
        onDelete={() => {
          // After deletion, check if there are other children
          const remainingChildren = getChildren();
          if (remainingChildren.length > 0) {
            setCurrentChild(remainingChildren[0]);
            localStorage.setItem('tinysteps_current_child', remainingChildren[0].id);
            setStep(AppStep.HOME);
          } else {
            setCurrentChild(null);
            setStep(AppStep.ONBOARDING);
          }
        }}
      />
    );
  }

  // Fallback loading
  return (
    <div className="min-h-screen bg-emerald-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
          <Baby className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-xl font-bold text-emerald-900">TinySteps AI</h1>
        <p className="text-emerald-600 mt-2">Loading...</p>
      </div>
    </div>
  );
};

export default App;
