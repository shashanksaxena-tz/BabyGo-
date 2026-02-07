import 'dart:convert';
import 'dart:io';
import 'package:google_generative_ai/google_generative_ai.dart';
import '../models/models.dart';
import 'who_data_service.dart';

/// Gemini AI Service for child development analysis, story generation,
/// and personalized recommendations.
class GeminiService {
  late GenerativeModel _model;
  late GenerativeModel _visionModel;
  bool _isInitialized = false;

  static final GeminiService _instance = GeminiService._internal();
  factory GeminiService() => _instance;
  GeminiService._internal();

  /// Initialize with API key
  Future<void> initialize(String apiKey) async {
    _model = GenerativeModel(
      model: 'gemini-1.5-flash',
      apiKey: apiKey,
    );
    _visionModel = GenerativeModel(
      model: 'gemini-1.5-flash',
      apiKey: apiKey,
    );
    _isInitialized = true;
  }

  bool get isInitialized => _isInitialized;

  /// Analyze baby sounds/vocalizations
  Future<Map<String, dynamic>> analyzeBabySounds({
    required File audioFile,
    required int ageMonths,
  }) async {
    if (!_isInitialized) {
      throw Exception('GeminiService not initialized');
    }

    final audioBytes = await audioFile.readAsBytes();
    final audioBase64 = base64Encode(audioBytes);

    final milestones = WHODataService.getMilestonesByDomain(
      DevelopmentDomain.language,
      ageMonths,
    );
    final milestoneContext = milestones.map((m) =>
      '- ${m.title} (typical: ${m.typicalMonths} months, range: ${m.minMonths}-${m.maxMonths} months): ${m.description}'
    ).join('\n');

    final prompt = '''
You are a child development specialist analyzing baby vocalizations for a $ageMonths-month-old child.

WHO Language Milestones for this age:
$milestoneContext

Analyze the audio and provide:
1. Vocalizations observed (list specific sounds heard)
2. Language development observations based on WHO milestones
3. Recommendations for supporting language development

IMPORTANT: This is for informational purposes only. Do not provide medical diagnoses.

Respond in JSON format:
{
  "vocalizations": ["sound1", "sound2"],
  "languageObservations": "detailed observation text",
  "recommendations": ["tip1", "tip2", "tip3"],
  "developmentStatus": "on_track|emerging|needs_support"
}
''';

    try {
      final content = [
        Content.multi([
          TextPart(prompt),
          DataPart('audio/webm', audioBytes),
        ])
      ];

      final response = await _visionModel.generateContent(content);
      final responseText = response.text ?? '{}';

      // Parse JSON from response
      final jsonMatch = RegExp(r'\{[\s\S]*\}').firstMatch(responseText);
      if (jsonMatch != null) {
        return json.decode(jsonMatch.group(0)!);
      }
      return {
        'vocalizations': [],
        'languageObservations': 'Unable to analyze audio',
        'recommendations': [],
        'developmentStatus': 'unknown'
      };
    } catch (e) {
      print('Error analyzing baby sounds: $e');
      return {
        'vocalizations': [],
        'languageObservations': 'Error processing audio',
        'recommendations': [],
        'developmentStatus': 'unknown'
      };
    }
  }

  /// Analyze child development from images/videos
  Future<AnalysisResult> analyzeDevelopment({
    required ChildProfile child,
    required List<File> mediaFiles,
    File? audioFile,
  }) async {
    if (!_isInitialized) {
      throw Exception('GeminiService not initialized');
    }

    // Get relevant milestones and growth data
    final milestones = WHODataService.getMilestonesForAge(child.ageInMonths);
    final growthPercentiles = WHODataService.assessGrowth(child);
    final sources = WHODataService.getSourcesForRegion(child.region);

    // Build milestone context
    final milestoneContext = _buildMilestoneContext(milestones, child.ageInMonths);
    final growthContext = _buildGrowthContext(growthPercentiles);

    final prompt = '''
You are a child development specialist using WHO standards to analyze a ${child.ageInMonths}-month-old ${child.gender.name} child named ${child.name}.

CHILD PROFILE:
- Age: ${child.ageInMonths} months (${child.displayAge})
- Weight: ${child.weight} kg
- Height: ${child.height} cm
${child.headCircumference != null ? '- Head Circumference: ${child.headCircumference} cm' : ''}
- Region: ${child.region.name.toUpperCase()}
- Interests: ${child.interests.join(', ')}

CURRENT GROWTH ASSESSMENT:
$growthContext

WHO DEVELOPMENTAL MILESTONES FOR THIS AGE:
$milestoneContext

Analyze the provided media showing ${child.name} and assess their development across all four domains: Motor, Language, Cognitive, and Social-Emotional.

IMPORTANT GUIDELINES:
1. Base assessments on WHO developmental milestones only
2. This is for informational purposes - NOT medical advice
3. Do not diagnose conditions or diseases
4. Recommend consulting a pediatrician for any concerns
5. Be encouraging and supportive in tone
6. Provide specific, actionable activities for each domain

Respond in this JSON format:
{
  "overallScore": 85,
  "overallStatus": "on_track",
  "summary": "Overall development summary...",
  "motor": {
    "score": 85,
    "status": "on_track",
    "observations": ["observation1", "observation2"],
    "strengths": ["strength1"],
    "areasToSupport": ["area1"],
    "achievedMilestones": ["milestone_id1"],
    "activities": ["activity1", "activity2"]
  },
  "language": {
    "score": 80,
    "status": "on_track",
    "observations": ["observation1"],
    "strengths": ["strength1"],
    "areasToSupport": [],
    "achievedMilestones": ["milestone_id1"],
    "activities": ["activity1"]
  },
  "cognitive": {
    "score": 90,
    "status": "on_track",
    "observations": ["observation1"],
    "strengths": ["strength1"],
    "areasToSupport": [],
    "achievedMilestones": ["milestone_id1"],
    "activities": ["activity1"]
  },
  "social": {
    "score": 85,
    "status": "on_track",
    "observations": ["observation1"],
    "strengths": ["strength1"],
    "areasToSupport": [],
    "achievedMilestones": ["milestone_id1"],
    "activities": ["activity1"]
  },
  "personalizedTips": ["tip1", "tip2", "tip3"]
}
''';

    try {
      // Build content with media files
      final parts = <Part>[TextPart(prompt)];

      for (final file in mediaFiles) {
        final bytes = await file.readAsBytes();
        final mimeType = _getMimeType(file.path);
        parts.add(DataPart(mimeType, bytes));
      }

      final content = [Content.multi(parts)];
      final response = await _visionModel.generateContent(content);
      final responseText = response.text ?? '{}';

      // Parse JSON from response
      final jsonMatch = RegExp(r'\{[\s\S]*\}').firstMatch(responseText);
      if (jsonMatch != null) {
        final data = json.decode(jsonMatch.group(0)!);
        return _buildAnalysisResult(data, child, milestones, growthPercentiles, sources);
      }

      throw Exception('Invalid response format');
    } catch (e) {
      print('Error analyzing development: $e');
      rethrow;
    }
  }

  /// Generate a personalized bedtime story
  Future<BedtimeStory> generateBedtimeStory({
    required ChildProfile child,
    required StoryTheme theme,
  }) async {
    if (!_isInitialized) {
      throw Exception('GeminiService not initialized');
    }

    final prompt = '''
Create a bedtime story for a ${child.ageInMonths}-month-old child named ${child.name}.

STORY REQUIREMENTS:
- Theme: ${theme.name} (${theme.description})
- Make ${child.name} the protagonist/hero of the story
- Include their interests: ${child.interests.join(', ')}
- Include their favorite characters if relevant: ${child.favoriteCharacters.join(', ')}
- Use simple, age-appropriate language
- Story should be calming and lead to sleep
- 4-6 pages, each with 2-3 short paragraphs
- Include a gentle moral or lesson
- End with ${child.name} falling peacefully asleep

Respond in this JSON format:
{
  "title": "Story Title",
  "pages": [
    {
      "pageNumber": 1,
      "text": "Story text for page 1...",
      "illustrationPrompt": "Description for illustration"
    },
    {
      "pageNumber": 2,
      "text": "Story text for page 2...",
      "illustrationPrompt": "Description for illustration"
    }
  ],
  "moral": "The gentle lesson of the story"
}
''';

    try {
      final content = [Content.text(prompt)];
      final response = await _model.generateContent(content);
      final responseText = response.text ?? '{}';

      final jsonMatch = RegExp(r'\{[\s\S]*\}').firstMatch(responseText);
      if (jsonMatch != null) {
        final data = json.decode(jsonMatch.group(0)!);
        return _buildBedtimeStory(data, child, theme);
      }

      throw Exception('Invalid response format');
    } catch (e) {
      print('Error generating story: $e');
      rethrow;
    }
  }

  /// Generate product recommendations
  Future<List<ProductRecommendation>> generateProductRecommendations({
    required ChildProfile child,
    required String category,
  }) async {
    if (!_isInitialized) {
      throw Exception('GeminiService not initialized');
    }

    final prompt = '''
Recommend age-appropriate products for a ${child.ageInMonths}-month-old child.

CHILD PROFILE:
- Age: ${child.ageInMonths} months
- Interests: ${child.interests.join(', ')}
- Favorite characters: ${child.favoriteCharacters.join(', ')}

CATEGORY: $category

Provide 5 product recommendations. Focus on developmental benefits.

Respond in JSON format:
{
  "products": [
    {
      "name": "Product Name",
      "description": "Brief description",
      "category": "$category",
      "developmentAreas": ["motor", "cognitive"],
      "whyRecommended": "Why this helps development"
    }
  ]
}
''';

    try {
      final content = [Content.text(prompt)];
      final response = await _model.generateContent(content);
      final responseText = response.text ?? '{}';

      final jsonMatch = RegExp(r'\{[\s\S]*\}').firstMatch(responseText);
      if (jsonMatch != null) {
        final data = json.decode(jsonMatch.group(0)!);
        final products = (data['products'] as List?) ?? [];
        return products.map((p) => ProductRecommendation(
          id: DateTime.now().millisecondsSinceEpoch.toString(),
          name: p['name'] ?? '',
          description: p['description'] ?? '',
          category: p['category'] ?? category,
          minAgeMonths: child.ageInMonths,
          maxAgeMonths: child.ageInMonths + 6,
          developmentAreas: List<String>.from(p['developmentAreas'] ?? []),
          whyRecommended: p['whyRecommended'] ?? '',
        )).toList();
      }

      return [];
    } catch (e) {
      print('Error generating recommendations: $e');
      return [];
    }
  }

  /// Generate age-appropriate recipes
  /// Options for recipe generation filtering
  Future<List<Recipe>> generateRecipes({
    required ChildProfile child,
    int count = 6,
    String? category,
    List<String> excludeAllergens = const [],
    List<String> dietaryPreferences = const [],
    String? foodLikings,
  }) async {
    if (!_isInitialized) {
      throw Exception('GeminiService not initialized');
    }

    // Build allergen exclusion text
    final allergenText = excludeAllergens.isNotEmpty
        ? 'IMPORTANT: Exclude these allergens completely: ${excludeAllergens.join(', ')}.'
        : '';

    // Build dietary preferences text
    final dietaryText = dietaryPreferences.isNotEmpty
        ? 'Dietary requirements: ${dietaryPreferences.join(', ')}.'
        : '';

    // Build category filter text
    final categoryText = category != null && category != 'all'
        ? 'Recipe type: $category meals only.'
        : 'Include a variety of meal types (breakfast, lunch, dinner, snacks).';

    // Build food preferences text
    final likingsText = foodLikings != null && foodLikings.isNotEmpty
        ? 'Child\'s food preferences: $foodLikings'
        : '';

    // Get region name for cultural context
    final regionName = _getRegionDisplayName(child.region);

    final prompt = '''
Create $count age-appropriate recipes for a ${child.ageInMonths}-month-old child from the $regionName region.

$categoryText
$allergenText
$dietaryText
$likingsText

Consider:
- Age-appropriate textures and ingredients for ${child.ageInMonths} months
- Nutritional needs (iron, protein, fiber) for this age
- WHO/UNICEF infant and young child feeding guidelines
- Regional cuisine and locally available ingredients from $regionName
- Easy preparation for busy parents
- Child's interests: ${child.interests.join(', ')}

Respond ONLY with valid JSON in this exact format:
{
  "recipes": [
    {
      "name": "Recipe Name",
      "emoji": "🍽️",
      "category": "breakfast|lunch|dinner|snacks|smoothies",
      "description": "Brief appealing description",
      "prepTime": 15,
      "servings": "1-2 servings",
      "calories": 150,
      "protein": 5,
      "fiber": 2,
      "iron": "medium",
      "ingredients": ["1 cup ingredient1", "2 tbsp ingredient2"],
      "steps": ["Step 1 instruction", "Step 2 instruction"],
      "tips": ["Helpful tip 1"],
      "allergens": ["dairy", "eggs"]
    }
  ]
}
''';

    try {
      final content = [Content.text(prompt)];
      final response = await _model.generateContent(content);
      final responseText = response.text ?? '{}';

      final jsonMatch = RegExp(r'\{[\s\S]*\}').firstMatch(responseText);
      if (jsonMatch != null) {
        final data = json.decode(jsonMatch.group(0)!);
        final recipes = (data['recipes'] as List?) ?? [];
        return recipes.map((r) => Recipe(
          id: DateTime.now().millisecondsSinceEpoch.toString(),
          name: r['name'] ?? '',
          description: r['description'] ?? '',
          minAgeMonths: child.ageInMonths,
          maxAgeMonths: child.ageInMonths + 6,
          ingredients: List<String>.from(r['ingredients'] ?? []),
          instructions: List<String>.from(r['steps'] ?? r['instructions'] ?? []),
          prepTime: r['prepTime']?.toString() ?? '15 min',
          cookTime: r['cookTime']?.toString() ?? '',
          nutritionHighlights: List<String>.from(r['nutritionHighlights'] ?? []),
          allergens: List<String>.from(r['allergens'] ?? []),
          isVegetarian: dietaryPreferences.contains('vegetarian') || r['isVegetarian'] == true,
          isVegan: dietaryPreferences.contains('vegan') || r['isVegan'] == true,
          difficulty: r['difficulty'] ?? 'Easy',
        )).toList();
      }

      return [];
    } catch (e) {
      print('Error generating recipes: $e');
      return [];
    }
  }

  /// Generate recipes returning raw maps for custom parsing
  Future<List<Map<String, dynamic>>> generateRecipesRaw({
    required ChildProfile child,
    int count = 6,
    String? category,
    List<String> excludeAllergens = const [],
    List<String> dietaryPreferences = const [],
    String? foodLikings,
  }) async {
    if (!_isInitialized) {
      throw Exception('GeminiService not initialized');
    }

    // Build filter texts
    final allergenText = excludeAllergens.isNotEmpty
        ? 'IMPORTANT: Exclude these allergens completely: ${excludeAllergens.join(', ')}.'
        : '';
    final dietaryText = dietaryPreferences.isNotEmpty
        ? 'Dietary requirements: ${dietaryPreferences.join(', ')}.'
        : '';
    final categoryText = category != null && category != 'all'
        ? 'Recipe type: $category meals only.'
        : 'Include a variety of meal types (breakfast, lunch, dinner, snacks).';
    final likingsText = foodLikings != null && foodLikings.isNotEmpty
        ? 'Child\'s food preferences: $foodLikings'
        : '';
    final regionName = _getRegionDisplayName(child.region);

    final prompt = '''
Create $count age-appropriate recipes for a ${child.ageInMonths}-month-old child from the $regionName region.

$categoryText
$allergenText
$dietaryText
$likingsText

Consider:
- Age-appropriate textures and ingredients for ${child.ageInMonths} months
- Nutritional needs (iron, protein, fiber) for this age
- WHO/UNICEF infant and young child feeding guidelines
- Regional cuisine and locally available ingredients from $regionName
- Easy preparation for busy parents
- Child's interests: ${child.interests.join(', ')}

Respond ONLY with valid JSON:
{
  "recipes": [
    {
      "name": "Recipe Name",
      "emoji": "🍽️",
      "category": "breakfast|lunch|dinner|snacks|smoothies",
      "description": "Brief appealing description",
      "prepTime": 15,
      "servings": "1-2 servings",
      "calories": 150,
      "protein": 5,
      "fiber": 2,
      "iron": "medium",
      "ingredients": ["1 cup ingredient1", "2 tbsp ingredient2"],
      "steps": ["Step 1 instruction", "Step 2 instruction"],
      "tips": ["Helpful tip 1"],
      "allergens": ["dairy", "eggs"]
    }
  ]
}
''';

    try {
      final content = [Content.text(prompt)];
      final response = await _model.generateContent(content);
      final responseText = response.text ?? '{}';

      final jsonMatch = RegExp(r'\{[\s\S]*\}').firstMatch(responseText);
      if (jsonMatch != null) {
        final data = json.decode(jsonMatch.group(0)!);
        final recipes = (data['recipes'] as List?) ?? [];
        return recipes.cast<Map<String, dynamic>>();
      }

      return [];
    } catch (e) {
      print('Error generating recipes: $e');
      return [];
    }
  }

  String _getRegionDisplayName(WHORegion region) {
    switch (region) {
      case WHORegion.afro:
        return 'African';
      case WHORegion.amro:
        return 'Americas';
      case WHORegion.searo:
        return 'South-East Asian';
      case WHORegion.euro:
        return 'European';
      case WHORegion.emro:
        return 'Eastern Mediterranean';
      case WHORegion.wpro:
        return 'Western Pacific';
    }
  }

  /// Generate parenting tips
  Future<List<String>> generateParentingTips({
    required ChildProfile child,
    required DevelopmentDomain? focusArea,
  }) async {
    if (!_isInitialized) {
      throw Exception('GeminiService not initialized');
    }

    final focusText = focusArea != null
        ? 'Focus on ${focusArea.name} development.'
        : 'Cover all development areas.';

    final prompt = '''
Provide 5 research-backed parenting tips for a ${child.ageInMonths}-month-old child.

$focusText

Child's interests: ${child.interests.join(', ')}

Tips should be:
- Specific and actionable
- Based on developmental science
- Incorporate the child's interests when possible
- Appropriate for the child's age

Respond in JSON format:
{
  "tips": ["tip1", "tip2", "tip3", "tip4", "tip5"]
}
''';

    try {
      final content = [Content.text(prompt)];
      final response = await _model.generateContent(content);
      final responseText = response.text ?? '{}';

      final jsonMatch = RegExp(r'\{[\s\S]*\}').firstMatch(responseText);
      if (jsonMatch != null) {
        final data = json.decode(jsonMatch.group(0)!);
        return List<String>.from(data['tips'] ?? []);
      }

      return [];
    } catch (e) {
      print('Error generating tips: $e');
      return [];
    }
  }

  // Helper methods

  String _buildMilestoneContext(List<Milestone> milestones, int ageMonths) {
    final byDomain = <DevelopmentDomain, List<Milestone>>{};
    for (final m in milestones) {
      byDomain.putIfAbsent(m.domain, () => []).add(m);
    }

    final buffer = StringBuffer();
    for (final domain in DevelopmentDomain.values) {
      final domainMilestones = byDomain[domain] ?? [];
      if (domainMilestones.isEmpty) continue;

      buffer.writeln('\n${domain.name.toUpperCase()}:');
      for (final m in domainMilestones) {
        final status = ageMonths >= m.typicalMonths ? 'expected' : 'upcoming';
        buffer.writeln('- [${m.id}] ${m.title} ($status at ${m.typicalMonths}mo): ${m.description}');
      }
    }

    return buffer.toString();
  }

  String _buildGrowthContext(List<GrowthPercentile> percentiles) {
    return percentiles.map((p) =>
      '- ${p.metric}: ${p.value} (${p.percentile.toStringAsFixed(0)}th percentile - ${p.interpretation})'
    ).join('\n');
  }

  String _getMimeType(String path) {
    final ext = path.split('.').last.toLowerCase();
    switch (ext) {
      case 'jpg':
      case 'jpeg':
        return 'image/jpeg';
      case 'png':
        return 'image/png';
      case 'gif':
        return 'image/gif';
      case 'webp':
        return 'image/webp';
      case 'mp4':
        return 'video/mp4';
      case 'webm':
        return 'video/webm';
      case 'mov':
        return 'video/quicktime';
      default:
        return 'application/octet-stream';
    }
  }

  AnalysisResult _buildAnalysisResult(
    Map<String, dynamic> data,
    ChildProfile child,
    List<Milestone> milestones,
    List<GrowthPercentile> growthPercentiles,
    List<WHOSource> sources,
  ) {
    final now = DateTime.now();
    final id = '${child.id}_${now.millisecondsSinceEpoch}';

    DomainAssessment buildAssessment(
      DevelopmentDomain domain,
      Map<String, dynamic>? domainData,
    ) {
      if (domainData == null) {
        return DomainAssessment(
          domain: domain,
          score: 50,
          status: 'unknown',
        );
      }

      final achievedIds = List<String>.from(domainData['achievedMilestones'] ?? []);
      final achieved = milestones
          .where((m) => m.domain == domain && achievedIds.contains(m.id))
          .map((m) => m.copyWith(isAchieved: true, achievedDate: now))
          .toList();

      final upcoming = milestones
          .where((m) => m.domain == domain && !achievedIds.contains(m.id))
          .toList();

      return DomainAssessment(
        domain: domain,
        score: (domainData['score'] ?? 50).toDouble(),
        status: domainData['status'] ?? 'unknown',
        observations: List<String>.from(domainData['observations'] ?? []),
        strengths: List<String>.from(domainData['strengths'] ?? []),
        areasToSupport: List<String>.from(domainData['areasToSupport'] ?? []),
        achievedMilestones: achieved,
        upcomingMilestones: upcoming,
        activities: List<String>.from(domainData['activities'] ?? []),
        sources: sources.take(2).toList(),
      );
    }

    return AnalysisResult(
      id: id,
      childId: child.id,
      timestamp: now,
      overallScore: (data['overallScore'] ?? 50).toDouble(),
      overallStatus: data['overallStatus'] ?? 'unknown',
      summary: data['summary'] ?? '',
      motorAssessment: buildAssessment(DevelopmentDomain.motor, data['motor']),
      languageAssessment: buildAssessment(DevelopmentDomain.language, data['language']),
      cognitiveAssessment: buildAssessment(DevelopmentDomain.cognitive, data['cognitive']),
      socialAssessment: buildAssessment(DevelopmentDomain.social, data['social']),
      growthPercentiles: growthPercentiles,
      personalizedTips: List<String>.from(data['personalizedTips'] ?? []),
      allSources: sources,
    );
  }

  BedtimeStory _buildBedtimeStory(
    Map<String, dynamic> data,
    ChildProfile child,
    StoryTheme theme,
  ) {
    final pages = (data['pages'] as List?)?.map((p) => StoryPage(
      pageNumber: p['pageNumber'] ?? 1,
      text: p['text'] ?? '',
      illustrationPrompt: p['illustrationPrompt'],
    )).toList() ?? [];

    return BedtimeStory(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      childId: child.id,
      title: data['title'] ?? 'A Story for ${child.name}',
      theme: theme,
      pages: pages,
      moral: data['moral'] ?? '',
      ageMonths: child.ageInMonths,
      createdAt: DateTime.now(),
    );
  }

  /// Generate story illustration using AI
  Future<String?> generateStoryIllustration({
    required String prompt,
    required String childName,
    String? childPhotoUrl,
    required StoryTheme theme,
  }) async {
    if (!_isInitialized) {
      throw Exception('GeminiService not initialized');
    }

    // For now, we generate a descriptive illustration prompt
    // In production, this would call Gemini Imagen API
    final illustrationPrompt = '''
Create a whimsical children's book illustration for this scene:
$prompt

Style guidelines:
- Warm, inviting children's book illustration style
- ${theme.name} theme with ${theme.colorHex} as accent color
- Main character is a child named $childName
- Soft, rounded shapes and friendly expressions
- Suitable for bedtime - calming colors
- No text in the image
''';

    try {
      // Note: When Gemini Imagen is available, replace with actual image generation
      // For now, return null to use placeholder
      // final response = await _model.generateImage(illustrationPrompt);
      // return response.imageUrl;
      return null;
    } catch (e) {
      print('Error generating illustration: $e');
      return null;
    }
  }

  /// Generate activity recommendations for development
  Future<List<Activity>> generateActivityRecommendations({
    required ChildProfile child,
  }) async {
    if (!_isInitialized) {
      throw Exception('GeminiService not initialized');
    }

    final milestones = WHODataService.getMilestonesForAge(child.ageInMonths);

    final prompt = '''
Create 8 age-appropriate developmental activities for a ${child.ageInMonths}-month-old child named ${child.name}.

Child's interests: ${child.interests.join(', ')}

WHO Milestones for this age:
${milestones.take(10).map((m) => '- ${m.title} (${m.domain.name}): ${m.description}').join('\n')}

For each activity, include:
- Activities that support current WHO milestones
- Mix of all 4 domains: motor, language, cognitive, social
- Indoor and outdoor activities
- Activities using common household items

Respond in JSON format:
{
  "activities": [
    {
      "name": "Activity Name",
      "emoji": "🎯",
      "domain": "motor|language|cognitive|social",
      "description": "Brief engaging description",
      "duration": "10-15 min",
      "materials": ["item1", "item2"],
      "skills": ["skill1", "skill2"],
      "steps": ["step1", "step2", "step3"],
      "milestoneSupported": "milestone_id"
    }
  ]
}
''';

    try {
      final content = [Content.text(prompt)];
      final response = await _model.generateContent(content);
      final responseText = response.text ?? '{}';

      final jsonMatch = RegExp(r'\{[\s\S]*\}').firstMatch(responseText);
      if (jsonMatch != null) {
        final data = json.decode(jsonMatch.group(0)!);
        final activities = (data['activities'] as List?) ?? [];
        return activities.map((a) => Activity(
          name: a['name'] ?? '',
          emoji: a['emoji'] ?? '🎯',
          domain: a['domain'] ?? 'general',
          description: a['description'] ?? '',
          duration: a['duration'] ?? '10 min',
          materials: List<String>.from(a['materials'] ?? []),
          skills: List<String>.from(a['skills'] ?? []),
          steps: List<String>.from(a['steps'] ?? []),
        )).toList();
      }

      return [];
    } catch (e) {
      print('Error generating activities: $e');
      return [];
    }
  }

  /// Generate parenting tips with expert sources and action steps
  Future<List<Map<String, dynamic>>> generateParentingTipsRaw({
    required ChildProfile child,
    String? focusArea,
  }) async {
    if (!_isInitialized) {
      throw Exception('GeminiService not initialized');
    }

    final focusText = focusArea != null
        ? 'Focus on: $focusArea'
        : 'Cover various aspects of parenting';

    final regionName = _getRegionDisplayName(child.region);

    final prompt = '''
Provide 6 evidence-based parenting tips for a ${child.ageInMonths}-month-old child from the $regionName region.

$focusText

Child's interests: ${child.interests.join(', ')}

Tips should be:
- Based on WHO guidelines and pediatric research
- Culturally sensitive to $regionName region
- Practical and actionable with specific steps
- Specific to this age

Respond ONLY in JSON format:
{
  "tips": [
    {
      "title": "Concise Tip Title",
      "emoji": "💡",
      "category": "Sleep|Feeding|Play|Safety|Development|Bonding",
      "content": "Detailed explanation of the tip with context...",
      "source": "WHO Nurturing Care Framework",
      "sourceUrl": "https://www.who.int/publications/i/item/9789241514064",
      "actionSteps": [
        "Specific action step 1",
        "Specific action step 2",
        "Specific action step 3"
      ]
    }
  ]
}

For sources, use only these verified URLs:
- WHO: https://www.who.int/health-topics/infant-and-young-child-feeding
- CDC: https://www.cdc.gov/ncbddd/childdevelopment/positiveparenting/
- AAP: https://www.healthychildren.org/
''';

    try {
      final content = [Content.text(prompt)];
      final response = await _model.generateContent(content);
      final responseText = response.text ?? '{}';

      final jsonMatch = RegExp(r'\{[\s\S]*\}').firstMatch(responseText);
      if (jsonMatch != null) {
        final data = json.decode(jsonMatch.group(0)!);
        final tips = (data['tips'] as List?) ?? [];
        return tips.cast<Map<String, dynamic>>();
      }

      return [];
    } catch (e) {
      print('Error generating tips: $e');
      return [];
    }
  }

  /// Generate parenting tips with expert sources (legacy method)
  Future<List<ParentingTip>> generateParentingTipsWithSources({
    required ChildProfile child,
    String? focusArea,
  }) async {
    final raw = await generateParentingTipsRaw(child: child, focusArea: focusArea);
    return raw.map((t) => ParentingTip(
      title: t['title'] ?? '',
      emoji: t['emoji'] ?? '💡',
      category: t['category'] ?? 'General',
      content: t['content'] ?? '',
      source: t['source'],
    )).toList();
  }

  /// Generate enhanced recipes with full nutrition info
  Future<List<EnhancedRecipe>> generateEnhancedRecipes({
    required ChildProfile child,
    int count = 6,
    String? category,
  }) async {
    if (!_isInitialized) {
      throw Exception('GeminiService not initialized');
    }

    final categoryFilter = category != null && category != 'all'
        ? 'Category: $category'
        : 'Mix of breakfast, lunch, dinner, and snacks';

    final prompt = '''
Create $count age-appropriate recipes for a ${child.ageInMonths}-month-old child.

$categoryFilter

Requirements based on WHO feeding guidelines:
- Appropriate textures for age (${child.ageInMonths < 6 ? 'breast milk/formula only' : child.ageInMonths < 8 ? 'smooth purees' : child.ageInMonths < 10 ? 'mashed foods' : 'finger foods and small pieces'})
- Iron-rich foods (important for this age)
- No added salt or sugar
- No honey if under 12 months
- Variety of food groups

Respond in JSON format:
{
  "recipes": [
    {
      "name": "Recipe Name",
      "emoji": "🥣",
      "category": "breakfast|lunch|dinner|snacks|smoothies",
      "description": "Brief appetizing description",
      "prepTime": 15,
      "servings": "2 servings",
      "calories": 150,
      "protein": 5,
      "fiber": 2,
      "iron": "high|medium|low",
      "ingredients": ["1/2 cup ingredient1", "1 tbsp ingredient2"],
      "steps": ["Step 1 instruction", "Step 2 instruction"],
      "tips": ["Storage tip", "Variation idea"],
      "allergens": ["dairy", "eggs"]
    }
  ]
}
''';

    try {
      final content = [Content.text(prompt)];
      final response = await _model.generateContent(content);
      final responseText = response.text ?? '{}';

      final jsonMatch = RegExp(r'\{[\s\S]*\}').firstMatch(responseText);
      if (jsonMatch != null) {
        final data = json.decode(jsonMatch.group(0)!);
        final recipes = (data['recipes'] as List?) ?? [];
        return recipes.map((r) => EnhancedRecipe(
          name: r['name'] ?? '',
          emoji: r['emoji'] ?? '🍽️',
          category: r['category'] ?? 'meal',
          description: r['description'] ?? '',
          prepTime: r['prepTime'] ?? 15,
          servings: r['servings'] ?? '1 serving',
          calories: r['calories'] ?? 0,
          protein: r['protein'] ?? 0,
          fiber: r['fiber'] ?? 0,
          iron: r['iron'] ?? 'low',
          ingredients: List<String>.from(r['ingredients'] ?? []),
          steps: List<String>.from(r['steps'] ?? []),
          tips: List<String>.from(r['tips'] ?? []),
          allergens: List<String>.from(r['allergens'] ?? []),
        )).toList();
      }

      return [];
    } catch (e) {
      print('Error generating recipes: $e');
      return [];
    }
  }

  /// Generate product recommendations with more details
  Future<List<EnhancedProductRecommendation>> generateEnhancedProductRecommendations({
    required ChildProfile child,
    required List<String> categories,
  }) async {
    if (!_isInitialized) {
      throw Exception('GeminiService not initialized');
    }

    final prompt = '''
Recommend 8 age-appropriate products for a ${child.ageInMonths}-month-old child.

Categories to include: ${categories.join(', ')}

Child's interests: ${child.interests.join(', ')}
Favorite characters: ${child.favoriteCharacters.join(', ')}

Focus on products that:
- Support WHO developmental milestones
- Are safe for this age
- Provide educational value
- Are engaging and fun

Respond in JSON format:
{
  "products": [
    {
      "name": "Product Name",
      "emoji": "🧸",
      "category": "toys|books|educational|safety|outdoor|sensory",
      "description": "Why this product is great",
      "ageRange": "${child.ageInMonths}+ months",
      "developmentAreas": ["motor", "cognitive"],
      "whyRecommended": "Specific developmental benefits",
      "priceRange": "\$10-\$20"
    }
  ]
}
''';

    try {
      final content = [Content.text(prompt)];
      final response = await _model.generateContent(content);
      final responseText = response.text ?? '{}';

      final jsonMatch = RegExp(r'\{[\s\S]*\}').firstMatch(responseText);
      if (jsonMatch != null) {
        final data = json.decode(jsonMatch.group(0)!);
        final products = (data['products'] as List?) ?? [];
        return products.map((p) => EnhancedProductRecommendation(
          name: p['name'] ?? '',
          emoji: p['emoji'] ?? '🧸',
          category: p['category'] ?? 'toys',
          description: p['description'] ?? '',
          ageRange: p['ageRange'] ?? '${child.ageInMonths}+ months',
          developmentAreas: List<String>.from(p['developmentAreas'] ?? []),
          whyRecommended: p['whyRecommended'] ?? '',
          priceRange: p['priceRange'],
        )).toList();
      }

      return [];
    } catch (e) {
      print('Error generating product recommendations: $e');
      return [];
    }
  }
}

/// Enhanced Recipe model with nutrition
class EnhancedRecipe {
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

  const EnhancedRecipe({
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
}

/// Activity model for recommendations
class Activity {
  final String name;
  final String emoji;
  final String domain;
  final String description;
  final String duration;
  final List<String> materials;
  final List<String> skills;
  final List<String> steps;

  const Activity({
    required this.name,
    required this.emoji,
    required this.domain,
    required this.description,
    required this.duration,
    this.materials = const [],
    this.skills = const [],
    this.steps = const [],
  });
}

/// Parenting tip model with sources
class ParentingTip {
  final String title;
  final String emoji;
  final String category;
  final String content;
  final String? source;

  const ParentingTip({
    required this.title,
    required this.emoji,
    required this.category,
    required this.content,
    this.source,
  });
}

/// Enhanced product recommendation
class EnhancedProductRecommendation {
  final String name;
  final String emoji;
  final String category;
  final String description;
  final String ageRange;
  final List<String> developmentAreas;
  final String whyRecommended;
  final String? priceRange;
  final String? affiliateUrl;

  const EnhancedProductRecommendation({
    required this.name,
    required this.emoji,
    required this.category,
    required this.description,
    required this.ageRange,
    required this.developmentAreas,
    required this.whyRecommended,
    this.priceRange,
    this.affiliateUrl,
  });
}
