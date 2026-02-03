class ProductCategory {
  final String id;
  final String name;
  final String emoji;

  const ProductCategory({
    required this.id,
    required this.name,
    required this.emoji,
  });

  static const List<ProductCategory> categories = [
    ProductCategory(id: 'toys', name: 'Toys', emoji: '🧸'),
    ProductCategory(id: 'books', name: 'Books', emoji: '📚'),
    ProductCategory(id: 'learning', name: 'Learning', emoji: '🎓'),
    ProductCategory(id: 'activity', name: 'Activity', emoji: '🎨'),
    ProductCategory(id: 'outdoor', name: 'Outdoor', emoji: '🌳'),
    ProductCategory(id: 'music', name: 'Music', emoji: '🎵'),
    ProductCategory(id: 'sensory', name: 'Sensory', emoji: '🌈'),
    ProductCategory(id: 'feeding', name: 'Feeding', emoji: '🍼'),
  ];
}

class ProductRecommendation {
  final String id;
  final String name;
  final String description;
  final String category;
  final int minAgeMonths;
  final int maxAgeMonths;
  final List<String> developmentAreas;
  final String? imageUrl;
  final String? affiliateUrl;
  final double? price;
  final String? currency;
  final double? rating;
  final int? reviewCount;
  final List<String> tags;
  final String whyRecommended;

  const ProductRecommendation({
    required this.id,
    required this.name,
    required this.description,
    required this.category,
    required this.minAgeMonths,
    required this.maxAgeMonths,
    required this.developmentAreas,
    this.imageUrl,
    this.affiliateUrl,
    this.price,
    this.currency,
    this.rating,
    this.reviewCount,
    this.tags = const [],
    required this.whyRecommended,
  });

  String get ageRange {
    if (minAgeMonths == maxAgeMonths) {
      return '$minAgeMonths months';
    }
    if (maxAgeMonths >= 24) {
      final minYears = minAgeMonths ~/ 12;
      final maxYears = maxAgeMonths ~/ 12;
      if (minAgeMonths >= 12) {
        return '$minYears-$maxYears years';
      }
      return '$minAgeMonths months - $maxYears years';
    }
    return '$minAgeMonths-$maxAgeMonths months';
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'name': name,
    'description': description,
    'category': category,
    'minAgeMonths': minAgeMonths,
    'maxAgeMonths': maxAgeMonths,
    'developmentAreas': developmentAreas,
    'imageUrl': imageUrl,
    'affiliateUrl': affiliateUrl,
    'price': price,
    'currency': currency,
    'rating': rating,
    'reviewCount': reviewCount,
    'tags': tags,
    'whyRecommended': whyRecommended,
  };

  factory ProductRecommendation.fromJson(Map<String, dynamic> json) =>
      ProductRecommendation(
        id: json['id'],
        name: json['name'],
        description: json['description'],
        category: json['category'],
        minAgeMonths: json['minAgeMonths'],
        maxAgeMonths: json['maxAgeMonths'],
        developmentAreas: List<String>.from(json['developmentAreas'] ?? []),
        imageUrl: json['imageUrl'],
        affiliateUrl: json['affiliateUrl'],
        price: json['price']?.toDouble(),
        currency: json['currency'],
        rating: json['rating']?.toDouble(),
        reviewCount: json['reviewCount'],
        tags: List<String>.from(json['tags'] ?? []),
        whyRecommended: json['whyRecommended'],
      );
}

class Recipe {
  final String id;
  final String name;
  final String description;
  final int minAgeMonths;
  final int maxAgeMonths;
  final List<String> ingredients;
  final List<String> instructions;
  final String prepTime;
  final String cookTime;
  final List<String> nutritionHighlights;
  final String? imageUrl;
  final List<String> allergens;
  final bool isVegetarian;
  final bool isVegan;
  final String difficulty;

  const Recipe({
    required this.id,
    required this.name,
    required this.description,
    required this.minAgeMonths,
    required this.maxAgeMonths,
    required this.ingredients,
    required this.instructions,
    required this.prepTime,
    required this.cookTime,
    required this.nutritionHighlights,
    this.imageUrl,
    this.allergens = const [],
    this.isVegetarian = false,
    this.isVegan = false,
    this.difficulty = 'Easy',
  });

  Map<String, dynamic> toJson() => {
    'id': id,
    'name': name,
    'description': description,
    'minAgeMonths': minAgeMonths,
    'maxAgeMonths': maxAgeMonths,
    'ingredients': ingredients,
    'instructions': instructions,
    'prepTime': prepTime,
    'cookTime': cookTime,
    'nutritionHighlights': nutritionHighlights,
    'imageUrl': imageUrl,
    'allergens': allergens,
    'isVegetarian': isVegetarian,
    'isVegan': isVegan,
    'difficulty': difficulty,
  };

  factory Recipe.fromJson(Map<String, dynamic> json) => Recipe(
    id: json['id'],
    name: json['name'],
    description: json['description'],
    minAgeMonths: json['minAgeMonths'],
    maxAgeMonths: json['maxAgeMonths'],
    ingredients: List<String>.from(json['ingredients'] ?? []),
    instructions: List<String>.from(json['instructions'] ?? []),
    prepTime: json['prepTime'],
    cookTime: json['cookTime'],
    nutritionHighlights: List<String>.from(json['nutritionHighlights'] ?? []),
    imageUrl: json['imageUrl'],
    allergens: List<String>.from(json['allergens'] ?? []),
    isVegetarian: json['isVegetarian'] ?? false,
    isVegan: json['isVegan'] ?? false,
    difficulty: json['difficulty'] ?? 'Easy',
  );
}
