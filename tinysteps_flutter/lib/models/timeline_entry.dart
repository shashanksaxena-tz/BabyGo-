import 'package:equatable/equatable.dart';

enum TimelineEntryType {
  analysis,
  milestone,
  measurement,
  photo,
  note,
}

class TimelineEntry extends Equatable {
  final String id;
  final String childId;
  final TimelineEntryType type;
  final DateTime date;
  final String title;
  final String? description;
  final Map<String, dynamic>? data;
  final String? mediaPath;
  final List<String> tags;

  const TimelineEntry({
    required this.id,
    required this.childId,
    required this.type,
    required this.date,
    required this.title,
    this.description,
    this.data,
    this.mediaPath,
    this.tags = const [],
  });

  Map<String, dynamic> toJson() => {
    'id': id,
    'childId': childId,
    'type': type.name,
    'date': date.toIso8601String(),
    'title': title,
    'description': description,
    'data': data,
    'mediaPath': mediaPath,
    'tags': tags,
  };

  factory TimelineEntry.fromJson(Map<String, dynamic> json) => TimelineEntry(
    id: json['id'],
    childId: json['childId'],
    type: TimelineEntryType.values.byName(json['type']),
    date: DateTime.parse(json['date']),
    title: json['title'],
    description: json['description'],
    data: json['data'],
    mediaPath: json['mediaPath'],
    tags: List<String>.from(json['tags'] ?? []),
  );

  String get typeEmoji {
    switch (type) {
      case TimelineEntryType.analysis:
        return '📊';
      case TimelineEntryType.milestone:
        return '⭐';
      case TimelineEntryType.measurement:
        return '📏';
      case TimelineEntryType.photo:
        return '📸';
      case TimelineEntryType.note:
        return '📝';
    }
  }

  String get typeLabel {
    switch (type) {
      case TimelineEntryType.analysis:
        return 'Analysis';
      case TimelineEntryType.milestone:
        return 'Milestone';
      case TimelineEntryType.measurement:
        return 'Measurement';
      case TimelineEntryType.photo:
        return 'Photo';
      case TimelineEntryType.note:
        return 'Note';
    }
  }

  @override
  List<Object?> get props => [id, childId, type, date];
}

class GrowthMeasurement {
  final String id;
  final String childId;
  final DateTime date;
  final double? weight;
  final double? height;
  final double? headCircumference;
  final String? notes;

  const GrowthMeasurement({
    required this.id,
    required this.childId,
    required this.date,
    this.weight,
    this.height,
    this.headCircumference,
    this.notes,
  });

  Map<String, dynamic> toJson() => {
    'id': id,
    'childId': childId,
    'date': date.toIso8601String(),
    'weight': weight,
    'height': height,
    'headCircumference': headCircumference,
    'notes': notes,
  };

  factory GrowthMeasurement.fromJson(Map<String, dynamic> json) =>
      GrowthMeasurement(
        id: json['id'],
        childId: json['childId'],
        date: DateTime.parse(json['date']),
        weight: json['weight']?.toDouble(),
        height: json['height']?.toDouble(),
        headCircumference: json['headCircumference']?.toDouble(),
        notes: json['notes'],
      );
}
