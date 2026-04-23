import { useState, useEffect, useCallback, useMemo } from 'react';
import TopBar from '../components/TopBar';
import {
    Search, Video, FileText, Activity, ExternalLink, RefreshCw,
    Loader2, AlertTriangle, Sparkles, Star, BookOpen, Gamepad2,
    SlidersHorizontal, X, Library, ChevronDown, ChevronUp
} from 'lucide-react';
import { useChild } from '../contexts/ChildContext';
import api from '../api';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Resource {
    id: string;
    title: string;
    description: string;
    type: string;        // activity | book | video | toy | app
    domain: string;      // motor | language | cognitive | social
    tags?: string[];
    ageRange?: string;
    duration?: string;
    difficulty?: string;  // easy | moderate | challenging
    priority?: string;    // high | medium | low
    imageUrl?: string;
    sourceUrl?: string;
    createdAt?: string;
}

interface ResourceCounts {
    total: number;
    byDomain: Record<string, number>;
    byType: Record<string, number>;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DOMAINS = [
    { id: 'all', label: 'All Domains', color: 'bg-gray-100 text-gray-700 border-gray-200', activeColor: 'bg-emerald-500 text-white' },
    { id: 'motor', label: 'Motor Skills', color: 'bg-blue-50 text-blue-700 border-blue-200', activeColor: 'bg-blue-500 text-white' },
    { id: 'cognitive', label: 'Cognitive', color: 'bg-purple-50 text-purple-700 border-purple-200', activeColor: 'bg-purple-500 text-white' },
    { id: 'language', label: 'Language', color: 'bg-pink-50 text-pink-700 border-pink-200', activeColor: 'bg-pink-500 text-white' },
    { id: 'social', label: 'Social', color: 'bg-amber-50 text-amber-700 border-amber-200', activeColor: 'bg-amber-500 text-white' },
];

const TYPES = [
    { id: 'all', label: 'All Types', icon: SlidersHorizontal },
    { id: 'video', label: 'Videos', icon: Video },
    { id: 'article', label: 'Articles', icon: FileText },
    { id: 'book', label: 'Books', icon: BookOpen },
    { id: 'activity', label: 'Activities', icon: Activity },
    { id: 'toy', label: 'Toys', icon: Gamepad2 },
];

const getDomainStyle = (domain: string) => {
    switch (domain) {
        case 'motor': return { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-100', badge: 'bg-blue-100 text-blue-700' };
        case 'cognitive': return { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-100', badge: 'bg-purple-100 text-purple-700' };
        case 'language': return { bg: 'bg-pink-50', text: 'text-pink-600', border: 'border-pink-100', badge: 'bg-pink-100 text-pink-700' };
        case 'social': return { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-100', badge: 'bg-amber-100 text-amber-700' };
        default: return { bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-100', badge: 'bg-gray-100 text-gray-700' };
    }
};

const getTypeIcon = (type: string) => {
    switch (type) {
        case 'video': return Video;
        case 'book': return BookOpen;
        case 'article': return FileText;
        case 'activity': return Activity;
        case 'toy': return Gamepad2;
        default: return FileText;
    }
};

const getTypeColor = (type: string) => {
    switch (type) {
        case 'video': return 'text-red-500';
        case 'book': return 'text-indigo-500';
        case 'article': return 'text-sky-500';
        case 'activity': return 'text-emerald-500';
        case 'toy': return 'text-orange-500';
        default: return 'text-gray-500';
    }
};

const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
        case 'easy': return 'bg-green-100 text-green-700';
        case 'moderate': return 'bg-yellow-100 text-yellow-700';
        case 'challenging': return 'bg-red-100 text-red-700';
        default: return 'bg-gray-100 text-gray-700';
    }
};

function mapResource(r: any): Resource {
    return {
        id: r._id || r.id,
        title: r.title,
        description: r.description,
        type: r.type,
        domain: r.domain,
        tags: r.tags,
        ageRange: r.ageRange,
        duration: r.duration,
        difficulty: r.difficulty,
        priority: r.priority,
        imageUrl: r.imageUrl,
        sourceUrl: r.sourceUrl || r.url,
        createdAt: r.createdAt,
    };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function Resources() {
    const { activeChild } = useChild();
    const child = activeChild;

    const [resources, setResources] = useState<Resource[]>([]);
    const [counts, setCounts] = useState<ResourceCounts | null>(null);
    const [loading, setLoading] = useState(true);
    const [regenerating, setRegenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedDomain, setSelectedDomain] = useState('all');
    const [selectedType, setSelectedType] = useState('all');
    const [expandedResource, setExpandedResource] = useState<string | null>(null);

    // ------------------------------------------------------------------
    // API calls
    // ------------------------------------------------------------------

    const fetchResources = useCallback(async () => {
        if (!child?._id) return;
        setLoading(true);
        setError(null);
        try {
            const params: Record<string, string> = {};
            if (selectedDomain !== 'all') params.domain = selectedDomain;
            if (selectedType !== 'all') params.type = selectedType;

            const response = await api.get(`/resources/${child._id}`, { params });
            const data = response.data;

            const rawResources = Array.isArray(data.resources)
                ? data.resources
                : Array.isArray(data) ? data : [];

            setResources(rawResources.map(mapResource));
            if (data.counts) setCounts(data.counts);
        } catch (err: any) {
            console.error('Failed to load resources:', err);
            setError(err.response?.data?.error || 'Failed to load resources. Please try again.');
        } finally {
            setLoading(false);
        }
    }, [child?._id, selectedDomain, selectedType]);

    useEffect(() => {
        fetchResources();
    }, [fetchResources]);

    const handleRegenerate = async () => {
        if (!child?._id) return;
        setRegenerating(true);
        setError(null);
        try {
            const response = await api.post(`/resources/${child._id}/regenerate`);
            const data = response.data;
            const rawResources = Array.isArray(data.resources)
                ? data.resources
                : [];
            setResources(rawResources.map(mapResource));
            // Reset filters after regeneration
            setSelectedDomain('all');
            setSelectedType('all');
            setSearchQuery('');
        } catch (err: any) {
            console.error('Failed to regenerate resources:', err);
            setError(err.response?.data?.error || 'Failed to regenerate resources. Please try again.');
        } finally {
            setRegenerating(false);
        }
    };

    // ------------------------------------------------------------------
    // Filtering
    // ------------------------------------------------------------------

    const filteredResources = useMemo(() => {
        if (!searchQuery.trim()) return resources;
        const query = searchQuery.toLowerCase();
        return resources.filter(r =>
            r.title.toLowerCase().includes(query) ||
            r.description.toLowerCase().includes(query) ||
            r.domain.toLowerCase().includes(query) ||
            r.type.toLowerCase().includes(query) ||
            (r.tags && r.tags.some(t => t.toLowerCase().includes(query)))
        );
    }, [resources, searchQuery]);

    // ------------------------------------------------------------------
    // Guard: no child selected
    // ------------------------------------------------------------------

    if (!child) {
        return (
            <>
                <TopBar title="Resources" subtitle="Curated developmental resources" />
                <div className="flex-1 flex items-center justify-center p-8">
                    <p className="text-gray-500">Please select a child to view resources.</p>
                </div>
            </>
        );
    }

    // ------------------------------------------------------------------
    // Render
    // ------------------------------------------------------------------

    return (
        <>
            <TopBar title="Resources" subtitle={`Curated developmental resources for ${child.name}`} />
            <div className="flex-1 p-8 overflow-y-auto max-w-7xl mx-auto w-full flex flex-col xl:flex-row gap-8">

                {/* ====================== MAIN CONTENT ====================== */}
                <div className="xl:w-3/4 flex flex-col gap-6">

                    {/* Search Bar */}
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search resources by title, description, or tags..."
                            className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-white border border-gray-200 text-gray-800 placeholder-gray-400 text-sm focus:ring-2 focus:ring-emerald-300 focus:border-emerald-300 outline-none transition shadow-sm"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>

                    {/* Domain Filter Tabs */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
                        {DOMAINS.map(domain => (
                            <button
                                key={domain.id}
                                onClick={() => setSelectedDomain(domain.id)}
                                className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition duration-200 ${
                                    selectedDomain === domain.id
                                        ? domain.activeColor + ' shadow-md'
                                        : domain.color + ' border hover:opacity-80'
                                }`}
                            >
                                {domain.label}
                                {counts && domain.id !== 'all' && counts.byDomain[domain.id]
                                    ? ` (${counts.byDomain[domain.id]})`
                                    : domain.id === 'all' && counts ? ` (${counts.total})` : ''
                                }
                            </button>
                        ))}
                    </div>

                    {/* Type Filter Tabs */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
                        {TYPES.map(type => {
                            const Icon = type.icon;
                            return (
                                <button
                                    key={type.id}
                                    onClick={() => setSelectedType(type.id)}
                                    className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition duration-200 ${
                                        selectedType === type.id
                                            ? 'bg-emerald-500 text-white shadow-md'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                                >
                                    <Icon className="w-4 h-4" />
                                    {type.label}
                                    {counts && type.id !== 'all' && counts.byType[type.id]
                                        ? ` (${counts.byType[type.id]})`
                                        : ''
                                    }
                                </button>
                            );
                        })}
                    </div>

                    {/* Loading State */}
                    {(loading || regenerating) && (
                        <div className="flex flex-col items-center justify-center py-20">
                            <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl flex items-center justify-center mb-4 animate-bounce shadow-lg shadow-emerald-500/20">
                                <Library className="w-8 h-8 text-white" />
                            </div>
                            <p className="text-gray-700 font-bold text-lg">
                                {regenerating ? 'Generating new resources...' : 'Loading resources...'}
                            </p>
                            <p className="text-gray-400 text-sm mt-1">
                                {regenerating
                                    ? `Creating personalized resources for ${child.name}`
                                    : `Finding curated resources for ${child.name}`
                                }
                            </p>
                        </div>
                    )}

                    {/* Error State */}
                    {error && !loading && !regenerating && (
                        <div className="bg-red-50 border border-red-100 rounded-2xl p-6 text-center">
                            <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-3" />
                            <h3 className="text-lg font-bold text-red-800 mb-1">Something went wrong</h3>
                            <p className="text-red-600 text-sm mb-4">{error}</p>
                            <button
                                onClick={fetchResources}
                                className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition"
                            >
                                <RefreshCw className="w-4 h-4" /> Try Again
                            </button>
                        </div>
                    )}

                    {/* Resource Grid */}
                    {!loading && !regenerating && !error && filteredResources.length > 0 && (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                            {filteredResources.map((resource) => {
                                const domainStyle = getDomainStyle(resource.domain);
                                const TypeIcon = getTypeIcon(resource.type);
                                const typeColor = getTypeColor(resource.type);
                                const isExpanded = expandedResource === resource.id;
                                return (
                                    <div
                                        key={resource.id}
                                        onClick={() => setExpandedResource(isExpanded ? null : resource.id)}
                                        className="bg-white rounded-[24px] overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-gray-50 flex flex-col group cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all duration-200"
                                    >
                                        {/* Card Header */}
                                        <div className={`${domainStyle.bg} p-5 ${domainStyle.border} border-b`}>
                                            <div className="flex items-start gap-3">
                                                <div className={`w-11 h-11 ${domainStyle.bg} rounded-xl flex items-center justify-center shrink-0 border ${domainStyle.border}`}>
                                                    <TypeIcon className={`w-5 h-5 ${typeColor}`} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-bold text-gray-800 text-sm leading-tight line-clamp-2">
                                                        {resource.title}
                                                    </h4>
                                                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold capitalize ${domainStyle.badge}`}>
                                                            {resource.domain}
                                                        </span>
                                                        <span className="text-xs text-gray-500 capitalize">
                                                            {resource.type}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${domainStyle.bg} ${domainStyle.text} border ${domainStyle.border} flex-shrink-0`}>
                                                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Card Body */}
                                        <div className="p-5 flex flex-col flex-1">
                                            <p className={`text-gray-500 text-sm leading-relaxed mb-3 ${isExpanded ? '' : 'line-clamp-3'}`}>
                                                {resource.description}
                                            </p>

                                            {/* Metadata Row */}
                                            <div className="flex items-center gap-2 flex-wrap mt-auto mb-3">
                                                {resource.difficulty && (
                                                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold capitalize ${getDifficultyColor(resource.difficulty)}`}>
                                                        {resource.difficulty}
                                                    </span>
                                                )}
                                                {resource.duration && (
                                                    <span className="text-xs text-gray-500 font-medium">
                                                        {resource.duration}
                                                    </span>
                                                )}
                                                {resource.priority === 'high' && (
                                                    <span className="flex items-center gap-1 text-xs font-semibold text-red-500">
                                                        <Star className="w-3 h-3 fill-red-500" />
                                                        High
                                                    </span>
                                                )}
                                            </div>

                                            {/* Tags - show all when expanded, limited when collapsed */}
                                            {resource.tags && resource.tags.length > 0 && (
                                                <div className="flex flex-wrap gap-1 mb-3">
                                                    {(isExpanded ? resource.tags : resource.tags.slice(0, 3)).map((tag, i) => (
                                                        <span key={i} className="text-[11px] px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full">
                                                            {tag}
                                                        </span>
                                                    ))}
                                                    {!isExpanded && resource.tags.length > 3 && (
                                                        <span className="text-[11px] px-2 py-0.5 bg-gray-100 text-gray-400 rounded-full">
                                                            +{resource.tags.length - 3}
                                                        </span>
                                                    )}
                                                </div>
                                            )}

                                            {/* Expanded details */}
                                            {isExpanded && (
                                                <div className="border-t border-gray-100 pt-3 mt-1 space-y-2">
                                                    {resource.ageRange && (
                                                        <p className="text-xs text-gray-500"><span className="font-semibold text-gray-600">Age Range:</span> {resource.ageRange}</p>
                                                    )}
                                                    {resource.priority && (
                                                        <p className="text-xs text-gray-500"><span className="font-semibold text-gray-600">Priority:</span> <span className="capitalize">{resource.priority}</span></p>
                                                    )}
                                                </div>
                                            )}

                                            {/* External Link */}
                                            {resource.sourceUrl && (
                                                <a
                                                    href={resource.sourceUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className={`inline-flex items-center gap-1.5 text-sm font-semibold transition mt-auto ${
                                                        isExpanded
                                                            ? 'text-white bg-emerald-500 hover:bg-emerald-600 px-4 py-2 rounded-xl mt-3 justify-center'
                                                            : 'text-emerald-600 hover:text-emerald-700'
                                                    }`}
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <ExternalLink className="w-4 h-4" />
                                                    Open Resource
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Empty State */}
                    {!loading && !regenerating && !error && filteredResources.length === 0 && (
                        <div className="text-center py-20 bg-white rounded-3xl border border-gray-50 shadow-sm">
                            <div className="w-20 h-20 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <Library className="w-10 h-10 text-emerald-400" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-800 mb-2">
                                {resources.length === 0 ? 'No Resources Yet' : 'No matching resources'}
                            </h3>
                            <p className="text-gray-500 max-w-md mx-auto mb-6">
                                {resources.length === 0
                                    ? `Generate personalized developmental resources for ${child.name} based on their latest analysis.`
                                    : 'Try adjusting your search or filters to find what you are looking for.'}
                            </p>
                            {resources.length === 0 && (
                                <button
                                    onClick={handleRegenerate}
                                    className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 transition shadow-md shadow-emerald-500/20"
                                >
                                    <Sparkles className="w-5 h-5" /> Generate Resources
                                </button>
                            )}
                            {resources.length > 0 && searchQuery && (
                                <button
                                    onClick={() => { setSearchQuery(''); setSelectedDomain('all'); setSelectedType('all'); }}
                                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition"
                                >
                                    <X className="w-4 h-4" /> Clear Filters
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* ====================== SIDEBAR ====================== */}
                <div className="xl:w-1/4 flex flex-col gap-6">

                    {/* Regenerate CTA */}
                    <button
                        onClick={handleRegenerate}
                        disabled={regenerating || loading}
                        className="bg-gradient-to-br from-emerald-400 to-teal-500 rounded-[24px] p-6 shadow-lg text-white relative overflow-hidden text-center cursor-pointer hover:shadow-emerald-500/20 transition hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed group"
                    >
                        <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                            {regenerating ? (
                                <Loader2 className="w-6 h-6 text-white animate-spin" />
                            ) : (
                                <Sparkles className="w-6 h-6 text-white" />
                            )}
                        </div>
                        <h3 className="font-bold font-heading text-lg mb-2">
                            {regenerating ? 'Generating...' : 'Refresh Resources'}
                        </h3>
                        <p className="text-white/90 text-sm font-medium leading-relaxed px-2">
                            Generate fresh AI-curated resources based on {child.name}'s latest developmental analysis.
                        </p>
                        <div className="absolute -left-10 -bottom-10 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />
                    </button>

                    {/* Domain Summary */}
                    {counts && (
                        <div className="bg-white rounded-[24px] p-6 shadow-[0_2px_12px_rgba(0,0,0,0.02)] border border-gray-50 flex flex-col gap-4">
                            <h3 className="font-bold font-heading text-lg text-gray-900">By Domain</h3>
                            {['motor', 'cognitive', 'language', 'social'].map(domain => {
                                const count = counts.byDomain[domain] || 0;
                                const style = getDomainStyle(domain);
                                return (
                                    <button
                                        key={domain}
                                        onClick={() => setSelectedDomain(selectedDomain === domain ? 'all' : domain)}
                                        className={`flex items-center justify-between p-3 rounded-xl transition ${
                                            selectedDomain === domain ? style.bg + ' ' + style.border + ' border' : 'hover:bg-gray-50'
                                        }`}
                                    >
                                        <span className={`text-sm font-semibold capitalize ${style.text}`}>{domain}</span>
                                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${style.badge}`}>
                                            {count}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {/* Type Summary */}
                    {counts && (
                        <div className="bg-white rounded-[24px] p-6 shadow-[0_2px_12px_rgba(0,0,0,0.02)] border border-gray-50 flex flex-col gap-4">
                            <h3 className="font-bold font-heading text-lg text-gray-900">By Type</h3>
                            {['activity', 'book', 'video', 'toy'].map(type => {
                                const count = counts.byType[type] || 0;
                                const TypeIcon = getTypeIcon(type);
                                const color = getTypeColor(type);
                                return (
                                    <button
                                        key={type}
                                        onClick={() => setSelectedType(selectedType === type ? 'all' : type)}
                                        className={`flex items-center justify-between p-3 rounded-xl transition ${
                                            selectedType === type ? 'bg-emerald-50 border border-emerald-100' : 'hover:bg-gray-50'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2">
                                            <TypeIcon className={`w-4 h-4 ${color}`} />
                                            <span className="text-sm font-semibold text-gray-700 capitalize">{type === 'activity' ? 'Activities' : type + 's'}</span>
                                        </div>
                                        <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-gray-100 text-gray-600">
                                            {count}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {/* Refresh button */}
                    <button
                        onClick={fetchResources}
                        disabled={loading}
                        className="w-full flex justify-center items-center gap-2 bg-white text-emerald-600 border border-emerald-200 font-semibold py-3 rounded-xl hover:bg-emerald-50 transition disabled:opacity-50"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        Reload Resources
                    </button>
                </div>
            </div>
        </>
    );
}
