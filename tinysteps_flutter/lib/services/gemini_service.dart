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
  Future<List<Recipe>> generateRecipes({
    required ChildProfile child,
    int count = 3,
  }) async {
    if (!_isInitialized) {
      throw Exception('GeminiService not initialized');
    }

    final prompt = '''
Create $count age-appropriate recipes for a ${child.ageInMonths}-month-old child.

Consider:
- Age-appropriate textures and ingredients
- Nutritional needs for this age
- Easy preparation
- WHO feeding guidelines

Respond in JSON format:
{
  "recipes": [
    {
      "name": "Recipe Name",
      "description": "Brief description",
      "ingredients": ["ingredient1", "ingredient2"],
      "instructions": ["step1", "step2"],
      "prepTime": "10 mins",
      "cookTime": "15 mins",
      "nutritionHighlights": ["Iron-rich", "Good source of protein"],
      "allergens": ["dairy"],
      "difficulty": "Easy"
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
          instructions: List<String>.from(r['instructions'] ?? []),
          prepTime: r['prepTime'] ?? '',
          cookTime: r['cookTime'] ?? '',
          nutritionHighlights: List<String>.from(r['nutritionHighlights'] ?? []),
          allergens: List<String>.from(r['allergens'] ?? []),
          difficulty: r['difficulty'] ?? 'Easy',
        )).toList();
      }

      return [];
    } catch (e) {
      print('Error generating recipes: $e');
      return [];
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
}
