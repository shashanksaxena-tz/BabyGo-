import { useState, useEffect, useCallback } from 'react';
import TopBar from '../components/TopBar';
import {
    ShoppingBag, Target, Lightbulb, Clock, ExternalLink,
    RefreshCw, Sparkles, Award, Loader2, AlertTriangle,
    ChevronDown, ChevronUp, BookOpen, Info
} from 'lucide-react';
import { useChild } from '../contexts/ChildContext';
import api, { translateText, updateUserLanguage } from '../api';
import LanguagePicker from '../components/LanguagePicker';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Product {
    name: string;
    emoji: string;
    category: string;
    description: string;
    ageRange: string;
    developmentAreas: string[];
    whyRecommended: string;
    priceRange?: string;
    affiliateUrl?: string;
}

interface Activity {
    name: string;
    emoji: string;
    domain: string;
    description: string;
    duration: string;
    materials: string[];
    skills: string[];
    steps: string[];
}

interface ParentingTip {
    title: string;
    emoji: string;
    category: string;
    content: string;
    description: string;
    actionSteps?: string[];
    source?: string | { title: string; url: string; organization: string; year?: number; type: string };
}

interface Source {
    title: string;
    url?: string;
    type?: string;
    domain?: string;
}

interface MethodologyStep {
    step: number;
    title: string;
    description: string;
    icon: string;
}

type TabType = 'products' | 'activities' | 'tips';

interface TranslatedActivity {
    name: string;
    description: string;
    materials: string[];
    skills: string[];
    steps: string[];
}

interface TranslatedTip {
    title: string;
    content: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const getDomainColor = (domain: string) => {
    switch (domain.toLowerCase()) {
        case 'motor':
            return { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200', gradient: 'from-blue-400 to-blue-500' };
        case 'language':
            return { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-200', gradient: 'from-purple-400 to-purple-500' };
        case 'cognitive':
            return { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200', gradient: 'from-amber-400 to-amber-500' };
        case 'social':
            return { bg: 'bg-rose-50', text: 'text-rose-600', border: 'border-rose-200', gradient: 'from-rose-400 to-rose-500' };
        default:
            return { bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-200', gradient: 'from-gray-400 to-gray-500' };
    }
};

const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
        case 'toys': return 'bg-pink-100 text-pink-600';
        case 'books': return 'bg-blue-100 text-blue-600';
        case 'educational': return 'bg-emerald-100 text-emerald-600';
        case 'safety': return 'bg-amber-100 text-amber-600';
        case 'feeding': return 'bg-orange-100 text-orange-600';
        case 'clothing': return 'bg-purple-100 text-purple-600';
        default: return 'bg-gray-100 text-gray-600';
    }
};

const TABS: { id: TabType; label: string; icon: typeof ShoppingBag }[] = [
    { id: 'products', label: 'Products', icon: ShoppingBag },
    { id: 'activities', label: 'Activities', icon: Target },
    { id: 'tips', label: 'Tips', icon: Lightbulb },
];

const PRODUCT_CATEGORIES = ['all', 'toys', 'books', 'educational', 'safety', 'feeding', 'clothing'];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function Recommendations() {
    const { activeChild } = useChild();
    const child = activeChild;

    const [activeTab, setActiveTab] = useState<TabType>('products');
    const [products, setProducts] = useState<Product[]>([]);
    const [activities, setActivities] = useState<Activity[]>([]);
    const [tips, setTips] = useState<ParentingTip[]>([]);
    const [sources, setSources] = useState<Source[]>([]);
    const [methodology, setMethodology] = useState<MethodologyStep[]>([]);
    const [disclaimer, setDisclaimer] = useState('');

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [expandedActivity, setExpandedActivity] = useState<number | null>(null);
    const [expandedProduct, setExpandedProduct] = useState<number | null>(null);
    const [expandedTip, setExpandedTip] = useState<number | null>(null);
    const [selectedProductCategory, setSelectedProductCategory] = useState('all');
    const [showSources, setShowSources] = useState(false);
    const [selectedLanguage, setSelectedLanguage] = useState('en-IN');
    const [translatedActivities, setTranslatedActivities] = useState<TranslatedActivity[] | null>(null);
    const [translatedTips, setTranslatedTips] = useState<TranslatedTip[] | null>(null);
    const [isTranslating, setIsTranslating] = useState(false);

    // ------------------------------------------------------------------
    // Data fetching
    // ------------------------------------------------------------------

    const fetchRecommendations = useCallback(async () => {
        if (!child?._id) return;
        setLoading(true);
        setError(null);
        try {
            const [productsRes, activitiesRes, tipsRes, sourcesRes] = await Promise.all([
                api.get(`/recommendations/products/${child._id}`),
                api.get(`/recommendations/activities/${child._id}`),
                api.get(`/recommendations/tips/${child._id}`),
                api.get('/recommendations/sources'),
            ]);

            setProducts(productsRes.data?.recommendations || []);
            setActivities(activitiesRes.data?.activities || []);
            setTips(tipsRes.data?.tips || []);
            setSources(sourcesRes.data?.sources || []);
            setMethodology(sourcesRes.data?.methodology || []);
            setDisclaimer(sourcesRes.data?.disclaimer || '');
        } catch (err: any) {
            console.error('Failed to load recommendations:', err);
            setError(err.response?.data?.error || 'Failed to load recommendations. Please try again.');
        } finally {
            setLoading(false);
        }
    }, [child?._id]);

    useEffect(() => {
        fetchRecommendations();
    }, [fetchRecommendations]);

    useEffect(() => {
        if (selectedLanguage === 'en-IN') {
            setTranslatedActivities(null);
            setTranslatedTips(null);
            setIsTranslating(false);
            return;
        }

        if (activities.length === 0 && tips.length === 0) {
            setTranslatedActivities(null);
            setTranslatedTips(null);
            setIsTranslating(false);
            return;
        }

        let cancelled = false;

        const translateContent = async () => {
            setIsTranslating(true);
            setTranslatedActivities(null);
            setTranslatedTips(null);

            const [translatedActs, translatedTipsArr] = await Promise.all([
                Promise.all(
                    activities.map(async (activity) => {
                        const [name, description, materials, skills, steps] = await Promise.all([
                            translateText(activity.name, selectedLanguage),
                            translateText(activity.description, selectedLanguage),
                            activity.materials.length > 0
                                ? translateText(activity.materials.join('\n'), selectedLanguage)
                                : Promise.resolve(undefined),
                            activity.skills.length > 0
                                ? translateText(activity.skills.join('\n'), selectedLanguage)
                                : Promise.resolve(undefined),
                            activity.steps.length > 0
                                ? translateText(activity.steps.join('\n'), selectedLanguage)
                                : Promise.resolve(undefined),
                        ]);

                        return {
                            name: name || activity.name,
                            description: description || activity.description,
                            materials: materials ? materials.split('\n').filter(Boolean) : activity.materials,
                            skills: skills ? skills.split('\n').filter(Boolean) : activity.skills,
                            steps: steps ? steps.split('\n').filter(Boolean) : activity.steps,
                        };
                    })
                ),
                Promise.all(
                    tips.map(async (tip) => {
                        const [title, content] = await Promise.all([
                            translateText(tip.title, selectedLanguage),
                            translateText(tip.content, selectedLanguage),
                        ]);

                        return {
                            title: title || tip.title,
                            content: content || tip.content,
                        };
                    })
                ),
            ]);

            if (!cancelled) {
                setTranslatedActivities(translatedActs);
                setTranslatedTips(translatedTipsArr);
                setIsTranslating(false);
            }
        };

        translateContent().catch((err) => {
            if (!cancelled) {
                console.error('Failed to translate recommendations:', err);
                setIsTranslating(false);
            }
        });

        return () => {
            cancelled = true;
        };
    }, [activities, tips, selectedLanguage]);

    const handleLanguageChange = (language: string) => {
        setSelectedLanguage(language);
        updateUserLanguage(language).catch(() => { });
    };

    // ------------------------------------------------------------------
    // Derived data
    // ------------------------------------------------------------------

    const filteredProducts =
        selectedProductCategory === 'all'
            ? products
            : products.filter(p => p.category.toLowerCase() === selectedProductCategory);

    // ------------------------------------------------------------------
    // Guard: no child selected
    // ------------------------------------------------------------------

    if (!child) {
        return (
            <>
                <TopBar title="Recommendations" subtitle="Personalized suggestions for your child" />
                <div className="flex-1 flex items-center justify-center p-8">
                    <p className="text-gray-500">Please select a child to view recommendations.</p>
                </div>
            </>
        );
    }

    // ------------------------------------------------------------------
    // Render
    // ------------------------------------------------------------------

    return (
        <>
            <TopBar title="Recommendations" subtitle={`Personalized for ${child.name}`} />
            <div className="flex-1 p-8 overflow-y-auto max-w-7xl mx-auto w-full flex flex-col xl:flex-row gap-8">

                {/* ====================== MAIN CONTENT ====================== */}
                <div className="xl:w-3/4 flex flex-col gap-6">

                    {/* Tabs */}
                    <div className="flex items-center justify-end">
                        <LanguagePicker value={selectedLanguage} onChange={handleLanguageChange} />
                    </div>
                    <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-2xl">
                        {TABS.map((tab) => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all duration-200 ${
                                        activeTab === tab.id
                                            ? 'bg-white text-emerald-600 shadow-sm'
                                            : 'text-gray-500 hover:text-gray-700'
                                    }`}
                                >
                                    <Icon className="w-4 h-4" />
                                    <span>{tab.label}</span>
                                </button>
                            );
                        })}
                    </div>

                    {!loading && isTranslating && (
                        <div className="flex items-center gap-2 text-sm text-gray-500 bg-purple-50 px-4 py-2 rounded-xl">
                            <RefreshCw className="w-4 h-4 animate-spin text-purple-500" />
                            Translating content...
                        </div>
                    )}

                    {/* Product Category Filter (only visible on products tab) */}
                    {activeTab === 'products' && !loading && !error && products.length > 0 && (
                        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
                            {PRODUCT_CATEGORIES.map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setSelectedProductCategory(cat)}
                                    className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition duration-200 capitalize ${
                                        selectedProductCategory === cat
                                            ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20 hover:bg-emerald-600'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Loading State */}
                    {loading && (
                        <div className="flex flex-col items-center justify-center py-20">
                            <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl flex items-center justify-center mb-4 animate-bounce shadow-lg shadow-emerald-500/20">
                                <Sparkles className="w-8 h-8 text-white" />
                            </div>
                            <p className="text-gray-700 font-bold text-lg">Finding recommendations...</p>
                            <p className="text-gray-400 text-sm mt-1">
                                Generating personalized suggestions for {child.name}
                            </p>
                        </div>
                    )}

                    {/* Error State */}
                    {error && !loading && (
                        <div className="bg-red-50 border border-red-100 rounded-2xl p-6 text-center">
                            <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-3" />
                            <h3 className="text-lg font-bold text-red-800 mb-1">Something went wrong</h3>
                            <p className="text-red-600 text-sm mb-4">{error}</p>
                            <button
                                onClick={fetchRecommendations}
                                className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition"
                            >
                                <RefreshCw className="w-4 h-4" /> Try Again
                            </button>
                        </div>
                    )}

                    {/* ==================== PRODUCTS TAB ==================== */}
                    {!loading && !error && activeTab === 'products' && (
                        <>
                            {filteredProducts.length > 0 ? (
                                <div className="grid md:grid-cols-2 gap-6">
                                    {filteredProducts.map((product, index) => {
                                        const isExpanded = expandedProduct === index;
                                        return (
                                            <div
                                                key={index}
                                                onClick={() => setExpandedProduct(isExpanded ? null : index)}
                                                className="bg-white rounded-[24px] overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-gray-50 cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all duration-200"
                                            >
                                                <div className="p-5 flex gap-4">
                                                    <div className="w-14 h-14 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                                                        <span className="text-3xl">{product.emoji}</span>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-start justify-between gap-2">
                                                            <div className="min-w-0">
                                                                <h3 className="font-bold text-gray-800 truncate">{product.name}</h3>
                                                                <div className="flex items-center gap-2 mt-1">
                                                                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${getCategoryColor(product.category)}`}>
                                                                        {product.category}
                                                                    </span>
                                                                    <span className="text-xs text-gray-400">{product.ageRange}</span>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-2 flex-shrink-0">
                                                                {product.affiliateUrl && (
                                                                    <a
                                                                        href={product.affiliateUrl}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="p-2 bg-emerald-50 rounded-lg text-emerald-600 hover:bg-emerald-100 transition"
                                                                        onClick={(e) => e.stopPropagation()}
                                                                    >
                                                                        <ExternalLink className="w-4 h-4" />
                                                                    </a>
                                                                )}
                                                                <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-50 text-gray-400 border border-gray-100">
                                                                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <p className={`text-sm text-gray-600 mt-2 leading-relaxed ${isExpanded ? '' : 'line-clamp-2'}`}>
                                                            {product.description}
                                                        </p>

                                                        {/* Expanded content */}
                                                        {isExpanded && (
                                                            <>
                                                                {product.whyRecommended && (
                                                                    <div className="mt-3 bg-emerald-50 rounded-xl p-3 border border-emerald-100">
                                                                        <p className="text-xs font-bold text-emerald-700 mb-1 uppercase tracking-wide">Why Recommended</p>
                                                                        <p className="text-sm text-emerald-600 leading-relaxed">
                                                                            {product.whyRecommended}
                                                                        </p>
                                                                    </div>
                                                                )}
                                                                {product.developmentAreas && product.developmentAreas.length > 0 && (
                                                                    <div className="mt-3">
                                                                        <p className="text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">Development Areas</p>
                                                                        <div className="flex flex-wrap gap-1">
                                                                            {product.developmentAreas.map((area, i) => (
                                                                                <span
                                                                                    key={i}
                                                                                    className="text-xs px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-full font-medium"
                                                                                >
                                                                                    {area}
                                                                                </span>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                )}
                                                                {product.priceRange && (
                                                                    <p className="text-xs text-gray-400 mt-3 font-medium">Price: {product.priceRange}</p>
                                                                )}
                                                            </>
                                                        )}

                                                        {/* Collapsed preview */}
                                                        {!isExpanded && (
                                                            <>
                                                                {product.whyRecommended && (
                                                                    <p className="text-xs text-emerald-600 mt-2 italic line-clamp-1">
                                                                        {product.whyRecommended}
                                                                    </p>
                                                                )}
                                                                {product.priceRange && (
                                                                    <p className="text-xs text-gray-400 mt-2 font-medium">{product.priceRange}</p>
                                                                )}
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <EmptyState
                                    tab="products"
                                    childName={child.name}
                                    onRefresh={fetchRecommendations}
                                />
                            )}
                        </>
                    )}

                    {/* ==================== ACTIVITIES TAB ==================== */}
                    {!loading && !error && activeTab === 'activities' && (
                        <>
                            {activities.length > 0 ? (
                                <div className="space-y-4">
                                    {activities.map((activity, index) => {
                                        const colors = getDomainColor(activity.domain);
                                        const isExpanded = expandedActivity === index;
                                        const translated = translatedActivities ? translatedActivities[index] : null;
                                        const activityName = translated?.name || activity.name;
                                        const activityDescription = translated?.description || activity.description;
                                        const activityMaterials = translated?.materials || activity.materials;
                                        const activitySkills = translated?.skills || activity.skills;
                                        const activitySteps = translated?.steps || activity.steps;

                                        return (
                                            <div
                                                key={index}
                                                className={`bg-white rounded-[24px] overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.03)] border ${colors.border}`}
                                            >
                                                {/* Activity Header */}
                                                <div
                                                    className={`${colors.bg} p-5 cursor-pointer`}
                                                    onClick={() => setExpandedActivity(isExpanded ? null : index)}
                                                >
                                                    <div className="flex gap-4 items-center">
                                                        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                                                            <span className="text-2xl">{activity.emoji}</span>
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <h3 className={`font-bold ${colors.text}`}>{activityName}</h3>
                                                            <div className="flex items-center gap-3 mt-1">
                                                                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${colors.bg} ${colors.text} border ${colors.border}`}>
                                                                    {activity.domain}
                                                                </span>
                                                                <span className="text-xs text-gray-500 flex items-center gap-1">
                                                                    <Clock className="w-3 h-3" /> {activity.duration}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${colors.bg} ${colors.text} border ${colors.border}`}>
                                                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Activity Body */}
                                                <div className="p-5">
                                                    <p className="text-gray-600 text-sm mb-3 leading-relaxed">{activityDescription}</p>

                                                    {/* Materials */}
                                                    {activityMaterials && activityMaterials.length > 0 && (
                                                        <div className="mb-3">
                                                            <p className="text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">Materials</p>
                                                            <div className="flex flex-wrap gap-1.5">
                                                                {activityMaterials.map((m, i) => (
                                                                    <span key={i} className="text-xs px-2.5 py-1 bg-gray-100 text-gray-600 rounded-lg font-medium">
                                                                        {m}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Skills */}
                                                    {activitySkills && activitySkills.length > 0 && (
                                                        <div className="mb-3">
                                                            <p className="text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">Skills Developed</p>
                                                            <div className="flex flex-wrap gap-1.5">
                                                                {activitySkills.map((s, i) => (
                                                                    <span key={i} className={`text-xs px-2.5 py-1 rounded-lg font-medium ${colors.bg} ${colors.text}`}>
                                                                        {s}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Steps (expanded) */}
                                                    {isExpanded && activitySteps && activitySteps.length > 0 && (
                                                        <div className="border-t border-gray-100 pt-4 mt-4">
                                                            <p className="text-xs font-bold text-gray-500 mb-3 uppercase tracking-wide">How to Do It</p>
                                                            <ol className="space-y-3">
                                                                {activitySteps.map((step, i) => (
                                                                    <li key={i} className="flex gap-3 text-sm">
                                                                        <span className={`w-6 h-6 ${colors.bg} ${colors.text} rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0`}>
                                                                            {i + 1}
                                                                        </span>
                                                                        <span className="text-gray-600 pt-0.5">{step}</span>
                                                                    </li>
                                                                ))}
                                                            </ol>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <EmptyState
                                    tab="activities"
                                    childName={child.name}
                                    onRefresh={fetchRecommendations}
                                />
                            )}
                        </>
                    )}

                    {/* ==================== TIPS TAB ==================== */}
                    {!loading && !error && activeTab === 'tips' && (
                        <>
                            {tips.length > 0 ? (
                                <div className="space-y-4">
                                    {tips.map((tip, index) => {
                                        const isExpanded = expandedTip === index;
                                        const translated = translatedTips ? translatedTips[index] : null;
                                        const tipTitle = translated?.title || tip.title;
                                        const tipContent = translated?.content || tip.content;
                                        return (
                                            <div
                                                key={index}
                                                onClick={() => setExpandedTip(isExpanded ? null : index)}
                                                className="bg-white rounded-[24px] shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-gray-50 p-5 cursor-pointer hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
                                            >
                                                <div className="flex gap-4">
                                                    <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
                                                        <span className="text-2xl">{tip.emoji}</span>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-start justify-between gap-2">
                                                            <div className="min-w-0">
                                                                <h3 className="font-bold text-gray-800">{tipTitle}</h3>
                                                                <span className="inline-block text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full font-semibold mt-1">
                                                                    {tip.category}
                                                                </span>
                                                            </div>
                                                            <div className="w-8 h-8 rounded-full flex items-center justify-center bg-amber-50 text-amber-500 border border-amber-100 flex-shrink-0">
                                                                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                                            </div>
                                                        </div>
                                                        <p className={`text-gray-600 text-sm mt-3 leading-relaxed ${isExpanded ? '' : 'line-clamp-2'}`}>
                                                            {tip.description || tipContent}
                                                        </p>
                                                        {isExpanded && tip.actionSteps && tip.actionSteps.length > 0 && (
                                                            <div className="mt-3 bg-amber-50 rounded-xl p-3">
                                                                <p className="text-xs font-semibold text-amber-700 mb-2">Try this:</p>
                                                                <ul className="space-y-1.5">
                                                                    {tip.actionSteps.map((step, i) => (
                                                                        <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                                                                            <span className="text-amber-500 mt-0.5">•</span>
                                                                            <span>{step}</span>
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                            </div>
                                                        )}
                                                        {isExpanded && tip.source && (
                                                            <div className="flex items-center gap-1.5 mt-3 text-xs text-gray-400">
                                                                <Award className="w-3 h-3" />
                                                                <span>
                                                                    Source: {typeof tip.source === 'object' ? (
                                                                        tip.source.url ? (
                                                                            <a
                                                                                href={tip.source.url}
                                                                                target="_blank"
                                                                                rel="noopener noreferrer"
                                                                                className="text-emerald-600 hover:text-emerald-700 hover:underline"
                                                                                onClick={(e) => e.stopPropagation()}
                                                                            >
                                                                                {tip.source.organization}
                                                                            </a>
                                                                        ) : tip.source.organization
                                                                    ) : tip.source}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <EmptyState
                                    tab="tips"
                                    childName={child.name}
                                    onRefresh={fetchRecommendations}
                                />
                            )}
                        </>
                    )}
                </div>

                {/* ====================== SIDEBAR ====================== */}
                <div className="xl:w-1/4 flex flex-col gap-6">

                    {/* Refresh CTA */}
                    <button
                        onClick={fetchRecommendations}
                        disabled={loading}
                        className="bg-gradient-to-br from-emerald-400 to-teal-500 rounded-[24px] p-6 shadow-lg text-white relative overflow-hidden text-center cursor-pointer hover:shadow-emerald-500/20 transition hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                            {loading ? (
                                <Loader2 className="w-6 h-6 text-white animate-spin" />
                            ) : (
                                <RefreshCw className="w-6 h-6 text-white" />
                            )}
                        </div>
                        <h3 className="font-bold font-heading text-lg mb-2">
                            {loading ? 'Loading...' : 'Refresh Recommendations'}
                        </h3>
                        <p className="text-white/90 text-sm font-medium leading-relaxed px-2">
                            Get fresh AI-powered suggestions for {child.name}.
                        </p>
                        <div className="absolute -left-10 -bottom-10 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />
                    </button>

                    {/* Sources & References */}
                    <div className="bg-white rounded-[24px] p-6 shadow-[0_2px_12px_rgba(0,0,0,0.02)] border border-gray-50 flex flex-col gap-5">
                        <button
                            onClick={() => setShowSources(!showSources)}
                            className="flex justify-between items-center w-full"
                        >
                            <h3 className="font-bold font-heading text-lg text-gray-900 flex items-center gap-2">
                                <BookOpen className="w-5 h-5 text-gray-400" />
                                Sources & References
                            </h3>
                            <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center">
                                {showSources ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
                            </div>
                        </button>

                        {showSources && (
                            <>
                                {sources.length > 0 ? (
                                    <div className="space-y-3">
                                        {sources.map((source, i) => (
                                            <div key={i} className="flex items-start gap-2">
                                                <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full mt-2 flex-shrink-0" />
                                                <div className="flex-1 min-w-0">
                                                    {source.url ? (
                                                        <a
                                                            href={source.url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-sm text-emerald-600 hover:text-emerald-700 font-medium hover:underline"
                                                        >
                                                            {source.title}
                                                        </a>
                                                    ) : (
                                                        <p className="text-sm text-gray-700 font-medium">{source.title}</p>
                                                    )}
                                                    {source.type && (
                                                        <span className="text-xs text-gray-400 capitalize">{source.type}</span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-400 italic">No sources available.</p>
                                )}

                                {/* Methodology */}
                                {methodology.length > 0 && (
                                    <div className="border-t border-gray-100 pt-4">
                                        <h4 className="text-sm font-bold text-gray-700 mb-3">Our Methodology</h4>
                                        <div className="space-y-3">
                                            {methodology.map((step) => (
                                                <div key={step.step} className="flex gap-3">
                                                    <span className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 font-bold text-xs flex-shrink-0">
                                                        {step.step}
                                                    </span>
                                                    <div>
                                                        <p className="text-sm font-semibold text-gray-800">{step.title}</p>
                                                        <p className="text-xs text-gray-500 mt-0.5">{step.description}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    {/* Disclaimer */}
                    {disclaimer && (
                        <div className="bg-amber-50 border border-amber-100 rounded-[24px] p-5">
                            <div className="flex items-start gap-3">
                                <Info className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                                <p className="text-xs text-amber-700 leading-relaxed">{disclaimer}</p>
                            </div>
                        </div>
                    )}

                    {/* Quick Stats */}
                    <div className="bg-white rounded-[24px] p-6 shadow-[0_2px_12px_rgba(0,0,0,0.02)] border border-gray-50">
                        <h3 className="font-bold font-heading text-lg text-gray-900 mb-4">Overview</h3>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <ShoppingBag className="w-4 h-4 text-emerald-500" />
                                    <span className="text-sm text-gray-600">Products</span>
                                </div>
                                <span className="text-sm font-bold text-gray-800">{products.length}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Target className="w-4 h-4 text-blue-500" />
                                    <span className="text-sm text-gray-600">Activities</span>
                                </div>
                                <span className="text-sm font-bold text-gray-800">{activities.length}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Lightbulb className="w-4 h-4 text-amber-500" />
                                    <span className="text-sm text-gray-600">Tips</span>
                                </div>
                                <span className="text-sm font-bold text-gray-800">{tips.length}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

// ---------------------------------------------------------------------------
// Empty State Component
// ---------------------------------------------------------------------------

function EmptyState({ tab, childName, onRefresh }: { tab: TabType; childName: string; onRefresh: () => void }) {
    const config = {
        products: { icon: ShoppingBag, title: 'No Products Yet', description: `Generate personalized product recommendations for ${childName}.` },
        activities: { icon: Target, title: 'No Activities Yet', description: `Discover fun, developmental activities for ${childName}.` },
        tips: { icon: Lightbulb, title: 'No Tips Yet', description: `Get personalized parenting tips for ${childName}.` },
    };

    const { icon: Icon, title, description } = config[tab];

    return (
        <div className="text-center py-20 bg-white rounded-3xl border border-gray-50 shadow-sm">
            <div className="w-20 h-20 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Icon className="w-10 h-10 text-emerald-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">{title}</h3>
            <p className="text-gray-500 max-w-md mx-auto mb-6">{description}</p>
            <button
                onClick={onRefresh}
                className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 transition shadow-md shadow-emerald-500/20"
            >
                <Sparkles className="w-5 h-5" /> Load Recommendations
            </button>
        </div>
    );
}
