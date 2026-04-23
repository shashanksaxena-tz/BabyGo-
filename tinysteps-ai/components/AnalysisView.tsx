import React, { useState, useEffect } from 'react';
import { Baby, Sparkles, Brain, Activity, MessageCircle, Heart } from 'lucide-react';

interface AnalysisViewProps {
  childName?: string;
}

const AnalysisView: React.FC<AnalysisViewProps> = ({ childName = 'your child' }) => {
  const [progress, setProgress] = useState(0);
  const [currentPhase, setCurrentPhase] = useState(0);

  const phases = [
    { icon: Activity, label: 'Analyzing motor skills...', color: 'text-blue-500' },
    { icon: Brain, label: 'Evaluating cognitive development...', color: 'text-purple-500' },
    { icon: MessageCircle, label: 'Assessing language skills...', color: 'text-pink-500' },
    { icon: Heart, label: 'Reviewing social-emotional growth...', color: 'text-amber-500' },
    { icon: Sparkles, label: 'Generating personalized insights...', color: 'text-emerald-500' },
  ];

  useEffect(() => {
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) {
          return 95; // Cap at 95 until actual completion
        }
        return prev + 2;
      });
    }, 200);

    const phaseInterval = setInterval(() => {
      setCurrentPhase((prev) => (prev + 1) % phases.length);
    }, 2500);

    return () => {
      clearInterval(progressInterval);
      clearInterval(phaseInterval);
    };
  }, []);

  const CurrentIcon = phases[currentPhase].icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 flex items-center justify-center p-6">
      <div className="text-center text-white max-w-md">
        {/* Animated Icon Container */}
        <div className="relative mb-8 w-32 h-32 mx-auto">
          {/* Outer Ring */}
          <svg className="w-32 h-32 absolute animate-spin" style={{ animationDuration: '8s' }}>
            <circle
              cx="64"
              cy="64"
              r="60"
              stroke="rgba(255,255,255,0.2)"
              strokeWidth="4"
              fill="none"
              strokeDasharray="40 20"
            />
          </svg>

          {/* Middle Ring */}
          <svg className="w-24 h-24 absolute top-4 left-4 animate-spin" style={{ animationDuration: '6s', animationDirection: 'reverse' }}>
            <circle
              cx="48"
              cy="48"
              r="44"
              stroke="rgba(255,255,255,0.3)"
              strokeWidth="3"
              fill="none"
              strokeDasharray="30 15"
            />
          </svg>

          {/* Center Icon */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
              <CurrentIcon className={`w-8 h-8 text-white animate-pulse`} />
            </div>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold mb-2">
          Analyzing {childName}'s Development
        </h1>
        <p className="text-emerald-100 mb-8">
          Comparing against WHO milestones and research data
        </p>

        {/* Current Phase */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 mb-6 min-h-[60px] flex items-center justify-center">
          <div className="flex items-center justify-center gap-3">
            <CurrentIcon className="w-5 h-5 animate-bounce" />
            <span className="font-medium">{phases[currentPhase].label}</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="h-3 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-white rounded-full transition-all duration-300 ease-out relative"
              style={{ width: `${progress}%` }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent animate-shimmer" />
            </div>
          </div>
          <p className="text-sm text-emerald-100 mt-2">{progress}% complete</p>
        </div>

        {/* Domain Indicators */}
        <div className="flex justify-center gap-3 mt-6">
          {phases.map((phase, index) => {
            const Icon = phase.icon;
            const isActive = index === currentPhase;
            const isComplete = index < currentPhase;
            return (
              <div
                key={index}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
                  isActive
                    ? 'bg-white text-emerald-600 scale-110 shadow-lg'
                    : isComplete
                    ? 'bg-white/80 text-emerald-600'
                    : 'bg-white/20 text-white/50'
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>
            );
          })}
        </div>

        {/* Tips while waiting */}
        <div className="mt-8 text-sm text-emerald-100 bg-white/10 rounded-xl p-4">
          <Baby className="w-6 h-6 mx-auto mb-2" />
          <p>
            Every child develops at their own pace. TinySteps uses WHO guidelines
            to help you understand and support {childName}'s unique journey.
          </p>
        </div>
      </div>

      {/* Background decorations */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-20 left-10 w-32 h-32 bg-white/5 rounded-full blur-xl animate-float" />
        <div className="absolute bottom-40 right-20 w-48 h-48 bg-white/5 rounded-full blur-xl animate-float-delay" />
        <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-white/5 rounded-full blur-xl animate-float" />
      </div>

      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }
        .animate-float {
          animation: float 4s ease-in-out infinite;
        }
        .animate-float-delay {
          animation: float 4s ease-in-out infinite 2s;
        }
      `}</style>
    </div>
  );
};

export default AnalysisView;
