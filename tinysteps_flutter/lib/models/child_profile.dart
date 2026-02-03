import 'package:equatable/equatable.dart';
import 'package:hive/hive.dart';

part 'child_profile.g.dart';

enum Gender { male, female, other }

enum WHORegion {
  afro,  // African Region
  amro,  // Region of the Americas
  searo, // South-East Asia Region
  euro,  // European Region
  emro,  // Eastern Mediterranean Region
  wpro,  // Western Pacific Region
}

@HiveType(typeId: 0)
class ChildProfile extends Equatable {
  @HiveField(0)
  final String id;

  @HiveField(1)
  final String name;

  @HiveField(2)
  final String? nickname;

  @HiveField(3)
  final DateTime dateOfBirth;

  @HiveField(4)
  final Gender gender;

  @HiveField(5)
  final double weight; // in kg

  @HiveField(6)
  final double height; // in cm

  @HiveField(7)
  final double? headCircumference; // for babies < 2 years

  @HiveField(8)
  final WHORegion region;

  @HiveField(9)
  final List<String> interests;

  @HiveField(10)
  final List<String> favoriteCharacters;

  @HiveField(11)
  final List<String> favoriteToys;

  @HiveField(12)
  final List<String> favoriteColors;

  @HiveField(13)
  final String? profilePhotoPath;

  @HiveField(14)
  final DateTime createdAt;

  @HiveField(15)
  final DateTime updatedAt;

  const ChildProfile({
    required this.id,
    required this.name,
    this.nickname,
    required this.dateOfBirth,
    required this.gender,
    required this.weight,
    required this.height,
    this.headCircumference,
    required this.region,
    this.interests = const [],
    this.favoriteCharacters = const [],
    this.favoriteToys = const [],
    this.favoriteColors = const [],
    this.profilePhotoPath,
    required this.createdAt,
    required this.updatedAt,
  });

  int get ageInMonths {
    final now = DateTime.now();
    return (now.year - dateOfBirth.year) * 12 +
           (now.month - dateOfBirth.month);
  }

  int get ageInDays {
    return DateTime.now().difference(dateOfBirth).inDays;
  }

  String get displayAge {
    final months = ageInMonths;
    if (months < 1) {
      final days = ageInDays;
      return '$days day${days == 1 ? '' : 's'}';
    } else if (months < 24) {
      return '$months month${months == 1 ? '' : 's'}';
    } else {
      final years = months ~/ 12;
      final remainingMonths = months % 12;
      if (remainingMonths == 0) {
        return '$years year${years == 1 ? '' : 's'}';
      }
      return '$years year${years == 1 ? '' : 's'}, $remainingMonths month${remainingMonths == 1 ? '' : 's'}';
    }
  }

  String get displayName => nickname ?? name;

  ChildProfile copyWith({
    String? id,
    String? name,
    String? nickname,
    DateTime? dateOfBirth,
    Gender? gender,
    double? weight,
    double? height,
    double? headCircumference,
    WHORegion? region,
    List<String>? interests,
    List<String>? favoriteCharacters,
    List<String>? favoriteToys,
    List<String>? favoriteColors,
    String? profilePhotoPath,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return ChildProfile(
      id: id ?? this.id,
      name: name ?? this.name,
      nickname: nickname ?? this.nickname,
      dateOfBirth: dateOfBirth ?? this.dateOfBirth,
      gender: gender ?? this.gender,
      weight: weight ?? this.weight,
      height: height ?? this.height,
      headCircumference: headCircumference ?? this.headCircumference,
      region: region ?? this.region,
      interests: interests ?? this.interests,
      favoriteCharacters: favoriteCharacters ?? this.favoriteCharacters,
      favoriteToys: favoriteToys ?? this.favoriteToys,
      favoriteColors: favoriteColors ?? this.favoriteColors,
      profilePhotoPath: profilePhotoPath ?? this.profilePhotoPath,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'name': name,
    'nickname': nickname,
    'dateOfBirth': dateOfBirth.toIso8601String(),
    'gender': gender.name,
    'weight': weight,
    'height': height,
    'headCircumference': headCircumference,
    'region': region.name,
    'interests': interests,
    'favoriteCharacters': favoriteCharacters,
    'favoriteToys': favoriteToys,
    'favoriteColors': favoriteColors,
    'profilePhotoPath': profilePhotoPath,
    'createdAt': createdAt.toIso8601String(),
    'updatedAt': updatedAt.toIso8601String(),
  };

  factory ChildProfile.fromJson(Map<String, dynamic> json) => ChildProfile(
    id: json['id'],
    name: json['name'],
    nickname: json['nickname'],
    dateOfBirth: DateTime.parse(json['dateOfBirth']),
    gender: Gender.values.byName(json['gender']),
    weight: json['weight'].toDouble(),
    height: json['height'].toDouble(),
    headCircumference: json['headCircumference']?.toDouble(),
    region: WHORegion.values.byName(json['region']),
    interests: List<String>.from(json['interests'] ?? []),
    favoriteCharacters: List<String>.from(json['favoriteCharacters'] ?? []),
    favoriteToys: List<String>.from(json['favoriteToys'] ?? []),
    favoriteColors: List<String>.from(json['favoriteColors'] ?? []),
    profilePhotoPath: json['profilePhotoPath'],
    createdAt: DateTime.parse(json['createdAt']),
    updatedAt: DateTime.parse(json['updatedAt']),
  );

  @override
  List<Object?> get props => [
    id, name, nickname, dateOfBirth, gender, weight, height,
    headCircumference, region, interests, favoriteCharacters,
    favoriteToys, favoriteColors, profilePhotoPath, createdAt, updatedAt,
  ];
}
