import React from 'react';
import { BrainCircuit, Activity, Search, ScanLine } from 'lucide-react';

const AnalysisView: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
      <div className="relative mb-8">
        <div className="absolute inset-0 bg-emerald-300 blur-xl opacity-30 animate-pulse rounded-full"></div>
        <div className="bg-white p-6 rounded-3xl shadow-xl animate-float relative z-10 border-4 border-emerald-50">
           <img 
            src="https://picsum.photos/100/100?random=1" 
            alt="Child placeholder" 
            className="w-24 h-24 rounded-full object-cover mb-4 mx-auto border-2 border-emerald-100"
          />
          <div className="space-y-3">
             <div className="flex items-center gap-3 text-emerald-700 bg-emerald-50 px-4 py-2 rounded-lg">
                <BrainCircuit className="w-5 h-5 animate-pulse" />
                <span className="font-medium text-sm">Thinking Deeply...</span>
             </div>
             <div className="flex items-center gap-3 text-blue-700 bg-blue-50 px-4 py-2 rounded-lg opacity-80">
                <ScanLine className="w-5 h-5" />
                <span className="font-medium text-sm">Analyzing Motor Skills</span>
             </div>
              <div className="flex items-center gap-3 text-indigo-700 bg-indigo-50 px-4 py-2 rounded-lg opacity-60">
                <Search className="w-5 h-5" />
                <span className="font-medium text-sm">Checking WHO Data</span>
             </div>
          </div>
        </div>
      </div>
      
      <h2 className="text-2xl font-bold text-gray-800 mb-2">Analyzing Development</h2>
      <p className="text-gray-500 max-w-xs mx-auto">
        TinySteps AI is reviewing the media against age-appropriate milestones. This takes about 10 seconds.
      </p>
    </div>
  );
};

export default AnalysisView;