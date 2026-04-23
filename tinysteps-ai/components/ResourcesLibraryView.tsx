import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Search,
  Play,
  BookOpen,
  Video,
  Gamepad2,
  ChevronRight,
  Clock,
  Star,
  Sparkles,
} from 'lucide-react';
import apiService from '../services/apiService';

interface Resource {
  id: string;
  title: string;
  description: string;
  type: string;
  domain: string;
  imageUrl?: string;
  duration?: string;
  difficulty?: string;
  priority?: string;
  url?: string;
  tags?: string[];
  createdAt?: string;
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
    difficulty: r.difficulty,
    priority: r.priority,
    url: r.sourceUrl || r.url,
    tags: r.tags,
    createdAt: r.createdAt,
  };
}

interface ResourcesLibraryViewProps {
  childId: string;
  onBack: () => void;
  onNavigate: (step: string, data?: any) => void;
}

const DOMAINS = [
  { id: 'motor', label: 'Motor Skills', emoji: '🏃', color: 'bg-blue-50 text-blue-700 border-blue-200', iconBg: 'bg-blue-100' },
  { id: 'cognitive', label: 'Cognitive', emoji: '🧠', color: 'bg-purple-50 text-purple-700 border-purple-200', iconBg: 'bg-purple-100' },
  { id: 'language', label: 'Language', emoji: '💬', color: 'bg-pink-50 text-pink-700 border-pink-200', iconBg: 'bg-pink-100' },
  { id: 'social', label: 'Social', emoji: '❤️', color: 'bg-amber-50 text-amber-700 border-amber-200', iconBg: 'bg-amber-100' },
];

const TYPES = [
  { id: 'activity', label: 'Activities', icon: Play, color: 'bg-emerald-50 text-emerald-700' },
  { id: 'book', label: 'Books', icon: BookOpen, color: 'bg-indigo-50 text-indigo-700' },
  { id: 'video', label: 'Videos', icon: Video, color: 'bg-red-50 text-red-700' },
  { id: 'toy', label: 'Toys', icon: Gamepad2, color: 'bg-orange-50 text-orange-700' },
];

const ResourcesLibraryView: React.FC<ResourcesLibraryViewProps> = ({
  childId,
  onBack,
  onNavigate,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [recentResources, setRecentResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecentResources();
  }, [childId]);

  const fetchRecentResources = async () => {
    setLoading(true);
    try {
      const result = await apiService.getResources(childId);
      if (result.data) {
        // Backend returns { resources: [...], counts: {...} }
        const responseData = result.data as any;
        const rawResources = Array.isArray(responseData.resources)
          ? responseData.resources
          : Array.isArray(responseData) ? responseData : [];
        setRecentResources(rawResources.slice(0, 6).map(mapResource));
      }
    } catch (err) {
      console.error('Failed to fetch resources:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDomainTap = (domainId: string) => {
    onNavigate('IMPROVE_DOMAIN', {
      domain: domainId,
      score: 0,
      status: 'on-track',
    });
  };

  const handleTypeTap = (typeId: string) => {
    onNavigate('IMPROVE_DOMAIN', {
      domain: 'motor',
      score: 0,
      status: 'on-track',
      defaultTab: typeId,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-6 pt-12 pb-8 rounded-b-[2rem]">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={onBack}
            className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center hover:bg-white/30 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold">Resources Library</h1>
            <p className="text-white/80 text-sm">Curated resources for development</p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search activities, books, videos..."
            className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-white text-gray-800 placeholder-gray-400 text-sm focus:ring-2 focus:ring-emerald-300 outline-none"
          />
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-6 space-y-8 pb-24">
        {/* Browse by Domain */}
        <div>
          <h2 className="font-bold text-gray-800 text-lg mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-500" />
            Browse by Domain
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {DOMAINS.map((domain) => (
              <button
                key={domain.id}
                onClick={() => handleDomainTap(domain.id)}
                className={`p-4 rounded-2xl border text-left transition-all hover:scale-[1.02] active:scale-[0.98] ${domain.color}`}
              >
                <div className={`w-10 h-10 rounded-xl ${domain.iconBg} flex items-center justify-center mb-3`}>
                  <span className="text-xl">{domain.emoji}</span>
                </div>
                <p className="font-semibold text-sm">{domain.label}</p>
                <p className="text-xs opacity-70 mt-0.5">Activities & resources</p>
                <ChevronRight className="w-4 h-4 mt-2 opacity-50" />
              </button>
            ))}
          </div>
        </div>

        {/* Browse by Type */}
        <div>
          <h2 className="font-bold text-gray-800 text-lg mb-4">Browse by Type</h2>
          <div className="grid grid-cols-2 gap-3">
            {TYPES.map((type) => {
              const Icon = type.icon;
              return (
                <button
                  key={type.id}
                  onClick={() => handleTypeTap(type.id)}
                  className={`p-4 rounded-2xl text-left transition-all hover:scale-[1.02] active:scale-[0.98] ${type.color}`}
                >
                  <Icon className="w-6 h-6 mb-2" />
                  <p className="font-semibold text-sm">{type.label}</p>
                  <p className="text-xs opacity-70 mt-0.5">Explore all</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Recently Added */}
        <div>
          <h2 className="font-bold text-gray-800 text-lg mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-gray-500" />
            Recently Added
          </h2>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-2xl p-4 animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                  <div className="h-3 bg-gray-100 rounded w-full" />
                </div>
              ))}
            </div>
          ) : recentResources.length === 0 ? (
            <div className="text-center py-8 bg-white rounded-2xl">
              <p className="text-gray-500 text-sm">No resources yet. Browse by domain to get started.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentResources.map((resource) => (
                <div
                  key={resource.id}
                  className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                      {resource.type === 'activity' && <Play className="w-5 h-5 text-emerald-600" />}
                      {resource.type === 'book' && <BookOpen className="w-5 h-5 text-indigo-600" />}
                      {resource.type === 'video' && <Video className="w-5 h-5 text-red-600" />}
                      {resource.type === 'toy' && <Gamepad2 className="w-5 h-5 text-orange-600" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-800 text-sm">{resource.title}</h4>
                      <p className="text-gray-500 text-xs mt-1 line-clamp-2">{resource.description}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full capitalize">
                          {resource.domain}
                        </span>
                        {resource.difficulty && (
                          <span className="flex items-center gap-1 text-xs text-gray-400 capitalize">
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
          )}
        </div>
      </div>
    </div>
  );
};

export default ResourcesLibraryView;
