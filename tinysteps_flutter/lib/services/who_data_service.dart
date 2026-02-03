import '../models/analysis_result.dart';
import '../models/child_profile.dart';

/// WHO Data Service - Provides WHO developmental milestones, growth standards,
/// and official source citations for child development analysis.
class WHODataService {
  // Official WHO Sources with URLs
  static const List<WHOSource> whoSources = [
    WHOSource(
      title: 'WHO Motor Development Study',
      url: 'https://www.who.int/publications/i/item/WHO-TRS-1006',
      description: 'WHO Multicentre Growth Reference Study: Motor development milestones',
      type: 'study',
    ),
    WHOSource(
      title: 'WHO Child Growth Standards',
      url: 'https://www.who.int/tools/child-growth-standards',
      description: 'WHO Child Growth Standards: Methods and development',
      type: 'standard',
    ),
    WHOSource(
      title: 'WHO Developmental Milestones',
      url: 'https://www.who.int/publications/i/item/9789241596503',
      description: 'WHO Motor Development Study: Windows of achievement',
      type: 'study',
    ),
    WHOSource(
      title: 'UNICEF Early Childhood Development',
      url: 'https://www.unicef.org/early-childhood-development',
      description: 'Evidence-based early childhood development resources',
      type: 'reference',
    ),
    WHOSource(
      title: 'WHO Nurturing Care Framework',
      url: 'https://nurturing-care.org',
      description: 'Framework for early childhood development',
      type: 'framework',
    ),
    WHOSource(
      title: 'CDC Developmental Milestones',
      url: 'https://www.cdc.gov/ncbddd/actearly/milestones/index.html',
      description: 'Learn the Signs. Act Early. Developmental milestones',
      type: 'reference',
    ),
  ];

  // Regional health sources by WHO region
  static Map<WHORegion, List<WHOSource>> regionalSources = {
    WHORegion.afro: [
      const WHOSource(
        title: 'WHO Africa Region',
        url: 'https://www.afro.who.int/health-topics/child-health',
        description: 'WHO Regional Office for Africa - Child Health',
        type: 'regional',
      ),
    ],
    WHORegion.amro: [
      const WHOSource(
        title: 'PAHO Child Development',
        url: 'https://www.paho.org/en/topics/child-health',
        description: 'Pan American Health Organization - Child Health',
        type: 'regional',
      ),
    ],
    WHORegion.searo: [
      const WHOSource(
        title: 'WHO South-East Asia Region',
        url: 'https://www.who.int/southeastasia/health-topics/child-health',
        description: 'WHO Regional Office for South-East Asia - Child Health',
        type: 'regional',
      ),
    ],
    WHORegion.euro: [
      const WHOSource(
        title: 'WHO Europe Child Health',
        url: 'https://www.who.int/europe/health-topics/child-health',
        description: 'WHO Regional Office for Europe - Child Health',
        type: 'regional',
      ),
    ],
    WHORegion.emro: [
      const WHOSource(
        title: 'WHO Eastern Mediterranean',
        url: 'https://www.emro.who.int/child-health/index.html',
        description: 'WHO Regional Office for Eastern Mediterranean',
        type: 'regional',
      ),
    ],
    WHORegion.wpro: [
      const WHOSource(
        title: 'WHO Western Pacific',
        url: 'https://www.who.int/westernpacific/health-topics/child-health',
        description: 'WHO Regional Office for Western Pacific - Child Health',
        type: 'regional',
      ),
    ],
  };

  // Motor Milestones based on WHO Multicentre Growth Reference Study
  static final List<Milestone> motorMilestones = [
    Milestone(
      id: 'motor_head_control',
      title: 'Head Control',
      description: 'Holds head steady when supported in sitting',
      domain: DevelopmentDomain.motor,
      minMonths: 1,
      maxMonths: 4,
      typicalMonths: 2,
      source: whoSources[2],
    ),
    Milestone(
      id: 'motor_rolling',
      title: 'Rolling Over',
      description: 'Rolls from back to stomach and back again',
      domain: DevelopmentDomain.motor,
      minMonths: 2,
      maxMonths: 7,
      typicalMonths: 4,
      source: whoSources[2],
    ),
    Milestone(
      id: 'motor_sitting_support',
      title: 'Sitting with Support',
      description: 'Sits with support or propped up',
      domain: DevelopmentDomain.motor,
      minMonths: 4,
      maxMonths: 8,
      typicalMonths: 5,
      source: whoSources[0],
    ),
    Milestone(
      id: 'motor_sitting_alone',
      title: 'Sitting Without Support',
      description: 'Sits alone without support for extended periods',
      domain: DevelopmentDomain.motor,
      minMonths: 4,
      maxMonths: 9,
      typicalMonths: 6,
      source: whoSources[0],
    ),
    Milestone(
      id: 'motor_crawling',
      title: 'Crawling',
      description: 'Moves by crawling on hands and knees',
      domain: DevelopmentDomain.motor,
      minMonths: 5,
      maxMonths: 13,
      typicalMonths: 8,
      source: whoSources[0],
    ),
    Milestone(
      id: 'motor_standing_support',
      title: 'Standing with Assistance',
      description: 'Pulls to stand and stands holding on',
      domain: DevelopmentDomain.motor,
      minMonths: 5,
      maxMonths: 11,
      typicalMonths: 8,
      source: whoSources[0],
    ),
    Milestone(
      id: 'motor_walking_support',
      title: 'Walking with Assistance',
      description: 'Takes steps while holding onto support',
      domain: DevelopmentDomain.motor,
      minMonths: 6,
      maxMonths: 14,
      typicalMonths: 9,
      source: whoSources[0],
    ),
    Milestone(
      id: 'motor_standing_alone',
      title: 'Standing Alone',
      description: 'Stands alone without support',
      domain: DevelopmentDomain.motor,
      minMonths: 7,
      maxMonths: 17,
      typicalMonths: 11,
      source: whoSources[0],
    ),
    Milestone(
      id: 'motor_walking_alone',
      title: 'Walking Alone',
      description: 'Takes several steps independently',
      domain: DevelopmentDomain.motor,
      minMonths: 8,
      maxMonths: 18,
      typicalMonths: 12,
      source: whoSources[0],
    ),
    Milestone(
      id: 'motor_running',
      title: 'Running',
      description: 'Runs with coordination',
      domain: DevelopmentDomain.motor,
      minMonths: 15,
      maxMonths: 24,
      typicalMonths: 18,
      source: whoSources[5],
    ),
    Milestone(
      id: 'motor_climbing',
      title: 'Climbing',
      description: 'Climbs stairs with support, climbs on furniture',
      domain: DevelopmentDomain.motor,
      minMonths: 12,
      maxMonths: 24,
      typicalMonths: 18,
      source: whoSources[5],
    ),
    Milestone(
      id: 'motor_kicking',
      title: 'Kicking Ball',
      description: 'Kicks a ball forward',
      domain: DevelopmentDomain.motor,
      minMonths: 18,
      maxMonths: 30,
      typicalMonths: 24,
      source: whoSources[5],
    ),
  ];

  // Language Milestones
  static final List<Milestone> languageMilestones = [
    Milestone(
      id: 'lang_cooing',
      title: 'Cooing',
      description: 'Makes cooing sounds, vowel-like sounds',
      domain: DevelopmentDomain.language,
      minMonths: 1,
      maxMonths: 4,
      typicalMonths: 2,
      source: whoSources[5],
    ),
    Milestone(
      id: 'lang_laughing',
      title: 'Laughing',
      description: 'Laughs out loud',
      domain: DevelopmentDomain.language,
      minMonths: 2,
      maxMonths: 6,
      typicalMonths: 4,
      source: whoSources[5],
    ),
    Milestone(
      id: 'lang_babbling',
      title: 'Babbling',
      description: 'Makes babbling sounds like "ba-ba" or "ma-ma"',
      domain: DevelopmentDomain.language,
      minMonths: 4,
      maxMonths: 10,
      typicalMonths: 6,
      source: whoSources[5],
    ),
    Milestone(
      id: 'lang_responds_name',
      title: 'Responds to Name',
      description: 'Turns head when name is called',
      domain: DevelopmentDomain.language,
      minMonths: 5,
      maxMonths: 10,
      typicalMonths: 7,
      source: whoSources[5],
    ),
    Milestone(
      id: 'lang_gestures',
      title: 'Using Gestures',
      description: 'Waves bye-bye, points to things',
      domain: DevelopmentDomain.language,
      minMonths: 7,
      maxMonths: 13,
      typicalMonths: 9,
      source: whoSources[5],
    ),
    Milestone(
      id: 'lang_first_words',
      title: 'First Words',
      description: 'Says first meaningful words like "mama" or "dada"',
      domain: DevelopmentDomain.language,
      minMonths: 8,
      maxMonths: 15,
      typicalMonths: 12,
      source: whoSources[5],
    ),
    Milestone(
      id: 'lang_10_words',
      title: '10+ Words',
      description: 'Uses 10 or more words',
      domain: DevelopmentDomain.language,
      minMonths: 12,
      maxMonths: 21,
      typicalMonths: 18,
      source: whoSources[5],
    ),
    Milestone(
      id: 'lang_two_words',
      title: 'Two-Word Phrases',
      description: 'Combines two words like "more milk"',
      domain: DevelopmentDomain.language,
      minMonths: 18,
      maxMonths: 30,
      typicalMonths: 24,
      source: whoSources[5],
    ),
    Milestone(
      id: 'lang_50_words',
      title: '50+ Words',
      description: 'Uses 50 or more words',
      domain: DevelopmentDomain.language,
      minMonths: 18,
      maxMonths: 30,
      typicalMonths: 24,
      source: whoSources[5],
    ),
    Milestone(
      id: 'lang_sentences',
      title: 'Simple Sentences',
      description: 'Speaks in sentences of 3+ words',
      domain: DevelopmentDomain.language,
      minMonths: 24,
      maxMonths: 36,
      typicalMonths: 30,
      source: whoSources[5],
    ),
  ];

  // Cognitive Milestones
  static final List<Milestone> cognitiveMilestones = [
    Milestone(
      id: 'cog_follows_objects',
      title: 'Visual Tracking',
      description: 'Follows moving objects with eyes',
      domain: DevelopmentDomain.cognitive,
      minMonths: 1,
      maxMonths: 3,
      typicalMonths: 2,
      source: whoSources[5],
    ),
    Milestone(
      id: 'cog_reaches_objects',
      title: 'Reaching for Objects',
      description: 'Reaches out to grab objects',
      domain: DevelopmentDomain.cognitive,
      minMonths: 3,
      maxMonths: 6,
      typicalMonths: 4,
      source: whoSources[5],
    ),
    Milestone(
      id: 'cog_object_permanence',
      title: 'Object Permanence',
      description: 'Looks for hidden objects',
      domain: DevelopmentDomain.cognitive,
      minMonths: 6,
      maxMonths: 12,
      typicalMonths: 8,
      source: whoSources[5],
    ),
    Milestone(
      id: 'cog_cause_effect',
      title: 'Cause and Effect',
      description: 'Understands simple cause and effect',
      domain: DevelopmentDomain.cognitive,
      minMonths: 6,
      maxMonths: 12,
      typicalMonths: 9,
      source: whoSources[5],
    ),
    Milestone(
      id: 'cog_imitation',
      title: 'Imitation',
      description: 'Imitates actions and sounds',
      domain: DevelopmentDomain.cognitive,
      minMonths: 7,
      maxMonths: 14,
      typicalMonths: 10,
      source: whoSources[5],
    ),
    Milestone(
      id: 'cog_problem_solving',
      title: 'Simple Problem Solving',
      description: 'Tries different ways to get what they want',
      domain: DevelopmentDomain.cognitive,
      minMonths: 10,
      maxMonths: 18,
      typicalMonths: 12,
      source: whoSources[5],
    ),
    Milestone(
      id: 'cog_pretend_play',
      title: 'Pretend Play',
      description: 'Engages in simple pretend play',
      domain: DevelopmentDomain.cognitive,
      minMonths: 12,
      maxMonths: 24,
      typicalMonths: 18,
      source: whoSources[5],
    ),
    Milestone(
      id: 'cog_sorting',
      title: 'Sorting by Shape/Color',
      description: 'Sorts objects by shape or color',
      domain: DevelopmentDomain.cognitive,
      minMonths: 18,
      maxMonths: 30,
      typicalMonths: 24,
      source: whoSources[5],
    ),
    Milestone(
      id: 'cog_counting',
      title: 'Counting Begins',
      description: 'Counts to 3 or higher',
      domain: DevelopmentDomain.cognitive,
      minMonths: 24,
      maxMonths: 36,
      typicalMonths: 30,
      source: whoSources[5],
    ),
  ];

  // Social-Emotional Milestones
  static final List<Milestone> socialMilestones = [
    Milestone(
      id: 'social_social_smile',
      title: 'Social Smile',
      description: 'Smiles in response to others',
      domain: DevelopmentDomain.social,
      minMonths: 1,
      maxMonths: 4,
      typicalMonths: 2,
      source: whoSources[5],
    ),
    Milestone(
      id: 'social_eye_contact',
      title: 'Eye Contact',
      description: 'Makes and maintains eye contact',
      domain: DevelopmentDomain.social,
      minMonths: 1,
      maxMonths: 3,
      typicalMonths: 2,
      source: whoSources[5],
    ),
    Milestone(
      id: 'social_recognizes_faces',
      title: 'Recognizes Familiar Faces',
      description: 'Shows recognition of familiar people',
      domain: DevelopmentDomain.social,
      minMonths: 2,
      maxMonths: 5,
      typicalMonths: 3,
      source: whoSources[5],
    ),
    Milestone(
      id: 'social_stranger_anxiety',
      title: 'Stranger Anxiety',
      description: 'Shows awareness of unfamiliar people',
      domain: DevelopmentDomain.social,
      minMonths: 6,
      maxMonths: 12,
      typicalMonths: 8,
      source: whoSources[5],
    ),
    Milestone(
      id: 'social_plays_peek',
      title: 'Plays Peek-a-boo',
      description: 'Enjoys interactive games like peek-a-boo',
      domain: DevelopmentDomain.social,
      minMonths: 6,
      maxMonths: 12,
      typicalMonths: 9,
      source: whoSources[5],
    ),
    Milestone(
      id: 'social_shows_affection',
      title: 'Shows Affection',
      description: 'Hugs, kisses, or shows affection to familiar people',
      domain: DevelopmentDomain.social,
      minMonths: 9,
      maxMonths: 18,
      typicalMonths: 12,
      source: whoSources[5],
    ),
    Milestone(
      id: 'social_parallel_play',
      title: 'Parallel Play',
      description: 'Plays alongside other children',
      domain: DevelopmentDomain.social,
      minMonths: 12,
      maxMonths: 24,
      typicalMonths: 18,
      source: whoSources[5],
    ),
    Milestone(
      id: 'social_emotions',
      title: 'Shows Various Emotions',
      description: 'Expresses a range of emotions clearly',
      domain: DevelopmentDomain.social,
      minMonths: 12,
      maxMonths: 24,
      typicalMonths: 18,
      source: whoSources[5],
    ),
    Milestone(
      id: 'social_interactive_play',
      title: 'Interactive Play',
      description: 'Begins to play with other children',
      domain: DevelopmentDomain.social,
      minMonths: 24,
      maxMonths: 36,
      typicalMonths: 30,
      source: whoSources[5],
    ),
    Milestone(
      id: 'social_empathy',
      title: 'Shows Empathy',
      description: 'Shows concern when others are upset',
      domain: DevelopmentDomain.social,
      minMonths: 18,
      maxMonths: 30,
      typicalMonths: 24,
      source: whoSources[5],
    ),
  ];

  /// Get all milestones for a specific age range
  static List<Milestone> getMilestonesForAge(int ageMonths) {
    final allMilestones = [
      ...motorMilestones,
      ...languageMilestones,
      ...cognitiveMilestones,
      ...socialMilestones,
    ];

    // Get milestones that are relevant for this age
    // Include milestones where the child is within the achievement window
    // or up to 3 months ahead (upcoming milestones)
    return allMilestones.where((m) {
      return ageMonths >= m.minMonths - 1 && ageMonths <= m.maxMonths + 3;
    }).toList();
  }

  /// Get milestones by domain for a specific age
  static List<Milestone> getMilestonesByDomain(
    DevelopmentDomain domain,
    int ageMonths,
  ) {
    List<Milestone> domainMilestones;
    switch (domain) {
      case DevelopmentDomain.motor:
        domainMilestones = motorMilestones;
        break;
      case DevelopmentDomain.language:
        domainMilestones = languageMilestones;
        break;
      case DevelopmentDomain.cognitive:
        domainMilestones = cognitiveMilestones;
        break;
      case DevelopmentDomain.social:
        domainMilestones = socialMilestones;
        break;
    }

    return domainMilestones.where((m) {
      return ageMonths >= m.minMonths - 1 && ageMonths <= m.maxMonths + 3;
    }).toList();
  }

  /// Get sources for a specific region
  static List<WHOSource> getSourcesForRegion(WHORegion region) {
    return [...whoSources, ...(regionalSources[region] ?? [])];
  }

  // WHO Growth Standards Data (simplified percentile calculations)
  // Based on WHO Child Growth Standards

  /// Calculate weight percentile based on WHO standards
  static double calculateWeightPercentile({
    required double weightKg,
    required int ageMonths,
    required Gender gender,
  }) {
    // Simplified WHO weight-for-age median values (kg)
    // Boys and girls have slightly different curves
    final medianWeights = gender == Gender.female ? _girlsWeightMedian : _boysWeightMedian;

    final ageIndex = ageMonths.clamp(0, medianWeights.length - 1);
    final median = medianWeights[ageIndex];

    // Simplified z-score calculation
    // Standard deviation is approximately 10-12% of median for weight
    final sd = median * 0.11;
    final zScore = (weightKg - median) / sd;

    // Convert z-score to percentile (simplified)
    return _zScoreToPercentile(zScore);
  }

  /// Calculate height percentile based on WHO standards
  static double calculateHeightPercentile({
    required double heightCm,
    required int ageMonths,
    required Gender gender,
  }) {
    final medianHeights = gender == Gender.female ? _girlsHeightMedian : _boysHeightMedian;

    final ageIndex = ageMonths.clamp(0, medianHeights.length - 1);
    final median = medianHeights[ageIndex];

    // Standard deviation is approximately 3-4% of median for height
    final sd = median * 0.035;
    final zScore = (heightCm - median) / sd;

    return _zScoreToPercentile(zScore);
  }

  /// Calculate head circumference percentile
  static double calculateHeadCircumferencePercentile({
    required double headCircumferenceCm,
    required int ageMonths,
    required Gender gender,
  }) {
    final medianHC = gender == Gender.female ? _girlsHCMedian : _boysHCMedian;

    final ageIndex = ageMonths.clamp(0, medianHC.length - 1);
    final median = medianHC[ageIndex];

    final sd = median * 0.025; // HC has smaller variance
    final zScore = (headCircumferenceCm - median) / sd;

    return _zScoreToPercentile(zScore);
  }

  /// Get interpretation of percentile
  static String interpretPercentile(double percentile) {
    if (percentile < 3) {
      return 'Below typical range - consult pediatrician';
    } else if (percentile < 15) {
      return 'Lower end of typical range';
    } else if (percentile < 85) {
      return 'Within typical range';
    } else if (percentile < 97) {
      return 'Higher end of typical range';
    } else {
      return 'Above typical range - consult pediatrician';
    }
  }

  /// Get all growth percentiles for a child
  static List<GrowthPercentile> assessGrowth(ChildProfile child) {
    final results = <GrowthPercentile>[];

    // Weight percentile
    final weightPercentile = calculateWeightPercentile(
      weightKg: child.weight,
      ageMonths: child.ageInMonths,
      gender: child.gender,
    );
    results.add(GrowthPercentile(
      metric: 'weight',
      value: child.weight,
      percentile: weightPercentile,
      interpretation: interpretPercentile(weightPercentile),
      source: whoSources[1],
    ));

    // Height percentile
    final heightPercentile = calculateHeightPercentile(
      heightCm: child.height,
      ageMonths: child.ageInMonths,
      gender: child.gender,
    );
    results.add(GrowthPercentile(
      metric: 'height',
      value: child.height,
      percentile: heightPercentile,
      interpretation: interpretPercentile(heightPercentile),
      source: whoSources[1],
    ));

    // Head circumference (if available and age < 36 months)
    if (child.headCircumference != null && child.ageInMonths < 36) {
      final hcPercentile = calculateHeadCircumferencePercentile(
        headCircumferenceCm: child.headCircumference!,
        ageMonths: child.ageInMonths,
        gender: child.gender,
      );
      results.add(GrowthPercentile(
        metric: 'headCircumference',
        value: child.headCircumference!,
        percentile: hcPercentile,
        interpretation: interpretPercentile(hcPercentile),
        source: whoSources[1],
      ));
    }

    return results;
  }

  // Simplified z-score to percentile conversion
  static double _zScoreToPercentile(double zScore) {
    // Using a simplified approximation of the standard normal CDF
    // Clamp extreme values
    final z = zScore.clamp(-4.0, 4.0);

    // Approximation using logistic function
    final percentile = 100 / (1 + exp(-1.7 * z));
    return percentile.clamp(0.1, 99.9);
  }

  // WHO median values for boys weight (kg) by month (0-36)
  static const List<double> _boysWeightMedian = [
    3.3, 4.5, 5.6, 6.4, 7.0, 7.5, 7.9, 8.3, 8.6, 8.9, 9.2, 9.4, 9.6,
    9.9, 10.1, 10.3, 10.5, 10.7, 10.9, 11.1, 11.3, 11.5, 11.8, 12.0, 12.2,
    12.4, 12.5, 12.7, 12.9, 13.1, 13.3, 13.5, 13.7, 13.8, 14.0, 14.2, 14.3,
  ];

  // WHO median values for girls weight (kg) by month (0-36)
  static const List<double> _girlsWeightMedian = [
    3.2, 4.2, 5.1, 5.8, 6.4, 6.9, 7.3, 7.6, 7.9, 8.2, 8.5, 8.7, 8.9,
    9.2, 9.4, 9.6, 9.8, 10.0, 10.2, 10.4, 10.6, 10.9, 11.1, 11.3, 11.5,
    11.7, 11.9, 12.1, 12.3, 12.5, 12.7, 12.9, 13.1, 13.3, 13.5, 13.7, 13.9,
  ];

  // WHO median values for boys height (cm) by month (0-36)
  static const List<double> _boysHeightMedian = [
    49.9, 54.7, 58.4, 61.4, 63.9, 65.9, 67.6, 69.2, 70.6, 72.0, 73.3, 74.5, 75.7,
    76.9, 78.0, 79.1, 80.2, 81.2, 82.3, 83.2, 84.2, 85.1, 86.0, 86.9, 87.8,
    88.0, 88.8, 89.6, 90.4, 91.2, 91.9, 92.7, 93.4, 94.1, 94.8, 95.4, 96.1,
  ];

  // WHO median values for girls height (cm) by month (0-36)
  static const List<double> _girlsHeightMedian = [
    49.1, 53.7, 57.1, 59.8, 62.1, 64.0, 65.7, 67.3, 68.7, 70.1, 71.5, 72.8, 74.0,
    75.2, 76.4, 77.5, 78.6, 79.7, 80.7, 81.7, 82.7, 83.7, 84.6, 85.5, 86.4,
    86.6, 87.4, 88.3, 89.1, 89.9, 90.7, 91.4, 92.2, 92.9, 93.6, 94.4, 95.1,
  ];

  // WHO median values for boys head circumference (cm) by month (0-36)
  static const List<double> _boysHCMedian = [
    34.5, 37.3, 39.1, 40.5, 41.6, 42.6, 43.3, 44.0, 44.5, 45.0, 45.4, 45.8, 46.1,
    46.3, 46.6, 46.8, 47.0, 47.2, 47.4, 47.5, 47.7, 47.8, 48.0, 48.1, 48.3,
    48.4, 48.5, 48.6, 48.8, 48.9, 49.0, 49.1, 49.2, 49.3, 49.4, 49.5, 49.6,
  ];

  // WHO median values for girls head circumference (cm) by month (0-36)
  static const List<double> _girlsHCMedian = [
    33.9, 36.5, 38.3, 39.5, 40.6, 41.5, 42.2, 42.8, 43.4, 43.8, 44.2, 44.6, 44.9,
    45.2, 45.4, 45.7, 45.9, 46.1, 46.2, 46.4, 46.6, 46.7, 46.9, 47.0, 47.2,
    47.3, 47.4, 47.5, 47.6, 47.8, 47.9, 48.0, 48.1, 48.2, 48.3, 48.4, 48.5,
  ];
}

// Helper function
double exp(double x) => 2.718281828459045 * x.abs() < 700
    ? (x >= 0 ? _exp(x) : 1 / _exp(-x))
    : (x >= 0 ? double.maxFinite : 0);

double _exp(double x) {
  double result = 1.0;
  double term = 1.0;
  for (int i = 1; i <= 100; i++) {
    term *= x / i;
    result += term;
    if (term.abs() < 1e-15) break;
  }
  return result;
}
