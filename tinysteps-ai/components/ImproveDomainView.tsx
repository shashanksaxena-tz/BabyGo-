import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Play,
  BookOpen,
  Video,
  Gamepad2,
  Star,
  Clock,
  ChevronRight,
  Sparkles,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import apiService from '../services/apiService';

interface Resource {
  id: string;
  title: string;
  description: string;
  type: 'activity' | 'book' | 'video' | 'toy';
  domain: string;
  imageUrl?: string;
  duration?: string;
  ageRange?: string;
  priority?: string;
  difficulty?: string;
  url?: string;
  tags?: string[];
  whoSources?: Array<{ title: string; url: string; domain: string }>;
}

// Maps a backend resource object to the frontend Resource interface
function mapResource(r: any): Resource {
  return {
    id: r._id || r.id,
    title: r.title,
    description: r.description,
    type: r.type,
    domain: r.domain,
    imageUrl: r.imageUrl,
    duration: r.duration,
    ageRange: r.ageRange,
    priority: r.priority,
    difficulty: r.difficulty,
    url: r.sourceUrl || r.url,
    tags: r.tags,
    whoSources: r.whoSources,
  };
}

interface ImproveDomainViewProps {
  childId: string;
  domain: 'motor' | 'language' | 'cognitive' | 'social';
  score: number;
  status: string;
  onBack: () => void;
  onNavigate: (step: string, data?: any) => void;
}

// Default domain display config - can be overridden by /api/config
const DEFAULT_DOMAIN_CONFIG: Record<string, any> = {
  motor: {
    label: 'Motor Skills',
    emoji: '🏃',
    gradient: 'from-blue-500 to-blue-600',
    lightBg: 'bg-blue-50',
    textColor: 'text-blue-600',
    borderColor: 'border-blue-200',
    badgeBg: 'bg-blue-100',
  },
  language: {
    label: 'Language',
    emoji: '💬',
    gradient: 'from-pink-500 to-pink-600',
    lightBg: 'bg-pink-50',
    textColor: 'text-pink-600',
    borderColor: 'border-pink-200',
    badgeBg: 'bg-pink-100',
  },
  cognitive: {
    label: 'Cognitive',
    emoji: '🧠',
    gradient: 'from-purple-500 to-purple-600',
    lightBg: 'bg-purple-50',
    textColor: 'text-purple-600',
    borderColor: 'border-purple-200',
    badgeBg: 'bg-purple-100',
  },
  social: {
    label: 'Social & Emotional',
    emoji: '❤️',
    gradient: 'from-amber-500 to-amber-600',
    lightBg: 'bg-amber-50',
    textColor: 'text-amber-600',
    borderColor: 'border-amber-200',
    badgeBg: 'bg-amber-100',
  },
};

const TABS = [
  { id: 'activity', label: 'Activities', icon: Play },
  { id: 'book', label: 'Books', icon: BookOpen },
  { id: 'video', label: 'Videos', icon: Video },
  { id: 'toy', label: 'Toys/Apps', icon: Gamepad2 },
] as const;

const ImproveDomainView: React.FC<ImproveDomainViewProps> = ({
  childId,
  domain,
  score,
  status,
  onBack,
  onNavigate,
}) => {
  const [activeTab, setActiveTab] = useState<string>('activity');
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [domainConfigs, setDomainConfigs] = useState<Record<string, any>>(DEFAULT_DOMAIN_CONFIG);

  const config = domainConfigs[domain] || DEFAULT_DOMAIN_CONFIG[domain];

  useEffect(() => {
    // Fetch domain config from backend API
    apiService.getAppConfig().then((result) => {
      const data = (result as any).data;
      if (data?.domains) {
        setDomainConfigs(prev => ({ ...prev, ...data.domains }));
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    fetchResources();
  }, [activeTab, domain]);

  const fetchResources = async () => {
    setLoading(true);
    try {
      const result = await apiService.getResources(childId, {
        domain,
        type: activeTab,
      });
      if (result.data) {
        // Backend returns { resources: [...], counts: {...} }
        const responseData = result.data as any;
        const rawResources = Array.isArray(responseData.resources)
          ? responseData.resources
          : Array.isArray(responseData) ? responseData : [];
        setResources(rawResources.map(mapResource));
      }
    } catch (err) {
      console.error('Failed to fetch resources:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const result = await apiService.regenerateResources(childId);
      if (result.error) {
        console.error('Regenerate error:', result.error);
      }
      // Fetch fresh resources after regeneration
      await fetchResources();
    } catch (err) {
      console.error('Failed to regenerate resources:', err);
    } finally {
      setRefreshing(false);
    }
  };

  const getStatusLabel = (s: string) => {
    switch (s) {
      case 'ahead': return 'Ahead';
      case 'on-track': return 'On Track';
      case 'monitor': return 'Monitor';
      case 'discuss': return 'Discuss';
      default: return s;
    }
  };

  const featuredResource = resources.length > 0 ? resources[0] : null;
  const otherResources = resources.slice(1);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className={`bg-gradient-to-r ${config.gradient} text-white px-6 pt-12 pb-8 rounded-b-[2rem]`}>
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={onBack}
            className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center hover:bg-white/30 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold">Improve {config.label}</h1>
            <p className="text-white/80 text-sm">Resources to boost development</p>
          </div>
          <div className="bg-white/20 rounded-xl px-3 py-2 text-center">
            <span className="text-2xl font-bold">{score}</span>
            <span className="text-xs block text-white/80">{getStatusLabel(status)}</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-white text-gray-800 shadow-lg'
                    : 'bg-white/15 text-white/90 hover:bg-white/25'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-6 space-y-6 pb-24">
        {/* Refresh button */}
        <div className="flex justify-end">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className={`flex items-center gap-2 text-sm font-medium ${config.textColor} hover:opacity-80 transition-opacity`}
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl p-6 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-3" />
                <div className="h-3 bg-gray-100 rounded w-full mb-2" />
                <div className="h-3 bg-gray-100 rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : resources.length === 0 ? (
          <div className="text-center py-16">
            <div className={`w-16 h-16 ${config.lightBg} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
              <span className="text-3xl">{config.emoji}</span>
            </div>
            <p className="font-semibold text-gray-800 mb-2">No resources yet</p>
            <p className="text-sm text-gray-500 mb-4">
              Generate personalized resources for this domain
            </p>
            <button
              onClick={handleRefresh}
              className={`px-6 py-3 bg-gradient-to-r ${config.gradient} text-white rounded-xl font-medium`}
            >
              Generate Resources
            </button>
          </div>
        ) : (
          <>
            {/* Featured Resource */}
            {featuredResource && (
              <div className={`bg-white rounded-2xl shadow-lg overflow-hidden border-2 ${config.borderColor}`}>
                <div className={`${config.lightBg} px-4 py-2 flex items-center gap-2`}>
                  <Sparkles className={`w-4 h-4 ${config.textColor}`} />
                  <span className={`text-sm font-semibold ${config.textColor}`}>Top Priority</span>
                </div>
                <div className="p-5">
                  <h3 className="font-bold text-gray-800 text-lg mb-2">{featuredResource.title}</h3>
                  <p className="text-gray-600 text-sm mb-4">{featuredResource.description}</p>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    {featuredResource.duration && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {featuredResource.duration}
                      </span>
                    )}
                    {featuredResource.difficulty && (
                      <span className="flex items-center gap-1 capitalize">
                        <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                        {featuredResource.difficulty}
                      </span>
                    )}
                    {featuredResource.ageRange && (
                      <span>{featuredResource.ageRange}</span>
                    )}
                  </div>
                  {featuredResource.url && (
                    <a
                      href={featuredResource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`mt-4 inline-flex items-center gap-1.5 text-sm font-medium ${config.textColor}`}
                    >
                      Learn More <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Other Resources */}
            <div className="space-y-3">
              {otherResources.map((resource) => (
                <div
                  key={resource.id}
                  className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-xl ${config.lightBg} flex items-center justify-center shrink-0`}>
                      {activeTab === 'activity' && <Play className={`w-5 h-5 ${config.textColor}`} />}
                      {activeTab === 'book' && <BookOpen className={`w-5 h-5 ${config.textColor}`} />}
                      {activeTab === 'video' && <Video className={`w-5 h-5 ${config.textColor}`} />}
                      {activeTab === 'toy' && <Gamepad2 className={`w-5 h-5 ${config.textColor}`} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-800 text-sm">{resource.title}</h4>
                      <p className="text-gray-500 text-xs mt-1 line-clamp-2">{resource.description}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                        {resource.duration && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {resource.duration}
                          </span>
                        )}
                        {resource.difficulty && (
                          <span className="flex items-center gap-1 capitalize">
                            <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                            {resource.difficulty}
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-300 shrink-0" />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ImproveDomainView;
