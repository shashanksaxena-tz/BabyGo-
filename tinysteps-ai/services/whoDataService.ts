import { WHOSource, MilestoneProgress, WHORegion, Region, GrowthAssessment } from '../types';

// WHO Official Sources
export const WHO_SOURCES: Record<string, WHOSource> = {
  motorMilestones: {
    title: 'WHO Motor Development Study: Windows of Achievement for Gross Motor Milestones',
    url: 'https://www.who.int/publications/i/item/9789241596275',
    organization: 'WHO',
    year: 2006,
    type: 'guideline',
  },
  growthStandards: {
    title: 'WHO Child Growth Standards: Length/height-for-age, weight-for-age, weight-for-length, weight-for-height and body mass index-for-age',
    url: 'https://www.who.int/tools/child-growth-standards/standards',
    organization: 'WHO',
    year: 2006,
    type: 'data',
  },
  headCircumference: {
    title: 'WHO Child Growth Standards: Head circumference-for-age',
    url: 'https://www.who.int/tools/child-growth-standards/standards/head-circumference-for-age',
    organization: 'WHO',
    year: 2007,
    type: 'data',
  },
  developmentalMilestones: {
    title: 'WHO Guidelines on Responsive Caregiving and Early Learning Activities',
    url: 'https://www.who.int/publications/i/item/9789240032408',
    organization: 'WHO',
    year: 2020,
    type: 'guideline',
  },
  cdcMilestones: {
    title: 'CDC Developmental Milestones',
    url: 'https://www.cdc.gov/ncbddd/actearly/milestones/index.html',
    organization: 'CDC',
    year: 2024,
    type: 'guideline',
  },
  aapGuidelines: {
    title: 'American Academy of Pediatrics - Bright Futures Guidelines',
    url: 'https://www.aap.org/en/practice-management/bright-futures/',
    organization: 'AAP',
    year: 2024,
    type: 'guideline',
  },
  unicefECD: {
    title: 'UNICEF Early Childhood Development',
    url: 'https://www.unicef.org/early-childhood-development',
    organization: 'UNICEF',
    year: 2024,
    type: 'guideline',
  },
  nutritionGuidelines: {
    title: 'WHO Complementary feeding: family foods for breastfed children',
    url: 'https://www.who.int/publications/i/item/9241562218',
    organization: 'WHO',
    year: 2000,
    type: 'guideline',
  },
};

// Regional-specific sources
export const REGIONAL_SOURCES: Record<WHORegion, WHOSource[]> = {
  AFRO: [
    {
      title: 'African Region Child Development Guidelines',
      url: 'https://www.afro.who.int/health-topics/child-health',
      organization: 'Regional',
      region: 'AFRO',
      year: 2023,
      type: 'guideline',
    },
  ],
  AMRO: [
    {
      title: 'PAHO/WHO Child Health in the Americas',
      url: 'https://www.paho.org/en/topics/child-health',
      organization: 'Regional',
      region: 'AMRO',
      year: 2023,
      type: 'guideline',
    },
  ],
  SEARO: [
    {
      title: 'WHO South-East Asia Region Child Development',
      url: 'https://www.who.int/southeastasia/health-topics/child-health',
      organization: 'Regional',
      region: 'SEARO',
      year: 2023,
      type: 'guideline',
    },
  ],
  EURO: [
    {
      title: 'WHO European Region Child Health',
      url: 'https://www.who.int/europe/health-topics/child-health',
      organization: 'Regional',
      region: 'EURO',
      year: 2023,
      type: 'guideline',
    },
  ],
  EMRO: [
    {
      title: 'WHO Eastern Mediterranean Region Child Health',
      url: 'https://www.emro.who.int/child-health/about/index.html',
      organization: 'Regional',
      region: 'EMRO',
      year: 2023,
      type: 'guideline',
    },
  ],
  WPRO: [
    {
      title: 'WHO Western Pacific Region Child Health',
      url: 'https://www.who.int/westernpacific/health-topics/child-health',
      organization: 'Regional',
      region: 'WPRO',
      year: 2023,
      type: 'guideline',
    },
  ],
};

// WHO Motor Milestones (based on WHO Multicentre Growth Reference Study)
export const WHO_MOTOR_MILESTONES: MilestoneProgress[] = [
  // Gross Motor Milestones
  {
    id: 'sitting-without-support',
    domain: 'motor',
    title: 'Sitting Without Support',
    description: 'Child can sit alone without support for at least 10 seconds',
    expectedAgeMonths: { min: 4, max: 9 },
    achieved: false,
    source: WHO_SOURCES.motorMilestones,
  },
  {
    id: 'standing-with-assistance',
    domain: 'motor',
    title: 'Standing with Assistance',
    description: 'Child can stand while holding onto furniture or someone\'s hands',
    expectedAgeMonths: { min: 5, max: 11 },
    achieved: false,
    source: WHO_SOURCES.motorMilestones,
  },
  {
    id: 'hands-and-knees-crawling',
    domain: 'motor',
    title: 'Hands and Knees Crawling',
    description: 'Child moves forward on hands and knees',
    expectedAgeMonths: { min: 5, max: 13 },
    achieved: false,
    source: WHO_SOURCES.motorMilestones,
  },
  {
    id: 'walking-with-assistance',
    domain: 'motor',
    title: 'Walking with Assistance',
    description: 'Child can walk while holding onto furniture or someone\'s hands',
    expectedAgeMonths: { min: 6, max: 14 },
    achieved: false,
    source: WHO_SOURCES.motorMilestones,
  },
  {
    id: 'standing-alone',
    domain: 'motor',
    title: 'Standing Alone',
    description: 'Child can stand independently without support for at least 10 seconds',
    expectedAgeMonths: { min: 7, max: 17 },
    achieved: false,
    source: WHO_SOURCES.motorMilestones,
  },
  {
    id: 'walking-alone',
    domain: 'motor',
    title: 'Walking Alone',
    description: 'Child takes at least 5 independent steps without support',
    expectedAgeMonths: { min: 8, max: 18 },
    achieved: false,
    source: WHO_SOURCES.motorMilestones,
  },
  {
    id: 'runs-well',
    domain: 'motor',
    title: 'Runs Well',
    description: 'Child can run without falling',
    expectedAgeMonths: { min: 18, max: 24 },
    achieved: false,
    source: WHO_SOURCES.cdcMilestones,
  },
  {
    id: 'climbs-stairs',
    domain: 'motor',
    title: 'Climbs Stairs',
    description: 'Child can walk up stairs with support',
    expectedAgeMonths: { min: 18, max: 30 },
    achieved: false,
    source: WHO_SOURCES.cdcMilestones,
  },
  {
    id: 'jumps-both-feet',
    domain: 'motor',
    title: 'Jumps with Both Feet',
    description: 'Child can jump off the ground with both feet',
    expectedAgeMonths: { min: 24, max: 36 },
    achieved: false,
    source: WHO_SOURCES.cdcMilestones,
  },
  {
    id: 'pedals-tricycle',
    domain: 'motor',
    title: 'Pedals a Tricycle',
    description: 'Child can pedal a tricycle',
    expectedAgeMonths: { min: 30, max: 42 },
    achieved: false,
    source: WHO_SOURCES.cdcMilestones,
  },
  // Fine Motor Milestones
  {
    id: 'reaches-for-objects',
    domain: 'motor',
    title: 'Reaches for Objects',
    description: 'Child reaches out to grab toys and objects',
    expectedAgeMonths: { min: 3, max: 5 },
    achieved: false,
    source: WHO_SOURCES.cdcMilestones,
  },
  {
    id: 'transfers-objects',
    domain: 'motor',
    title: 'Transfers Objects Between Hands',
    description: 'Child can pass objects from one hand to the other',
    expectedAgeMonths: { min: 5, max: 9 },
    achieved: false,
    source: WHO_SOURCES.cdcMilestones,
  },
  {
    id: 'pincer-grasp',
    domain: 'motor',
    title: 'Pincer Grasp',
    description: 'Child picks up small objects between thumb and index finger',
    expectedAgeMonths: { min: 8, max: 12 },
    achieved: false,
    source: WHO_SOURCES.cdcMilestones,
  },
  {
    id: 'stacks-blocks',
    domain: 'motor',
    title: 'Stacks Blocks',
    description: 'Child can stack 2-4 blocks on top of each other',
    expectedAgeMonths: { min: 12, max: 24 },
    achieved: false,
    source: WHO_SOURCES.cdcMilestones,
  },
  {
    id: 'uses-spoon',
    domain: 'motor',
    title: 'Uses Spoon',
    description: 'Child can use a spoon to eat with minimal spilling',
    expectedAgeMonths: { min: 15, max: 24 },
    achieved: false,
    source: WHO_SOURCES.cdcMilestones,
  },
];

// Language Milestones
export const WHO_LANGUAGE_MILESTONES: MilestoneProgress[] = [
  {
    id: 'coos-babbles',
    domain: 'language',
    title: 'Coos and Babbles',
    description: 'Makes cooing sounds and begins babbling',
    expectedAgeMonths: { min: 2, max: 6 },
    achieved: false,
    source: WHO_SOURCES.cdcMilestones,
  },
  {
    id: 'responds-to-name',
    domain: 'language',
    title: 'Responds to Name',
    description: 'Turns head when name is called',
    expectedAgeMonths: { min: 6, max: 12 },
    achieved: false,
    source: WHO_SOURCES.cdcMilestones,
  },
  {
    id: 'first-words',
    domain: 'language',
    title: 'First Words',
    description: 'Says first words like "mama" or "dada" with meaning',
    expectedAgeMonths: { min: 9, max: 14 },
    achieved: false,
    source: WHO_SOURCES.cdcMilestones,
  },
  {
    id: 'follows-simple-commands',
    domain: 'language',
    title: 'Follows Simple Commands',
    description: 'Follows simple instructions like "give me the ball"',
    expectedAgeMonths: { min: 12, max: 18 },
    achieved: false,
    source: WHO_SOURCES.cdcMilestones,
  },
  {
    id: 'two-word-phrases',
    domain: 'language',
    title: 'Two-Word Phrases',
    description: 'Combines two words like "more milk" or "daddy go"',
    expectedAgeMonths: { min: 18, max: 24 },
    achieved: false,
    source: WHO_SOURCES.cdcMilestones,
  },
  {
    id: 'fifty-words',
    domain: 'language',
    title: 'Says 50+ Words',
    description: 'Vocabulary of 50 or more words',
    expectedAgeMonths: { min: 18, max: 30 },
    achieved: false,
    source: WHO_SOURCES.cdcMilestones,
  },
  {
    id: 'simple-sentences',
    domain: 'language',
    title: 'Simple Sentences',
    description: 'Uses 3-4 word sentences',
    expectedAgeMonths: { min: 24, max: 36 },
    achieved: false,
    source: WHO_SOURCES.cdcMilestones,
  },
];

// Cognitive Milestones
export const WHO_COGNITIVE_MILESTONES: MilestoneProgress[] = [
  {
    id: 'follows-moving-objects',
    domain: 'cognitive',
    title: 'Follows Moving Objects',
    description: 'Tracks moving objects with eyes',
    expectedAgeMonths: { min: 1, max: 4 },
    achieved: false,
    source: WHO_SOURCES.cdcMilestones,
  },
  {
    id: 'object-permanence',
    domain: 'cognitive',
    title: 'Object Permanence',
    description: 'Understands that objects exist even when out of sight',
    expectedAgeMonths: { min: 6, max: 12 },
    achieved: false,
    source: WHO_SOURCES.developmentalMilestones,
  },
  {
    id: 'explores-objects',
    domain: 'cognitive',
    title: 'Explores Objects',
    description: 'Explores objects in different ways (shaking, banging, throwing)',
    expectedAgeMonths: { min: 6, max: 12 },
    achieved: false,
    source: WHO_SOURCES.cdcMilestones,
  },
  {
    id: 'simple-pretend-play',
    domain: 'cognitive',
    title: 'Simple Pretend Play',
    description: 'Engages in simple pretend play like feeding a doll',
    expectedAgeMonths: { min: 12, max: 24 },
    achieved: false,
    source: WHO_SOURCES.cdcMilestones,
  },
  {
    id: 'sorts-shapes-colors',
    domain: 'cognitive',
    title: 'Sorts Shapes and Colors',
    description: 'Can sort objects by shape or color',
    expectedAgeMonths: { min: 24, max: 36 },
    achieved: false,
    source: WHO_SOURCES.cdcMilestones,
  },
  {
    id: 'understands-counting',
    domain: 'cognitive',
    title: 'Understands Counting',
    description: 'Understands the concept of counting and may count to 10',
    expectedAgeMonths: { min: 36, max: 48 },
    achieved: false,
    source: WHO_SOURCES.cdcMilestones,
  },
];

// Social-Emotional Milestones
export const WHO_SOCIAL_MILESTONES: MilestoneProgress[] = [
  {
    id: 'social-smile',
    domain: 'social',
    title: 'Social Smile',
    description: 'Smiles in response to social interaction',
    expectedAgeMonths: { min: 1, max: 3 },
    achieved: false,
    source: WHO_SOURCES.cdcMilestones,
  },
  {
    id: 'stranger-anxiety',
    domain: 'social',
    title: 'Stranger Awareness',
    description: 'Shows wariness around unfamiliar people',
    expectedAgeMonths: { min: 6, max: 12 },
    achieved: false,
    source: WHO_SOURCES.cdcMilestones,
  },
  {
    id: 'waves-bye',
    domain: 'social',
    title: 'Waves Bye-Bye',
    description: 'Waves goodbye when prompted',
    expectedAgeMonths: { min: 9, max: 15 },
    achieved: false,
    source: WHO_SOURCES.cdcMilestones,
  },
  {
    id: 'shows-affection',
    domain: 'social',
    title: 'Shows Affection',
    description: 'Shows affection with hugs and kisses',
    expectedAgeMonths: { min: 12, max: 18 },
    achieved: false,
    source: WHO_SOURCES.cdcMilestones,
  },
  {
    id: 'parallel-play',
    domain: 'social',
    title: 'Parallel Play',
    description: 'Plays alongside other children',
    expectedAgeMonths: { min: 18, max: 30 },
    achieved: false,
    source: WHO_SOURCES.cdcMilestones,
  },
  {
    id: 'shares-with-others',
    domain: 'social',
    title: 'Shares with Others',
    description: 'Begins to share toys with other children',
    expectedAgeMonths: { min: 24, max: 42 },
    achieved: false,
    source: WHO_SOURCES.cdcMilestones,
  },
];

// WHO Growth Charts Data (simplified percentile boundaries)
export const WHO_GROWTH_PERCENTILES = {
  weight: {
    boys: {
      // Age in months: [3rd, 15th, 50th, 85th, 97th] percentile in kg
      0: [2.5, 2.9, 3.3, 3.9, 4.4],
      1: [3.4, 3.9, 4.5, 5.1, 5.8],
      2: [4.3, 4.9, 5.6, 6.3, 7.1],
      3: [5.0, 5.7, 6.4, 7.2, 8.0],
      6: [6.4, 7.1, 7.9, 8.8, 9.8],
      9: [7.1, 8.0, 8.9, 9.9, 10.9],
      12: [7.7, 8.6, 9.6, 10.8, 11.8],
      18: [8.8, 9.8, 10.9, 12.2, 13.5],
      24: [9.7, 10.8, 12.2, 13.6, 15.0],
      36: [11.3, 12.7, 14.3, 16.2, 18.1],
      48: [12.7, 14.4, 16.3, 18.6, 21.2],
      60: [14.1, 16.0, 18.3, 21.2, 24.4],
    },
    girls: {
      0: [2.4, 2.8, 3.2, 3.7, 4.2],
      1: [3.2, 3.6, 4.2, 4.8, 5.5],
      2: [3.9, 4.5, 5.1, 5.8, 6.6],
      3: [4.5, 5.2, 5.8, 6.6, 7.5],
      6: [5.7, 6.5, 7.3, 8.2, 9.3],
      9: [6.3, 7.3, 8.2, 9.3, 10.4],
      12: [6.9, 7.9, 8.9, 10.1, 11.3],
      18: [7.9, 9.0, 10.2, 11.6, 13.0],
      24: [8.9, 10.2, 11.5, 13.0, 14.8],
      36: [10.6, 12.0, 13.9, 15.9, 18.1],
      48: [12.3, 14.0, 16.1, 18.5, 21.5],
      60: [13.7, 15.8, 18.2, 21.2, 24.9],
    },
  },
  height: {
    boys: {
      // Age in months: [3rd, 15th, 50th, 85th, 97th] percentile in cm
      0: [46.1, 47.9, 49.9, 51.8, 53.7],
      1: [50.8, 52.8, 54.7, 56.7, 58.6],
      2: [54.4, 56.4, 58.4, 60.4, 62.4],
      3: [57.3, 59.4, 61.4, 63.5, 65.5],
      6: [63.3, 65.5, 67.6, 69.8, 71.9],
      9: [67.5, 69.7, 72.0, 74.2, 76.5],
      12: [71.0, 73.4, 75.7, 78.1, 80.5],
      18: [76.9, 79.6, 82.3, 85.0, 87.7],
      24: [81.7, 84.6, 87.8, 91.0, 94.2],
      36: [89.9, 93.1, 96.1, 99.2, 102.3],
      48: [96.1, 99.9, 103.3, 106.7, 110.0],
      60: [101.8, 105.8, 110.0, 114.2, 118.4],
    },
    girls: {
      0: [45.4, 47.3, 49.1, 51.0, 52.9],
      1: [49.8, 51.7, 53.7, 55.6, 57.6],
      2: [53.0, 55.0, 57.1, 59.1, 61.1],
      3: [55.6, 57.7, 59.8, 62.0, 64.0],
      6: [61.2, 63.5, 65.7, 68.0, 70.3],
      9: [65.3, 67.7, 70.1, 72.6, 75.0],
      12: [68.9, 71.4, 74.0, 76.6, 79.2],
      18: [74.9, 77.8, 80.7, 83.6, 86.5],
      24: [80.0, 83.2, 86.4, 89.6, 92.9],
      36: [87.7, 91.2, 95.1, 98.9, 102.7],
      48: [94.1, 98.0, 102.7, 107.3, 111.9],
      60: [99.9, 104.1, 109.4, 114.7, 120.0],
    },
  },
  headCircumference: {
    boys: {
      // Age in months: [3rd, 15th, 50th, 85th, 97th] percentile in cm
      0: [32.1, 33.2, 34.5, 35.8, 37.0],
      1: [35.1, 36.2, 37.3, 38.4, 39.5],
      2: [36.9, 38.0, 39.1, 40.3, 41.5],
      3: [38.3, 39.3, 40.5, 41.7, 42.9],
      6: [41.0, 42.0, 43.3, 44.6, 45.8],
      9: [43.0, 44.0, 45.3, 46.6, 47.9],
      12: [44.3, 45.4, 46.7, 48.0, 49.3],
      18: [45.8, 46.9, 48.3, 49.7, 51.0],
      24: [46.9, 48.0, 49.3, 50.7, 52.0],
    },
    girls: {
      0: [31.5, 32.6, 33.9, 35.1, 36.2],
      1: [34.2, 35.2, 36.5, 37.8, 38.9],
      2: [35.8, 36.9, 38.3, 39.5, 40.7],
      3: [37.1, 38.2, 39.5, 40.8, 42.0],
      6: [39.8, 40.9, 42.2, 43.5, 44.8],
      9: [41.5, 42.6, 44.0, 45.3, 46.6],
      12: [42.8, 43.9, 45.4, 46.8, 48.2],
      18: [44.3, 45.5, 47.0, 48.4, 49.8],
      24: [45.3, 46.6, 48.1, 49.5, 51.0],
    },
  },
};

// Regions database
export const REGIONS: Region[] = [
  { code: 'US', name: 'United States', whoRegion: 'AMRO' },
  { code: 'CA', name: 'Canada', whoRegion: 'AMRO' },
  { code: 'MX', name: 'Mexico', whoRegion: 'AMRO' },
  { code: 'BR', name: 'Brazil', whoRegion: 'AMRO' },
  { code: 'AR', name: 'Argentina', whoRegion: 'AMRO' },
  { code: 'GB', name: 'United Kingdom', whoRegion: 'EURO' },
  { code: 'DE', name: 'Germany', whoRegion: 'EURO' },
  { code: 'FR', name: 'France', whoRegion: 'EURO' },
  { code: 'IT', name: 'Italy', whoRegion: 'EURO' },
  { code: 'ES', name: 'Spain', whoRegion: 'EURO' },
  { code: 'IN', name: 'India', whoRegion: 'SEARO' },
  { code: 'BD', name: 'Bangladesh', whoRegion: 'SEARO' },
  { code: 'TH', name: 'Thailand', whoRegion: 'SEARO' },
  { code: 'ID', name: 'Indonesia', whoRegion: 'SEARO' },
  { code: 'CN', name: 'China', whoRegion: 'WPRO' },
  { code: 'JP', name: 'Japan', whoRegion: 'WPRO' },
  { code: 'KR', name: 'South Korea', whoRegion: 'WPRO' },
  { code: 'AU', name: 'Australia', whoRegion: 'WPRO' },
  { code: 'PH', name: 'Philippines', whoRegion: 'WPRO' },
  { code: 'NG', name: 'Nigeria', whoRegion: 'AFRO' },
  { code: 'ZA', name: 'South Africa', whoRegion: 'AFRO' },
  { code: 'KE', name: 'Kenya', whoRegion: 'AFRO' },
  { code: 'EG', name: 'Egypt', whoRegion: 'EMRO' },
  { code: 'SA', name: 'Saudi Arabia', whoRegion: 'EMRO' },
  { code: 'AE', name: 'United Arab Emirates', whoRegion: 'EMRO' },
  { code: 'PK', name: 'Pakistan', whoRegion: 'EMRO' },
];

// Helper functions
export function getMilestonesForAge(ageMonths: number): MilestoneProgress[] {
  const allMilestones = [
    ...WHO_MOTOR_MILESTONES,
    ...WHO_LANGUAGE_MILESTONES,
    ...WHO_COGNITIVE_MILESTONES,
    ...WHO_SOCIAL_MILESTONES,
  ];

  return allMilestones.filter(
    (m) => m.expectedAgeMonths.min <= ageMonths && ageMonths <= m.expectedAgeMonths.max + 6
  );
}

export function getUpcomingMilestones(ageMonths: number, count: number = 5): MilestoneProgress[] {
  const allMilestones = [
    ...WHO_MOTOR_MILESTONES,
    ...WHO_LANGUAGE_MILESTONES,
    ...WHO_COGNITIVE_MILESTONES,
    ...WHO_SOCIAL_MILESTONES,
  ];

  return allMilestones
    .filter((m) => m.expectedAgeMonths.min > ageMonths)
    .sort((a, b) => a.expectedAgeMonths.min - b.expectedAgeMonths.min)
    .slice(0, count);
}

export function calculatePercentile(
  value: number,
  metric: 'weight' | 'height' | 'headCircumference',
  ageMonths: number,
  gender: 'male' | 'female' | 'other'
): number {
  // Default 'other' to average between male and female by using 'boys' data
  const genderKey = gender === 'female' ? 'girls' : 'boys';
  const data = WHO_GROWTH_PERCENTILES[metric]?.[genderKey];

  if (!data) return 50;

  // Find closest age
  const ages = Object.keys(data).map(Number).sort((a, b) => a - b);
  let closestAge = ages[0];
  for (const age of ages) {
    if (Math.abs(age - ageMonths) < Math.abs(closestAge - ageMonths)) {
      closestAge = age;
    }
  }

  const percentiles = data[closestAge];
  if (!percentiles) return 50;

  // Map value to percentile
  const [p3, p15, p50, p85, p97] = percentiles;

  if (value <= p3) return 3;
  if (value <= p15) return Math.round(3 + ((value - p3) / (p15 - p3)) * 12);
  if (value <= p50) return Math.round(15 + ((value - p15) / (p50 - p15)) * 35);
  if (value <= p85) return Math.round(50 + ((value - p50) / (p85 - p50)) * 35);
  if (value <= p97) return Math.round(85 + ((value - p85) / (p97 - p85)) * 12);
  return 97;
}

export function assessGrowth(
  weight: number,
  height: number,
  headCircumference: number | undefined,
  ageMonths: number,
  gender: 'male' | 'female' | 'other'
): GrowthAssessment {
  const weightPercentile = calculatePercentile(weight, 'weight', ageMonths, gender);
  const heightPercentile = calculatePercentile(height, 'height', ageMonths, gender);
  const headCircumferencePercentile = headCircumference
    ? calculatePercentile(headCircumference, 'headCircumference', ageMonths, gender)
    : undefined;

  let status = 'On Track';
  let description = '';

  if (weightPercentile < 5 || weightPercentile > 95) {
    status = 'Monitor';
    description = weightPercentile < 5
      ? 'Weight is below the 5th percentile. Consider consulting your pediatrician.'
      : 'Weight is above the 95th percentile. Consider consulting your pediatrician.';
  } else if (heightPercentile < 5 || heightPercentile > 95) {
    status = 'Monitor';
    description = heightPercentile < 5
      ? 'Height is below the 5th percentile. Consider consulting your pediatrician.'
      : 'Height is above the 95th percentile.';
  } else {
    description = `Your child's growth is within healthy ranges. Weight is at the ${weightPercentile}th percentile and height is at the ${heightPercentile}th percentile.`;
  }

  return {
    status,
    description,
    weightPercentile,
    heightPercentile,
    headCircumferencePercentile,
  };
}

export function getSourcesForRegion(region: WHORegion): WHOSource[] {
  return [
    WHO_SOURCES.growthStandards,
    WHO_SOURCES.motorMilestones,
    WHO_SOURCES.developmentalMilestones,
    WHO_SOURCES.cdcMilestones,
    ...REGIONAL_SOURCES[region],
  ];
}

export function formatAgeRange(min: number, max: number): string {
  if (min < 12 && max < 12) {
    return `${min}-${max} months`;
  } else if (min >= 12 && max >= 12) {
    const minYears = Math.floor(min / 12);
    const minMonths = min % 12;
    const maxYears = Math.floor(max / 12);
    const maxMonths = max % 12;

    const minStr = minMonths === 0 ? `${minYears}y` : `${minYears}y ${minMonths}m`;
    const maxStr = maxMonths === 0 ? `${maxYears}y` : `${maxYears}y ${maxMonths}m`;

    return `${minStr} - ${maxStr}`;
  } else {
    return `${min}m - ${Math.floor(max / 12)}y ${max % 12}m`;
  }
}
