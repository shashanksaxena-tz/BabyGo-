import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../models/models.dart';
import '../../services/storage_service.dart';
import '../../services/api_service.dart';
import '../../utils/app_theme.dart';
import '../../widgets/language_picker.dart';
import '../../animations/custom_animations.dart';

class RecipesScreen extends StatefulWidget {
  const RecipesScreen({super.key});

  @override
  State<RecipesScreen> createState() => _RecipesScreenState();
}

class _RecipesScreenState extends State<RecipesScreen> {
  ChildProfile? _child;
  List<Recipe> _recipes = [];
  bool _isLoading = true;
  String _selectedCategory = 'all';
  String _selectedLanguage = 'en-IN';

  static const List<Map<String, String>> _categories = [
    {'id': 'all', 'name': 'All'},
    {'id': 'breakfast', 'name': 'Breakfast'},
    {'id': 'lunch', 'name': 'Lunch'},
    {'id': 'dinner', 'name': 'Dinner'},
    {'id': 'snack', 'name': 'Snack'},
  ];

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() => _isLoading = true);
    try {
      final storage = StorageService();
      final child = await storage.getCurrentChild();

      if (child != null) {
        try {
          final apiService = ApiService();
          final result = await apiService.getRecipes(child.id, count: 10);
          if (result['success'] == true && result['data'] != null) {
            final data = result['data'];
            List<dynamic> recipesList;
            if (data is Map && data.containsKey('recipes')) {
              recipesList = data['recipes'] as List;
            } else if (data is List) {
              recipesList = data;
            } else {
              recipesList = [];
            }
            setState(() {
              _child = child;
              _recipes = recipesList.map((r) => Recipe.fromJson(r)).toList();
              _isLoading = false;
            });
            return;
          }
        } catch (_) {}

        setState(() {
          _child = child;
          _recipes = [];
          _isLoading = false;
        });
      } else {
        setState(() => _isLoading = false);
      }
    } catch (_) {
      setState(() => _isLoading = false);
    }
  }

  List<Recipe> get _filteredRecipes {
    if (_selectedCategory == 'all') return _recipes;
    return _recipes.where((r) {
      final name = r.name.toLowerCase();
      final desc = r.description.toLowerCase();
      switch (_selectedCategory) {
        case 'breakfast':
          return name.contains('breakfast') ||
              name.contains('pancake') ||
              name.contains('oat') ||
              desc.contains('breakfast');
        case 'lunch':
          return name.contains('lunch') ||
              name.contains('wrap') ||
              name.contains('bowl') ||
              desc.contains('lunch');
        case 'dinner':
          return name.contains('dinner') ||
              name.contains('chicken') ||
              desc.contains('dinner');
        case 'snack':
          return name.contains('snack') ||
              name.contains('star') ||
              name.contains('bites') ||
              desc.contains('snack');
        default:
          return true;
      }
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.backgroundV3,
      body: SafeArea(
        child: Column(
          children: [
            // Green gradient header
            _buildHeader(),

            // Category filter tabs
            _buildCategoryTabs(),

            // Content
            Expanded(
              child: _isLoading
                  ? const Center(
                      child: CircularProgressIndicator(
                          color: AppTheme.primaryGreen),
                    )
                  : _filteredRecipes.isEmpty
                      ? _buildEmptyState()
                      : _buildRecipeList(),
            ),
          ],
        ),
      ),
    );
  }

  // ---- GREEN HEADER ----
  Widget _buildHeader() {
    final ageLabel = _child != null
        ? '${(_child!.ageInMonths / 12).floor()}-${((_child!.ageInMonths / 12).floor() + 1)} years'
        : '2-3 years';

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.fromLTRB(20, 12, 20, 20),
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          colors: [Color(0xFF10B981), Color(0xFF059669)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.only(
          bottomLeft: Radius.circular(24),
          bottomRight: Radius.circular(24),
        ),
      ),
      child: Row(
        children: [
          GestureDetector(
            onTap: () => Navigator.of(context).pop(),
            child: const Icon(Icons.arrow_back_rounded,
                color: Colors.white, size: 24),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Row(
              children: [
                const Text(
                  '\u{1F468}\u{200D}\u{1F373}',
                  style: TextStyle(fontSize: 20),
                ),
                const SizedBox(width: 8),
                Text(
                  'Recipes for $ageLabel',
                  style: const TextStyle(
                    fontFamily: 'Nunito',
                    fontSize: 18,
                    fontWeight: FontWeight.w700,
                    color: Colors.white,
                  ),
                ),
              ],
            ),
          ),
          LanguagePicker(
            selectedLanguage: _selectedLanguage,
            onLanguageChanged: (code) =>
                setState(() => _selectedLanguage = code),
            iconColor: Colors.white,
          ),
          const SizedBox(width: 8),
          // Leo avatar placeholder
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.2),
              shape: BoxShape.circle,
              border: Border.all(color: Colors.white.withOpacity(0.4), width: 2),
            ),
            child: const Center(
              child: Text('\u{1F476}', style: TextStyle(fontSize: 22)),
            ),
          ),
        ],
      ),
    );
  }

  // ---- CATEGORY TABS ----
  Widget _buildCategoryTabs() {
    return SizedBox(
      height: 56,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        itemCount: _categories.length,
        separatorBuilder: (_, __) => const SizedBox(width: 8),
        itemBuilder: (context, index) {
          final cat = _categories[index];
          final isSelected = _selectedCategory == cat['id'];
          return GestureDetector(
            onTap: () => setState(() => _selectedCategory = cat['id']!),
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 8),
              decoration: BoxDecoration(
                color: isSelected ? AppTheme.primaryGreen : Colors.white,
                borderRadius: BorderRadius.circular(24),
                border: Border.all(
                  color: isSelected
                      ? AppTheme.primaryGreen
                      : AppTheme.borderLight,
                ),
              ),
              child: Center(
                child: Text(
                  cat['name']!,
                  style: TextStyle(
                    fontFamily: 'Inter',
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: isSelected ? Colors.white : AppTheme.textSecondary,
                  ),
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  // ---- RECIPE LIST ----
  Widget _buildRecipeList() {
    final recipes = _filteredRecipes;
    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SizedBox(height: 8),

          // Featured recipe (first one)
          if (recipes.isNotEmpty) _buildFeaturedRecipeCard(recipes.first),

          const SizedBox(height: 16),

          // Remaining recipes in compact list
          ...recipes.skip(1).toList().asMap().entries.map((entry) {
            return StaggeredListAnimation(
              index: entry.key,
              child: _buildCompactRecipeItem(entry.value),
            );
          }),

          const SizedBox(height: 32),
        ],
      ),
    );
  }

  // ---- FEATURED RECIPE CARD ----
  Widget _buildFeaturedRecipeCard(Recipe recipe) {
    return GestureDetector(
      onTap: () => _showRecipeDetail(recipe),
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          boxShadow: AppTheme.cardShadowV3,
        ),
        clipBehavior: Clip.antiAlias,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Image
            Container(
              height: 180,
              width: double.infinity,
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [
                    Colors.green.shade200,
                    Colors.teal.shade300,
                    Colors.green.shade400,
                  ],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
              ),
              child: recipe.imageUrl != null
                  ? Image.network(recipe.imageUrl!, fit: BoxFit.cover,
                      errorBuilder: (_, __, ___) => _recipePlaceholder())
                  : _recipePlaceholder(),
            ),

            // Details
            Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    recipe.name,
                    style: const TextStyle(
                      fontFamily: 'Nunito',
                      fontSize: 18,
                      fontWeight: FontWeight.w700,
                      color: AppTheme.textPrimary,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      Icon(Icons.access_time_rounded,
                          size: 14, color: AppTheme.textSecondary),
                      const SizedBox(width: 4),
                      Text(
                        recipe.prepTime,
                        style: const TextStyle(
                          fontFamily: 'Inter',
                          fontSize: 13,
                          color: AppTheme.textSecondary,
                        ),
                      ),
                      const SizedBox(width: 12),
                      _buildBadge(recipe.difficulty, AppTheme.primaryGreen),
                      const SizedBox(width: 8),
                      _buildBadge(
                        '${recipe.minAgeMonths ~/ 12}-${recipe.maxAgeMonths ~/ 12} years',
                        AppTheme.textSecondary,
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    ).animate().fadeIn(duration: 400.ms).slideY(begin: 0.05, end: 0);
  }

  // ---- COMPACT RECIPE ITEM ----
  Widget _buildCompactRecipeItem(Recipe recipe) {
    // Infer category badge text
    String categoryLabel = '';
    final nameLower = recipe.name.toLowerCase();
    if (nameLower.contains('pancake') || nameLower.contains('oat')) {
      categoryLabel = 'Breakfast';
    } else if (nameLower.contains('wrap') || nameLower.contains('bowl')) {
      categoryLabel = 'Lunch';
    } else if (nameLower.contains('chicken') || nameLower.contains('pasta')) {
      categoryLabel = 'Dinner';
    } else if (nameLower.contains('star') || nameLower.contains('bites')) {
      categoryLabel = 'Snack';
    }

    // Category color
    Color categoryColor;
    switch (categoryLabel) {
      case 'Breakfast':
        categoryColor = AppTheme.secondaryOrange;
        break;
      case 'Lunch':
        categoryColor = AppTheme.primaryGreen;
        break;
      case 'Dinner':
        categoryColor = AppTheme.secondaryPurple;
        break;
      case 'Snack':
        categoryColor = AppTheme.secondaryPink;
        break;
      default:
        categoryColor = AppTheme.textTertiary;
        categoryLabel = recipe.difficulty;
    }

    return GestureDetector(
      onTap: () => _showRecipeDetail(recipe),
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          boxShadow: AppTheme.cardShadowV3,
        ),
        child: Row(
          children: [
            // Circular thumbnail
            Container(
              width: 48,
              height: 48,
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [
                    categoryColor.withOpacity(0.2),
                    categoryColor.withOpacity(0.1),
                  ],
                ),
                shape: BoxShape.circle,
              ),
              child: Center(
                child: Text(
                  _recipeEmoji(recipe.name),
                  style: const TextStyle(fontSize: 20),
                ),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    recipe.name,
                    style: const TextStyle(
                      fontFamily: 'Inter',
                      fontSize: 15,
                      fontWeight: FontWeight.w500,
                      color: AppTheme.textPrimary,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      Icon(Icons.access_time_rounded,
                          size: 12, color: AppTheme.textTertiary),
                      const SizedBox(width: 3),
                      Text(
                        recipe.prepTime,
                        style: const TextStyle(
                          fontFamily: 'Inter',
                          fontSize: 12,
                          color: AppTheme.textSecondary,
                        ),
                      ),
                      const SizedBox(width: 8),
                      _buildBadge(categoryLabel, categoryColor, small: true),
                    ],
                  ),
                ],
              ),
            ),
            const Icon(Icons.chevron_right_rounded,
                size: 20, color: AppTheme.textTertiary),
          ],
        ),
      ),
    );
  }

  // ---- RECIPE DETAIL BOTTOM SHEET ----
  void _showRecipeDetail(Recipe recipe) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => _RecipeDetailSheet(recipe: recipe),
    );
  }

  // ---- HELPERS ----
  Widget _buildBadge(String text, Color color, {bool small = false}) {
    return Container(
      padding: EdgeInsets.symmetric(
        horizontal: small ? 8 : 10,
        vertical: small ? 2 : 3,
      ),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Text(
        text,
        style: TextStyle(
          fontFamily: 'Inter',
          fontSize: small ? 11 : 12,
          fontWeight: FontWeight.w600,
          color: color,
        ),
      ),
    );
  }

  Widget _recipePlaceholder() {
    return Center(
      child: Text('\u{1F957}', style: TextStyle(fontSize: 56)),
    );
  }

  String _recipeEmoji(String name) {
    final lower = name.toLowerCase();
    if (lower.contains('pancake')) return '\u{1F95E}';
    if (lower.contains('chicken')) return '\u{1F357}';
    if (lower.contains('potato')) return '\u{1F954}';
    if (lower.contains('bowl')) return '\u{1F957}';
    if (lower.contains('wrap')) return '\u{1F32F}';
    if (lower.contains('banana')) return '\u{1F34C}';
    if (lower.contains('star')) return '\u{2B50}';
    if (lower.contains('smoothie')) return '\u{1F964}';
    return '\u{1F372}';
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            width: 80,
            height: 80,
            decoration: BoxDecoration(
              color: AppTheme.primaryGreen.withOpacity(0.1),
              borderRadius: BorderRadius.circular(24),
            ),
            child: const Center(
              child: Text('\u{1F372}', style: TextStyle(fontSize: 40)),
            ),
          ),
          const SizedBox(height: 20),
          const Text(
            'No recipes found',
            style: TextStyle(
              fontFamily: 'Nunito',
              fontSize: 18,
              fontWeight: FontWeight.w600,
              color: AppTheme.textPrimary,
            ),
          ),
          const SizedBox(height: 8),
          const Text(
            'Try a different category\nor check back later',
            textAlign: TextAlign.center,
            style: TextStyle(
              fontFamily: 'Inter',
              fontSize: 14,
              color: AppTheme.textSecondary,
            ),
          ),
        ],
      ),
    );
  }
}

// ---- RECIPE DETAIL BOTTOM SHEET ----
class _RecipeDetailSheet extends StatelessWidget {
  final Recipe recipe;
  const _RecipeDetailSheet({required this.recipe});

  @override
  Widget build(BuildContext context) {
    return DraggableScrollableSheet(
      initialChildSize: 0.85,
      maxChildSize: 0.95,
      minChildSize: 0.5,
      builder: (_, controller) {
        return Container(
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
          ),
          child: ListView(
            controller: controller,
            padding: const EdgeInsets.all(24),
            children: [
              // Handle
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  margin: const EdgeInsets.only(bottom: 20),
                  decoration: BoxDecoration(
                    color: AppTheme.neutral300,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),

              // Title
              Text(
                recipe.name,
                style: const TextStyle(
                  fontFamily: 'Nunito',
                  fontSize: 22,
                  fontWeight: FontWeight.w700,
                  color: AppTheme.textPrimary,
                ),
              ),
              const SizedBox(height: 8),

              // Description
              Text(
                recipe.description,
                style: const TextStyle(
                  fontFamily: 'Inter',
                  fontSize: 14,
                  color: AppTheme.textSecondary,
                  height: 1.5,
                ),
              ),
              const SizedBox(height: 16),

              // Info pills
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  _infoPill(Icons.access_time_rounded, 'Prep: ${recipe.prepTime}'),
                  _infoPill(Icons.local_fire_department_rounded, 'Cook: ${recipe.cookTime}'),
                  _infoPill(Icons.signal_cellular_alt_rounded, recipe.difficulty),
                  if (recipe.isVegetarian)
                    _infoPill(Icons.eco_rounded, 'Vegetarian',
                        color: AppTheme.primaryGreen),
                ],
              ),
              const SizedBox(height: 24),

              // Ingredients
              _sectionTitle('Ingredients'),
              const SizedBox(height: 8),
              ...recipe.ingredients.map((i) => Padding(
                    padding: const EdgeInsets.only(bottom: 6),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Container(
                          width: 6,
                          height: 6,
                          margin: const EdgeInsets.only(top: 7),
                          decoration: const BoxDecoration(
                            color: AppTheme.primaryGreen,
                            shape: BoxShape.circle,
                          ),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Text(
                            i,
                            style: const TextStyle(
                              fontFamily: 'Inter',
                              fontSize: 14,
                              color: AppTheme.textPrimary,
                              height: 1.5,
                            ),
                          ),
                        ),
                      ],
                    ),
                  )),
              const SizedBox(height: 24),

              // Instructions
              _sectionTitle('Instructions'),
              const SizedBox(height: 8),
              ...recipe.instructions.asMap().entries.map((entry) {
                return Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(
                        width: 28,
                        height: 28,
                        decoration: BoxDecoration(
                          color: AppTheme.primaryGreen.withOpacity(0.1),
                          shape: BoxShape.circle,
                        ),
                        child: Center(
                          child: Text(
                            '${entry.key + 1}',
                            style: const TextStyle(
                              fontFamily: 'Inter',
                              fontSize: 13,
                              fontWeight: FontWeight.w700,
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
                            fontFamily: 'Inter',
                            fontSize: 14,
                            color: AppTheme.textPrimary,
                            height: 1.5,
                          ),
                        ),
                      ),
                    ],
                  ),
                );
              }),
              const SizedBox(height: 24),

              // Nutrition highlights
              if (recipe.nutritionHighlights.isNotEmpty) ...[
                _sectionTitle('Nutrition Highlights'),
                const SizedBox(height: 8),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: recipe.nutritionHighlights
                      .map((n) => Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 12, vertical: 6),
                            decoration: BoxDecoration(
                              color: AppTheme.greenTint,
                              borderRadius: BorderRadius.circular(16),
                            ),
                            child: Text(
                              n,
                              style: const TextStyle(
                                fontFamily: 'Inter',
                                fontSize: 12,
                                fontWeight: FontWeight.w600,
                                color: AppTheme.primaryGreen,
                              ),
                            ),
                          ))
                      .toList(),
                ),
                const SizedBox(height: 24),
              ],

              // Allergen warnings
              if (recipe.allergens.isNotEmpty) ...[
                Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: AppTheme.secondaryOrange.withOpacity(0.06),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                        color: AppTheme.secondaryOrange.withOpacity(0.2)),
                  ),
                  child: Row(
                    children: [
                      Icon(Icons.warning_amber_rounded,
                          color: AppTheme.secondaryOrange, size: 20),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          'Allergens: ${recipe.allergens.join(', ')}',
                          style: const TextStyle(
                            fontFamily: 'Inter',
                            fontSize: 13,
                            fontWeight: FontWeight.w500,
                            color: AppTheme.secondaryOrange,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
              ],
            ],
          ),
        );
      },
    );
  }

  Widget _sectionTitle(String text) {
    return Text(
      text,
      style: const TextStyle(
        fontFamily: 'Nunito',
        fontSize: 16,
        fontWeight: FontWeight.w700,
        color: AppTheme.textPrimary,
      ),
    );
  }

  Widget _infoPill(IconData icon, String text, {Color? color}) {
    final c = color ?? AppTheme.textSecondary;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: c.withOpacity(0.08),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: c),
          const SizedBox(width: 4),
          Text(
            text,
            style: TextStyle(
              fontFamily: 'Inter',
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: c,
            ),
          ),
        ],
      ),
    );
  }
}
