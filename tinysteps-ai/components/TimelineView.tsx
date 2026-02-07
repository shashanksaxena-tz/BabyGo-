import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Calendar,
  Camera,
  TrendingUp,
  CheckCircle,
  Star,
  Scale,
  Plus,
  ChevronRight,
  ExternalLink,
  Trophy,
  Activity,
  MessageSquare,
  Brain,
  Heart,
  Sparkles,
} from 'lucide-react';
import { ChildProfile, TimelineEntry, AnalysisResult } from '../types';
import { getTimeline, getAnalyses } from '../services/storageService';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { calculatePercentile, getMilestoneById, WHO_SOURCES } from '../services/whoDataService';

interface TimelineViewProps {
  child: ChildProfile;
  onBack: () => void;
  onNavigate: (screen: string, data?: any) => void;
}

const TimelineView: React.FC<TimelineViewProps> = ({ child, onBack, onNavigate }) => {
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
  const [analyses, setAnalyses] = useState<AnalysisResult[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [chartMetric, setChartMetric] = useState<'weight' | 'height'>('weight');

  useEffect(() => {
    setTimeline(getTimeline(child.id));
    setAnalyses(getAnalyses(child.id));
  }, [child.id]);

  const filteredTimeline = filter === 'all'
    ? timeline
    : timeline.filter(t => t.type === filter);

  // Build growth chart data
  const growthData = analyses
    .filter(a => a.physicalGrowth)
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    .map(a => {
      const date = new Date(a.timestamp);
      return {
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        weight: child.weight,
        height: child.height,
        weightPercentile: a.physicalGrowth.weightPercentile,
        heightPercentile: a.physicalGrowth.heightPercentile,
      };
    });

  // Add current measurements
  if (growthData.length === 0) {
    growthData.push({
      date: 'Today',
      weight: child.weight,
      height: child.height,
      weightPercentile: calculatePercentile(child.weight, 'weight', child.ageMonths, child.gender),
      heightPercentile: calculatePercentile(child.height, 'height', child.ageMonths, child.gender),
    });
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getEntryIcon = (type: string, domain?: string) => {
    switch (type) {
      case 'analysis': return { icon: Camera, color: 'bg-emerald-100 text-emerald-600', emoji: '📊' };
      case 'milestone':
        // Return domain-specific icon for milestones
        switch (domain) {
          case 'motor': return { icon: Activity, color: 'bg-blue-100 text-blue-600', emoji: '🏃' };
          case 'language': return { icon: MessageSquare, color: 'bg-purple-100 text-purple-600', emoji: '💬' };
          case 'cognitive': return { icon: Brain, color: 'bg-amber-100 text-amber-600', emoji: '🧠' };
          case 'social': return { icon: Heart, color: 'bg-rose-100 text-rose-600', emoji: '❤️' };
          case 'sensory': return { icon: Sparkles, color: 'bg-teal-100 text-teal-600', emoji: '✨' };
          default: return { icon: Trophy, color: 'bg-amber-100 text-amber-600', emoji: '🏆' };
        }
      case 'measurement': return { icon: Scale, color: 'bg-blue-100 text-blue-600', emoji: '📏' };
      case 'photo': return { icon: Camera, color: 'bg-purple-100 text-purple-600', emoji: '📸' };
      default: return { icon: CheckCircle, color: 'bg-gray-100 text-gray-600', emoji: '✓' };
    }
  };

  // Get milestone details from WHO data
  const getMilestoneDetails = (entry: TimelineEntry) => {
    if (entry.type !== 'milestone' || !entry.data?.milestoneId) return null;
    const milestone = getMilestoneById(entry.data.milestoneId);
    return milestone;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-6 pt-12 pb-8">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={onBack}
            className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center hover:bg-white/30 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold">{child.name}'s Growth Journey</h1>
            <p className="text-indigo-100 text-sm">Timeline & Progress</p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white/10 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold">{analyses.length}</p>
            <p className="text-xs text-indigo-100">Analyses</p>
          </div>
          <div className="bg-white/10 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold">{child.ageMonths}</p>
            <p className="text-xs text-indigo-100">Months Old</p>
          </div>
          <div className="bg-white/10 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold">{timeline.filter(t => t.type === 'milestone').length}</p>
            <p className="text-xs text-indigo-100">Milestones</p>
          </div>
        </div>
      </div>

      <div className="px-6 py-6 space-y-6">
        {/* Growth Chart */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-500" />
              Growth Chart
            </h3>
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setChartMetric('weight')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${
                  chartMetric === 'weight' ? 'bg-white shadow text-indigo-600' : 'text-gray-500'
                }`}
              >
                Weight
              </button>
              <button
                onClick={() => setChartMetric('height')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${
                  chartMetric === 'height' ? 'bg-white shadow text-indigo-600' : 'text-gray-500'
                }`}
              >
                Height
              </button>
            </div>
          </div>

          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={growthData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                  formatter={(value: number) => [`${value}%`, 'Percentile']}
                />
                <ReferenceLine y={50} stroke="#e5e7eb" strokeDasharray="3 3" />
                <ReferenceLine y={25} stroke="#fecaca" strokeDasharray="3 3" />
                <ReferenceLine y={75} stroke="#bbf7d0" strokeDasharray="3 3" />
                <Line
                  type="monotone"
                  dataKey={chartMetric === 'weight' ? 'weightPercentile' : 'heightPercentile'}
                  stroke={chartMetric === 'weight' ? '#3b82f6' : '#10b981'}
                  strokeWidth={3}
                  dot={{ fill: chartMetric === 'weight' ? '#3b82f6' : '#10b981', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="flex justify-center gap-4 mt-4 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <span className="w-3 h-0.5 bg-green-300"></span> Above average (75%+)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-0.5 bg-gray-300"></span> Average (50%)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-0.5 bg-red-300"></span> Below average (25%-)
            </span>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {['all', 'analysis', 'milestone', 'measurement'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                filter === f
                  ? 'bg-indigo-500 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {/* Timeline */}
        <div className="space-y-4">
          {filteredTimeline.length > 0 ? (
            filteredTimeline.map((entry, index) => {
              const milestoneDetails = getMilestoneDetails(entry);
              const domain = entry.data?.domain || milestoneDetails?.domain;
              const { icon: Icon, color, emoji } = getEntryIcon(entry.type, domain);
              const isMilestone = entry.type === 'milestone';

              return (
                <div
                  key={entry.id}
                  className="flex gap-4"
                >
                  {/* Timeline Line */}
                  <div className="flex flex-col items-center">
                    <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center`}>
                      {isMilestone ? (
                        <span className="text-lg">{emoji}</span>
                      ) : (
                        <Icon className="w-5 h-5" />
                      )}
                    </div>
                    {index < filteredTimeline.length - 1 && (
                      <div className="w-0.5 h-full bg-gray-200 my-2" />
                    )}
                  </div>

                  {/* Entry Card */}
                  <div
                    className={`flex-1 bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition-shadow ${
                      entry.type === 'analysis' ? 'cursor-pointer' : ''
                    } ${isMilestone ? 'border-l-4 border-amber-400' : ''}`}
                    onClick={() => {
                      if (entry.type === 'analysis' && entry.analysisId) {
                        onNavigate('results', { analysisId: entry.analysisId });
                      }
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          {isMilestone && (
                            <Trophy className="w-4 h-4 text-amber-500" />
                          )}
                          <p className="font-semibold text-gray-800">{entry.title}</p>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">{entry.description}</p>

                        {/* Milestone-specific details */}
                        {isMilestone && milestoneDetails && (
                          <div className="mt-3 p-3 bg-amber-50 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <span className={`text-xs px-2 py-0.5 rounded-full ${
                                domain === 'motor' ? 'bg-blue-100 text-blue-600' :
                                domain === 'language' ? 'bg-purple-100 text-purple-600' :
                                domain === 'cognitive' ? 'bg-amber-100 text-amber-600' :
                                domain === 'social' ? 'bg-rose-100 text-rose-600' :
                                'bg-teal-100 text-teal-600'
                              }`}>
                                {domain}
                              </span>
                              <span className="text-xs text-gray-500">
                                Expected: {milestoneDetails.expectedAgeMonths.min}-{milestoneDetails.expectedAgeMonths.max} months
                              </span>
                            </div>
                            {entry.data?.confirmedBy && (
                              <p className="text-xs text-gray-500">
                                Confirmed by: {entry.data.confirmedBy === 'parent' ? 'Parent' : 'AI Analysis'}
                              </p>
                            )}
                            {milestoneDetails.source && (
                              <a
                                href={milestoneDetails.source.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 mt-2 text-xs text-blue-500 hover:text-blue-700 hover:underline"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <ExternalLink className="w-3 h-3" />
                                <span>
                                  {milestoneDetails.source.organization} - View Source
                                </span>
                              </a>
                            )}
                          </div>
                        )}

                        <p className="text-xs text-gray-400 mt-2">
                          <Calendar className="w-3 h-3 inline mr-1" />
                          {formatDate(entry.timestamp)}
                        </p>
                      </div>
                      {entry.type === 'analysis' && (
                        <ChevronRight className="w-5 h-5 text-gray-300" />
                      )}
                    </div>

                    {entry.mediaUrl && (
                      <img
                        src={entry.mediaUrl}
                        alt=""
                        className="mt-3 rounded-lg w-full h-32 object-cover"
                      />
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No entries yet</p>
              <p className="text-sm text-gray-400 mt-1">Start tracking {child.name}'s journey</p>
              <button
                onClick={() => onNavigate('upload')}
                className="mt-4 px-6 py-2 bg-indigo-500 text-white rounded-xl font-medium hover:bg-indigo-600 transition-colors"
              >
                Add First Entry
              </button>
            </div>
          )}
        </div>

        {/* Add Entry Button */}
        {filteredTimeline.length > 0 && (
          <button
            onClick={() => onNavigate('upload')}
            className="fixed bottom-24 right-6 w-14 h-14 bg-indigo-500 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-indigo-600 transition-colors"
          >
            <Plus className="w-6 h-6" />
          </button>
        )}
      </div>
    </div>
  );
};

export default TimelineView;
