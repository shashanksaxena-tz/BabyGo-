import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Check,
  Clock,
  Award,
  Brain,
  Heart,
  MessageSquare,
  Activity,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Trophy,
} from 'lucide-react';
import { ChildProfile, WHOSource } from '../types';
import apiService from '../services/apiService';

interface Milestone {
  id: string;
  title: string;
  description: string;
  domain: 'motor' | 'language' | 'cognitive' | 'social';
  minMonths: number;
  maxMonths: number;
  typicalMonths: number;
  source?: WHOSource;
}

interface MilestonesViewProps {
  child: ChildProfile;
  onBack: () => void;
}

type DomainFilter = 'all' | 'motor' | 'language' | 'cognitive' | 'social';

const MilestonesView: React.FC<MilestonesViewProps> = ({ child, onBack }) => {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDomain, setSelectedDomain] = useState<DomainFilter>('all');
  const [achievedMilestones, setAchievedMilestones] = useState<Set<string>>(
    new Set()
  );
  const [activeTab, setActiveTab] = useState<'current' | 'upcoming'>('current');

  useEffect(() => {
    loadMilestones();
    // Load achieved milestones from localStorage
    const saved = localStorage.getItem(`achieved_milestones_${child.id}`);
    if (saved) {
      setAchievedMilestones(new Set(JSON.parse(saved)));
    }
  }, [child.id]);

  const loadMilestones = async () => {
    setLoading(true);
    try {
      const response = await apiService.getMilestones(child.ageMonths);
      if (response.data) {
        setMilestones((response.data as any).milestones || []);
      }
    } catch (error) {
      console.error('Failed to load milestones:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleMilestone = (milestoneId: string) => {
    setAchievedMilestones((prev) => {
      const next = new Set(prev);
      if (next.has(milestoneId)) {
        next.delete(milestoneId);
      } else {
        next.add(milestoneId);
      }
      // Save to localStorage
      localStorage.setItem(
        `achieved_milestones_${child.id}`,
        JSON.stringify([...next])
      );
      return next;
    });
  };

  const getDomainInfo = (domain: string) => {
    switch (domain) {
      case 'motor':
        return {
          icon: Activity,
          color: 'blue',
          emoji: '🏃',
          bg: 'bg-blue-50',
          text: 'text-blue-600',
          border: 'border-blue-200',
          gradient: 'from-blue-400 to-cyan-500',
        };
      case 'language':
        return {
          icon: MessageSquare,
          color: 'purple',
          emoji: '💬',
          bg: 'bg-purple-50',
          text: 'text-purple-600',
          border: 'border-purple-200',
          gradient: 'from-purple-400 to-pink-500',
        };
      case 'cognitive':
        return {
          icon: Brain,
          color: 'amber',
          emoji: '🧠',
          bg: 'bg-amber-50',
          text: 'text-amber-600',
          border: 'border-amber-200',
          gradient: 'from-amber-400 to-orange-500',
        };
      case 'social':
        return {
          icon: Heart,
          color: 'rose',
          emoji: '❤️',
          bg: 'bg-rose-50',
          text: 'text-rose-600',
          border: 'border-rose-200',
          gradient: 'from-rose-400 to-pink-500',
        };
      default:
        return {
          icon: Award,
          color: 'gray',
          emoji: '🎯',
          bg: 'bg-gray-50',
          text: 'text-gray-600',
          border: 'border-gray-200',
          gradient: 'from-gray-400 to-gray-500',
        };
    }
  };

  const domains = [
    { id: 'all' as DomainFilter, name: 'All', emoji: '🌟' },
    { id: 'motor' as DomainFilter, name: 'Motor', emoji: '🏃' },
    { id: 'language' as DomainFilter, name: 'Language', emoji: '💬' },
    { id: 'cognitive' as DomainFilter, name: 'Cognitive', emoji: '🧠' },
    { id: 'social' as DomainFilter, name: 'Social', emoji: '❤️' },
  ];

  // Filter milestones
  const filteredMilestones = milestones.filter((m) => {
    if (selectedDomain !== 'all' && m.domain !== selectedDomain) return false;

    if (activeTab === 'current') {
      return (
        child.ageMonths >= m.minMonths && child.ageMonths <= m.maxMonths
      );
    } else {
      return m.minMonths > child.ageMonths;
    }
  });

  // Calculate progress
  const currentMilestones = milestones.filter(
    (m) => child.ageMonths >= m.minMonths && child.ageMonths <= m.maxMonths
  );
  const achievedCount = currentMilestones.filter((m) =>
    achievedMilestones.has(m.id)
  ).length;
  const progress =
    currentMilestones.length > 0
      ? (achievedCount / currentMilestones.length) * 100
      : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={onBack}
            className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm hover:shadow-md transition-all"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">Milestones</h1>
            <p className="text-sm text-gray-500">
              Track {child.name}'s development
            </p>
          </div>
          <button
            onClick={loadMilestones}
            className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center text-white shadow-lg"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Progress Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-3xl p-6 mb-6 shadow-lg shadow-emerald-200"
        >
          <div className="flex items-center gap-6">
            {/* Progress Ring */}
            <div className="relative w-24 h-24">
              <svg className="w-24 h-24 -rotate-90">
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  stroke="rgba(255,255,255,0.3)"
                  strokeWidth="8"
                  fill="none"
                />
                <motion.circle
                  cx="48"
                  cy="48"
                  r="40"
                  stroke="white"
                  strokeWidth="8"
                  fill="none"
                  strokeLinecap="round"
                  initial={{ strokeDasharray: '0 251.2' }}
                  animate={{
                    strokeDasharray: `${(progress / 100) * 251.2} 251.2`,
                  }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-white">
                  {achievedCount}/{currentMilestones.length}
                </span>
              </div>
            </div>

            <div className="flex-1">
              <p className="text-white/80 text-sm">Current Milestones</p>
              <p className="text-white text-2xl font-bold">
                {progress.toFixed(0)}% achieved
              </p>
              <p className="text-white/80 text-sm mt-1">
                Age: {child.ageMonths} months
              </p>
            </div>

            <div className="text-center">
              <Trophy className="w-10 h-10 text-yellow-300 mx-auto" />
              <p className="text-white/80 text-xs mt-1">Keep going!</p>
            </div>
          </div>
        </motion.div>

        {/* Domain Filter */}
        <div className="flex gap-2 overflow-x-auto pb-4 mb-4 scrollbar-hide">
          {domains.map((domain) => (
            <button
              key={domain.id}
              onClick={() => setSelectedDomain(domain.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all ${
                selectedDomain === domain.id
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              <span>{domain.emoji}</span>
              <span className="font-medium text-sm">{domain.name}</span>
            </button>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 p-1 bg-gray-100 rounded-2xl mb-6">
          <button
            onClick={() => setActiveTab('current')}
            className={`flex-1 py-3 rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2 ${
              activeTab === 'current'
                ? 'bg-white text-emerald-600 shadow-sm'
                : 'text-gray-500'
            }`}
          >
            🎯 Current
          </button>
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`flex-1 py-3 rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2 ${
              activeTab === 'upcoming'
                ? 'bg-white text-emerald-600 shadow-sm'
                : 'text-gray-500'
            }`}
          >
            🚀 Upcoming
          </button>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <Award className="w-16 h-16 text-emerald-500 animate-bounce mb-4" />
            <p className="text-gray-600 font-medium">Loading milestones...</p>
          </div>
        )}

        {/* Milestones List */}
        {!loading && (
          <div className="space-y-3">
            <AnimatePresence>
              {filteredMilestones.map((milestone, index) => {
                const domainInfo = getDomainInfo(milestone.domain);
                const isAchieved = achievedMilestones.has(milestone.id);
                const isCurrent = activeTab === 'current';

                // Calculate progress within window
                const windowStart = milestone.minMonths;
                const windowEnd = milestone.maxMonths;
                const windowProgress =
                  ((child.ageMonths - windowStart) / (windowEnd - windowStart)) *
                  100;

                return (
                  <motion.div
                    key={milestone.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.05 }}
                    className={`bg-white rounded-2xl shadow-sm overflow-hidden border-2 transition-all ${
                      isAchieved
                        ? 'border-emerald-400 bg-emerald-50/50'
                        : `${domainInfo.border}`
                    }`}
                  >
                    <div className="p-4">
                      <div className="flex gap-4">
                        {/* Domain Icon */}
                        <div
                          className={`w-12 h-12 ${domainInfo.bg} rounded-xl flex items-center justify-center flex-shrink-0`}
                        >
                          <span className="text-2xl">{domainInfo.emoji}</span>
                        </div>

                        {/* Content */}
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3
                                className={`font-bold ${
                                  isAchieved
                                    ? 'text-emerald-700 line-through'
                                    : 'text-gray-800'
                                }`}
                              >
                                {milestone.title}
                              </h3>
                              <div className="flex items-center gap-2 mt-1">
                                <span
                                  className={`text-xs px-2 py-0.5 rounded-full ${domainInfo.bg} ${domainInfo.text}`}
                                >
                                  {milestone.domain}
                                </span>
                                <span className="text-xs text-gray-400">
                                  {milestone.minMonths}-{milestone.maxMonths} months
                                </span>
                              </div>
                            </div>

                            {/* Checkbox for current milestones */}
                            {isCurrent && (
                              <button
                                onClick={() => toggleMilestone(milestone.id)}
                                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                                  isAchieved
                                    ? 'bg-emerald-500 text-white'
                                    : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                                }`}
                              >
                                <Check className="w-5 h-5" />
                              </button>
                            )}

                            {/* Clock for upcoming */}
                            {!isCurrent && (
                              <div className="p-2 bg-gray-100 rounded-lg">
                                <Clock className="w-4 h-4 text-gray-400" />
                              </div>
                            )}
                          </div>

                          <p
                            className={`text-sm mt-2 ${
                              isAchieved ? 'text-emerald-600' : 'text-gray-600'
                            }`}
                          >
                            {milestone.description}
                          </p>

                          {/* Progress bar for current milestones */}
                          {isCurrent && !isAchieved && (
                            <div className="mt-3">
                              <div className="flex justify-between text-xs text-gray-400 mb-1">
                                <span>Expected window</span>
                                <span>
                                  Typical: {milestone.typicalMonths}mo
                                </span>
                              </div>
                              <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{
                                    width: `${Math.min(windowProgress, 100)}%`,
                                  }}
                                  className={`h-full bg-gradient-to-r ${domainInfo.gradient} rounded-full`}
                                />
                              </div>
                            </div>
                          )}

                          {/* Source */}
                          {milestone.source && (
                            <div className="flex items-center gap-1 mt-2 text-xs text-gray-400">
                              <Award className="w-3 h-3" />
                              <span>{milestone.source.title}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredMilestones.length === 0 && (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-gray-100 rounded-3xl flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">🎯</span>
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">
              No milestones found
            </h3>
            <p className="text-gray-500">
              {activeTab === 'current'
                ? 'All current milestones are in other domains'
                : 'Check back as your child grows'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MilestonesView;
