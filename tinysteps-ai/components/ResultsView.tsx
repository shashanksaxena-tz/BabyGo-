import React, { useState } from 'react';
import { AnalysisResult, ChildProfile, WHOSource } from '../types';
import {
  Share2,
  CheckCircle2,
  TrendingUp,
  Activity,
  Lightbulb,
  ExternalLink,
  Brain,
  MessageCircle,
  Heart,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Scale,
  Ruler,
  BookOpen,
  ArrowLeft,
  Download,
  Star,
  Info,
} from 'lucide-react';
import {
  RadialBarChart,
  RadialBar,
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
} from 'recharts';

interface ResultsViewProps {
  result: AnalysisResult;
  child: ChildProfile;
  onReset: () => void;
  onNavigate?: (screen: string) => void;
}

const ResultsView: React.FC<ResultsViewProps> = ({ result, child, onReset, onNavigate }) => {
  const [expandedSection, setExpandedSection] = useState<string | null>('motor');
  const [showAllSources, setShowAllSources] = useState(false);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${child.name}'s Development Update`,
          text: `${result.headline}\n\n${result.reassurance}`,
          url: window.location.href,
        });
      } catch (error) {
        console.log('Error sharing', error);
      }
    } else {
      navigator.clipboard.writeText(
        `${child.name}'s Development Update\n\n${result.headline}\n\n${result.reassurance}`
      );
      alert('Copied to clipboard!');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ahead': return { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200' };
      case 'on-track': return { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-200' };
      case 'monitor': return { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-200' };
      case 'discuss': return { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200' };
      default: return { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-200' };
    }
  };

  const DomainCard = ({
    icon: Icon,
    title,
    domain,
    color,
  }: {
    icon: any;
    title: string;
    domain: any;
    color: string;
  }) => {
    const isExpanded = expandedSection === title.toLowerCase();
    const statusColors = getStatusColor(domain.status);

    return (
      <div className={`bg-white rounded-2xl shadow-sm border overflow-hidden transition-all ${statusColors.border}`}>
        <button
          onClick={() => setExpandedSection(isExpanded ? null : title.toLowerCase())}
          className="w-full p-5 flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-xl ${color} flex items-center justify-center`}>
              <Icon className="w-7 h-7" />
            </div>
            <div className="text-left">
              <h3 className="font-bold text-gray-800">{title}</h3>
              <div className="flex items-center gap-2 mt-1">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors.bg} ${statusColors.text}`}>
                  {domain.status.replace('-', ' ')}
                </span>
                <span className="text-sm text-gray-500">Score: {domain.score}/100</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 relative">
              <ResponsiveContainer>
                <RadialBarChart
                  innerRadius="70%"
                  outerRadius="100%"
                  data={[
                    { value: 100, fill: '#f3f4f6' },
                    { value: domain.score, fill: domain.score >= 70 ? '#10b981' : domain.score >= 50 ? '#f59e0b' : '#ef4444' }
                  ]}
                  startAngle={90}
                  endAngle={-270}
                >
                  <RadialBar dataKey="value" cornerRadius={5} />
                </RadialBarChart>
              </ResponsiveContainer>
            </div>
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </div>
        </button>

        {isExpanded && (
          <div className="px-5 pb-5 space-y-4 border-t border-gray-100 pt-4">
            <p className="text-gray-700">{domain.description}</p>

            {domain.observations && domain.observations.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-700 mb-2 text-sm">Observations</h4>
                <ul className="space-y-2">
                  {domain.observations.map((obs: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                      {obs}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {domain.recommendations && domain.recommendations.length > 0 && (
              <div className="bg-gray-50 rounded-xl p-4">
                <h4 className="font-semibold text-gray-700 mb-2 text-sm">Recommendations</h4>
                <ul className="space-y-2">
                  {domain.recommendations.map((rec: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                      <Lightbulb className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {domain.percentile && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Info className="w-4 h-4" />
                <span>Percentile rank: {domain.percentile}th (compared to children of same age)</span>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const SourceCard: React.FC<{ source: WHOSource }> = ({ source }) => (
    <a
      href={source.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
    >
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
        source.organization === 'WHO' ? 'bg-blue-100 text-blue-600' :
        source.organization === 'CDC' ? 'bg-green-100 text-green-600' :
        source.organization === 'AAP' ? 'bg-purple-100 text-purple-600' :
        'bg-gray-100 text-gray-600'
      }`}>
        <BookOpen className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-700 truncate">{source.title}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-gray-500">{source.organization}</span>
          {source.year && <span className="text-xs text-gray-400">({source.year})</span>}
          <span className={`text-xs px-1.5 py-0.5 rounded ${
            source.type === 'guideline' ? 'bg-blue-100 text-blue-600' :
            source.type === 'data' ? 'bg-green-100 text-green-600' :
            'bg-gray-100 text-gray-600'
          }`}>
            {source.type}
          </span>
        </div>
      </div>
      <ExternalLink className="w-4 h-4 text-gray-400 flex-shrink-0" />
    </a>
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-b-[3rem] px-6 pt-12 pb-16 text-white">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={onReset}
            className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center hover:bg-white/30 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <p className="text-emerald-100 text-sm">Analysis Results</p>
            <p className="text-sm font-medium">{new Date(result.timestamp).toLocaleDateString()}</p>
          </div>
          <button
            onClick={handleShare}
            className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center hover:bg-white/30 transition-colors"
          >
            <Share2 className="w-5 h-5" />
          </button>
        </div>

        <h1 className="text-2xl font-bold mb-3">{result.headline}</h1>
        <p className="text-emerald-100 leading-relaxed">{result.reassurance}</p>

        {/* Overall Score Badge */}
        <div className="mt-6 flex items-center gap-4">
          <div className="w-20 h-20 relative">
            <ResponsiveContainer>
              <RadialBarChart
                innerRadius="70%"
                outerRadius="100%"
                data={[
                  { value: 100, fill: 'rgba(255,255,255,0.2)' },
                  { value: result.overallScore, fill: 'white' }
                ]}
                startAngle={90}
                endAngle={-270}
              >
                <RadialBar dataKey="value" cornerRadius={10} />
              </RadialBarChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xl font-bold">{result.overallScore}</span>
            </div>
          </div>
          <div>
            <p className="font-semibold">Overall Development Score</p>
            <p className="text-sm text-emerald-100">Based on WHO milestones for {child.ageMonths} months</p>
          </div>
        </div>
      </div>

      <div className="px-6 -mt-8 space-y-6">
        {/* Warnings (if any) */}
        {result.warnings && result.warnings.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
            <div className="flex items-center gap-2 text-amber-700 mb-3">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="font-semibold">Points to Consider</h3>
            </div>
            <div className="space-y-2">
              {result.warnings.map((warning, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    warning.severity === 'urgent' ? 'bg-red-100 text-red-700' :
                    warning.severity === 'discuss' ? 'bg-orange-100 text-orange-700' :
                    warning.severity === 'monitor' ? 'bg-amber-100 text-amber-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {warning.severity}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm text-gray-700">{warning.message}</p>
                    <p className="text-xs text-gray-500 mt-1">{warning.recommendation}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Domain Cards */}
        <div className="space-y-4">
          <DomainCard
            icon={Activity}
            title="Motor Skills"
            domain={result.motorSkills}
            color="bg-blue-100 text-blue-600"
          />
          <DomainCard
            icon={Brain}
            title="Cognitive Skills"
            domain={result.cognitiveSkills}
            color="bg-purple-100 text-purple-600"
          />
          <DomainCard
            icon={MessageCircle}
            title="Language Skills"
            domain={result.languageSkills}
            color="bg-pink-100 text-pink-600"
          />
          <DomainCard
            icon={Heart}
            title="Social-Emotional"
            domain={result.socialEmotional}
            color="bg-amber-100 text-amber-600"
          />
        </div>

        {/* Physical Growth */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-500" />
            Physical Growth (WHO Percentiles)
          </h3>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="p-4 bg-blue-50 rounded-xl text-center">
              <Scale className="w-6 h-6 text-blue-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-blue-600">{result.physicalGrowth.weightPercentile}%</p>
              <p className="text-sm text-gray-600">Weight</p>
              <p className="text-xs text-gray-400">{child.weight} kg</p>
            </div>
            <div className="p-4 bg-green-50 rounded-xl text-center">
              <Ruler className="w-6 h-6 text-green-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-green-600">{result.physicalGrowth.heightPercentile}%</p>
              <p className="text-sm text-gray-600">Height</p>
              <p className="text-xs text-gray-400">{child.height} cm</p>
            </div>
          </div>

          <p className="text-sm text-gray-600">{result.physicalGrowth.description}</p>
        </div>

        {/* Development Tips */}
        {result.tips.length > 0 && (
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-6">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-amber-500" />
              Development Tips for {child.name}
            </h3>
            <div className="space-y-4">
              {result.tips.slice(0, 5).map((tip, idx) => (
                <div key={idx} className="flex gap-3">
                  <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-amber-600 font-bold shadow-sm flex-shrink-0">
                    {idx + 1}
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">{tip.title}</p>
                    <p className="text-sm text-gray-600 mt-1">{tip.description}</p>
                    {tip.materials && tip.materials.length > 0 && (
                      <p className="text-xs text-gray-500 mt-1">
                        Materials: {tip.materials.join(', ')}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* WHO Sources */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-500" />
              Research Sources
            </h3>
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
              {result.sources.length} sources
            </span>
          </div>

          <div className="space-y-2">
            {(showAllSources ? result.sources : result.sources.slice(0, 3)).map((source, idx) => (
              <SourceCard key={idx} source={source} />
            ))}
          </div>

          {result.sources.length > 3 && (
            <button
              onClick={() => setShowAllSources(!showAllSources)}
              className="w-full mt-3 py-2 text-sm text-blue-600 font-medium hover:text-blue-700"
            >
              {showAllSources ? 'Show Less' : `Show ${result.sources.length - 3} More Sources`}
            </button>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            onClick={handleShare}
            className="flex-1 bg-white border-2 border-emerald-500 text-emerald-600 font-bold py-4 rounded-xl hover:bg-emerald-50 transition-colors flex items-center justify-center gap-2"
          >
            <Share2 className="w-5 h-5" />
            Share Results
          </button>
          <button
            onClick={onReset}
            className="flex-1 bg-emerald-500 text-white font-bold py-4 rounded-xl hover:bg-emerald-600 shadow-lg shadow-emerald-200 transition-colors"
          >
            New Analysis
          </button>
        </div>

        {/* Disclaimer */}
        <p className="text-center text-xs text-gray-400 pb-4">
          TinySteps AI provides insights based on WHO developmental guidelines for informational purposes only.
          It is not a substitute for professional medical advice, diagnosis, or treatment.
        </p>
      </div>
    </div>
  );
};

export default ResultsView;
