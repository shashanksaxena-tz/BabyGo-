import React, { useState, useEffect } from 'react';
import {
  Baby,
  Camera,
  BookOpen,
  TrendingUp,
  Gift,
  Utensils,
  Bell,
  Settings,
  ChevronRight,
  ChevronDown,
  Sparkles,
  Calendar,
  Star,
  Heart,
  Play,
  Clock,
  Target,
  Lightbulb,
} from 'lucide-react';
import { ChildProfile, AnalysisResult, TimelineEntry, Notification } from '../types';
import { getTimeline, getAnalyses, getNotifications, getChildren, setCurrentChild } from '../services/storageService';
import { getMilestonesForAge, getUpcomingMilestones, assessGrowth } from '../services/whoDataService';
import { getPersonalizedGreeting, getThemedNotification } from '../data/interests';
import { RadialBarChart, RadialBar, ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts';

interface HomeDashboardProps {
  child: ChildProfile;
  onNavigate: (screen: string) => void;
  onStartAnalysis: () => void;
  onSwitchChild: (childId: string) => void;
  onAddChild: () => void;
}

const HomeDashboard: React.FC<HomeDashboardProps> = ({ child, onNavigate, onStartAnalysis, onSwitchChild, onAddChild }) => {
  const [greeting, setGreeting] = useState('');
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
  const [analyses, setAnalyses] = useState<AnalysisResult[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isSwitchingProfile, setIsSwitchingProfile] = useState(false);
  const [allChildren, setAllChildren] = useState<ChildProfile[]>([]);

  useEffect(() => {
    setGreeting(getPersonalizedGreeting(child.name, child.interests));
    setTimeline(getTimeline(child.id).slice(0, 5));
    setAnalyses(getAnalyses(child.id).slice(0, 3));
    setNotifications(getNotifications(child.id).filter(n => !n.read).slice(0, 3));
    setAllChildren(getChildren());
  }, [child]);

  const milestones = getMilestonesForAge(child.ageMonths);
  const upcomingMilestones = getUpcomingMilestones(child.ageMonths, 3);
  const growthAssessment = assessGrowth(
    child.weight,
    child.height,
    child.headCircumference,
    child.ageMonths,
    child.gender
  );

  const latestAnalysis = analyses[0];
  const overallScore = latestAnalysis?.overallScore || 0;

  const scoreData = [
    { name: 'bg', value: 100, fill: '#f0fdf4' },
    { name: 'score', value: overallScore, fill: overallScore >= 70 ? '#10b981' : overallScore >= 50 ? '#f59e0b' : '#ef4444' }
  ];

  // Format age display
  const formatAge = (months: number) => {
    if (months < 12) return `${months} months`;
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    if (remainingMonths === 0) return `${years} year${years > 1 ? 's' : ''}`;
    return `${years}y ${remainingMonths}m`;
  };

  const QuickActionCard = ({ icon: Icon, title, subtitle, color, onClick }: any) => (
    <button
      onClick={onClick}
      className={`p-4 rounded-2xl text-left transition-all hover:scale-[1.02] active:scale-[0.98] ${color}`}
    >
      <Icon className="w-6 h-6 mb-2" />
      <p className="font-semibold text-sm">{title}</p>
      <p className="text-xs opacity-80">{subtitle}</p>
    </button>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-6 pt-12 pb-24 rounded-b-[3rem]">
        <div className="flex items-center justify-between mb-6">
          <div
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => setIsSwitchingProfile(true)}
          >
            <div className="relative">
              {child.profilePhoto ? (
                <img
                  src={child.profilePhoto}
                  alt={child.name}
                  className="w-14 h-14 rounded-2xl object-cover border-2 border-white/30"
                />
              ) : (
                <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center border-2 border-white/30">
                  <Baby className="w-7 h-7" />
                </div>
              )}
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-sm">
                <ChevronDown className="w-4 h-4 text-emerald-600" />
              </div>
            </div>
            <div>
              <p className="text-emerald-100 text-sm">Welcome back!</p>
              <h1 className="text-xl font-bold">{child.name}</h1>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => onNavigate('notifications')}
              className="relative w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center hover:bg-white/30 transition-colors"
            >
              <Bell className="w-5 h-5" />
              {notifications.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs flex items-center justify-center">
                  {notifications.length}
                </span>
              )}
            </button>
            <button
              onClick={() => onNavigate('settings')}
              className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center hover:bg-white/30 transition-colors"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Greeting with interest theme */}
        <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-sm">
          <p className="text-lg font-medium">{greeting}</p>
          <p className="text-emerald-100 text-sm mt-1">
            {formatAge(child.ageMonths)} old
            {child.interests.length > 0 && ` | Loves ${child.interests[0].icon} ${child.interests[0].name}`}
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-6 -mt-16 pb-24 space-y-6">
        {/* Score Card */}
        <div className="bg-white rounded-3xl shadow-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-gray-800">Development Overview</h2>
              <p className="text-sm text-gray-500">Based on WHO standards</p>
            </div>
            {latestAnalysis && (
              <button
                onClick={() => onNavigate('results', { analysisId: latestAnalysis.id })}
                className="text-emerald-600 text-sm font-medium flex items-center gap-1 hover:text-emerald-700"
              >
                View Details <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>

          {latestAnalysis ? (
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 relative">
                <ResponsiveContainer>
                  <RadialBarChart innerRadius="75%" outerRadius="100%" data={scoreData} startAngle={90} endAngle={-270}>
                    <RadialBar dataKey="value" cornerRadius={10} />
                  </RadialBarChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <span className="text-2xl font-bold text-emerald-600">{overallScore}</span>
                    <span className="text-xs text-gray-500 block">score</span>
                  </div>
                </div>
              </div>

              <div className="flex-1 space-y-2">
                {[
                  { label: 'Motor', value: latestAnalysis.motorSkills.score, color: 'emerald' },
                  { label: 'Cognitive', value: latestAnalysis.cognitiveSkills.score, color: 'blue' },
                  { label: 'Language', value: latestAnalysis.languageSkills.score, color: 'purple' },
                  { label: 'Social', value: latestAnalysis.socialEmotional.score, color: 'pink' },
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 w-16">{item.label}</span>
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full bg-${item.color}-500 rounded-full transition-all`}
                        style={{ width: `${item.value}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-gray-700 w-8">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Camera className="w-8 h-8 text-emerald-600" />
              </div>
              <p className="font-semibold text-gray-800 mb-2">No analysis yet</p>
              <p className="text-sm text-gray-500 mb-4">Upload photos or videos to get started</p>
              <button
                onClick={onStartAnalysis}
                className="px-6 py-3 bg-emerald-500 text-white rounded-xl font-medium hover:bg-emerald-600 transition-colors"
              >
                Start First Analysis
              </button>
            </div>
          )}
        </div>

        {/* Growth Stats */}
        <div className="bg-white rounded-3xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-500" />
              Growth Percentiles
            </h3>
            <button
              onClick={() => onNavigate('growth')}
              className="text-blue-600 text-sm font-medium"
            >
              View Charts
            </button>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-blue-50 rounded-xl">
              <p className="text-2xl font-bold text-blue-600">{growthAssessment.weightPercentile}%</p>
              <p className="text-xs text-gray-600">Weight</p>
              <p className="text-xs text-gray-400">{child.weight} kg</p>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-xl">
              <p className="text-2xl font-bold text-green-600">{growthAssessment.heightPercentile}%</p>
              <p className="text-xs text-gray-600">Height</p>
              <p className="text-xs text-gray-400">{child.height} cm</p>
            </div>
            {growthAssessment.headCircumferencePercentile && (
              <div className="text-center p-3 bg-purple-50 rounded-xl">
                <p className="text-2xl font-bold text-purple-600">{growthAssessment.headCircumferencePercentile}%</p>
                <p className="text-xs text-gray-600">Head</p>
                <p className="text-xs text-gray-400">{child.headCircumference} cm</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            Quick Actions
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <QuickActionCard
              icon={Camera}
              title="New Analysis"
              subtitle="Upload media"
              color="bg-gradient-to-br from-emerald-400 to-teal-500 text-white"
              onClick={onStartAnalysis}
            />
            <QuickActionCard
              icon={BookOpen}
              title="Bedtime Stories"
              subtitle={`Starring ${child.name}`}
              color="bg-gradient-to-br from-purple-400 to-pink-500 text-white"
              onClick={() => onNavigate('stories')}
            />
            <QuickActionCard
              icon={Gift}
              title="For You"
              subtitle="Recommendations"
              color="bg-gradient-to-br from-amber-400 to-orange-500 text-white"
              onClick={() => onNavigate('recommendations')}
            />
            <QuickActionCard
              icon={Utensils}
              title="Recipes"
              subtitle="Age-appropriate"
              color="bg-gradient-to-br from-blue-400 to-indigo-500 text-white"
              onClick={() => onNavigate('recipes')}
            />
          </div>
        </div>

        {/* Upcoming Milestones */}
        <div className="bg-white rounded-3xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              <Target className="w-5 h-5 text-emerald-500" />
              Upcoming Milestones
            </h3>
            <button
              onClick={() => onNavigate('milestones')}
              className="text-emerald-600 text-sm font-medium"
            >
              View All
            </button>
          </div>

          <div className="space-y-3">
            {upcomingMilestones.map((milestone, index) => (
              <div
                key={milestone.id}
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-emerald-50 transition-colors cursor-pointer"
                onClick={() => onNavigate('milestones')}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${milestone.domain === 'motor' ? 'bg-blue-100 text-blue-600' :
                  milestone.domain === 'cognitive' ? 'bg-purple-100 text-purple-600' :
                    milestone.domain === 'language' ? 'bg-pink-100 text-pink-600' :
                      'bg-amber-100 text-amber-600'
                  }`}>
                  {milestone.domain === 'motor' ? '🏃' :
                    milestone.domain === 'cognitive' ? '🧠' :
                      milestone.domain === 'language' ? '💬' : '❤️'}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-800 text-sm">{milestone.title}</p>
                  <p className="text-xs text-gray-500">
                    Expected: {milestone.expectedAgeMonths.min}-{milestone.expectedAgeMonths.max} months
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-300" />
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        {timeline.length > 0 && (
          <div className="bg-white rounded-3xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <Clock className="w-5 h-5 text-indigo-500" />
                Recent Activity
              </h3>
              <button
                onClick={() => onNavigate('timeline')}
                className="text-indigo-600 text-sm font-medium"
              >
                View All
              </button>
            </div>

            <div className="space-y-3">
              {timeline.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center gap-3 p-3 border-l-4 border-indigo-200 bg-indigo-50/50 rounded-r-xl"
                >
                  <div className="flex-1">
                    <p className="font-medium text-gray-800 text-sm">{entry.title}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(entry.timestamp).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                  {entry.type === 'analysis' && (
                    <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">
                      Analysis
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Parenting Tips */}
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-3xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="w-5 h-5 text-amber-500" />
            <h3 className="font-bold text-gray-800">Daily Tip</h3>
          </div>
          <p className="text-gray-700">
            At {child.ageMonths} months, {child.name} benefits from reading together daily.
            Point to pictures and name objects to boost language development!
          </p>
          <button
            onClick={() => onNavigate('recommendations')}
            className="mt-4 text-amber-700 font-medium text-sm flex items-center gap-1"
          >
            More Tips <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
      {/* Profile Switcher Modal */}
      {isSwitchingProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsSwitchingProfile(false)}
          />
          <div className="relative bg-white rounded-3xl w-full max-w-sm overflow-hidden animate-scaleIn">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Switch Profile</h3>
              <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                {allChildren.map(c => (
                  <button
                    key={c.id}
                    onClick={() => {
                      onSwitchChild(c.id);
                      setIsSwitchingProfile(false);
                    }}
                    className={`w-full flex items-center gap-4 p-3 rounded-2xl border-2 transition-all ${c.id === child.id
                      ? 'border-emerald-500 bg-emerald-50'
                      : 'border-gray-100 hover:border-emerald-200'
                      }`}
                  >
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${c.id === child.id ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-400'
                      }`}>
                      <Baby className="w-6 h-6" />
                    </div>
                    <div className="text-left flex-1">
                      <p className="font-bold text-gray-800">{c.name}</p>
                      <p className="text-xs text-gray-500">{formatAge(c.ageMonths)} old</p>
                    </div>
                    {c.id === child.id && (
                      <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
                        <Star className="w-3 h-3 text-white fill-current" />
                      </div>
                    )}
                  </button>
                ))}

                <button
                  onClick={() => {
                    onAddChild();
                    setIsSwitchingProfile(false);
                  }}
                  className="w-full flex items-center gap-4 p-3 rounded-2xl border-2 border-dashed border-gray-200 text-gray-500 hover:border-emerald-300 hover:text-emerald-600 transition-all"
                >
                  <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <div className="text-left">
                    <p className="font-bold">Add New Child</p>
                    <p className="text-xs">Create another profile</p>
                  </div>
                </button>
              </div>

              <button
                onClick={() => setIsSwitchingProfile(false)}
                className="w-full mt-6 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomeDashboard;
