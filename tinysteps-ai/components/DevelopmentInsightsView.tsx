import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Minus,
  ChevronRight,
  Target,
  Sparkles,
  BarChart3,
} from 'lucide-react';
import { ChildProfile, AnalysisResult } from '../types';
import { getAnalyses, fetchAnalyses } from '../services/storageService';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface DevelopmentInsightsViewProps {
  childId: string;
  child?: ChildProfile;
  onBack: () => void;
  onNavigate: (step: string, data?: any) => void;
}

const TIME_FILTERS = [
  { id: '1W', label: '1W', days: 7 },
  { id: '1M', label: '1M', days: 30 },
  { id: '3M', label: '3M', days: 90 },
  { id: 'ALL', label: 'All', days: 9999 },
];

const DOMAIN_CONFIG = {
  motor: { label: 'Motor Skills', emoji: '🏃', color: '#3b82f6', bgColor: 'bg-blue-50', textColor: 'text-blue-600' },
  cognitive: { label: 'Cognitive', emoji: '🧠', color: '#8b5cf6', bgColor: 'bg-purple-50', textColor: 'text-purple-600' },
  language: { label: 'Language', emoji: '💬', color: '#ec4899', bgColor: 'bg-pink-50', textColor: 'text-pink-600' },
  social: { label: 'Social & Emotional', emoji: '❤️', color: '#f59e0b', bgColor: 'bg-amber-50', textColor: 'text-amber-600' },
};

const DevelopmentInsightsView: React.FC<DevelopmentInsightsViewProps> = ({
  childId,
  child,
  onBack,
  onNavigate,
}) => {
  const [timeFilter, setTimeFilter] = useState('ALL');
  const [analyses, setAnalyses] = useState<AnalysisResult[]>([]);

  useEffect(() => {
    // Load from localStorage immediately
    setAnalyses(getAnalyses(childId));

    // Then fetch from API
    fetchAnalyses(childId).then((apiAnalyses) => {
      setAnalyses(apiAnalyses);
    }).catch(() => {});
  }, [childId]);

  const getFilteredAnalyses = () => {
    const filter = TIME_FILTERS.find((f) => f.id === timeFilter);
    if (!filter || filter.id === 'ALL') return analyses;

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - filter.days);

    return analyses.filter((a) => new Date(a.timestamp) >= cutoff);
  };

  const filteredAnalyses = getFilteredAnalyses();

  // Build chart data
  const chartData = filteredAnalyses
    .slice()
    .reverse()
    .map((a) => ({
      date: new Date(a.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      motor: a.motorSkills?.score ?? 0,
      cognitive: a.cognitiveSkills?.score ?? 0,
      language: a.languageSkills?.score ?? 0,
      social: a.socialEmotional?.score ?? 0,
      overall: a.overallScore,
    }));

  // Calculate trends
  const getTrend = (domain: 'motor' | 'cognitive' | 'language' | 'social') => {
    if (filteredAnalyses.length < 2) return 'stable';
    const domainKey = {
      motor: 'motorSkills',
      cognitive: 'cognitiveSkills',
      language: 'languageSkills',
      social: 'socialEmotional',
    } as const;
    const latest = filteredAnalyses[0][domainKey[domain]]?.score ?? 0;
    const previous = filteredAnalyses[1][domainKey[domain]]?.score ?? 0;
    if (latest > previous + 2) return 'up';
    if (latest < previous - 2) return 'down';
    return 'stable';
  };

  const getLatestScore = (domain: 'motor' | 'cognitive' | 'language' | 'social') => {
    if (filteredAnalyses.length === 0) return 0;
    const domainKey = {
      motor: 'motorSkills',
      cognitive: 'cognitiveSkills',
      language: 'languageSkills',
      social: 'socialEmotional',
    } as const;
    return filteredAnalyses[0][domainKey[domain]]?.score ?? 0;
  };

  const getLatestStatus = (domain: 'motor' | 'cognitive' | 'language' | 'social') => {
    if (filteredAnalyses.length === 0) return 'on-track';
    const domainKey = {
      motor: 'motorSkills',
      cognitive: 'cognitiveSkills',
      language: 'languageSkills',
      social: 'socialEmotional',
    } as const;
    return filteredAnalyses[0][domainKey[domain]].status;
  };

  // Milestone velocity
  const totalMilestones = filteredAnalyses.reduce(
    (sum, a) => sum + a.milestones.filter((m) => m.achieved).length,
    0
  );
  const totalPending = filteredAnalyses.length > 0
    ? filteredAnalyses[0].milestones.filter((m) => !m.achieved).length
    : 0;

  const TrendIcon = ({ trend }: { trend: string }) => {
    if (trend === 'up') return <TrendingUp className="w-4 h-4 text-emerald-500" />;
    if (trend === 'down') return <TrendingDown className="w-4 h-4 text-red-500" />;
    return <Minus className="w-4 h-4 text-gray-400" />;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white px-6 pt-12 pb-8 rounded-b-[2rem]">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={onBack}
            className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center hover:bg-white/30 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold">Development Insights</h1>
            <p className="text-white/80 text-sm">Track progress over time</p>
          </div>
          <BarChart3 className="w-8 h-8 ml-auto opacity-60" />
        </div>

        {/* Time Filter Pills */}
        <div className="flex gap-2">
          {TIME_FILTERS.map((filter) => (
            <button
              key={filter.id}
              onClick={() => setTimeFilter(filter.id)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                timeFilter === filter.id
                  ? 'bg-white text-purple-700 shadow-lg'
                  : 'bg-white/15 text-white/90 hover:bg-white/25'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-6 space-y-6 pb-24">
        {/* Development Trend Chart */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-500" />
            Development Trend
          </h3>

          {chartData.length < 2 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 text-sm">
                Need at least 2 analyses to show trends. Run more analyses to see your chart!
              </p>
            </div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '12px',
                      border: 'none',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="motor"
                    stroke={DOMAIN_CONFIG.motor.color}
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    name="Motor"
                  />
                  <Line
                    type="monotone"
                    dataKey="cognitive"
                    stroke={DOMAIN_CONFIG.cognitive.color}
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    name="Cognitive"
                  />
                  <Line
                    type="monotone"
                    dataKey="language"
                    stroke={DOMAIN_CONFIG.language.color}
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    name="Language"
                  />
                  <Line
                    type="monotone"
                    dataKey="social"
                    stroke={DOMAIN_CONFIG.social.color}
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    name="Social"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Legend */}
          <div className="flex flex-wrap gap-4 mt-4">
            {Object.entries(DOMAIN_CONFIG).map(([key, config]) => (
              <div key={key} className="flex items-center gap-1.5">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: config.color }}
                />
                <span className="text-xs text-gray-600">{config.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Domain Detail Cards */}
        <div className="space-y-3">
          <h3 className="font-bold text-gray-800 text-lg">Domain Details</h3>
          {(Object.keys(DOMAIN_CONFIG) as Array<keyof typeof DOMAIN_CONFIG>).map((domain) => {
            const config = DOMAIN_CONFIG[domain];
            const score = getLatestScore(domain);
            const trend = getTrend(domain);
            const status = getLatestStatus(domain);

            return (
              <button
                key={domain}
                onClick={() =>
                  onNavigate('IMPROVE_DOMAIN', {
                    domain,
                    score,
                    status,
                  })
                }
                className="w-full bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow text-left"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl ${config.bgColor} flex items-center justify-center`}>
                    <span className="text-xl">{config.emoji}</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-gray-800">{config.label}</h4>
                      <TrendIcon trend={trend} />
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-lg font-bold ${config.textColor}`}>{score}</span>
                      <span className="text-xs text-gray-500">/100</span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          status === 'ahead'
                            ? 'bg-emerald-50 text-emerald-700'
                            : status === 'on-track'
                            ? 'bg-blue-50 text-blue-700'
                            : status === 'monitor'
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-red-50 text-red-700'
                        }`}
                      >
                        {status}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-300" />
                </div>
              </button>
            );
          })}
        </div>

        {/* Milestone Velocity */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-emerald-500" />
            Milestone Velocity
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-emerald-50 rounded-xl">
              <p className="text-3xl font-bold text-emerald-600">{totalMilestones}</p>
              <p className="text-xs text-gray-600 mt-1">Achieved</p>
            </div>
            <div className="text-center p-4 bg-amber-50 rounded-xl">
              <p className="text-3xl font-bold text-amber-600">{totalPending}</p>
              <p className="text-xs text-gray-600 mt-1">In Progress</p>
            </div>
          </div>
          {filteredAnalyses.length > 0 && (
            <p className="text-xs text-gray-500 text-center mt-3">
              Based on {filteredAnalyses.length} analysis{filteredAnalyses.length > 1 ? 'es' : ''} in selected period
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default DevelopmentInsightsView;
