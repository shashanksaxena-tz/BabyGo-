import 'package:equatable/equatable.dart';
import 'child_profile.dart';

enum DevelopmentDomain {
  motor,
  language,
  cognitive,
  social,
}

class WHOSource {
  final String title;
  final String url;
  final String? description;
  final String type;

  const WHOSource({
    required this.title,
    required this.url,
    this.description,
    this.type = 'reference',
  });

  Map<String, dynamic> toJson() => {
    'title': title,
    'url': url,
    'description': description,
    'type': type,
  };

  factory WHOSource.fromJson(Map<String, dynamic> json) => WHOSource(
    title: json['title'],
    url: json['url'],
    description: json['description'],
    type: json['type'] ?? 'reference',
  );
}

class Milestone {
  final String id;
  final String title;
  final String description;
  final DevelopmentDomain domain;
  final int minMonths;
  final int maxMonths;
  final int typicalMonths;
  final WHOSource source;
  final bool isAchieved;
  final DateTime? achievedDate;

  const Milestone({
    required this.id,
    required this.title,
    required this.description,
    required this.domain,
    required this.minMonths,
    required this.maxMonths,
    required this.typicalMonths,
    required this.source,
    this.isAchieved = false,
    this.achievedDate,
  });

  Map<String, dynamic> toJson() => {
    'id': id,
    'title': title,
    'description': description,
    'domain': domain.name,
    'minMonths': minMonths,
    'maxMonths': maxMonths,
    'typicalMonths': typicalMonths,
    'source': source.toJson(),
    'isAchieved': isAchieved,
    'achievedDate': achievedDate?.toIso8601String(),
  };

  factory Milestone.fromJson(Map<String, dynamic> json) => Milestone(
    id: json['id'],
    title: json['title'],
    description: json['description'],
    domain: DevelopmentDomain.values.byName(json['domain']),
    minMonths: json['minMonths'],
    maxMonths: json['maxMonths'],
    typicalMonths: json['typicalMonths'],
    source: WHOSource.fromJson(json['source']),
    isAchieved: json['isAchieved'] ?? false,
    achievedDate: json['achievedDate'] != null
        ? DateTime.parse(json['achievedDate'])
        : null,
  );

  Milestone copyWith({bool? isAchieved, DateTime? achievedDate}) => Milestone(
    id: id,
    title: title,
    description: description,
    domain: domain,
    minMonths: minMonths,
    maxMonths: maxMonths,
    typicalMonths: typicalMonths,
    source: source,
    isAchieved: isAchieved ?? this.isAchieved,
    achievedDate: achievedDate ?? this.achievedDate,
  );
}

class DomainAssessment {
  final DevelopmentDomain domain;
  final double score; // 0-100
  final String status; // 'on_track', 'emerging', 'needs_support'
  final List<String> observations;
  final List<String> strengths;
  final List<String> areasToSupport;
  final List<Milestone> achievedMilestones;
  final List<Milestone> upcomingMilestones;
  final List<String> activities;
  final List<WHOSource> sources;

  const DomainAssessment({
    required this.domain,
    required this.score,
    required this.status,
    this.observations = const [],
    this.strengths = const [],
    this.areasToSupport = const [],
    this.achievedMilestones = const [],
    this.upcomingMilestones = const [],
    this.activities = const [],
    this.sources = const [],
  });

  Map<String, dynamic> toJson() => {
    'domain': domain.name,
    'score': score,
    'status': status,
    'observations': observations,
    'strengths': strengths,
    'areasToSupport': areasToSupport,
    'achievedMilestones': achievedMilestones.map((m) => m.toJson()).toList(),
    'upcomingMilestones': upcomingMilestones.map((m) => m.toJson()).toList(),
    'activities': activities,
    'sources': sources.map((s) => s.toJson()).toList(),
  };

  factory DomainAssessment.fromJson(Map<String, dynamic> json) => DomainAssessment(
    domain: DevelopmentDomain.values.byName(json['domain']),
    score: json['score'].toDouble(),
    status: json['status'],
    observations: List<String>.from(json['observations'] ?? []),
    strengths: List<String>.from(json['strengths'] ?? []),
    areasToSupport: List<String>.from(json['areasToSupport'] ?? []),
    achievedMilestones: (json['achievedMilestones'] as List?)
        ?.map((m) => Milestone.fromJson(m))
        .toList() ?? [],
    upcomingMilestones: (json['upcomingMilestones'] as List?)
        ?.map((m) => Milestone.fromJson(m))
        .toList() ?? [],
    activities: List<String>.from(json['activities'] ?? []),
    sources: (json['sources'] as List?)
        ?.map((s) => WHOSource.fromJson(s))
        .toList() ?? [],
  );

  String get domainName {
    switch (domain) {
      case DevelopmentDomain.motor:
        return 'Motor Skills';
      case DevelopmentDomain.language:
        return 'Language';
      case DevelopmentDomain.cognitive:
        return 'Cognitive';
      case DevelopmentDomain.social:
        return 'Social-Emotional';
    }
  }

  String get domainEmoji {
    switch (domain) {
      case DevelopmentDomain.motor:
        return '🏃';
      case DevelopmentDomain.language:
        return '🗣️';
      case DevelopmentDomain.cognitive:
        return '🧠';
      case DevelopmentDomain.social:
        return '❤️';
    }
  }
}

class GrowthPercentile {
  final String metric; // 'weight', 'height', 'headCircumference'
  final double value;
  final double percentile;
  final String interpretation;
  final WHOSource source;

  const GrowthPercentile({
    required this.metric,
    required this.value,
    required this.percentile,
    required this.interpretation,
    required this.source,
  });

  Map<String, dynamic> toJson() => {
    'metric': metric,
    'value': value,
    'percentile': percentile,
    'interpretation': interpretation,
    'source': source.toJson(),
  };

  factory GrowthPercentile.fromJson(Map<String, dynamic> json) => GrowthPercentile(
    metric: json['metric'],
    value: json['value'].toDouble(),
    percentile: json['percentile'].toDouble(),
    interpretation: json['interpretation'],
    source: WHOSource.fromJson(json['source']),
  );
}

class AnalysisResult extends Equatable {
  final String id;
  final String childId;
  final DateTime timestamp;
  final List<String> mediaFiles;
  final String? audioFile;

  final double overallScore;
  final String overallStatus;
  final String summary;

  final DomainAssessment motorAssessment;
  final DomainAssessment languageAssessment;
  final DomainAssessment cognitiveAssessment;
  final DomainAssessment socialAssessment;

  final List<GrowthPercentile> growthPercentiles;

  final List<String> personalizedTips;
  final List<String> activities;
  final List<WHOSource> allSources;

  const AnalysisResult({
    required this.id,
    required this.childId,
    required this.timestamp,
    this.mediaFiles = const [],
    this.audioFile,
    required this.overallScore,
    required this.overallStatus,
    required this.summary,
    required this.motorAssessment,
    required this.languageAssessment,
    required this.cognitiveAssessment,
    required this.socialAssessment,
    this.growthPercentiles = const [],
    this.personalizedTips = const [],
    this.activities = const [],
    this.allSources = const [],
  });

  List<DomainAssessment> get allAssessments => [
    motorAssessment,
    languageAssessment,
    cognitiveAssessment,
    socialAssessment,
  ];

  Map<String, dynamic> toJson() => {
    'id': id,
    'childId': childId,
    'timestamp': timestamp.toIso8601String(),
    'mediaFiles': mediaFiles,
    'audioFile': audioFile,
    'overallScore': overallScore,
    'overallStatus': overallStatus,
    'summary': summary,
    'motorAssessment': motorAssessment.toJson(),
    'languageAssessment': languageAssessment.toJson(),
    'cognitiveAssessment': cognitiveAssessment.toJson(),
    'socialAssessment': socialAssessment.toJson(),
    'growthPercentiles': growthPercentiles.map((g) => g.toJson()).toList(),
    'personalizedTips': personalizedTips,
    'activities': activities,
    'allSources': allSources.map((s) => s.toJson()).toList(),
  };

  factory AnalysisResult.fromJson(Map<String, dynamic> json) => AnalysisResult(
    id: json['id'],
    childId: json['childId'],
    timestamp: DateTime.parse(json['timestamp']),
    mediaFiles: List<String>.from(json['mediaFiles'] ?? []),
    audioFile: json['audioFile'],
    overallScore: json['overallScore'].toDouble(),
    overallStatus: json['overallStatus'],
    summary: json['summary'],
    motorAssessment: DomainAssessment.fromJson(json['motorAssessment']),
    languageAssessment: DomainAssessment.fromJson(json['languageAssessment']),
    cognitiveAssessment: DomainAssessment.fromJson(json['cognitiveAssessment']),
    socialAssessment: DomainAssessment.fromJson(json['socialAssessment']),
    growthPercentiles: (json['growthPercentiles'] as List?)
        ?.map((g) => GrowthPercentile.fromJson(g))
        .toList() ?? [],
    personalizedTips: List<String>.from(json['personalizedTips'] ?? []),
    activities: List<String>.from(json['activities'] ?? []),
    allSources: (json['allSources'] as List?)
        ?.map((s) => WHOSource.fromJson(s))
        .toList() ?? [],
  );

  @override
  List<Object?> get props => [id, childId, timestamp];
}
