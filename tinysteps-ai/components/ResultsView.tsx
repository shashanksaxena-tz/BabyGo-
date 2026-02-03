import React from 'react';
import { AnalysisResult } from '../types';
import { Share2, CheckCircle2, TrendingUp, Activity, Lightbulb, ExternalLink } from 'lucide-react';
import { RadialBarChart, RadialBar, ResponsiveContainer } from 'recharts';

interface ResultsViewProps {
  result: AnalysisResult;
  onReset: () => void;
}

const ResultsView: React.FC<ResultsViewProps> = ({ result, onReset }) => {
  
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'TinySteps Development Insight',
          text: `Check out this developmental update: ${result.headline}`,
          url: window.location.href,
        });
      } catch (error) {
        console.log('Error sharing', error);
      }
    } else {
      alert("Sharing is not supported on this browser.");
    }
  };

  const scoreData = [
    { name: 'Motor', uv: 100, pv: 2400, fill: '#f0fdf4' }, // Background track
    { name: 'Score', uv: result.motorSkills.score, fill: '#10b981' }
  ];

  return (
    <div className="max-w-2xl mx-auto pb-12">
      {/* Header Card */}
      <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-b-3xl p-8 pt-12 text-white shadow-lg mb-6">
        <h1 className="text-3xl font-bold mb-2">{result.headline}</h1>
        <p className="opacity-90 font-medium text-lg">{result.reassurance}</p>
      </div>

      <div className="px-4 space-y-6">
        
        {/* Motor Skills Card */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col md:flex-row gap-6 items-center">
           <div className="w-32 h-32 relative flex-shrink-0">
             <ResponsiveContainer width="100%" height="100%">
               <RadialBarChart innerRadius="70%" outerRadius="100%" data={scoreData} startAngle={90} endAngle={-270}>
                 <RadialBar background dataKey="uv" cornerRadius={10} />
               </RadialBarChart>
             </ResponsiveContainer>
             <div className="absolute inset-0 flex items-center justify-center flex-col text-emerald-600">
               <TrendingUp className="w-6 h-6 mb-1" />
               <span className="text-xs font-bold">MOTOR</span>
             </div>
           </div>
           
           <div className="flex-1">
             <div className="flex items-center gap-2 mb-2">
               <CheckCircle2 className="w-5 h-5 text-emerald-500" />
               <h3 className="text-xl font-bold text-gray-800">Motor Skills</h3>
             </div>
             <p className="text-emerald-700 font-semibold mb-1 bg-emerald-50 inline-block px-2 py-1 rounded text-sm">
               {result.motorSkills.status}
             </p>
             <p className="text-gray-600 leading-relaxed mt-2">{result.motorSkills.description}</p>
           </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-3 text-blue-600">
              <Activity className="w-5 h-5" />
              <h3 className="font-bold">Physical Growth</h3>
            </div>
            <p className="text-sm font-semibold text-blue-800 bg-blue-50 inline-block px-2 py-1 rounded mb-2">
              {result.physicalGrowth.status}
            </p>
            <p className="text-gray-600 text-sm">{result.physicalGrowth.description}</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
             <div className="flex items-center gap-3 mb-3 text-purple-600">
              <Lightbulb className="w-5 h-5" />
              <h3 className="font-bold">Engagement</h3>
            </div>
             <p className="text-sm font-semibold text-purple-800 bg-purple-50 inline-block px-2 py-1 rounded mb-2">
              {result.activity.pattern}
            </p>
            <p className="text-gray-600 text-sm">{result.activity.description}</p>
          </div>
        </div>

        {/* Tips Section */}
        <div className="bg-orange-50 rounded-2xl p-6 border border-orange-100">
           <h3 className="font-bold text-orange-800 mb-4 text-lg">💡 Developmental Tips</h3>
           <ul className="space-y-3">
             {result.tips.map((tip, idx) => (
               <li key={idx} className="flex gap-3 text-gray-700">
                 <span className="flex-shrink-0 w-6 h-6 bg-white rounded-full flex items-center justify-center text-orange-500 font-bold shadow-sm border border-orange-100">{idx + 1}</span>
                 <span>{tip}</span>
               </li>
             ))}
           </ul>
        </div>

        {/* Reference Links (Search Grounding) */}
        {result.groundingUrls && result.groundingUrls.length > 0 && (
          <div className="bg-gray-50 rounded-xl p-4 text-xs text-gray-500">
             <h4 className="font-semibold mb-2 flex items-center gap-2">
               <ExternalLink className="w-3 h-3" />
               Sources & References
             </h4>
             <ul className="space-y-1">
               {result.groundingUrls.map((url, idx) => (
                 <li key={idx} className="truncate">
                   <a href={url} target="_blank" rel="noopener noreferrer" className="hover:text-emerald-600 underline decoration-dotted">
                     {url}
                   </a>
                 </li>
               ))}
             </ul>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4 pt-4">
           <button 
             onClick={handleShare}
             className="flex-1 bg-white border-2 border-emerald-500 text-emerald-600 font-bold py-3 rounded-xl hover:bg-emerald-50 transition-colors flex items-center justify-center gap-2"
           >
             <Share2 className="w-5 h-5" />
             Share
           </button>
           <button 
             onClick={onReset}
             className="flex-1 bg-emerald-500 text-white font-bold py-3 rounded-xl hover:bg-emerald-600 shadow-md shadow-emerald-200 transition-colors"
           >
             New Upload
           </button>
        </div>
        
        <p className="text-center text-xs text-gray-400 pb-8">
          TinySteps AI provides insights for informational purposes only and is not a substitute for professional medical advice.
        </p>

      </div>
    </div>
  );
};

export default ResultsView;