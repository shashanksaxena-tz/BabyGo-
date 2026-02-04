import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../models/models.dart';
import '../../services/storage_service.dart';
import '../../services/gemini_service.dart';
import '../../utils/app_theme.dart';
import '../../animations/custom_animations.dart';

class RecipesScreen extends StatefulWidget {
  const RecipesScreen({super.key});

  @override
  State<RecipesScreen> createState() => _RecipesScreenState();
}

class _RecipesScreenState extends State<RecipesScreen>
    with SingleTickerProviderStateMixin {
  ChildProfile? _child;
  List<Recipe> _recipes = [];
  bool _isLoading = true;
  bool _isGenerating = false;
  String _selectedCategory = 'all';

  final List<Map<String, dynamic>> _categories = [
    {'id': 'all', 'name': 'All', 'icon': '🍽️'},
    {'id': 'breakfast', 'name': 'Breakfast', 'icon': '🥣'},
    {'id': 'lunch', 'name': 'Lunch', 'icon': '🥗'},
    {'id': 'dinner', 'name': 'Dinner', 'icon': '🍝'},
    {'id': 'snacks', 'name': 'Snacks', 'icon': '🍎'},
    {'id': 'smoothies', 'name': 'Smoothies', 'icon': '🥤'},
  ];

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    final storage = StorageService();
    final child = await storage.getCurrentChild();

    setState(() {
      _child = child;
      _isLoading = false;
    });

    if (child != null) {
      _generateRecipes();
    }
  }

  Future<void> _generateRecipes() async {
    if (_child == null) return;

    setState(() => _isGenerating = true);

    try {
      final gemini = GeminiService();
      final storage = StorageService();
      final apiKey = storage.getApiKey();

      if (apiKey == null || apiKey.isEmpty) {
        throw Exception('Please set your Gemini API key');
      }

      if (!gemini.isInitialized) {
        await gemini.initialize(apiKey);
      }

      final recipes = await gemini.generateRecipes(
        child: _child!,
        count: 6,
        category: _selectedCategory == 'all' ? null : _selectedCategory,
      );

      if (mounted) {
        setState(() {
          _recipes = recipes;
          _isGenerating = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isGenerating = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to load recipes: ${e.toString()}'),
            backgroundColor: AppTheme.error,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Center(
        child: CircularProgressIndicator(color: AppTheme.primaryGreen),
      );
    }

    return Container(
      decoration: const BoxDecoration(
        gradient: AppTheme.backgroundGradient,
      ),
      child: SafeArea(
        child: Column(
          children: [
            _buildHeader(),
            _buildCategories(),
            Expanded(
              child: _isGenerating
                  ? _buildLoadingState()
                  : _recipes.isEmpty
                      ? _buildEmptyState()
                      : _buildRecipesList(),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return Padding(
      padding: const EdgeInsets.all(20),
      child: Row(
        children: [
          IconButton(
            onPressed: () => Navigator.pop(context),
            icon: const Icon(Icons.arrow_back_rounded),
            style: IconButton.styleFrom(
              backgroundColor: Colors.white,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Recipes',
                  style: TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.w800,
                    color: AppTheme.neutral900,
                  ),
                ),
                Text(
                  'Age-appropriate meals for ${_child?.displayName ?? "your child"}',
                  style: const TextStyle(
                    fontSize: 14,
                    color: AppTheme.neutral500,
                  ),
                ),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: AppTheme.accentOrange.withOpacity(0.1),
              borderRadius: BorderRadius.circular(16),
            ),
            child: const Text('🍳', style: TextStyle(fontSize: 24)),
          ),
        ],
      ),
    );
  }

  Widget _buildCategories() {
    return SizedBox(
      height: 50,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        itemCount: _categories.length,
        itemBuilder: (context, index) {
          final category = _categories[index];
          final isSelected = _selectedCategory == category['id'];

          return Padding(
            padding: const EdgeInsets.only(right: 8),
            child: FilterChip(
              selected: isSelected,
              label: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(category['icon']),
                  const SizedBox(width: 6),
                  Text(category['name']),
                ],
              ),
              onSelected: (selected) {
                setState(() => _selectedCategory = category['id']);
                _generateRecipes();
              },
              selectedColor: AppTheme.primaryGreen.withOpacity(0.2),
              backgroundColor: Colors.white,
              checkmarkColor: AppTheme.primaryGreen,
              labelStyle: TextStyle(
                fontWeight: isSelected ? FontWeight.w600 : FontWeight.w500,
                color: isSelected ? AppTheme.primaryGreen : AppTheme.neutral600,
              ),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(20),
                side: BorderSide(
                  color: isSelected ? AppTheme.primaryGreen : AppTheme.neutral200,
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildLoadingState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Text('🍳', style: TextStyle(fontSize: 64))
              .animate(onPlay: (c) => c.repeat())
              .rotate(duration: 2.seconds),
          const SizedBox(height: 24),
          const Text(
            'Cooking up recipes...',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w600,
              color: AppTheme.neutral700,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Finding age-appropriate meals for ${_child?.displayAge ?? "your child"}',
            style: const TextStyle(
              fontSize: 14,
              color: AppTheme.neutral500,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            width: 100,
            height: 100,
            decoration: BoxDecoration(
              color: AppTheme.accentOrange.withOpacity(0.1),
              borderRadius: BorderRadius.circular(32),
            ),
            child: const Center(
              child: Text('🍽️', style: TextStyle(fontSize: 48)),
            ),
          ),
          const SizedBox(height: 24),
          const Text(
            'No recipes yet',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w600,
              color: AppTheme.neutral700,
            ),
          ),
          const SizedBox(height: 8),
          const Text(
            'Tap to generate personalized recipes',
            style: TextStyle(
              fontSize: 14,
              color: AppTheme.neutral500,
            ),
          ),
          const SizedBox(height: 24),
          ElevatedButton.icon(
            onPressed: _generateRecipes,
            icon: const Icon(Icons.auto_awesome_rounded),
            label: const Text('Generate Recipes'),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.primaryGreen,
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildRecipesList() {
    return RefreshIndicator(
      onRefresh: _generateRecipes,
      color: AppTheme.primaryGreen,
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: _recipes.length,
        itemBuilder: (context, index) {
          return StaggeredListAnimation(
            index: index,
            child: _buildRecipeCard(_recipes[index]),
          );
        },
      ),
    );
  }

  Widget _buildRecipeCard(Recipe recipe) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: AppTheme.softShadow,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header with emoji and category
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [
                  _getCategoryColor(recipe.category).withOpacity(0.1),
                  _getCategoryColor(recipe.category).withOpacity(0.05),
                ],
              ),
              borderRadius: const BorderRadius.vertical(
                top: Radius.circular(20),
              ),
            ),
            child: Row(
              children: [
                Container(
                  width: 60,
                  height: 60,
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Center(
                    child: Text(
                      recipe.emoji,
                      style: const TextStyle(fontSize: 32),
                    ),
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        recipe.name,
                        style: const TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.w700,
                          color: AppTheme.neutral900,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Row(
                        children: [
                          _buildTag(recipe.category, _getCategoryColor(recipe.category)),
                          const SizedBox(width: 8),
                          _buildTag('${recipe.prepTime} min', AppTheme.neutral500),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          // Nutrition info
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Nutrition badges
                Row(
                  children: [
                    _buildNutritionBadge('Calories', '${recipe.calories}', AppTheme.secondaryPink),
                    const SizedBox(width: 8),
                    _buildNutritionBadge('Protein', '${recipe.protein}g', AppTheme.secondaryBlue),
                    const SizedBox(width: 8),
                    _buildNutritionBadge('Fiber', '${recipe.fiber}g', AppTheme.primaryGreen),
                  ],
                ),
                const SizedBox(height: 16),

                // Description
                Text(
                  recipe.description,
                  style: const TextStyle(
                    fontSize: 14,
                    color: AppTheme.neutral600,
                    height: 1.5,
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 16),

                // Action buttons
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: () => _showRecipeDetails(recipe),
                        icon: const Icon(Icons.restaurant_menu_rounded, size: 18),
                        label: const Text('View Recipe'),
                        style: OutlinedButton.styleFrom(
                          foregroundColor: AppTheme.primaryGreen,
                          side: const BorderSide(color: AppTheme.primaryGreen),
                          padding: const EdgeInsets.symmetric(vertical: 12),
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    IconButton(
                      onPressed: () {},
                      icon: const Icon(Icons.favorite_border_rounded),
                      style: IconButton.styleFrom(
                        backgroundColor: AppTheme.secondaryPink.withOpacity(0.1),
                        foregroundColor: AppTheme.secondaryPink,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTag(String text, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Text(
        text,
        style: TextStyle(
          fontSize: 12,
          fontWeight: FontWeight.w600,
          color: color,
        ),
      ),
    );
  }

  Widget _buildNutritionBadge(String label, String value, Color color) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 8),
        decoration: BoxDecoration(
          color: color.withOpacity(0.08),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Column(
          children: [
            Text(
              value,
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w700,
                color: color,
              ),
            ),
            Text(
              label,
              style: TextStyle(
                fontSize: 11,
                color: color.withOpacity(0.8),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Color _getCategoryColor(String category) {
    switch (category.toLowerCase()) {
      case 'breakfast':
        return AppTheme.accentOrange;
      case 'lunch':
        return AppTheme.primaryGreen;
      case 'dinner':
        return AppTheme.secondaryPurple;
      case 'snacks':
        return AppTheme.secondaryPink;
      case 'smoothies':
        return AppTheme.secondaryBlue;
      default:
        return AppTheme.neutral500;
    }
  }

  void _showRecipeDetails(Recipe recipe) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => _RecipeDetailSheet(recipe: recipe),
    );
  }
}

class _RecipeDetailSheet extends StatelessWidget {
  final Recipe recipe;

  const _RecipeDetailSheet({required this.recipe});

  @override
  Widget build(BuildContext context) {
    return DraggableScrollableSheet(
      initialChildSize: 0.85,
      maxChildSize: 0.95,
      minChildSize: 0.5,
      builder: (context, scrollController) {
        return Container(
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
          ),
          child: Column(
            children: [
              // Handle
              Center(
                child: Container(
                  margin: const EdgeInsets.symmetric(vertical: 12),
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: AppTheme.neutral300,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),

              // Content
              Expanded(
                child: ListView(
                  controller: scrollController,
                  padding: const EdgeInsets.all(24),
                  children: [
                    // Header
                    Row(
                      children: [
                        Container(
                          width: 80,
                          height: 80,
                          decoration: BoxDecoration(
                            color: AppTheme.primaryGreen.withOpacity(0.1),
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Center(
                            child: Text(recipe.emoji, style: const TextStyle(fontSize: 48)),
                          ),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                recipe.name,
                                style: const TextStyle(
                                  fontSize: 22,
                                  fontWeight: FontWeight.w800,
                                  color: AppTheme.neutral900,
                                ),
                              ),
                              const SizedBox(height: 8),
                              Row(
                                children: [
                                  Icon(Icons.timer_outlined,
                                      size: 16, color: AppTheme.neutral500),
                                  const SizedBox(width: 4),
                                  Text(
                                    '${recipe.prepTime} min',
                                    style: const TextStyle(
                                      fontSize: 14,
                                      color: AppTheme.neutral500,
                                    ),
                                  ),
                                  const SizedBox(width: 16),
                                  Icon(Icons.restaurant_rounded,
                                      size: 16, color: AppTheme.neutral500),
                                  const SizedBox(width: 4),
                                  Text(
                                    recipe.servings,
                                    style: const TextStyle(
                                      fontSize: 14,
                                      color: AppTheme.neutral500,
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),

                    const SizedBox(height: 24),

                    // Description
                    Text(
                      recipe.description,
                      style: const TextStyle(
                        fontSize: 16,
                        color: AppTheme.neutral600,
                        height: 1.6,
                      ),
                    ),

                    const SizedBox(height: 24),

                    // Nutrition
                    const Text(
                      'Nutrition',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w700,
                        color: AppTheme.neutral800,
                      ),
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        _buildNutritionTile('Calories', '${recipe.calories}', AppTheme.secondaryPink),
                        const SizedBox(width: 8),
                        _buildNutritionTile('Protein', '${recipe.protein}g', AppTheme.secondaryBlue),
                        const SizedBox(width: 8),
                        _buildNutritionTile('Fiber', '${recipe.fiber}g', AppTheme.primaryGreen),
                        const SizedBox(width: 8),
                        _buildNutritionTile('Iron', recipe.iron, AppTheme.accentOrange),
                      ],
                    ),

                    const SizedBox(height: 24),

                    // Ingredients
                    const Text(
                      'Ingredients',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w700,
                        color: AppTheme.neutral800,
                      ),
                    ),
                    const SizedBox(height: 12),
                    ...recipe.ingredients.map((ingredient) => Padding(
                      padding: const EdgeInsets.only(bottom: 8),
                      child: Row(
                        children: [
                          Container(
                            width: 8,
                            height: 8,
                            decoration: BoxDecoration(
                              color: AppTheme.primaryGreen,
                              borderRadius: BorderRadius.circular(4),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Text(
                            ingredient,
                            style: const TextStyle(
                              fontSize: 15,
                              color: AppTheme.neutral700,
                            ),
                          ),
                        ],
                      ),
                    )),

                    const SizedBox(height: 24),

                    // Instructions
                    const Text(
                      'Instructions',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w700,
                        color: AppTheme.neutral800,
                      ),
                    ),
                    const SizedBox(height: 12),
                    ...recipe.steps.asMap().entries.map((entry) => Padding(
                      padding: const EdgeInsets.only(bottom: 16),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Container(
                            width: 28,
                            height: 28,
                            decoration: BoxDecoration(
                              color: AppTheme.primaryGreen.withOpacity(0.1),
                              borderRadius: BorderRadius.circular(14),
                            ),
                            child: Center(
                              child: Text(
                                '${entry.key + 1}',
                                style: const TextStyle(
                                  fontSize: 14,
                                  fontWeight: FontWeight.w600,
                                  color: AppTheme.primaryGreen,
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Text(
                              entry.value,
                              style: const TextStyle(
                                fontSize: 15,
                                color: AppTheme.neutral700,
                                height: 1.5,
                              ),
                            ),
                          ),
                        ],
                      ),
                    )),

                    // Tips
                    if (recipe.tips.isNotEmpty) ...[
                      const SizedBox(height: 16),
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: AppTheme.accentOrange.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(16),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                const Text('💡', style: TextStyle(fontSize: 20)),
                                const SizedBox(width: 8),
                                const Text(
                                  'Tips',
                                  style: TextStyle(
                                    fontSize: 16,
                                    fontWeight: FontWeight.w600,
                                    color: AppTheme.accentOrange,
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 8),
                            ...recipe.tips.map((tip) => Padding(
                              padding: const EdgeInsets.only(bottom: 4),
                              child: Text(
                                '• $tip',
                                style: const TextStyle(
                                  fontSize: 14,
                                  color: AppTheme.neutral600,
                                ),
                              ),
                            )),
                          ],
                        ),
                      ),
                    ],

                    const SizedBox(height: 32),
                  ],
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildNutritionTile(String label, String value, Color color) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12),
        decoration: BoxDecoration(
          color: color.withOpacity(0.1),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Column(
          children: [
            Text(
              value,
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w700,
                color: color,
              ),
            ),
            const SizedBox(height: 2),
            Text(
              label,
              style: TextStyle(
                fontSize: 11,
                color: color.withOpacity(0.8),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Recipe model for generated recipes
class Recipe {
  final String name;
  final String emoji;
  final String category;
  final String description;
  final int prepTime;
  final String servings;
  final int calories;
  final int protein;
  final int fiber;
  final String iron;
  final List<String> ingredients;
  final List<String> steps;
  final List<String> tips;
  final List<String> allergens;

  const Recipe({
    required this.name,
    required this.emoji,
    required this.category,
    required this.description,
    required this.prepTime,
    required this.servings,
    required this.calories,
    required this.protein,
    required this.fiber,
    required this.iron,
    required this.ingredients,
    required this.steps,
    this.tips = const [],
    this.allergens = const [],
  });

  factory Recipe.fromJson(Map<String, dynamic> json) {
    return Recipe(
      name: json['name'] ?? '',
      emoji: json['emoji'] ?? '🍽️',
      category: json['category'] ?? 'meal',
      description: json['description'] ?? '',
      prepTime: json['prepTime'] ?? 15,
      servings: json['servings'] ?? '1 serving',
      calories: json['calories'] ?? 0,
      protein: json['protein'] ?? 0,
      fiber: json['fiber'] ?? 0,
      iron: json['iron'] ?? 'low',
      ingredients: List<String>.from(json['ingredients'] ?? []),
      steps: List<String>.from(json['steps'] ?? []),
      tips: List<String>.from(json['tips'] ?? []),
      allergens: List<String>.from(json['allergens'] ?? []),
    );
  }
}
