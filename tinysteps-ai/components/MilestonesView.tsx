import React, { useState, useEffect, useCallback } from 'react';
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
  RefreshCw,
  Trophy,
  Eye,
  EyeOff,
  Calendar,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { ChildProfile, WHOSource, MilestoneProgress } from '../types';
import apiService from '../services/apiService';
import {
  getMilestonesForAge as getLocalMilestones,
  getUpcomingMilestones,
} from '../services/whoDataService';

interface AchievedMilestone {
  milestoneId: string;
  achievedDate: string;
  confirmedBy: 'parent' | 'analysis';
  notes?: string;
}

interface Milestone {
  id: string;
  title: string;
  description: string;
  domain: 'motor' | 'language' | 'cognitive' | 'social' | 'sensory';
  minMonths: number;
  maxMonths: number;
  typicalMonths: number;
  source?: WHOSource;
}

interface MilestonesViewProps {
  child: ChildProfile;
  onBack: () => void;
}

type DomainFilter = 'all' | 'motor' | 'language' | 'cognitive' | 'social' | 'sensory';

const MilestonesView: React.FC<MilestonesViewProps> = ({ child, onBack }) => {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [selectedDomain, setSelectedDomain] = useState<DomainFilter>('all');
  const [achievedMilestones, setAchievedMilestones] = useState<Map<string, AchievedMilestone>>(new Map());
  const [watchedMilestones, setWatchedMilestones] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'current' | 'upcoming' | 'achieved'>('current');
  const [selectedMilestone, setSelectedMilestone] = useState<Milestone | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [achievementDate, setAchievementDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [achievementNotes, setAchievementNotes] = useState<string>('');

  // Load milestones from local data and sync with backend
  const loadMilestones = useCallback(async () => {
    setLoading(true);
    try {
      // Load local WHO milestones
      const localMilestones = getLocalMilestones(child.ageMonths);
      const upcomingMilestones = getUpcomingMilestones(child.ageMonths, 20);

      // Combine and deduplicate
      const allMilestones = [...localMilestones, ...upcomingMilestones];
      const uniqueMilestones = Array.from(
        new Map(allMilestones.map(m => [m.id, m])).values()
      );

      const mappedMilestones: Milestone[] = uniqueMilestones.map((m: MilestoneProgress) => ({
        id: m.id,
        title: m.title,
        description: m.description,
        domain: m.domain,
        minMonths: m.expectedAgeMonths.min,
        maxMonths: m.expectedAgeMonths.max,
        typicalMonths: Math.round((m.expectedAgeMonths.min + m.expectedAgeMonths.max) / 2),
        source: m.source,
      }));

      setMilestones(mappedMilestones);

      // Try to load from backend
      await syncWithBackend();
    } catch (error) {
      console.error('Failed to load milestones:', error);
    } finally {
      setLoading(false);
    }
  }, [child.ageMonths, child.id]);

  // Sync with backend
  const syncWithBackend = async () => {
    try {
      const response = await apiService.getChildMilestones(child.id);
      if (response.data) {
        // Backend success - use backend data
        const achievedMap = new Map<string, AchievedMilestone>();
        response.data.achievedMilestones.forEach(m => {
          achievedMap.set(m.milestoneId, m);
        });
        setAchievedMilestones(achievedMap);

        const watchedSet = new Set<string>();
        response.data.watchedMilestones.forEach(m => {
          watchedSet.add(m.milestoneId);
        });
        setWatchedMilestones(watchedSet);
      } else if (response.error) {
        // API returned an error - keep state empty (in-memory only, no persistence)
        console.log('Backend unavailable, starting with empty state:', response.error);
      }
    } catch (error) {
      // Network error - keep state empty (in-memory only, no persistence)
      console.error('Failed to sync with backend, starting with empty state:', error);
    }
  };

  useEffect(() => {
    loadMilestones();
  }, [loadMilestones]);

  // Mark milestone as achieved
  const markAchieved = async (milestoneId: string) => {
    setSyncing(true);

    // Helper to update UI state only (no persistence)
    const updateStateOnly = () => {
      setAchievedMilestones((prev: Map<string, AchievedMilestone>) => {
        const next = new Map(prev);
        next.set(milestoneId, {
          milestoneId,
          achievedDate: achievementDate,
          confirmedBy: 'parent',
          notes: achievementNotes,
        });
        return next;
      });

      // Remove from watched if present
      setWatchedMilestones((prev: Set<string>) => {
        const next = new Set(prev);
        next.delete(milestoneId);
        return next;
      });
    };

    try {
      const response = await apiService.markMilestoneAchieved(child.id, milestoneId, {
        achievedDate: achievementDate,
        notes: achievementNotes,
        confirmedBy: 'parent',
      });

      if (!response.error) {
        // Backend success - update state
        updateStateOnly();
      } else {
        // API returned an error - update UI only (in-memory, no persistence)
        console.warn('Backend error, updating UI only:', response.error);
        updateStateOnly();
      }
    } catch (error) {
      console.error('Network error, updating UI only:', error);
      // Network error - update UI only (in-memory, no persistence)
      updateStateOnly();
    } finally {
      setSyncing(false);
      setShowDatePicker(false);
      setSelectedMilestone(null);
      setAchievementDate(new Date().toISOString().split('T')[0]);
      setAchievementNotes('');
    }
  };

  // Unmark milestone
  const unmarkAchieved = async (milestoneId: string) => {
    setSyncing(true);

    // Helper to update UI state only
    const removeFromState = () => {
      setAchievedMilestones((prev: Map<string, AchievedMilestone>) => {
        const next = new Map(prev);
        next.delete(milestoneId);
        return next;
      });
    };

    try {
      const response = await apiService.unmarkMilestoneAchieved(child.id, milestoneId);
      if (!response.error) {
        removeFromState();
      } else {
        // API error - update UI only
        console.warn('Backend error, updating UI only:', response.error);
        removeFromState();
      }
    } catch (error) {
      console.error('Network error, updating UI only:', error);
      removeFromState();
    } finally {
      setSyncing(false);
    }
  };

  // Toggle watch milestone
  const toggleWatch = async (milestoneId: string) => {
    const isWatching = watchedMilestones.has(milestoneId);
    setSyncing(true);

    // Helper to update UI state only (no persistence)
    const updateWatchState = (add: boolean) => {
      setWatchedMilestones((prev: Set<string>) => {
        const next = new Set(prev);
        if (add) {
          next.add(milestoneId);
        } else {
          next.delete(milestoneId);
        }
        return next;
      });
    };

    try {
      if (isWatching) {
        const response = await apiService.unwatchMilestone(child.id, milestoneId);
        if (!response.error) {
          updateWatchState(false);
        } else {
          console.warn('Backend error, updating UI only:', response.error);
          updateWatchState(false);
        }
      } else {
        const response = await apiService.watchMilestone(child.id, milestoneId);
        if (!response.error) {
          updateWatchState(true);
        } else {
          console.warn('Backend error, updating UI only:', response.error);
          updateWatchState(true);
        }
      }
    } catch (error) {
      console.error('Network error, updating UI only:', error);
      // Network error - update UI only (in-memory, no persistence)
      updateWatchState(!isWatching);
    } finally {
      setSyncing(false);
    }
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
      case 'sensory':
        return {
          icon: Sparkles,
          color: 'teal',
          emoji: '✨',
          bg: 'bg-teal-50',
          text: 'text-teal-600',
          border: 'border-teal-200',
          gradient: 'from-teal-400 to-emerald-500',
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
    { id: 'sensory' as DomainFilter, name: 'Sensory', emoji: '✨' },
  ];

  // Filter milestones based on tab and domain
  const filteredMilestones = milestones.filter((m: Milestone) => {
    if (selectedDomain !== 'all' && m.domain !== selectedDomain) return false;

    if (activeTab === 'current') {
      return (
        !achievedMilestones.has(m.id) &&
        child.ageMonths >= m.minMonths &&
        child.ageMonths <= m.maxMonths
      );
    } else if (activeTab === 'upcoming') {
      return !achievedMilestones.has(m.id) && m.minMonths > child.ageMonths;
    } else {
      // achieved
      return achievedMilestones.has(m.id);
    }
  });

  // Calculate progress
  const currentMilestones = milestones.filter(
    (m: Milestone) => child.ageMonths >= m.minMonths && child.ageMonths <= m.maxMonths
  );
  const achievedCount = currentMilestones.filter((m: Milestone) =>
    achievedMilestones.has(m.id)
  ).length;
  const progress =
    currentMilestones.length > 0
      ? (achievedCount / currentMilestones.length) * 100
      : 0;

  // Achievement date picker modal
  const DatePickerModal = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={() => setShowDatePicker(false)}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-3xl p-6 max-w-md w-full shadow-xl"
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
      >
        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Trophy className="w-6 h-6 text-emerald-500" />
          Mark as Achieved
        </h3>

        {selectedMilestone && (
          <div className="mb-4 p-3 bg-gray-50 rounded-xl">
            <p className="font-medium text-gray-800">{selectedMilestone.title}</p>
            <p className="text-sm text-gray-500">{selectedMilestone.description}</p>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Calendar className="w-4 h-4 inline mr-1" />
              When did {child.name} achieve this?
            </label>
            <input
              type="date"
              value={achievementDate}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAchievementDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes (optional)
            </label>
            <textarea
              value={achievementNotes}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setAchievementNotes(e.target.value)}
              placeholder="Any notes about this milestone..."
              className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none"
              rows={2}
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={() => setShowDatePicker(false)}
            className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={() => selectedMilestone && markAchieved(selectedMilestone.id)}
            disabled={syncing}
            className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-medium shadow-lg disabled:opacity-50"
          >
            {syncing ? 'Saving...' : 'Confirm'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );

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
            disabled={loading || syncing}
            className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center text-white shadow-lg disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 ${loading || syncing ? 'animate-spin' : ''}`} />
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
              <p className="text-white/80 text-xs mt-1">
                {achievedMilestones.size} total
              </p>
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
          <button
            onClick={() => setActiveTab('achieved')}
            className={`flex-1 py-3 rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2 ${
              activeTab === 'achieved'
                ? 'bg-white text-emerald-600 shadow-sm'
                : 'text-gray-500'
            }`}
          >
            🏆 Achieved ({achievedMilestones.size})
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
              {filteredMilestones.map((milestone: Milestone, index: number) => {
                const domainInfo = getDomainInfo(milestone.domain);
                const isAchieved = achievedMilestones.has(milestone.id);
                const isWatching = watchedMilestones.has(milestone.id);
                const achievementData = achievedMilestones.get(milestone.id);
                const isCurrent = activeTab === 'current';
                const isUpcoming = activeTab === 'upcoming';

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
                        : isWatching
                        ? 'border-amber-300 bg-amber-50/30'
                        : domainInfo.border
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
                                    ? 'text-emerald-700'
                                    : 'text-gray-800'
                                }`}
                              >
                                {milestone.title}
                                {isWatching && !isAchieved && (
                                  <Eye className="w-4 h-4 inline ml-2 text-amber-500" />
                                )}
                              </h3>
                              <div className="flex items-center gap-2 mt-1 flex-wrap">
                                <span
                                  className={`text-xs px-2 py-0.5 rounded-full ${domainInfo.bg} ${domainInfo.text}`}
                                >
                                  {milestone.domain}
                                </span>
                                <span className="text-xs text-gray-400">
                                  {milestone.minMonths}-{milestone.maxMonths} months
                                </span>
                                {isAchieved && achievementData && (
                                  <span className="text-xs text-emerald-600 flex items-center gap-1">
                                    <Check className="w-3 h-3" />
                                    {new Date(achievementData.achievedDate).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Action buttons */}
                            <div className="flex gap-2">
                              {/* Watch button for upcoming */}
                              {isUpcoming && !isAchieved && (
                                <button
                                  onClick={() => toggleWatch(milestone.id)}
                                  disabled={syncing}
                                  className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                                    isWatching
                                      ? 'bg-amber-500 text-white'
                                      : 'bg-gray-100 text-gray-400 hover:bg-amber-100 hover:text-amber-500'
                                  }`}
                                  title={isWatching ? 'Stop watching' : 'Watch milestone'}
                                >
                                  {isWatching ? (
                                    <EyeOff className="w-4 h-4" />
                                  ) : (
                                    <Eye className="w-4 h-4" />
                                  )}
                                </button>
                              )}

                              {/* Checkbox for current milestones */}
                              {(isCurrent || isUpcoming) && !isAchieved && (
                                <button
                                  onClick={() => {
                                    setSelectedMilestone(milestone);
                                    setShowDatePicker(true);
                                  }}
                                  disabled={syncing}
                                  className="w-8 h-8 rounded-lg flex items-center justify-center bg-gray-100 text-gray-400 hover:bg-emerald-100 hover:text-emerald-500 transition-all"
                                  title="Mark as achieved"
                                >
                                  <Check className="w-5 h-5" />
                                </button>
                              )}

                              {/* Achieved state */}
                              {isAchieved && (
                                <button
                                  onClick={() => unmarkAchieved(milestone.id)}
                                  disabled={syncing}
                                  className="w-8 h-8 rounded-lg flex items-center justify-center bg-emerald-500 text-white hover:bg-red-500 transition-all"
                                  title="Remove achievement"
                                >
                                  <Check className="w-5 h-5" />
                                </button>
                              )}

                              {/* Clock for upcoming (not watching) */}
                              {isUpcoming && !isAchieved && !isWatching && (
                                <div className="p-2 bg-gray-100 rounded-lg">
                                  <Clock className="w-4 h-4 text-gray-400" />
                                </div>
                              )}
                            </div>
                          </div>

                          <p
                            className={`text-sm mt-2 ${
                              isAchieved ? 'text-emerald-600' : 'text-gray-600'
                            }`}
                          >
                            {milestone.description}
                          </p>

                          {/* Achievement notes */}
                          {isAchieved && achievementData?.notes && (
                            <p className="text-xs text-emerald-700 mt-2 italic">
                              "{achievementData.notes}"
                            </p>
                          )}

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

                          {/* Source link */}
                          {milestone.source && (
                            <a
                              href={milestone.source.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 mt-2 text-xs text-blue-500 hover:text-blue-700 hover:underline"
                            >
                              <ExternalLink className="w-3 h-3" />
                              <span>
                                {milestone.source.organization} - {milestone.source.title}
                              </span>
                            </a>
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
              <span className="text-4xl">
                {activeTab === 'achieved' ? '🏆' : '🎯'}
              </span>
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">
              {activeTab === 'achieved'
                ? 'No achievements yet'
                : 'No milestones found'}
            </h3>
            <p className="text-gray-500">
              {activeTab === 'achieved'
                ? `Start marking ${child.name}'s achievements!`
                : activeTab === 'current'
                ? 'All current milestones are in other domains'
                : 'Check back as your child grows'}
            </p>
          </div>
        )}
      </div>

      {/* Date Picker Modal */}
      <AnimatePresence>
        {showDatePicker && <DatePickerModal />}
      </AnimatePresence>
    </div>
  );
};

export default MilestonesView;
