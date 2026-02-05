import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Clock,
  Users,
  Flame,
  Leaf,
  AlertTriangle,
  ChefHat,
  RefreshCw,
  Heart,
  X,
  Sparkles,
} from 'lucide-react';
import { ChildProfile } from '../types';
import * as geminiService from '../services/geminiService';

interface Recipe {
  id: string;
  name: string;
  emoji: string;
  category: string;
  description: string;
  prepTime: number;
  servings: string;
  calories: number;
  protein: number;
  fiber: number;
  iron: string;
  ingredients: string[];
  steps: string[];
  tips: string[];
  allergens: string[];
}

interface RecipesViewProps {
  child: ChildProfile;
  onBack: () => void;
}

const CATEGORIES = [
  { id: 'all', name: 'All', emoji: '🍽️' },
  { id: 'breakfast', name: 'Breakfast', emoji: '🥣' },
  { id: 'lunch', name: 'Lunch', emoji: '🥗' },
  { id: 'dinner', name: 'Dinner', emoji: '🍝' },
  { id: 'snacks', name: 'Snacks', emoji: '🍎' },
  { id: 'smoothies', name: 'Smoothies', emoji: '🥤' },
];

const RecipesView: React.FC<RecipesViewProps> = ({ child, onBack }) => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadRecipes();
  }, [selectedCategory]);

  const loadRecipes = async () => {
    setLoading(true);
    try {
      const mealType = selectedCategory === 'all' ? undefined : selectedCategory as any;
      const data = await geminiService.generateRecipes(child, mealType);
      setRecipes(data || []);
    } catch (error) {
      console.error('Failed to load recipes:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = (recipeId: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(recipeId)) {
        next.delete(recipeId);
      } else {
        next.add(recipeId);
      }
      return next;
    });
  };

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'breakfast':
        return 'from-orange-400 to-amber-500';
      case 'lunch':
        return 'from-emerald-400 to-green-500';
      case 'dinner':
        return 'from-purple-400 to-indigo-500';
      case 'snacks':
        return 'from-pink-400 to-rose-500';
      case 'smoothies':
        return 'from-cyan-400 to-blue-500';
      default:
        return 'from-gray-400 to-gray-500';
    }
  };

  const filteredRecipes =
    selectedCategory === 'all'
      ? recipes
      : recipes.filter((r) => r.category.toLowerCase() === selectedCategory);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50">
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
            <h1 className="text-2xl font-bold text-gray-900">Recipes</h1>
            <p className="text-sm text-gray-500">
              Age-appropriate meals for {child.name}
            </p>
          </div>
          <button
            onClick={loadRecipes}
            className="w-10 h-10 bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-orange-200"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto pb-4 mb-6 scrollbar-hide">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all ${selectedCategory === cat.id
                  ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-200'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
            >
              <span>{cat.emoji}</span>
              <span className="font-medium text-sm">{cat.name}</span>
            </button>
          ))}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-20 h-20 bg-gradient-to-r from-orange-500 to-amber-500 rounded-3xl flex items-center justify-center mb-4 animate-bounce">
              <ChefHat className="w-10 h-10 text-white" />
            </div>
            <p className="text-gray-600 font-medium">Cooking up recipes...</p>
            <p className="text-gray-400 text-sm">
              Finding age-appropriate meals for {child.name}
            </p>
          </div>
        )}

        {/* Recipes Grid */}
        {!loading && (
          <div className="grid gap-4 md:grid-cols-2">
            <AnimatePresence>
              {filteredRecipes.map((recipe, index) => (
                <motion.div
                  key={recipe.id || index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow cursor-pointer"
                  onClick={() => setSelectedRecipe(recipe)}
                >
                  {/* Category Header */}
                  <div
                    className={`bg-gradient-to-r ${getCategoryColor(
                      recipe.category
                    )} p-4`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                        <span className="text-3xl">{recipe.emoji}</span>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-white text-lg">
                          {recipe.name}
                        </h3>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-white/80 text-xs px-2 py-0.5 bg-white/20 rounded-full">
                            {recipe.category}
                          </span>
                          <span className="text-white/80 text-xs flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {recipe.prepTime} min
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(recipe.id);
                        }}
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${favorites.has(recipe.id)
                            ? 'bg-white text-red-500'
                            : 'bg-white/20 text-white'
                          }`}
                      >
                        <Heart
                          className={`w-4 h-4 ${favorites.has(recipe.id) ? 'fill-current' : ''
                            }`}
                        />
                      </button>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    {/* Nutrition */}
                    <div className="flex gap-2 mb-3">
                      <div className="flex-1 bg-pink-50 rounded-lg p-2 text-center">
                        <p className="text-pink-600 font-bold">{recipe.calories}</p>
                        <p className="text-pink-400 text-xs">Cal</p>
                      </div>
                      <div className="flex-1 bg-blue-50 rounded-lg p-2 text-center">
                        <p className="text-blue-600 font-bold">{recipe.protein}g</p>
                        <p className="text-blue-400 text-xs">Protein</p>
                      </div>
                      <div className="flex-1 bg-green-50 rounded-lg p-2 text-center">
                        <p className="text-green-600 font-bold">{recipe.fiber}g</p>
                        <p className="text-green-400 text-xs">Fiber</p>
                      </div>
                    </div>

                    <p className="text-gray-600 text-sm line-clamp-2">
                      {recipe.description}
                    </p>

                    {/* Allergens */}
                    {recipe.allergens && recipe.allergens.length > 0 && (
                      <div className="flex items-center gap-1 mt-3">
                        <AlertTriangle className="w-3 h-3 text-amber-500" />
                        <span className="text-xs text-amber-600">
                          {recipe.allergens.join(', ')}
                        </span>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredRecipes.length === 0 && (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-gray-100 rounded-3xl flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">🍽️</span>
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">
              No recipes found
            </h3>
            <p className="text-gray-500 mb-4">
              Try a different category or refresh
            </p>
            <button
              onClick={loadRecipes}
              className="px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-medium rounded-xl hover:shadow-lg transition-all"
            >
              Generate Recipes
            </button>
          </div>
        )}
      </div>

      {/* Recipe Detail Modal */}
      <AnimatePresence>
        {selectedRecipe && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4"
            onClick={() => setSelectedRecipe(null)}
          >
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="bg-white rounded-3xl w-full max-w-lg max-h-[85vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div
                className={`bg-gradient-to-r ${getCategoryColor(
                  selectedRecipe.category
                )} p-6`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                      <span className="text-4xl">{selectedRecipe.emoji}</span>
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">
                        {selectedRecipe.name}
                      </h2>
                      <div className="flex items-center gap-4 mt-2">
                        <span className="text-white/80 text-sm flex items-center gap-1">
                          <Clock className="w-4 h-4" /> {selectedRecipe.prepTime}{' '}
                          min
                        </span>
                        <span className="text-white/80 text-sm flex items-center gap-1">
                          <Users className="w-4 h-4" /> {selectedRecipe.servings}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedRecipe(null)}
                    className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 overflow-y-auto max-h-[60vh]">
                <p className="text-gray-600 mb-6">{selectedRecipe.description}</p>

                {/* Nutrition */}
                <div className="mb-6">
                  <h3 className="font-bold text-gray-800 mb-3">Nutrition</h3>
                  <div className="grid grid-cols-4 gap-2">
                    <div className="bg-pink-50 rounded-xl p-3 text-center">
                      <Flame className="w-5 h-5 text-pink-500 mx-auto mb-1" />
                      <p className="text-pink-600 font-bold">
                        {selectedRecipe.calories}
                      </p>
                      <p className="text-pink-400 text-xs">Calories</p>
                    </div>
                    <div className="bg-blue-50 rounded-xl p-3 text-center">
                      <p className="text-blue-600 font-bold text-lg">
                        {selectedRecipe.protein}g
                      </p>
                      <p className="text-blue-400 text-xs">Protein</p>
                    </div>
                    <div className="bg-green-50 rounded-xl p-3 text-center">
                      <Leaf className="w-5 h-5 text-green-500 mx-auto mb-1" />
                      <p className="text-green-600 font-bold">
                        {selectedRecipe.fiber}g
                      </p>
                      <p className="text-green-400 text-xs">Fiber</p>
                    </div>
                    <div className="bg-amber-50 rounded-xl p-3 text-center">
                      <p className="text-amber-600 font-bold text-lg capitalize">
                        {selectedRecipe.iron}
                      </p>
                      <p className="text-amber-400 text-xs">Iron</p>
                    </div>
                  </div>
                </div>

                {/* Ingredients */}
                <div className="mb-6">
                  <h3 className="font-bold text-gray-800 mb-3">Ingredients</h3>
                  <ul className="space-y-2">
                    {selectedRecipe.ingredients.map((ing, i) => (
                      <li key={i} className="flex items-center gap-2 text-gray-600">
                        <div className="w-2 h-2 bg-orange-400 rounded-full" />
                        {ing}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Instructions */}
                <div className="mb-6">
                  <h3 className="font-bold text-gray-800 mb-3">Instructions</h3>
                  <ol className="space-y-3">
                    {selectedRecipe.steps.map((step, i) => (
                      <li key={i} className="flex gap-3">
                        <span className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 font-bold text-sm flex-shrink-0">
                          {i + 1}
                        </span>
                        <p className="text-gray-600">{step}</p>
                      </li>
                    ))}
                  </ol>
                </div>

                {/* Tips */}
                {selectedRecipe.tips && selectedRecipe.tips.length > 0 && (
                  <div className="bg-amber-50 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="w-5 h-5 text-amber-500" />
                      <h3 className="font-bold text-amber-700">Tips</h3>
                    </div>
                    <ul className="space-y-1">
                      {selectedRecipe.tips.map((tip, i) => (
                        <li key={i} className="text-amber-700 text-sm">
                          • {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RecipesView;
