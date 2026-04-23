class InterestCategory {
  final String id;
  final String name;
  final String emoji;
  final List<Interest> interests;

  const InterestCategory({
    required this.id,
    required this.name,
    required this.emoji,
    required this.interests,
  });
}

class Interest {
  final String id;
  final String name;
  final String emoji;
  final String category;

  const Interest({
    required this.id,
    required this.name,
    required this.emoji,
    required this.category,
  });
}

class InterestData {
  static const List<InterestCategory> categories = [
    InterestCategory(
      id: 'animals',
      name: 'Animals',
      emoji: '🐾',
      interests: [
        Interest(id: 'dinosaurs', name: 'Dinosaurs', emoji: '🦕', category: 'animals'),
        Interest(id: 'dogs', name: 'Dogs', emoji: '🐕', category: 'animals'),
        Interest(id: 'cats', name: 'Cats', emoji: '🐱', category: 'animals'),
        Interest(id: 'birds', name: 'Birds', emoji: '🐦', category: 'animals'),
        Interest(id: 'fish', name: 'Fish', emoji: '🐠', category: 'animals'),
        Interest(id: 'horses', name: 'Horses', emoji: '🐴', category: 'animals'),
        Interest(id: 'elephants', name: 'Elephants', emoji: '🐘', category: 'animals'),
        Interest(id: 'lions', name: 'Lions', emoji: '🦁', category: 'animals'),
        Interest(id: 'butterflies', name: 'Butterflies', emoji: '🦋', category: 'animals'),
        Interest(id: 'bugs', name: 'Bugs', emoji: '🐛', category: 'animals'),
      ],
    ),
    InterestCategory(
      id: 'vehicles',
      name: 'Vehicles',
      emoji: '🚗',
      interests: [
        Interest(id: 'cars', name: 'Cars', emoji: '🚗', category: 'vehicles'),
        Interest(id: 'trucks', name: 'Trucks', emoji: '🚚', category: 'vehicles'),
        Interest(id: 'trains', name: 'Trains', emoji: '🚂', category: 'vehicles'),
        Interest(id: 'planes', name: 'Planes', emoji: '✈️', category: 'vehicles'),
        Interest(id: 'boats', name: 'Boats', emoji: '⛵', category: 'vehicles'),
        Interest(id: 'rockets', name: 'Rockets', emoji: '🚀', category: 'vehicles'),
        Interest(id: 'tractors', name: 'Tractors', emoji: '🚜', category: 'vehicles'),
        Interest(id: 'helicopters', name: 'Helicopters', emoji: '🚁', category: 'vehicles'),
      ],
    ),
    InterestCategory(
      id: 'activities',
      name: 'Activities',
      emoji: '⚽',
      interests: [
        Interest(id: 'dancing', name: 'Dancing', emoji: '💃', category: 'activities'),
        Interest(id: 'singing', name: 'Singing', emoji: '🎤', category: 'activities'),
        Interest(id: 'drawing', name: 'Drawing', emoji: '🎨', category: 'activities'),
        Interest(id: 'building', name: 'Building', emoji: '🧱', category: 'activities'),
        Interest(id: 'reading', name: 'Reading', emoji: '📖', category: 'activities'),
        Interest(id: 'sports', name: 'Sports', emoji: '⚽', category: 'activities'),
        Interest(id: 'cooking', name: 'Cooking', emoji: '👨‍🍳', category: 'activities'),
        Interest(id: 'gardening', name: 'Gardening', emoji: '🌱', category: 'activities'),
      ],
    ),
    InterestCategory(
      id: 'nature',
      name: 'Nature',
      emoji: '🌿',
      interests: [
        Interest(id: 'flowers', name: 'Flowers', emoji: '🌸', category: 'nature'),
        Interest(id: 'trees', name: 'Trees', emoji: '🌳', category: 'nature'),
        Interest(id: 'ocean', name: 'Ocean', emoji: '🌊', category: 'nature'),
        Interest(id: 'mountains', name: 'Mountains', emoji: '⛰️', category: 'nature'),
        Interest(id: 'stars', name: 'Stars', emoji: '⭐', category: 'nature'),
        Interest(id: 'rainbows', name: 'Rainbows', emoji: '🌈', category: 'nature'),
        Interest(id: 'weather', name: 'Weather', emoji: '☀️', category: 'nature'),
      ],
    ),
    InterestCategory(
      id: 'fantasy',
      name: 'Fantasy',
      emoji: '✨',
      interests: [
        Interest(id: 'princesses', name: 'Princesses', emoji: '👸', category: 'fantasy'),
        Interest(id: 'superheroes', name: 'Superheroes', emoji: '🦸', category: 'fantasy'),
        Interest(id: 'dragons', name: 'Dragons', emoji: '🐉', category: 'fantasy'),
        Interest(id: 'unicorns', name: 'Unicorns', emoji: '🦄', category: 'fantasy'),
        Interest(id: 'fairies', name: 'Fairies', emoji: '🧚', category: 'fantasy'),
        Interest(id: 'pirates', name: 'Pirates', emoji: '🏴‍☠️', category: 'fantasy'),
        Interest(id: 'robots', name: 'Robots', emoji: '🤖', category: 'fantasy'),
        Interest(id: 'magic', name: 'Magic', emoji: '🪄', category: 'fantasy'),
      ],
    ),
    InterestCategory(
      id: 'food',
      name: 'Food',
      emoji: '🍎',
      interests: [
        Interest(id: 'fruits', name: 'Fruits', emoji: '🍎', category: 'food'),
        Interest(id: 'vegetables', name: 'Vegetables', emoji: '🥕', category: 'food'),
        Interest(id: 'sweets', name: 'Sweets', emoji: '🍪', category: 'food'),
        Interest(id: 'pizza', name: 'Pizza', emoji: '🍕', category: 'food'),
        Interest(id: 'icecream', name: 'Ice Cream', emoji: '🍦', category: 'food'),
      ],
    ),
    InterestCategory(
      id: 'music',
      name: 'Music',
      emoji: '🎵',
      interests: [
        Interest(id: 'nursery_rhymes', name: 'Nursery Rhymes', emoji: '🎶', category: 'music'),
        Interest(id: 'instruments', name: 'Instruments', emoji: '🎸', category: 'music'),
        Interest(id: 'drums', name: 'Drums', emoji: '🥁', category: 'music'),
        Interest(id: 'piano', name: 'Piano', emoji: '🎹', category: 'music'),
      ],
    ),
    InterestCategory(
      id: 'seasons',
      name: 'Seasons',
      emoji: '🍂',
      interests: [
        Interest(id: 'spring', name: 'Spring', emoji: '🌷', category: 'seasons'),
        Interest(id: 'summer', name: 'Summer', emoji: '☀️', category: 'seasons'),
        Interest(id: 'autumn', name: 'Autumn', emoji: '🍂', category: 'seasons'),
        Interest(id: 'winter', name: 'Winter', emoji: '❄️', category: 'seasons'),
        Interest(id: 'holidays', name: 'Holidays', emoji: '🎄', category: 'seasons'),
      ],
    ),
    InterestCategory(
      id: 'characters',
      name: 'Characters',
      emoji: '🧸',
      interests: [
        Interest(id: 'teddy_bears', name: 'Teddy Bears', emoji: '🧸', category: 'characters'),
        Interest(id: 'dolls', name: 'Dolls', emoji: '🪆', category: 'characters'),
        Interest(id: 'action_figures', name: 'Action Figures', emoji: '🦸‍♂️', category: 'characters'),
      ],
    ),
  ];

  static List<Interest> get allInterests {
    return categories.expand((cat) => cat.interests).toList();
  }

  static Interest? getInterestById(String id) {
    for (final category in categories) {
      for (final interest in category.interests) {
        if (interest.id == id) {
          return interest;
        }
      }
    }
    return null;
  }
}

class FavoriteColor {
  final String id;
  final String name;
  final String hexCode;

  const FavoriteColor({
    required this.id,
    required this.name,
    required this.hexCode,
  });

  static const List<FavoriteColor> colors = [
    FavoriteColor(id: 'red', name: 'Red', hexCode: '#EF4444'),
    FavoriteColor(id: 'orange', name: 'Orange', hexCode: '#F97316'),
    FavoriteColor(id: 'yellow', name: 'Yellow', hexCode: '#EAB308'),
    FavoriteColor(id: 'green', name: 'Green', hexCode: '#22C55E'),
    FavoriteColor(id: 'blue', name: 'Blue', hexCode: '#3B82F6'),
    FavoriteColor(id: 'purple', name: 'Purple', hexCode: '#A855F7'),
    FavoriteColor(id: 'pink', name: 'Pink', hexCode: '#EC4899'),
    FavoriteColor(id: 'teal', name: 'Teal', hexCode: '#14B8A6'),
    FavoriteColor(id: 'indigo', name: 'Indigo', hexCode: '#6366F1'),
    FavoriteColor(id: 'brown', name: 'Brown', hexCode: '#A16207'),
    FavoriteColor(id: 'gray', name: 'Gray', hexCode: '#6B7280'),
    FavoriteColor(id: 'black', name: 'Black', hexCode: '#1F2937'),
  ];
}

class FavoriteCharacter {
  final String id;
  final String name;
  final String? franchise;

  const FavoriteCharacter({
    required this.id,
    required this.name,
    this.franchise,
  });

  static const List<FavoriteCharacter> popularCharacters = [
    FavoriteCharacter(id: 'peppa_pig', name: 'Peppa Pig', franchise: 'Peppa Pig'),
    FavoriteCharacter(id: 'paw_patrol', name: 'Paw Patrol', franchise: 'Paw Patrol'),
    FavoriteCharacter(id: 'cocomelon', name: 'CoComelon', franchise: 'CoComelon'),
    FavoriteCharacter(id: 'bluey', name: 'Bluey', franchise: 'Bluey'),
    FavoriteCharacter(id: 'elsa', name: 'Elsa', franchise: 'Frozen'),
    FavoriteCharacter(id: 'spiderman', name: 'Spider-Man', franchise: 'Marvel'),
    FavoriteCharacter(id: 'mickey', name: 'Mickey Mouse', franchise: 'Disney'),
    FavoriteCharacter(id: 'minnie', name: 'Minnie Mouse', franchise: 'Disney'),
    FavoriteCharacter(id: 'thomas', name: 'Thomas', franchise: 'Thomas & Friends'),
    FavoriteCharacter(id: 'dora', name: 'Dora', franchise: 'Dora the Explorer'),
    FavoriteCharacter(id: 'winnie', name: 'Winnie the Pooh', franchise: 'Disney'),
    FavoriteCharacter(id: 'elmo', name: 'Elmo', franchise: 'Sesame Street'),
    FavoriteCharacter(id: 'lightning', name: 'Lightning McQueen', franchise: 'Cars'),
    FavoriteCharacter(id: 'moana', name: 'Moana', franchise: 'Disney'),
    FavoriteCharacter(id: 'batman', name: 'Batman', franchise: 'DC'),
    FavoriteCharacter(id: 'hello_kitty', name: 'Hello Kitty', franchise: 'Sanrio'),
  ];
}
