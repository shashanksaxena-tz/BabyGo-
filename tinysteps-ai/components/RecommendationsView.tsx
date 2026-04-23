import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  ShoppingBag,
  Lightbulb,
  Target,
  Clock,
  ExternalLink,
  RefreshCw,
  Sparkles,
  BookOpen,
  Award,
} from 'lucide-react';
import { ChildProfile } from '../types';
import LanguagePicker from './LanguagePicker';
import apiService from '../services/apiService';

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
  source?: string | { title: string; url: string; organization: string; year?: number; type: string };
}

interface RecommendationsViewProps {
  child: ChildProfile;
  onBack: () => void;
}

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

type TabType = 'products' | 'activities' | 'tips';

const RecommendationsView: React.FC<RecommendationsViewProps> = ({
  child,
  onBack,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('products');
  const [products, setProducts] = useState<Product[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [tips, setTips] = useState<ParentingTip[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedActivity, setExpandedActivity] = useState<number | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState('en-IN');
  const [translatedActivities, setTranslatedActivities] = useState<TranslatedActivity[] | null>(null);
  const [translatedTips, setTranslatedTips] = useState<TranslatedTip[] | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedLanguage === 'en-IN') {
      setTranslatedActivities(null);
      setTranslatedTips(null);
      return;
    }
    if (activities.length === 0 && tips.length === 0) return;
    let cancelled = false;
    const translateContent = async () => {
      setIsTranslating(true);
      setTranslatedActivities(null);
      setTranslatedTips(null);

      const [translatedActs, translatedTipsArr] = await Promise.all([
        Promise.all(
          activities.map(async (activity) => {
            const [nameResult, descResult, materialsResult, skillsResult, stepsResult] = await Promise.all([
              apiService.translateText(activity.name, selectedLanguage),
              apiService.translateText(activity.description, selectedLanguage),
              activity.materials.length > 0
                ? apiService.translateText(activity.materials.join('\n'), selectedLanguage)
                : Promise.resolve({ translatedText: '' }),
              activity.skills.length > 0
                ? apiService.translateText(activity.skills.join('\n'), selectedLanguage)
                : Promise.resolve({ translatedText: '' }),
              activity.steps.length > 0
                ? apiService.translateText(activity.steps.join('\n'), selectedLanguage)
                : Promise.resolve({ translatedText: '' }),
            ]);
            return {
              name: nameResult.translatedText || activity.name,
              description: descResult.translatedText || activity.description,
              materials: materialsResult.translatedText
                ? materialsResult.translatedText.split('\n').filter(Boolean)
                : activity.materials,
              skills: skillsResult.translatedText
                ? skillsResult.translatedText.split('\n').filter(Boolean)
                : activity.skills,
              steps: stepsResult.translatedText
                ? stepsResult.translatedText.split('\n').filter(Boolean)
                : activity.steps,
            };
          })
        ),
        Promise.all(
          tips.map(async (tip) => {
            const [titleResult, contentResult] = await Promise.all([
              apiService.translateText(tip.title, selectedLanguage),
              apiService.translateText(tip.content, selectedLanguage),
            ]);
            return {
              title: titleResult.translatedText || tip.title,
              content: contentResult.translatedText || tip.content,
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
    translateContent();
    return () => { cancelled = true; };
  }, [activities, tips, selectedLanguage]);

  const handleLanguageChange = (lang: string) => {
    setSelectedLanguage(lang);
    apiService.updateUserLanguage(lang).catch(() => {}); // persist, non-blocking
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [productsResult, activitiesResult, tipsResult] = await Promise.all([
        apiService.getProductRecommendations(child.id),
        apiService.getActivities(child.id),
        apiService.getParentingTips(child.id),
      ]);

      const productsData = (productsResult as any).data;
      const activitiesData = (activitiesResult as any).data;
      const tipsData = (tipsResult as any).data;

      if (productsData?.recommendations) setProducts(productsData.recommendations);
      if (activitiesData?.activities) setActivities(activitiesData.activities);
      if (tipsData?.tips) setTips(tipsData.tips);
    } catch (error) {
      console.error('Failed to load recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDomainColor = (domain: string) => {
    switch (domain.toLowerCase()) {
      case 'motor':
        return { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200' };
      case 'language':
        return { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-200' };
      case 'cognitive':
        return { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200' };
      case 'social':
        return { bg: 'bg-rose-50', text: 'text-rose-600', border: 'border-rose-200' };
      default:
        return { bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-200' };
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'toys':
        return 'bg-pink-100 text-pink-600';
      case 'books':
        return 'bg-blue-100 text-blue-600';
      case 'educational':
        return 'bg-emerald-100 text-emerald-600';
      case 'safety':
        return 'bg-amber-100 text-amber-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const tabs = [
    { id: 'products' as TabType, label: 'Products', icon: ShoppingBag, emoji: '🛍️' },
    { id: 'activities' as TabType, label: 'Activities', icon: Target, emoji: '🎯' },
    { id: 'tips' as TabType, label: 'Tips', icon: Lightbulb, emoji: '💡' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
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
            <h1 className="text-2xl font-bold text-gray-900">Recommendations</h1>
            <p className="text-sm text-gray-500">
              Personalized for {child.name}
            </p>
          </div>
          <LanguagePicker value={selectedLanguage} onChange={handleLanguageChange} />
          <button
            onClick={loadData}
            className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center text-white shadow-lg"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 p-1 bg-gray-100 rounded-2xl mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium text-sm transition-all ${activeTab === tab.id
                  ? 'bg-white text-purple-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
                }`}
            >
              <span>{tab.emoji}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-3xl flex items-center justify-center mb-4">
              <Sparkles className="w-10 h-10 text-white animate-pulse" />
            </div>
            <p className="text-gray-600 font-medium">Finding recommendations...</p>
          </div>
        )}

        {/* Translating indicator */}
        {!loading && isTranslating && (
          <div className="flex items-center gap-2 mb-4 text-sm text-gray-500 bg-purple-50 px-4 py-2 rounded-xl">
            <RefreshCw className="w-4 h-4 animate-spin text-purple-500" />
            Translating content...
          </div>
        )}

        {/* Products Tab */}
        {!loading && activeTab === 'products' && (
          <div className="space-y-4">
            <AnimatePresence>
              {products.map((product, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-2xl shadow-sm p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex gap-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                      <span className="text-3xl">{product.emoji}</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-bold text-gray-800">{product.name}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full ${getCategoryColor(
                                product.category
                              )}`}
                            >
                              {product.category}
                            </span>
                            <span className="text-xs text-gray-400">
                              {product.ageRange}
                            </span>
                          </div>
                        </div>
                        {product.affiliateUrl && (
                          <a
                            href={product.affiliateUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 bg-purple-50 rounded-lg text-purple-600 hover:bg-purple-100 transition-colors"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                        {product.description}
                      </p>
                      {product.developmentAreas && product.developmentAreas.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-3">
                          {product.developmentAreas.map((area, i) => (
                            <span
                              key={i}
                              className="text-xs px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-full"
                            >
                              {area}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Activities Tab */}
        {!loading && activeTab === 'activities' && (
          <div className="space-y-4">
            <AnimatePresence>
              {activities.map((activity, index) => {
                const colors = getDomainColor(activity.domain);
                const isExpanded = expandedActivity === index;
                const ta = translatedActivities ? translatedActivities[index] : null;
                const displayName = ta ? ta.name : activity.name;
                const displayDescription = ta ? ta.description : activity.description;
                const displayMaterials = ta ? ta.materials : activity.materials;
                const displaySkills = ta ? ta.skills : activity.skills;
                const displaySteps = ta ? ta.steps : activity.steps;

                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`bg-white rounded-2xl shadow-sm overflow-hidden border ${colors.border}`}
                  >
                    {/* Header */}
                    <div
                      className={`${colors.bg} p-4 cursor-pointer`}
                      onClick={() =>
                        setExpandedActivity(isExpanded ? null : index)
                      }
                    >
                      <div className="flex gap-4">
                        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center flex-shrink-0">
                          <span className="text-2xl">{activity.emoji}</span>
                        </div>
                        <div className="flex-1">
                          <h3 className={`font-bold ${colors.text}`}>
                            {displayName}
                          </h3>
                          <div className="flex items-center gap-3 mt-1">
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full ${colors.bg} ${colors.text} border ${colors.border}`}
                            >
                              {activity.domain}
                            </span>
                            <span className="text-xs text-gray-500 flex items-center gap-1">
                              <Clock className="w-3 h-3" /> {activity.duration}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-4">
                      <p className="text-gray-600 text-sm mb-3">
                        {displayDescription}
                      </p>

                      {/* Materials */}
                      {displayMaterials && displayMaterials.length > 0 && (
                        <div className="mb-3">
                          <p className="text-xs font-semibold text-gray-500 mb-1">
                            Materials:
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {displayMaterials.map((m, i) => (
                              <span
                                key={i}
                                className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-lg"
                              >
                                {m}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Skills */}
                      {displaySkills && displaySkills.length > 0 && (
                        <div className="mb-3">
                          <p className="text-xs font-semibold text-gray-500 mb-1">
                            Skills developed:
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {displaySkills.map((s, i) => (
                              <span
                                key={i}
                                className={`text-xs px-2 py-1 rounded-lg ${colors.bg} ${colors.text}`}
                              >
                                {s}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Steps (expanded) */}
                      <AnimatePresence>
                        {isExpanded && displaySteps && displaySteps.length > 0 && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="border-t border-gray-100 pt-3 mt-3"
                          >
                            <p className="text-xs font-semibold text-gray-500 mb-2">
                              How to do it:
                            </p>
                            <ol className="space-y-2">
                              {displaySteps.map((step, i) => (
                                <li key={i} className="flex gap-2 text-sm">
                                  <span
                                    className={`w-5 h-5 ${colors.bg} ${colors.text} rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0`}
                                  >
                                    {i + 1}
                                  </span>
                                  <span className="text-gray-600">{step}</span>
                                </li>
                              ))}
                            </ol>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}

        {/* Tips Tab */}
        {!loading && activeTab === 'tips' && (
          <div className="space-y-4">
            <AnimatePresence>
              {tips.map((tip, index) => {
                const tt = translatedTips ? translatedTips[index] : null;
                const displayTitle = tt ? tt.title : tip.title;
                const displayContent = tt ? tt.content : tip.content;
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white rounded-2xl shadow-sm p-5"
                  >
                    <div className="flex gap-4">
                      <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <span className="text-2xl">{tip.emoji}</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-gray-800">{displayTitle}</h3>
                        </div>
                        <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                          {tip.category}
                        </span>
                        <p className="text-gray-600 text-sm mt-3 leading-relaxed">
                          {displayContent}
                        </p>
                        {tip.source && (
                          <div className="flex items-center gap-1 mt-3 text-xs text-gray-400">
                            <Award className="w-3 h-3" />
                            <span>Source: {typeof tip.source === 'object' ? tip.source.organization : tip.source}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}

        {/* Empty States */}
        {!loading &&
          ((activeTab === 'products' && products.length === 0) ||
            (activeTab === 'activities' && activities.length === 0) ||
            (activeTab === 'tips' && tips.length === 0)) && (
            <div className="text-center py-20">
              <div className="w-20 h-20 bg-gray-100 rounded-3xl flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl">
                  {activeTab === 'products'
                    ? '🛍️'
                    : activeTab === 'activities'
                      ? '🎯'
                      : '💡'}
                </span>
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">
                No {activeTab} found
              </h3>
              <p className="text-gray-500 mb-4">Try refreshing to load new {activeTab}</p>
              <button
                onClick={loadData}
                className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium rounded-xl hover:shadow-lg transition-all"
              >
                Load Recommendations
              </button>
            </div>
          )}
      </div>
    </div>
  );
};

export default RecommendationsView;
