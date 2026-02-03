import 'package:equatable/equatable.dart';

class StoryTheme {
  final String id;
  final String name;
  final String emoji;
  final String description;
  final List<String> keywords;
  final String colorHex;

  const StoryTheme({
    required this.id,
    required this.name,
    required this.emoji,
    required this.description,
    this.keywords = const [],
    required this.colorHex,
  });

  static const List<StoryTheme> themes = [
    StoryTheme(
      id: 'adventure',
      name: 'Adventure',
      emoji: '🏔️',
      description: 'Exciting journeys and discoveries',
      keywords: ['explore', 'discover', 'brave', 'journey'],
      colorHex: '#F59E0B',
    ),
    StoryTheme(
      id: 'animals',
      name: 'Animals',
      emoji: '🦁',
      description: 'Stories with animal friends',
      keywords: ['animals', 'forest', 'jungle', 'friends'],
      colorHex: '#10B981',
    ),
    StoryTheme(
      id: 'space',
      name: 'Space',
      emoji: '🚀',
      description: 'Cosmic adventures among stars',
      keywords: ['stars', 'planets', 'rocket', 'astronaut'],
      colorHex: '#6366F1',
    ),
    StoryTheme(
      id: 'ocean',
      name: 'Ocean',
      emoji: '🌊',
      description: 'Underwater magical worlds',
      keywords: ['sea', 'fish', 'mermaid', 'treasure'],
      colorHex: '#0EA5E9',
    ),
    StoryTheme(
      id: 'magic',
      name: 'Magic',
      emoji: '✨',
      description: 'Enchanted tales with wonder',
      keywords: ['magic', 'fairy', 'wizard', 'spell'],
      colorHex: '#A855F7',
    ),
    StoryTheme(
      id: 'dinosaurs',
      name: 'Dinosaurs',
      emoji: '🦕',
      description: 'Prehistoric adventures',
      keywords: ['dinosaur', 'prehistoric', 'roar', 'fossil'],
      colorHex: '#84CC16',
    ),
    StoryTheme(
      id: 'dreams',
      name: 'Dreams',
      emoji: '🌙',
      description: 'Gentle, sleepy stories',
      keywords: ['sleep', 'dream', 'moon', 'stars', 'calm'],
      colorHex: '#8B5CF6',
    ),
    StoryTheme(
      id: 'friendship',
      name: 'Friendship',
      emoji: '🤝',
      description: 'Stories about being a good friend',
      keywords: ['friend', 'share', 'help', 'together'],
      colorHex: '#EC4899',
    ),
  ];
}

class StoryPage {
  final int pageNumber;
  final String text;
  final String? illustrationPrompt;
  final String? illustrationUrl;
  final int readingTimeSeconds;

  const StoryPage({
    required this.pageNumber,
    required this.text,
    this.illustrationPrompt,
    this.illustrationUrl,
    this.readingTimeSeconds = 30,
  });

  Map<String, dynamic> toJson() => {
    'pageNumber': pageNumber,
    'text': text,
    'illustrationPrompt': illustrationPrompt,
    'illustrationUrl': illustrationUrl,
    'readingTimeSeconds': readingTimeSeconds,
  };

  factory StoryPage.fromJson(Map<String, dynamic> json) => StoryPage(
    pageNumber: json['pageNumber'],
    text: json['text'],
    illustrationPrompt: json['illustrationPrompt'],
    illustrationUrl: json['illustrationUrl'],
    readingTimeSeconds: json['readingTimeSeconds'] ?? 30,
  );
}

class BedtimeStory extends Equatable {
  final String id;
  final String childId;
  final String title;
  final StoryTheme theme;
  final List<StoryPage> pages;
  final String moral;
  final int ageMonths;
  final DateTime createdAt;
  final bool isFavorite;
  final int timesRead;

  const BedtimeStory({
    required this.id,
    required this.childId,
    required this.title,
    required this.theme,
    required this.pages,
    required this.moral,
    required this.ageMonths,
    required this.createdAt,
    this.isFavorite = false,
    this.timesRead = 0,
  });

  int get totalReadingTimeSeconds =>
      pages.fold(0, (sum, page) => sum + page.readingTimeSeconds);

  String get readingTimeDisplay {
    final minutes = totalReadingTimeSeconds ~/ 60;
    return '$minutes min read';
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'childId': childId,
    'title': title,
    'themeId': theme.id,
    'pages': pages.map((p) => p.toJson()).toList(),
    'moral': moral,
    'ageMonths': ageMonths,
    'createdAt': createdAt.toIso8601String(),
    'isFavorite': isFavorite,
    'timesRead': timesRead,
  };

  factory BedtimeStory.fromJson(Map<String, dynamic> json) {
    final themeId = json['themeId'];
    final theme = StoryTheme.themes.firstWhere(
      (t) => t.id == themeId,
      orElse: () => StoryTheme.themes.first,
    );

    return BedtimeStory(
      id: json['id'],
      childId: json['childId'],
      title: json['title'],
      theme: theme,
      pages: (json['pages'] as List)
          .map((p) => StoryPage.fromJson(p))
          .toList(),
      moral: json['moral'],
      ageMonths: json['ageMonths'],
      createdAt: DateTime.parse(json['createdAt']),
      isFavorite: json['isFavorite'] ?? false,
      timesRead: json['timesRead'] ?? 0,
    );
  }

  BedtimeStory copyWith({
    bool? isFavorite,
    int? timesRead,
  }) {
    return BedtimeStory(
      id: id,
      childId: childId,
      title: title,
      theme: theme,
      pages: pages,
      moral: moral,
      ageMonths: ageMonths,
      createdAt: createdAt,
      isFavorite: isFavorite ?? this.isFavorite,
      timesRead: timesRead ?? this.timesRead,
    );
  }

  @override
  List<Object?> get props => [id, childId, title];
}
