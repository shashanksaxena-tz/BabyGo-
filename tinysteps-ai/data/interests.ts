import { Interest } from '../types';

export const AVAILABLE_INTERESTS: Interest[] = [
  // Animals
  { id: 'dinosaurs', name: 'Dinosaurs', icon: '🦕', category: 'animals' },
  { id: 'dogs', name: 'Dogs', icon: '🐕', category: 'animals' },
  { id: 'cats', name: 'Cats', icon: '🐱', category: 'animals' },
  { id: 'horses', name: 'Horses', icon: '🐴', category: 'animals' },
  { id: 'birds', name: 'Birds', icon: '🐦', category: 'animals' },
  { id: 'fish', name: 'Fish', icon: '🐠', category: 'animals' },
  { id: 'butterflies', name: 'Butterflies', icon: '🦋', category: 'animals' },
  { id: 'bears', name: 'Bears', icon: '🐻', category: 'animals' },
  { id: 'elephants', name: 'Elephants', icon: '🐘', category: 'animals' },
  { id: 'lions', name: 'Lions', icon: '🦁', category: 'animals' },
  { id: 'bunnies', name: 'Bunnies', icon: '🐰', category: 'animals' },
  { id: 'pandas', name: 'Pandas', icon: '🐼', category: 'animals' },

  // Vehicles
  { id: 'cars', name: 'Cars', icon: '🚗', category: 'vehicles' },
  { id: 'trucks', name: 'Trucks', icon: '🚚', category: 'vehicles' },
  { id: 'trains', name: 'Trains', icon: '🚂', category: 'vehicles' },
  { id: 'planes', name: 'Planes', icon: '✈️', category: 'vehicles' },
  { id: 'boats', name: 'Boats', icon: '⛵', category: 'vehicles' },
  { id: 'rockets', name: 'Rockets', icon: '🚀', category: 'vehicles' },
  { id: 'tractors', name: 'Tractors', icon: '🚜', category: 'vehicles' },
  { id: 'helicopters', name: 'Helicopters', icon: '🚁', category: 'vehicles' },
  { id: 'motorcycles', name: 'Motorcycles', icon: '🏍️', category: 'vehicles' },
  { id: 'fire-trucks', name: 'Fire Trucks', icon: '🚒', category: 'vehicles' },

  // Nature
  { id: 'flowers', name: 'Flowers', icon: '🌸', category: 'nature' },
  { id: 'trees', name: 'Trees', icon: '🌳', category: 'nature' },
  { id: 'ocean', name: 'Ocean', icon: '🌊', category: 'nature' },
  { id: 'mountains', name: 'Mountains', icon: '⛰️', category: 'nature' },
  { id: 'stars', name: 'Stars', icon: '⭐', category: 'nature' },
  { id: 'moon', name: 'Moon', icon: '🌙', category: 'nature' },
  { id: 'rainbow', name: 'Rainbow', icon: '🌈', category: 'nature' },
  { id: 'sunshine', name: 'Sunshine', icon: '☀️', category: 'nature' },
  { id: 'rain', name: 'Rain', icon: '🌧️', category: 'nature' },
  { id: 'snow', name: 'Snow', icon: '❄️', category: 'nature' },

  // Fantasy
  { id: 'princesses', name: 'Princesses', icon: '👸', category: 'fantasy' },
  { id: 'superheroes', name: 'Superheroes', icon: '🦸', category: 'fantasy' },
  { id: 'dragons', name: 'Dragons', icon: '🐉', category: 'fantasy' },
  { id: 'unicorns', name: 'Unicorns', icon: '🦄', category: 'fantasy' },
  { id: 'fairies', name: 'Fairies', icon: '🧚', category: 'fantasy' },
  { id: 'wizards', name: 'Wizards', icon: '🧙', category: 'fantasy' },
  { id: 'pirates', name: 'Pirates', icon: '🏴‍☠️', category: 'fantasy' },
  { id: 'robots', name: 'Robots', icon: '🤖', category: 'fantasy' },
  { id: 'mermaids', name: 'Mermaids', icon: '🧜‍♀️', category: 'fantasy' },
  { id: 'knights', name: 'Knights', icon: '🛡️', category: 'fantasy' },

  // Sports
  { id: 'soccer', name: 'Soccer', icon: '⚽', category: 'sports' },
  { id: 'basketball', name: 'Basketball', icon: '🏀', category: 'sports' },
  { id: 'swimming', name: 'Swimming', icon: '🏊', category: 'sports' },
  { id: 'dancing', name: 'Dancing', icon: '💃', category: 'sports' },
  { id: 'running', name: 'Running', icon: '🏃', category: 'sports' },
  { id: 'cycling', name: 'Cycling', icon: '🚴', category: 'sports' },
  { id: 'gymnastics', name: 'Gymnastics', icon: '🤸', category: 'sports' },
  { id: 'tennis', name: 'Tennis', icon: '🎾', category: 'sports' },

  // Arts
  { id: 'painting', name: 'Painting', icon: '🎨', category: 'arts' },
  { id: 'drawing', name: 'Drawing', icon: '✏️', category: 'arts' },
  { id: 'crafts', name: 'Crafts', icon: '✂️', category: 'arts' },
  { id: 'clay', name: 'Play-Doh/Clay', icon: '🎭', category: 'arts' },
  { id: 'coloring', name: 'Coloring', icon: '🖍️', category: 'arts' },
  { id: 'building', name: 'Building', icon: '🧱', category: 'arts' },
  { id: 'puzzles', name: 'Puzzles', icon: '🧩', category: 'arts' },

  // Science
  { id: 'space', name: 'Space', icon: '🌌', category: 'science' },
  { id: 'bugs', name: 'Bugs & Insects', icon: '🐛', category: 'science' },
  { id: 'weather', name: 'Weather', icon: '🌤️', category: 'science' },
  { id: 'experiments', name: 'Experiments', icon: '🔬', category: 'science' },
  { id: 'numbers', name: 'Numbers', icon: '🔢', category: 'science' },
  { id: 'letters', name: 'Letters', icon: '🔤', category: 'science' },
  { id: 'magnets', name: 'Magnets', icon: '🧲', category: 'science' },

  // Music
  { id: 'singing', name: 'Singing', icon: '🎤', category: 'music' },
  { id: 'drums', name: 'Drums', icon: '🥁', category: 'music' },
  { id: 'piano', name: 'Piano', icon: '🎹', category: 'music' },
  { id: 'guitar', name: 'Guitar', icon: '🎸', category: 'music' },
  { id: 'nursery-rhymes', name: 'Nursery Rhymes', icon: '🎵', category: 'music' },

  // Other
  { id: 'cooking', name: 'Cooking', icon: '👨‍🍳', category: 'other' },
  { id: 'gardening', name: 'Gardening', icon: '🌱', category: 'other' },
  { id: 'reading', name: 'Reading', icon: '📚', category: 'other' },
  { id: 'dolls', name: 'Dolls', icon: '🪆', category: 'other' },
  { id: 'blocks', name: 'Blocks', icon: '🧊', category: 'other' },
  { id: 'balls', name: 'Balls', icon: '🏐', category: 'other' },
  { id: 'bubbles', name: 'Bubbles', icon: '🫧', category: 'other' },
  { id: 'sand', name: 'Sand Play', icon: '🏖️', category: 'other' },
  { id: 'water-play', name: 'Water Play', icon: '💧', category: 'other' },
];

export const INTEREST_CATEGORIES = [
  { id: 'animals', name: 'Animals', icon: '🐾' },
  { id: 'vehicles', name: 'Vehicles', icon: '🚗' },
  { id: 'nature', name: 'Nature', icon: '🌿' },
  { id: 'fantasy', name: 'Fantasy', icon: '✨' },
  { id: 'sports', name: 'Sports', icon: '🏃' },
  { id: 'arts', name: 'Arts & Crafts', icon: '🎨' },
  { id: 'science', name: 'Learning', icon: '🔬' },
  { id: 'music', name: 'Music', icon: '🎵' },
  { id: 'other', name: 'Other', icon: '🎮' },
];

export const POPULAR_CHARACTERS = [
  'Peppa Pig',
  'Bluey',
  'Paw Patrol',
  'Cocomelon',
  'Mickey Mouse',
  'Minnie Mouse',
  'Elsa (Frozen)',
  'Spider-Man',
  'Batman',
  'Dora the Explorer',
  'Thomas the Tank Engine',
  'Barbie',
  'Baby Shark',
  'Sesame Street',
  'Winnie the Pooh',
  'Finding Nemo',
  'Toy Story',
  'The Lion King',
  'Moana',
  'Cars (Lightning McQueen)',
];

export const FAVORITE_COLORS = [
  { name: 'Red', hex: '#EF4444' },
  { name: 'Blue', hex: '#3B82F6' },
  { name: 'Green', hex: '#22C55E' },
  { name: 'Yellow', hex: '#EAB308' },
  { name: 'Purple', hex: '#A855F7' },
  { name: 'Pink', hex: '#EC4899' },
  { name: 'Orange', hex: '#F97316' },
  { name: 'Teal', hex: '#14B8A6' },
  { name: 'Rainbow', hex: 'linear-gradient(90deg, red, orange, yellow, green, blue, purple)' },
];

export function getInterestsByCategory(category: string): Interest[] {
  return AVAILABLE_INTERESTS.filter((i) => i.category === category);
}

export function getInterestById(id: string): Interest | undefined {
  return AVAILABLE_INTERESTS.find((i) => i.id === id);
}

export function getPersonalizedGreeting(name: string, interests: Interest[]): string {
  if (interests.length === 0) {
    return `Hi there, ${name}!`;
  }

  const interest = interests[Math.floor(Math.random() * interests.length)];

  const greetings: Record<string, string[]> = {
    dinosaurs: [
      `ROAR! ${name} the mighty dinosaur explorer is here!`,
      `Ready for a dino-mite adventure, ${name}?`,
    ],
    unicorns: [
      `Magical greetings, ${name}!`,
      `Sparkle on, little ${name}!`,
    ],
    cars: [
      `Vroom vroom! ${name} is ready to roll!`,
      `Start your engines, ${name}!`,
    ],
    rockets: [
      `3, 2, 1... Blast off, ${name}!`,
      `Ready for lift-off, astronaut ${name}?`,
    ],
    superheroes: [
      `Super ${name} to the rescue!`,
      `Hero mode activated for ${name}!`,
    ],
    princesses: [
      `Welcome, Princess ${name}!`,
      `Your royal highness ${name} has arrived!`,
    ],
    default: [
      `Hey there, awesome ${name}!`,
      `${name} is ready for fun!`,
    ],
  };

  const options = greetings[interest.id] || greetings.default;
  return options[Math.floor(Math.random() * options.length)];
}

export function getThemedNotification(
  type: string,
  name: string,
  interests: Interest[]
): { title: string; message: string; icon: string } {
  const interest = interests.length > 0
    ? interests[Math.floor(Math.random() * interests.length)]
    : null;

  if (!interest) {
    return {
      title: 'Time for Fun!',
      message: `${name} has new activities to explore!`,
      icon: '🌟',
    };
  }

  const themes: Record<string, { title: string; message: string }> = {
    dinosaurs: {
      title: 'Dino Discovery!',
      message: `${name}, the dinosaurs have a new adventure waiting!`,
    },
    unicorns: {
      title: 'Magical Moment!',
      message: `${name}, sprinkle some magic on your day!`,
    },
    rockets: {
      title: 'Mission Control!',
      message: `Astronaut ${name}, you have a new mission!`,
    },
    cars: {
      title: 'Pit Stop Time!',
      message: `${name}, rev up for some exciting activities!`,
    },
  };

  const themed = themes[interest.id] || {
    title: `${interest.name} Time!`,
    message: `${name} has something fun to discover!`,
  };

  return {
    ...themed,
    icon: interest.icon,
  };
}
