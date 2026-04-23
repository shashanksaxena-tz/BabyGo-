import { useState, useEffect, useCallback } from 'react';
import TopBar from '../components/TopBar';
import {
    Sparkles, Heart, Clock, Utensils, Loader2, RefreshCw, X,
    ChefHat, Leaf, AlertTriangle, Flame, Check, SlidersHorizontal,
    UtensilsCrossed
} from 'lucide-react';
import { useChild } from '../contexts/ChildContext';
import api, { translateText, updateUserLanguage } from '../api';
import LanguagePicker from '../components/LanguagePicker';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Recipe {
    id: string;
    name: string;
    emoji: string;
    category: string;
    description: string;
    prepTime: string;
    cookTime?: string;
    servings?: string;
    calories?: number;
    protein?: number;
    fiber?: number;
    iron?: string;
    nutritionHighlights?: string[];
    difficulty?: string;
    ingredients: string[];
    steps: string[];
    tips?: string[];
    allergens: string[];
    isFavorited?: boolean;
}

interface TranslatedRecipe {
    name: string;
    description: string;
    ingredients: string[];
    steps: string[];
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CATEGORIES = [
    { id: 'all', name: 'All', emoji: '' },
    { id: 'breakfast', name: 'Breakfast', emoji: '' },
    { id: 'lunch', name: 'Lunch', emoji: '' },
    { id: 'dinner', name: 'Dinner', emoji: '' },
    { id: 'snacks', name: 'Snacks', emoji: '' },
    { id: 'smoothies', name: 'Smoothies', emoji: '' },
];

const COMMON_ALLERGENS = [
    { id: 'dairy', name: 'Dairy', emoji: '' },
    { id: 'eggs', name: 'Eggs', emoji: '' },
    { id: 'nuts', name: 'Tree Nuts', emoji: '' },
    { id: 'peanuts', name: 'Peanuts', emoji: '' },
    { id: 'gluten', name: 'Wheat/Gluten', emoji: '' },
    { id: 'soy', name: 'Soy', emoji: '' },
    { id: 'fish', name: 'Fish', emoji: '' },
    { id: 'shellfish', name: 'Shellfish', emoji: '' },
];

const DIETARY_PREFERENCES = [
    { id: 'vegetarian', name: 'Vegetarian', emoji: '' },
    { id: 'vegan', name: 'Vegan', emoji: '' },
    { id: 'halal', name: 'Halal', emoji: '' },
    { id: 'kosher', name: 'Kosher', emoji: '' },
];

/**
 * Normalizes a recipe from the backend API response to the frontend Recipe interface.
 * The backend returns fields like `instructions`, `mealType`, `cookTime`, `nutritionHighlights`, `difficulty`
 * while the frontend uses `steps`, `category`, etc.
 */
function mapRecipe(raw: any, index: number): Recipe {
    return {
        id: raw._id || raw.id || `recipe-${index}`,
        name: raw.name || 'Untitled Recipe',
        emoji: raw.emoji || '',
        category: raw.category || raw.mealType || 'other',
        description: raw.description || '',
        prepTime: typeof raw.prepTime === 'number' ? `${raw.prepTime} min` : (raw.prepTime || ''),
        cookTime: typeof raw.cookTime === 'number' ? `${raw.cookTime} min` : (raw.cookTime || ''),
        servings: raw.servings || '',
        calories: raw.calories,
        protein: raw.protein,
        fiber: raw.fiber,
        iron: raw.iron,
        nutritionHighlights: raw.nutritionHighlights || [],
        difficulty: raw.difficulty || '',
        ingredients: raw.ingredients || [],
        steps: raw.steps || raw.instructions || [],
        tips: raw.tips || [],
        allergens: raw.allergens || [],
        isFavorited: raw.isFavorited || false,
    };
}

const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
        case 'breakfast': return { bg: 'from-orange-400 to-amber-500', light: 'bg-orange-50 text-orange-600' };
        case 'lunch': return { bg: 'from-emerald-400 to-green-500', light: 'bg-emerald-50 text-emerald-600' };
        case 'dinner': return { bg: 'from-purple-400 to-indigo-500', light: 'bg-purple-50 text-purple-600' };
        case 'snacks': return { bg: 'from-pink-400 to-rose-500', light: 'bg-pink-50 text-pink-600' };
        case 'smoothies': return { bg: 'from-cyan-400 to-blue-500', light: 'bg-cyan-50 text-cyan-600' };
        default: return { bg: 'from-gray-400 to-gray-500', light: 'bg-gray-50 text-gray-600' };
    }
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function Recipes() {
    const { activeChild } = useChild();
    const child = activeChild;

    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);

    // Filter state
    const [excludeAllergens, setExcludeAllergens] = useState<string[]>([]);
    const [dietaryPrefs, setDietaryPrefs] = useState<string[]>([]);
    const [likings, setLikings] = useState('');
    const [generating, setGenerating] = useState(false);
    const [selectedLanguage, setSelectedLanguage] = useState('en-IN');
    const [translatedRecipes, setTranslatedRecipes] = useState<TranslatedRecipe[] | null>(null);
    const [isTranslating, setIsTranslating] = useState(false);

    // Derived
    const activeFilterCount = excludeAllergens.length + dietaryPrefs.length + (likings ? 1 : 0);

    const filteredRecipes =
        selectedCategory === 'all'
            ? recipes
            : recipes.filter(r => {
                const cat = r.category.toLowerCase();
                // Handle both "snack" and "snacks" matching
                if (selectedCategory === 'snacks') return cat === 'snacks' || cat === 'snack';
                return cat === selectedCategory;
            });

    // ------------------------------------------------------------------
    // API calls
    // ------------------------------------------------------------------

    const fetchRecipes = useCallback(async () => {
        if (!child?._id) return;
        setLoading(true);
        setError(null);
        try {
            const response = await api.get(`/recommendations/recipes/${child._id}`);
            const rawRecipes = response.data?.recipes || [];
            setRecipes(rawRecipes.map((r: any, i: number) => mapRecipe(r, i)));
        } catch (err: any) {
            console.error('Failed to load recipes:', err);
            setError(err.response?.data?.error || 'Failed to load recipes. Please try again.');
        } finally {
            setLoading(false);
        }
    }, [child?._id]);

    useEffect(() => {
        fetchRecipes();
    }, [fetchRecipes]);

    useEffect(() => {
        if (recipes.length === 0 || selectedLanguage === 'en-IN') {
            setTranslatedRecipes(null);
            setIsTranslating(false);
            return;
        }

        let cancelled = false;

        const translateRecipes = async () => {
            setIsTranslating(true);
            setTranslatedRecipes(null);

            const translated = await Promise.all(
                recipes.map(async (recipe) => {
                    const [name, description, ingredients, steps] = await Promise.all([
                        translateText(recipe.name, selectedLanguage),
                        translateText(recipe.description, selectedLanguage),
                        translateText(recipe.ingredients.join('\n'), selectedLanguage),
                        translateText(recipe.steps.join('\n'), selectedLanguage),
                    ]);

                    return {
                        name: name || recipe.name,
                        description: description || recipe.description,
                        ingredients: ingredients ? ingredients.split('\n').filter(Boolean) : recipe.ingredients,
                        steps: steps ? steps.split('\n').filter(Boolean) : recipe.steps,
                    };
                })
            );

            if (!cancelled) {
                setTranslatedRecipes(translated);
                setIsTranslating(false);
            }
        };

        translateRecipes().catch((err) => {
            if (!cancelled) {
                console.error('Failed to translate recipes:', err);
                setIsTranslating(false);
            }
        });

        return () => {
            cancelled = true;
        };
    }, [recipes, selectedLanguage]);

    const handleLanguageChange = (language: string) => {
        setSelectedLanguage(language);
        updateUserLanguage(language).catch(() => { });
    };

    const handleRegenerate = async (filters?: {
        excludeAllergens?: string[];
        dietaryPreferences?: string[];
        foodLikings?: string;
    }) => {
        if (!child?._id) return;
        setGenerating(true);
        setError(null);
        try {
            const response = await api.post(`/recommendations/recipes/${child._id}/regenerate`, filters);
            const rawRecipes = response.data?.recipes || [];
            setRecipes(rawRecipes.map((r: any, i: number) => mapRecipe(r, i)));
        } catch (err: any) {
            console.error('Failed to regenerate recipes:', err);
            setError(err.response?.data?.error || 'Failed to generate recipes. Please try again.');
        } finally {
            setGenerating(false);
        }
    };

    // ------------------------------------------------------------------
    // Helpers
    // ------------------------------------------------------------------

    const toggleAllergen = (id: string) => {
        setExcludeAllergens(prev =>
            prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
        );
    };

    const toggleDietaryPref = (id: string) => {
        setDietaryPrefs(prev =>
            prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
        );
    };

    const favorites = new Set(recipes.filter(r => r.isFavorited).map(r => r.id));

    const toggleFavorite = async (recipeId: string) => {
        if (!child?._id) return;
        // Optimistic update
        setRecipes(prev => prev.map(r =>
            r.id === recipeId ? { ...r, isFavorited: !r.isFavorited } : r
        ));
        try {
            await api.post(`/recommendations/recipes/${recipeId}/favorite`, { childId: child._id });
        } catch (err) {
            // Revert on failure
            setRecipes(prev => prev.map(r =>
                r.id === recipeId ? { ...r, isFavorited: !r.isFavorited } : r
            ));
            console.error('Failed to toggle favorite:', err);
        }
    };

    // ------------------------------------------------------------------
    // Guard: no child selected
    // ------------------------------------------------------------------

    if (!child) {
        return (
            <>
                <TopBar title="Recipes" subtitle="Age-appropriate meals for your little one" />
                <div className="flex-1 flex items-center justify-center p-8">
                    <p className="text-gray-500">Please select a child to view recipes.</p>
                </div>
            </>
        );
    }

    // ------------------------------------------------------------------
    // Render
    // ------------------------------------------------------------------

    return (
        <>
            <TopBar title="Recipes" subtitle={`Age-appropriate meals for ${child.name}`} />
            <div className="flex-1 p-8 overflow-y-auto max-w-7xl mx-auto w-full flex flex-col xl:flex-row gap-8">

                {/* ====================== MAIN CONTENT ====================== */}
                <div className="xl:w-3/4 flex flex-col gap-6">

                    {/* Category Tabs */}
                    <div className="flex items-center justify-end">
                        <LanguagePicker value={selectedLanguage} onChange={handleLanguageChange} />
                    </div>
                    <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
                        {CATEGORIES.map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => setSelectedCategory(cat.id)}
                                className={`px-5 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition duration-200 ${
                                    selectedCategory === cat.id
                                        ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20 hover:bg-emerald-600'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                            >
                                {cat.name}
                            </button>
                        ))}
                    </div>

                    {!loading && isTranslating && (
                        <div className="flex items-center gap-2 text-sm text-gray-500 bg-emerald-50 px-4 py-2 rounded-xl">
                            <RefreshCw className="w-4 h-4 animate-spin text-emerald-500" />
                            Translating recipes...
                        </div>
                    )}

                    {/* Active Filter Pills */}
                    {activeFilterCount > 0 && (
                        <div className="flex flex-wrap gap-2">
                            {excludeAllergens.map(id => {
                                const allergen = COMMON_ALLERGENS.find(a => a.id === id);
                                return allergen ? (
                                    <span key={id} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-700 rounded-full text-xs font-semibold border border-red-100">
                                        <AlertTriangle className="w-3 h-3" /> No {allergen.name}
                                        <button onClick={() => toggleAllergen(id)} className="ml-0.5 hover:text-red-900"><X className="w-3 h-3" /></button>
                                    </span>
                                ) : null;
                            })}
                            {dietaryPrefs.map(id => {
                                const pref = DIETARY_PREFERENCES.find(p => p.id === id);
                                return pref ? (
                                    <span key={id} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 rounded-full text-xs font-semibold border border-green-100">
                                        <Leaf className="w-3 h-3" /> {pref.name}
                                        <button onClick={() => toggleDietaryPref(id)} className="ml-0.5 hover:text-green-900"><X className="w-3 h-3" /></button>
                                    </span>
                                ) : null;
                            })}
                            {likings && (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-xs font-semibold border border-blue-100">
                                    <Heart className="w-3 h-3" /> {likings.length > 25 ? likings.slice(0, 25) + '...' : likings}
                                    <button onClick={() => setLikings('')} className="ml-0.5 hover:text-blue-900"><X className="w-3 h-3" /></button>
                                </span>
                            )}
                        </div>
                    )}

                    {/* Loading State */}
                    {(loading || generating) && (
                        <div className="flex flex-col items-center justify-center py-20">
                            <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl flex items-center justify-center mb-4 animate-bounce shadow-lg shadow-emerald-500/20">
                                <ChefHat className="w-8 h-8 text-white" />
                            </div>
                            <p className="text-gray-700 font-bold text-lg">
                                {generating ? 'Generating recipes...' : 'Cooking up recipes...'}
                            </p>
                            <p className="text-gray-400 text-sm mt-1">
                                Finding age-appropriate meals for {child.name}
                            </p>
                        </div>
                    )}

                    {/* Error State */}
                    {error && !loading && !generating && (
                        <div className="bg-red-50 border border-red-100 rounded-2xl p-6 text-center">
                            <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-3" />
                            <h3 className="text-lg font-bold text-red-800 mb-1">Something went wrong</h3>
                            <p className="text-red-600 text-sm mb-4">{error}</p>
                            <button
                                onClick={fetchRecipes}
                                className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition"
                            >
                                <RefreshCw className="w-4 h-4" /> Try Again
                            </button>
                        </div>
                    )}

                    {/* Recipe Grid */}
                    {!loading && !generating && !error && filteredRecipes.length > 0 && (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredRecipes.map((recipe, index) => {
                                const colors = getCategoryColor(recipe.category);
                                const recipeIndex = recipes.indexOf(recipe);
                                const translated = translatedRecipes && recipeIndex >= 0 ? translatedRecipes[recipeIndex] : null;
                                const recipeName = translated?.name || recipe.name;
                                const recipeDescription = translated?.description || recipe.description;
                                return (
                                    <div
                                        key={recipe.id || index}
                                        onClick={() => setSelectedRecipe(recipe)}
                                        className="bg-white rounded-[24px] overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-gray-50 flex flex-col group cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all duration-200"
                                    >
                                        {/* Colored Header */}
                                        <div className={`bg-gradient-to-r ${colors.bg} p-5`}>
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                                                    <span className="text-2xl">{recipe.emoji}</span>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-bold text-white text-base leading-tight truncate">
                                                        {recipeName}
                                                    </h4>
                                                    <div className="flex items-center gap-3 mt-1">
                                                        <span className="text-white/80 text-xs px-2 py-0.5 bg-white/20 rounded-full">
                                                            {recipe.category}
                                                        </span>
                                                        <span className="text-white/80 text-xs flex items-center gap-1">
                                                            <Clock className="w-3 h-3" /> {recipe.prepTime}
                                                        </span>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); toggleFavorite(recipe.id); }}
                                                    className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition ${
                                                        favorites.has(recipe.id)
                                                            ? 'bg-white text-red-500'
                                                            : 'bg-white/20 text-white hover:bg-white/30'
                                                    }`}
                                                >
                                                    <Heart className={`w-4 h-4 ${favorites.has(recipe.id) ? 'fill-current' : ''}`} />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Card Body */}
                                        <div className="p-5 flex flex-col flex-1">
                                            {/* Nutrition Row - show numeric values if available, otherwise show nutritionHighlights */}
                                            {(recipe.calories != null || recipe.protein != null || recipe.fiber != null) ? (
                                                <div className="flex gap-2 mb-3">
                                                    {recipe.calories != null && (
                                                        <div className="flex-1 bg-pink-50 rounded-lg py-2 px-1 text-center">
                                                            <p className="text-pink-600 font-bold text-sm">{recipe.calories}</p>
                                                            <p className="text-pink-400 text-[10px] font-semibold">Cal</p>
                                                        </div>
                                                    )}
                                                    {recipe.protein != null && (
                                                        <div className="flex-1 bg-blue-50 rounded-lg py-2 px-1 text-center">
                                                            <p className="text-blue-600 font-bold text-sm">{recipe.protein}g</p>
                                                            <p className="text-blue-400 text-[10px] font-semibold">Protein</p>
                                                        </div>
                                                    )}
                                                    {recipe.fiber != null && (
                                                        <div className="flex-1 bg-green-50 rounded-lg py-2 px-1 text-center">
                                                            <p className="text-green-600 font-bold text-sm">{recipe.fiber}g</p>
                                                            <p className="text-green-400 text-[10px] font-semibold">Fiber</p>
                                                        </div>
                                                    )}
                                                </div>
                                            ) : recipe.nutritionHighlights && recipe.nutritionHighlights.length > 0 ? (
                                                <div className="flex flex-wrap gap-1.5 mb-3">
                                                    {recipe.nutritionHighlights.slice(0, 3).map((highlight, i) => (
                                                        <span key={i} className="text-[11px] px-2 py-1 bg-emerald-50 text-emerald-600 rounded-lg font-medium">
                                                            {highlight}
                                                        </span>
                                                    ))}
                                                </div>
                                            ) : null}

                                            <p className="text-gray-500 text-sm line-clamp-2 leading-relaxed mb-3">
                                                {recipeDescription}
                                            </p>

                                            {/* Difficulty & Cook Time */}
                                            {(recipe.difficulty || recipe.cookTime) && (
                                                <div className="flex items-center gap-2 mb-2">
                                                    {recipe.difficulty && (
                                                        <span className="text-[11px] px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full font-semibold">
                                                            {recipe.difficulty}
                                                        </span>
                                                    )}
                                                    {recipe.cookTime && (
                                                        <span className="text-[11px] text-gray-500 flex items-center gap-1">
                                                            <Flame className="w-3 h-3" /> Cook: {recipe.cookTime}
                                                        </span>
                                                    )}
                                                </div>
                                            )}

                                            {/* Allergens */}
                                            {recipe.allergens && recipe.allergens.length > 0 && (
                                                <div className="flex items-center gap-1.5 mt-auto">
                                                    <AlertTriangle className="w-3 h-3 text-amber-500 flex-shrink-0" />
                                                    <span className="text-xs text-amber-600 font-medium truncate">
                                                        {recipe.allergens.join(', ')}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Empty State */}
                    {!loading && !generating && !error && filteredRecipes.length === 0 && (
                        <div className="text-center py-20 bg-white rounded-3xl border border-gray-50 shadow-sm">
                            <div className="w-20 h-20 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <UtensilsCrossed className="w-10 h-10 text-emerald-400" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-800 mb-2">
                                {recipes.length === 0 ? 'No Recipes Yet' : 'No recipes in this category'}
                            </h3>
                            <p className="text-gray-500 max-w-md mx-auto mb-6">
                                {recipes.length === 0
                                    ? `Generate personalized, age-appropriate recipes for ${child.name} using AI.`
                                    : 'Try selecting a different category or generate new recipes.'}
                            </p>
                            <button
                                onClick={() => handleRegenerate()}
                                className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 transition shadow-md shadow-emerald-500/20"
                            >
                                <Sparkles className="w-5 h-5" /> Generate Recipes
                            </button>
                        </div>
                    )}
                </div>

                {/* ====================== SIDEBAR ====================== */}
                <div className="xl:w-1/4 flex flex-col gap-6">

                    {/* Generate AI Recipe CTA */}
                    <button
                        onClick={() => handleRegenerate({
                            excludeAllergens: excludeAllergens.length > 0 ? excludeAllergens : undefined,
                            dietaryPreferences: dietaryPrefs.length > 0 ? dietaryPrefs : undefined,
                            foodLikings: likings || undefined,
                        })}
                        disabled={generating || loading}
                        className="bg-gradient-to-br from-emerald-400 to-teal-500 rounded-[24px] p-6 shadow-lg text-white relative overflow-hidden text-center cursor-pointer hover:shadow-emerald-500/20 transition hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed group"
                    >
                        <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                            {generating ? (
                                <Loader2 className="w-6 h-6 text-white animate-spin" />
                            ) : (
                                <Sparkles className="w-6 h-6 text-white" />
                            )}
                        </div>
                        <h3 className="font-bold font-heading text-lg mb-2">
                            {generating ? 'Generating...' : 'Generate AI Recipes'}
                        </h3>
                        <p className="text-white/90 text-sm font-medium leading-relaxed px-2">
                            Get fresh recipes based on {child.name}'s age and your dietary preferences.
                        </p>
                        <div className="absolute -left-10 -bottom-10 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />
                    </button>

                    {/* Filters Panel */}
                    <div className="bg-white rounded-[24px] p-6 shadow-[0_2px_12px_rgba(0,0,0,0.02)] border border-gray-50 flex flex-col gap-5">
                        <div className="flex justify-between items-center">
                            <h3 className="font-bold font-heading text-lg text-gray-900 flex items-center gap-2">
                                <SlidersHorizontal className="w-5 h-5 text-gray-400" />
                                Filters
                            </h3>
                            {activeFilterCount > 0 && (
                                <span className="w-6 h-6 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center text-xs font-bold">
                                    {activeFilterCount}
                                </span>
                            )}
                        </div>

                        {/* Allergens */}
                        <div>
                            <h4 className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-1.5">
                                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                                Exclude Allergens
                            </h4>
                            <div className="flex flex-wrap gap-1.5">
                                {COMMON_ALLERGENS.map(allergen => (
                                    <button
                                        key={allergen.id}
                                        onClick={() => toggleAllergen(allergen.id)}
                                        className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
                                            excludeAllergens.includes(allergen.id)
                                                ? 'bg-red-500 text-white shadow-sm'
                                                : 'bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-600'
                                        }`}
                                    >
                                        {allergen.name}
                                        {excludeAllergens.includes(allergen.id) && <Check className="w-3 h-3" />}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Dietary */}
                        <div>
                            <h4 className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-1.5">
                                <Leaf className="w-3.5 h-3.5 text-green-500" />
                                Dietary Preferences
                            </h4>
                            <div className="flex flex-wrap gap-1.5">
                                {DIETARY_PREFERENCES.map(pref => (
                                    <button
                                        key={pref.id}
                                        onClick={() => toggleDietaryPref(pref.id)}
                                        className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
                                            dietaryPrefs.includes(pref.id)
                                                ? 'bg-green-500 text-white shadow-sm'
                                                : 'bg-gray-100 text-gray-600 hover:bg-green-50 hover:text-green-600'
                                        }`}
                                    >
                                        {pref.name}
                                        {dietaryPrefs.includes(pref.id) && <Check className="w-3 h-3" />}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Food Likings */}
                        <div>
                            <h4 className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-1.5">
                                <Heart className="w-3.5 h-3.5 text-pink-500" />
                                Food Preferences
                            </h4>
                            <textarea
                                value={likings}
                                onChange={(e) => setLikings(e.target.value)}
                                placeholder={`E.g., ${child.name} loves carrots, doesn't like spinach...`}
                                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none transition-all resize-none text-sm text-gray-700 placeholder-gray-400"
                                rows={3}
                            />
                        </div>

                        {/* Apply / Clear buttons */}
                        <div className="flex gap-2">
                            {activeFilterCount > 0 && (
                                <button
                                    onClick={() => { setExcludeAllergens([]); setDietaryPrefs([]); setLikings(''); }}
                                    className="flex-1 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-200 transition"
                                >
                                    Clear
                                </button>
                            )}
                            <button
                                onClick={() => handleRegenerate({
                                    excludeAllergens: excludeAllergens.length > 0 ? excludeAllergens : undefined,
                                    dietaryPreferences: dietaryPrefs.length > 0 ? dietaryPrefs : undefined,
                                    foodLikings: likings || undefined,
                                })}
                                disabled={generating}
                                className="flex-1 py-2.5 bg-emerald-500 text-white rounded-xl text-sm font-bold hover:bg-emerald-600 transition disabled:opacity-50 flex items-center justify-center gap-1.5"
                            >
                                {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                                Apply & Generate
                            </button>
                        </div>
                    </div>

                    {/* Saved Recipes (Favorites) */}
                    <div className="bg-white rounded-[24px] p-6 shadow-[0_2px_12px_rgba(0,0,0,0.02)] border border-gray-50 flex flex-col gap-5">
                        <div className="flex justify-between items-center">
                            <h3 className="font-bold font-heading text-lg text-gray-900">Saved Recipes</h3>
                            <span className="w-6 h-6 bg-red-50 text-red-500 rounded-full flex items-center justify-center text-xs font-bold">
                                {favorites.size}
                            </span>
                        </div>

                        {favorites.size > 0 ? (
                            recipes
                                .filter(r => favorites.has(r.id))
                                .slice(0, 5)
                                .map(recipe => (
                                    <div
                                        key={recipe.id}
                                        onClick={() => setSelectedRecipe(recipe)}
                                        className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 py-1 -mx-2 px-2 rounded-lg transition"
                                    >
                                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl bg-orange-50">
                                            {recipe.emoji}
                                        </div>
                                        <div className="flex flex-col flex-1 min-w-0">
                                            <h4 className="font-bold text-gray-800 text-sm truncate">{recipe.name}</h4>
                                            <p className="text-xs text-emerald-500 font-semibold">{recipe.category}</p>
                                        </div>
                                        <Heart className="w-4 h-4 text-red-500 fill-red-500 flex-shrink-0" />
                                    </div>
                                ))
                        ) : (
                            <p className="text-sm text-gray-400 italic">
                                No favorites yet. Click the heart icon on any recipe card to save it.
                            </p>
                        )}
                    </div>

                    {/* Refresh button */}
                    <button
                        onClick={fetchRecipes}
                        disabled={loading}
                        className="w-full flex justify-center items-center gap-2 bg-white text-emerald-600 border border-emerald-200 font-semibold py-3 rounded-xl hover:bg-emerald-50 transition disabled:opacity-50"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        Refresh Recipes
                    </button>
                </div>
            </div>

            {/* ====================== RECIPE DETAIL MODAL ====================== */}
            {selectedRecipe && (
                <div
                    className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    onClick={() => setSelectedRecipe(null)}
                >
                    <div
                        className="bg-white rounded-[28px] w-full max-w-2xl max-h-[85vh] overflow-hidden shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className={`bg-gradient-to-r ${getCategoryColor(selectedRecipe.category).bg} p-6`}>
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                                        <span className="text-4xl">{selectedRecipe.emoji}</span>
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-white">{selectedRecipe.name}</h2>
                                        <div className="flex items-center gap-4 mt-2 flex-wrap">
                                            {selectedRecipe.prepTime && (
                                                <span className="text-white/80 text-sm flex items-center gap-1">
                                                    <Clock className="w-4 h-4" /> Prep: {selectedRecipe.prepTime}
                                                </span>
                                            )}
                                            {selectedRecipe.cookTime && (
                                                <span className="text-white/80 text-sm flex items-center gap-1">
                                                    <Flame className="w-4 h-4" /> Cook: {selectedRecipe.cookTime}
                                                </span>
                                            )}
                                            {selectedRecipe.servings && (
                                                <span className="text-white/80 text-sm flex items-center gap-1">
                                                    <Utensils className="w-4 h-4" /> {selectedRecipe.servings}
                                                </span>
                                            )}
                                            {selectedRecipe.difficulty && (
                                                <span className="text-white/90 text-xs px-2 py-0.5 bg-white/20 rounded-full">
                                                    {selectedRecipe.difficulty}
                                                </span>
                                            )}
                                            <span className="text-white/80 text-xs px-2 py-0.5 bg-white/20 rounded-full">
                                                {selectedRecipe.category}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setSelectedRecipe(null)}
                                    className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-white hover:bg-white/30 transition flex-shrink-0"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 overflow-y-auto max-h-[calc(85vh-120px)] space-y-6">
                            {(() => {
                                const recipeIndex = recipes.findIndex(r => r.id === selectedRecipe.id);
                                const translated = translatedRecipes && recipeIndex >= 0 ? translatedRecipes[recipeIndex] : null;
                                const displayDescription = translated?.description || selectedRecipe.description;
                                const displayIngredients = translated?.ingredients || selectedRecipe.ingredients;
                                const displaySteps = translated?.steps || selectedRecipe.steps;

                                return (
                                    <>
                                        <p className="text-gray-600 leading-relaxed">{displayDescription}</p>

                                        {/* Nutrition Grid - show numeric values if available */}
                                        {(selectedRecipe.calories != null || selectedRecipe.protein != null || selectedRecipe.fiber != null || selectedRecipe.iron) && (
                                            <div>
                                                <h3 className="font-bold text-gray-800 mb-3">Nutrition</h3>
                                                <div className="grid grid-cols-4 gap-3">
                                                    {selectedRecipe.calories != null && (
                                                        <div className="bg-pink-50 rounded-xl p-3 text-center">
                                                            <Flame className="w-5 h-5 text-pink-500 mx-auto mb-1" />
                                                            <p className="text-pink-600 font-bold">{selectedRecipe.calories}</p>
                                                            <p className="text-pink-400 text-xs">Calories</p>
                                                        </div>
                                                    )}
                                                    {selectedRecipe.protein != null && (
                                                        <div className="bg-blue-50 rounded-xl p-3 text-center">
                                                            <p className="text-blue-600 font-bold text-lg">{selectedRecipe.protein}g</p>
                                                            <p className="text-blue-400 text-xs">Protein</p>
                                                        </div>
                                                    )}
                                                    {selectedRecipe.fiber != null && (
                                                        <div className="bg-green-50 rounded-xl p-3 text-center">
                                                            <Leaf className="w-5 h-5 text-green-500 mx-auto mb-1" />
                                                            <p className="text-green-600 font-bold">{selectedRecipe.fiber}g</p>
                                                            <p className="text-green-400 text-xs">Fiber</p>
                                                        </div>
                                                    )}
                                                    {selectedRecipe.iron && (
                                                        <div className="bg-amber-50 rounded-xl p-3 text-center">
                                                            <p className="text-amber-600 font-bold text-lg capitalize">{selectedRecipe.iron}</p>
                                                            <p className="text-amber-400 text-xs">Iron</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* Nutrition Highlights - show when numeric nutrition is not available */}
                                        {selectedRecipe.nutritionHighlights && selectedRecipe.nutritionHighlights.length > 0 &&
                                         selectedRecipe.calories == null && selectedRecipe.protein == null && selectedRecipe.fiber == null && (
                                            <div>
                                                <h3 className="font-bold text-gray-800 mb-3">Nutrition Highlights</h3>
                                                <div className="flex flex-wrap gap-2">
                                                    {selectedRecipe.nutritionHighlights.map((highlight, i) => (
                                                        <span key={i} className="text-sm px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-xl font-medium border border-emerald-100">
                                                            {highlight}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Allergens */}
                                        {selectedRecipe.allergens && selectedRecipe.allergens.length > 0 && (
                                            <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                                                    <h4 className="font-bold text-amber-800 text-sm">Allergens</h4>
                                                </div>
                                                <p className="text-amber-700 text-sm">{selectedRecipe.allergens.join(', ')}</p>
                                            </div>
                                        )}

                                        {/* Ingredients */}
                                        <div>
                                            <h3 className="font-bold text-gray-800 mb-3">Ingredients</h3>
                                            <ul className="space-y-2">
                                                {displayIngredients.map((ing, i) => (
                                                    <li key={i} className="flex items-start gap-2.5 text-gray-600 text-sm">
                                                        <div className="w-2 h-2 bg-emerald-400 rounded-full mt-1.5 flex-shrink-0" />
                                                        {ing}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>

                                        {/* Instructions */}
                                        <div>
                                            <h3 className="font-bold text-gray-800 mb-3">Instructions</h3>
                                            <ol className="space-y-3">
                                                {displaySteps.map((step, i) => (
                                                    <li key={i} className="flex gap-3">
                                                        <span className="w-7 h-7 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 font-bold text-sm flex-shrink-0">
                                                            {i + 1}
                                                        </span>
                                                        <p className="text-gray-600 text-sm pt-0.5">{step}</p>
                                                    </li>
                                                ))}
                                            </ol>
                                        </div>

                                        {/* Tips */}
                                        {selectedRecipe.tips && selectedRecipe.tips.length > 0 && (
                                            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Sparkles className="w-5 h-5 text-emerald-500" />
                                                    <h3 className="font-bold text-emerald-700">Tips</h3>
                                                </div>
                                                <ul className="space-y-1">
                                                    {selectedRecipe.tips.map((tip, i) => (
                                                        <li key={i} className="text-emerald-700 text-sm flex items-start gap-2">
                                                            <span className="text-emerald-400 mt-0.5">-</span>
                                                            {tip}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </>
                                );
                            })()}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
