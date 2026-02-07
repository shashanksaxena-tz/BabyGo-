import { WHOSource, MilestoneProgress, WHORegion, Region, GrowthAssessment } from '../types';

// WHO Official Sources with detailed evidence summaries
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
  cdcMilestones2months: {
    title: 'CDC Milestones at 2 Months',
    url: 'https://www.cdc.gov/ncbddd/actearly/milestones/milestones-2mo.html',
    organization: 'CDC',
    year: 2024,
    type: 'guideline',
  },
  cdcMilestones4months: {
    title: 'CDC Milestones at 4 Months',
    url: 'https://www.cdc.gov/ncbddd/actearly/milestones/milestones-4mo.html',
    organization: 'CDC',
    year: 2024,
    type: 'guideline',
  },
  cdcMilestones6months: {
    title: 'CDC Milestones at 6 Months',
    url: 'https://www.cdc.gov/ncbddd/actearly/milestones/milestones-6mo.html',
    organization: 'CDC',
    year: 2024,
    type: 'guideline',
  },
  cdcMilestones9months: {
    title: 'CDC Milestones at 9 Months',
    url: 'https://www.cdc.gov/ncbddd/actearly/milestones/milestones-9mo.html',
    organization: 'CDC',
    year: 2024,
    type: 'guideline',
  },
  cdcMilestones12months: {
    title: 'CDC Milestones at 12 Months',
    url: 'https://www.cdc.gov/ncbddd/actearly/milestones/milestones-1yr.html',
    organization: 'CDC',
    year: 2024,
    type: 'guideline',
  },
  cdcMilestones18months: {
    title: 'CDC Milestones at 18 Months',
    url: 'https://www.cdc.gov/ncbddd/actearly/milestones/milestones-18mo.html',
    organization: 'CDC',
    year: 2024,
    type: 'guideline',
  },
  cdcMilestones2years: {
    title: 'CDC Milestones at 2 Years',
    url: 'https://www.cdc.gov/ncbddd/actearly/milestones/milestones-2yr.html',
    organization: 'CDC',
    year: 2024,
    type: 'guideline',
  },
  cdcMilestones3years: {
    title: 'CDC Milestones at 3 Years',
    url: 'https://www.cdc.gov/ncbddd/actearly/milestones/milestones-3yr.html',
    organization: 'CDC',
    year: 2024,
    type: 'guideline',
  },
  cdcMilestones4years: {
    title: 'CDC Milestones at 4 Years',
    url: 'https://www.cdc.gov/ncbddd/actearly/milestones/milestones-4yr.html',
    organization: 'CDC',
    year: 2024,
    type: 'guideline',
  },
  cdcMilestones5years: {
    title: 'CDC Milestones at 5 Years',
    url: 'https://www.cdc.gov/ncbddd/actearly/milestones/milestones-5yr.html',
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
  whoEarlyChildhood: {
    title: 'WHO Early Child Development',
    url: 'https://www.who.int/health-topics/early-childhood-development',
    organization: 'WHO',
    year: 2024,
    type: 'guideline',
  },
  cdcFineMotor: {
    title: 'CDC Fine Motor Skills Development',
    url: 'https://www.cdc.gov/ncbddd/actearly/milestones/index.html',
    organization: 'CDC',
    year: 2024,
    type: 'guideline',
  },
  aapLanguage: {
    title: 'AAP Language Development in Children',
    url: 'https://www.healthychildren.org/English/ages-stages/toddler/Pages/Language-Development-2-Year-Olds.aspx',
    organization: 'AAP',
    year: 2024,
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
// Expanded to 50+ milestones covering 0-60 months with verified sources
export const WHO_MOTOR_MILESTONES: MilestoneProgress[] = [
  // 0-3 months - Gross Motor
  {
    id: 'head-control-tummy',
    domain: 'motor',
    title: 'Lifts Head During Tummy Time',
    description: 'Baby lifts head briefly while on tummy, developing neck strength',
    expectedAgeMonths: { min: 0, max: 3 },
    achieved: false,
    source: WHO_SOURCES.cdcMilestones2months,
  },
  {
    id: 'head-control-supported',
    domain: 'motor',
    title: 'Head Control When Supported',
    description: 'Holds head steady when held upright with support',
    expectedAgeMonths: { min: 1, max: 4 },
    achieved: false,
    source: WHO_SOURCES.motorMilestones,
  },
  // 3-6 months - Gross Motor
  {
    id: 'pushes-up-on-arms',
    domain: 'motor',
    title: 'Pushes Up on Arms',
    description: 'When on tummy, pushes up on arms to lift chest off surface',
    expectedAgeMonths: { min: 3, max: 6 },
    achieved: false,
    source: WHO_SOURCES.cdcMilestones4months,
  },
  {
    id: 'rolls-tummy-to-back',
    domain: 'motor',
    title: 'Rolls from Tummy to Back',
    description: 'Can roll from stomach to back independently',
    expectedAgeMonths: { min: 3, max: 6 },
    achieved: false,
    source: WHO_SOURCES.cdcMilestones4months,
  },
  {
    id: 'rolls-back-to-tummy',
    domain: 'motor',
    title: 'Rolls from Back to Tummy',
    description: 'Can roll from back to stomach independently',
    expectedAgeMonths: { min: 4, max: 7 },
    achieved: false,
    source: WHO_SOURCES.cdcMilestones6months,
  },
  // 4-9 months - Gross Motor
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
    id: 'pulls-to-stand',
    domain: 'motor',
    title: 'Pulls to Stand',
    description: 'Pulls self up to standing position using furniture',
    expectedAgeMonths: { min: 6, max: 12 },
    achieved: false,
    source: WHO_SOURCES.cdcMilestones9months,
  },
  // 6-14 months - Gross Motor
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
    id: 'cruising',
    domain: 'motor',
    title: 'Cruising Along Furniture',
    description: 'Walks while holding onto furniture for support',
    expectedAgeMonths: { min: 8, max: 14 },
    achieved: false,
    source: WHO_SOURCES.cdcMilestones12months,
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
  // 15-24 months - Gross Motor
  {
    id: 'walks-confidently',
    domain: 'motor',
    title: 'Walks Confidently',
    description: 'Walks steadily without falling frequently',
    expectedAgeMonths: { min: 12, max: 18 },
    achieved: false,
    source: WHO_SOURCES.cdcMilestones18months,
  },
  {
    id: 'runs-well',
    domain: 'motor',
    title: 'Runs Well',
    description: 'Child can run without falling',
    expectedAgeMonths: { min: 18, max: 24 },
    achieved: false,
    source: WHO_SOURCES.cdcMilestones2years,
  },
  {
    id: 'climbs-stairs',
    domain: 'motor',
    title: 'Climbs Stairs with Support',
    description: 'Child can walk up stairs with support, one step at a time',
    expectedAgeMonths: { min: 18, max: 30 },
    achieved: false,
    source: WHO_SOURCES.cdcMilestones2years,
  },
  {
    id: 'kicks-ball',
    domain: 'motor',
    title: 'Kicks Ball Forward',
    description: 'Can kick a ball forward while standing',
    expectedAgeMonths: { min: 18, max: 24 },
    achieved: false,
    source: WHO_SOURCES.cdcMilestones2years,
  },
  // 24-36 months - Gross Motor
  {
    id: 'jumps-both-feet',
    domain: 'motor',
    title: 'Jumps with Both Feet',
    description: 'Child can jump off the ground with both feet',
    expectedAgeMonths: { min: 24, max: 36 },
    achieved: false,
    source: WHO_SOURCES.cdcMilestones2years,
  },
  {
    id: 'stairs-alternating',
    domain: 'motor',
    title: 'Walks Up Stairs Alternating Feet',
    description: 'Climbs stairs with alternating feet, one foot per step',
    expectedAgeMonths: { min: 30, max: 42 },
    achieved: false,
    source: WHO_SOURCES.cdcMilestones3years,
  },
  // 36-48 months - Gross Motor
  {
    id: 'pedals-tricycle',
    domain: 'motor',
    title: 'Pedals a Tricycle',
    description: 'Child can pedal a tricycle',
    expectedAgeMonths: { min: 30, max: 42 },
    achieved: false,
    source: WHO_SOURCES.cdcMilestones3years,
  },
  {
    id: 'hops-one-foot',
    domain: 'motor',
    title: 'Hops on One Foot',
    description: 'Can hop forward on one foot',
    expectedAgeMonths: { min: 36, max: 48 },
    achieved: false,
    source: WHO_SOURCES.cdcMilestones4years,
  },
  {
    id: 'catches-ball',
    domain: 'motor',
    title: 'Catches Bounced Ball',
    description: 'Can catch a large ball that has been bounced',
    expectedAgeMonths: { min: 36, max: 48 },
    achieved: false,
    source: WHO_SOURCES.cdcMilestones4years,
  },
  // 48-60 months - Gross Motor
  {
    id: 'stands-one-foot-10sec',
    domain: 'motor',
    title: 'Stands on One Foot 10+ Seconds',
    description: 'Can balance on one foot for 10 seconds or longer',
    expectedAgeMonths: { min: 48, max: 60 },
    achieved: false,
    source: WHO_SOURCES.cdcMilestones5years,
  },
  {
    id: 'skips',
    domain: 'motor',
    title: 'Skips',
    description: 'Can skip forward alternating feet',
    expectedAgeMonths: { min: 48, max: 60 },
    achieved: false,
    source: WHO_SOURCES.cdcMilestones5years,
  },
  // Fine Motor Milestones - 0-6 months
  {
    id: 'hands-to-mouth',
    domain: 'motor',
    title: 'Brings Hands to Mouth',
    description: 'Brings hands to mouth to explore',
    expectedAgeMonths: { min: 0, max: 4 },
    achieved: false,
    source: WHO_SOURCES.cdcMilestones2months,
  },
  {
    id: 'reaches-for-objects',
    domain: 'motor',
    title: 'Reaches for Objects',
    description: 'Child reaches out to grab toys and objects',
    expectedAgeMonths: { min: 3, max: 5 },
    achieved: false,
    source: WHO_SOURCES.cdcMilestones4months,
  },
  {
    id: 'grasps-rattle',
    domain: 'motor',
    title: 'Grasps Rattle or Toy',
    description: 'Holds and shakes toys like rattles',
    expectedAgeMonths: { min: 3, max: 6 },
    achieved: false,
    source: WHO_SOURCES.cdcMilestones4months,
  },
  // Fine Motor - 6-12 months
  {
    id: 'transfers-objects',
    domain: 'motor',
    title: 'Transfers Objects Between Hands',
    description: 'Child can pass objects from one hand to the other',
    expectedAgeMonths: { min: 5, max: 9 },
    achieved: false,
    source: WHO_SOURCES.cdcMilestones6months,
  },
  {
    id: 'raking-grasp',
    domain: 'motor',
    title: 'Raking Grasp',
    description: 'Uses whole hand to pick up small objects',
    expectedAgeMonths: { min: 6, max: 9 },
    achieved: false,
    source: WHO_SOURCES.cdcFineMotor,
  },
  {
    id: 'pincer-grasp',
    domain: 'motor',
    title: 'Pincer Grasp',
    description: 'Child picks up small objects between thumb and index finger',
    expectedAgeMonths: { min: 8, max: 12 },
    achieved: false,
    source: WHO_SOURCES.cdcMilestones12months,
  },
  {
    id: 'bangs-objects',
    domain: 'motor',
    title: 'Bangs Objects Together',
    description: 'Holds two objects and bangs them together',
    expectedAgeMonths: { min: 8, max: 12 },
    achieved: false,
    source: WHO_SOURCES.cdcMilestones9months,
  },
  // Fine Motor - 12-24 months
  {
    id: 'stacks-blocks',
    domain: 'motor',
    title: 'Stacks 2-4 Blocks',
    description: 'Child can stack 2-4 blocks on top of each other',
    expectedAgeMonths: { min: 12, max: 24 },
    achieved: false,
    source: WHO_SOURCES.cdcMilestones18months,
  },
  {
    id: 'uses-spoon',
    domain: 'motor',
    title: 'Uses Spoon',
    description: 'Child can use a spoon to eat with minimal spilling',
    expectedAgeMonths: { min: 15, max: 24 },
    achieved: false,
    source: WHO_SOURCES.cdcMilestones18months,
  },
  {
    id: 'scribbles',
    domain: 'motor',
    title: 'Scribbles Spontaneously',
    description: 'Makes marks on paper with crayons or pencils',
    expectedAgeMonths: { min: 12, max: 18 },
    achieved: false,
    source: WHO_SOURCES.cdcMilestones18months,
  },
  // Fine Motor - 24-36 months
  {
    id: 'stacks-6-blocks',
    domain: 'motor',
    title: 'Stacks 6+ Blocks',
    description: 'Can stack 6 or more blocks in a tower',
    expectedAgeMonths: { min: 24, max: 36 },
    achieved: false,
    source: WHO_SOURCES.cdcMilestones2years,
  },
  {
    id: 'turns-pages',
    domain: 'motor',
    title: 'Turns Book Pages',
    description: 'Turns pages of a book one at a time',
    expectedAgeMonths: { min: 24, max: 36 },
    achieved: false,
    source: WHO_SOURCES.cdcMilestones2years,
  },
  // Fine Motor - 36-48 months
  {
    id: 'draws-circle',
    domain: 'motor',
    title: 'Draws a Circle',
    description: 'Can copy or draw a circle',
    expectedAgeMonths: { min: 36, max: 48 },
    achieved: false,
    source: WHO_SOURCES.cdcMilestones3years,
  },
  {
    id: 'uses-scissors',
    domain: 'motor',
    title: 'Uses Scissors',
    description: 'Can use child-safe scissors to cut paper',
    expectedAgeMonths: { min: 36, max: 48 },
    achieved: false,
    source: WHO_SOURCES.cdcMilestones4years,
  },
  // Fine Motor - 48-60 months
  {
    id: 'draws-person-6parts',
    domain: 'motor',
    title: 'Draws Person with 6+ Body Parts',
    description: 'Can draw a recognizable person with head, body, arms, legs',
    expectedAgeMonths: { min: 48, max: 60 },
    achieved: false,
    source: WHO_SOURCES.cdcMilestones5years,
  },
  {
    id: 'writes-letters',
    domain: 'motor',
    title: 'Writes Some Letters',
    description: 'Can write some letters of their name',
    expectedAgeMonths: { min: 48, max: 60 },
    achieved: false,
    source: WHO_SOURCES.cdcMilestones5years,
  },
];

// Language Milestones - Expanded 0-60 months
export const WHO_LANGUAGE_MILESTONES: MilestoneProgress[] = [
  // 0-3 months
  {
    id: 'coos',
    domain: 'language',
    title: 'Makes Cooing Sounds',
    description: 'Makes vowel sounds like "ooo" and "aah"',
    expectedAgeMonths: { min: 1, max: 4 },
    achieved: false,
    source: WHO_SOURCES.cdcMilestones2months,
  },
  {
    id: 'responds-to-sounds',
    domain: 'language',
    title: 'Responds to Sounds',
    description: 'Turns head toward sounds or voices',
    expectedAgeMonths: { min: 0, max: 3 },
    achieved: false,
    source: WHO_SOURCES.cdcMilestones2months,
  },
  // 3-6 months
  {
    id: 'laughs-aloud',
    domain: 'language',
    title: 'Laughs Aloud',
    description: 'Makes laughing sounds when happy',
    expectedAgeMonths: { min: 3, max: 6 },
    achieved: false,
    source: WHO_SOURCES.cdcMilestones4months,
  },
  {
    id: 'babbles-consonants',
    domain: 'language',
    title: 'Babbles with Consonants',
    description: 'Makes babbling sounds using consonants like "ba-ba" or "ma-ma"',
    expectedAgeMonths: { min: 4, max: 8 },
    achieved: false,
    source: WHO_SOURCES.cdcMilestones6months,
  },
  // 6-9 months
  {
    id: 'responds-to-name',
    domain: 'language',
    title: 'Responds to Name',
    description: 'Turns head when name is called',
    expectedAgeMonths: { min: 6, max: 12 },
    achieved: false,
    source: WHO_SOURCES.cdcMilestones9months,
  },
  {
    id: 'understands-no',
    domain: 'language',
    title: 'Understands "No"',
    description: 'Responds to "no" by pausing or looking',
    expectedAgeMonths: { min: 6, max: 12 },
    achieved: false,
    source: WHO_SOURCES.cdcMilestones9months,
  },
  {
    id: 'varied-babbling',
    domain: 'language',
    title: 'Varied Babbling',
    description: 'Babbles with different sounds like "ba-da-ga"',
    expectedAgeMonths: { min: 6, max: 10 },
    achieved: false,
    source: WHO_SOURCES.cdcMilestones9months,
  },
  // 9-12 months
  {
    id: 'uses-gestures',
    domain: 'language',
    title: 'Uses Gestures',
    description: 'Waves bye-bye, points at objects, or reaches to be picked up',
    expectedAgeMonths: { min: 9, max: 14 },
    achieved: false,
    source: WHO_SOURCES.cdcMilestones12months,
  },
  {
    id: 'first-words',
    domain: 'language',
    title: 'First Words',
    description: 'Says first words like "mama" or "dada" with meaning',
    expectedAgeMonths: { min: 9, max: 14 },
    achieved: false,
    source: WHO_SOURCES.cdcMilestones12months,
  },
  // 12-18 months
  {
    id: 'follows-simple-commands',
    domain: 'language',
    title: 'Follows Simple Commands',
    description: 'Follows simple instructions like "give me the ball"',
    expectedAgeMonths: { min: 12, max: 18 },
    achieved: false,
    source: WHO_SOURCES.cdcMilestones12months,
  },
  {
    id: 'says-several-words',
    domain: 'language',
    title: 'Says Several Words',
    description: 'Uses 3-5 words besides "mama" and "dada"',
    expectedAgeMonths: { min: 12, max: 18 },
    achieved: false,
    source: WHO_SOURCES.cdcMilestones18months,
  },
  {
    id: 'points-to-show',
    domain: 'language',
    title: 'Points to Show Interest',
    description: 'Points to things to share interest or get attention',
    expectedAgeMonths: { min: 12, max: 18 },
    achieved: false,
    source: WHO_SOURCES.cdcMilestones18months,
  },
  // 18-24 months
  {
    id: 'two-word-phrases',
    domain: 'language',
    title: 'Two-Word Phrases',
    description: 'Combines two words like "more milk" or "daddy go"',
    expectedAgeMonths: { min: 18, max: 24 },
    achieved: false,
    source: WHO_SOURCES.cdcMilestones2years,
  },
  {
    id: 'fifty-words',
    domain: 'language',
    title: 'Says 50+ Words',
    description: 'Vocabulary of 50 or more words',
    expectedAgeMonths: { min: 18, max: 30 },
    achieved: false,
    source: WHO_SOURCES.cdcMilestones2years,
  },
  {
    id: 'points-body-parts',
    domain: 'language',
    title: 'Points to Body Parts',
    description: 'Points to at least 2 body parts when asked',
    expectedAgeMonths: { min: 18, max: 24 },
    achieved: false,
    source: WHO_SOURCES.cdcMilestones2years,
  },
  // 24-36 months
  {
    id: 'simple-sentences',
    domain: 'language',
    title: 'Simple Sentences',
    description: 'Uses 2-3 word sentences',
    expectedAgeMonths: { min: 24, max: 36 },
    achieved: false,
    source: WHO_SOURCES.cdcMilestones2years,
  },
  {
    id: 'follows-2step-instructions',
    domain: 'language',
    title: 'Follows 2-Step Instructions',
    description: 'Can follow two-step instructions like "Pick up the toy and put it on the table"',
    expectedAgeMonths: { min: 24, max: 36 },
    achieved: false,
    source: WHO_SOURCES.cdcMilestones2years,
  },
  {
    id: 'names-pictures',
    domain: 'language',
    title: 'Names Pictures in Books',
    description: 'Can name common objects in picture books',
    expectedAgeMonths: { min: 24, max: 36 },
    achieved: false,
    source: WHO_SOURCES.cdcMilestones2years,
  },
  // 36-48 months
  {
    id: 'talks-in-sentences',
    domain: 'language',
    title: 'Talks in Sentences',
    description: 'Uses 4+ word sentences',
    expectedAgeMonths: { min: 36, max: 48 },
    achieved: false,
    source: WHO_SOURCES.cdcMilestones3years,
  },
  {
    id: 'asks-questions',
    domain: 'language',
    title: 'Asks Questions',
    description: 'Asks "who," "what," "where," and "why" questions',
    expectedAgeMonths: { min: 36, max: 48 },
    achieved: false,
    source: WHO_SOURCES.cdcMilestones3years,
  },
  {
    id: 'tells-stories',
    domain: 'language',
    title: 'Tells Simple Stories',
    description: 'Can tell a simple story with a beginning and end',
    expectedAgeMonths: { min: 36, max: 48 },
    achieved: false,
    source: WHO_SOURCES.cdcMilestones4years,
  },
  // 48-60 months
  {
    id: 'speaks-clearly',
    domain: 'language',
    title: 'Speaks Clearly',
    description: 'Speech is understood by strangers most of the time',
    expectedAgeMonths: { min: 48, max: 60 },
    achieved: false,
    source: WHO_SOURCES.cdcMilestones4years,
  },
  {
    id: 'tells-detailed-stories',
    domain: 'language',
    title: 'Tells Detailed Stories',
    description: 'Can tell stories with several details and a clear sequence',
    expectedAgeMonths: { min: 48, max: 60 },
    achieved: false,
    source: WHO_SOURCES.cdcMilestones5years,
  },
  {
    id: 'uses-future-tense',
    domain: 'language',
    title: 'Uses Future Tense',
    description: 'Uses future tense correctly (will, going to)',
    expectedAgeMonths: { min: 48, max: 60 },
    achieved: false,
    source: WHO_SOURCES.aapLanguage,
  },
];

// Cognitive Milestones - Expanded 0-60 months
export const WHO_COGNITIVE_MILESTONES: MilestoneProgress[] = [
  // 0-3 months
  {
    id: 'follows-moving-objects',
    domain: 'cognitive',
    title: 'Follows Moving Objects',
    description: 'Tracks moving objects with eyes',
    expectedAgeMonths: { min: 1, max: 4 },
    achieved: false,
    source: WHO_SOURCES.cdcMilestones2months,
  },
  {
    id: 'recognizes-caregiver',
    domain: 'cognitive',
    title: 'Recognizes Caregiver',
    description: 'Shows recognition of familiar faces and voices',
    expectedAgeMonths: { min: 2, max: 5 },
    achieved: false,
    source: WHO_SOURCES.cdcMilestones4months,
  },
  // 3-6 months
  {
    id: 'brings-things-to-mouth',
    domain: 'cognitive',
    title: 'Explores with Mouth',
    description: 'Brings objects to mouth to explore them',
    expectedAgeMonths: { min: 3, max: 8 },
    achieved: false,
    source: WHO_SOURCES.cdcMilestones4months,
  },
  {
    id: 'reaches-for-toy',
    domain: 'cognitive',
    title: 'Reaches for Nearby Toy',
    description: 'Shows interest and reaches for toys',
    expectedAgeMonths: { min: 3, max: 6 },
    achieved: false,
    source: WHO_SOURCES.cdcMilestones4months,
  },
  // 6-9 months
  {
    id: 'looks-for-dropped',
    domain: 'cognitive',
    title: 'Looks for Dropped Objects',
    description: 'Looks for toys that fall out of sight',
    expectedAgeMonths: { min: 6, max: 10 },
    achieved: false,
    source: WHO_SOURCES.cdcMilestones6months,
  },
  {
    id: 'explores-objects',
    domain: 'cognitive',
    title: 'Explores Objects',
    description: 'Explores objects in different ways (shaking, banging, throwing)',
    expectedAgeMonths: { min: 6, max: 12 },
    achieved: false,
    source: WHO_SOURCES.cdcMilestones9months,
  },
  // 9-12 months
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
    id: 'finds-hidden-objects',
    domain: 'cognitive',
    title: 'Finds Hidden Objects',
    description: 'Finds objects hidden under a cloth or container',
    expectedAgeMonths: { min: 9, max: 14 },
    achieved: false,
    source: WHO_SOURCES.cdcMilestones12months,
  },
  {
    id: 'uses-objects-correctly',
    domain: 'cognitive',
    title: 'Uses Objects Correctly',
    description: 'Uses objects correctly (drinks from cup, brushes hair)',
    expectedAgeMonths: { min: 9, max: 15 },
    achieved: false,
    source: WHO_SOURCES.cdcMilestones12months,
  },
  // 12-18 months
  {
    id: 'simple-pretend-play',
    domain: 'cognitive',
    title: 'Simple Pretend Play',
    description: 'Engages in simple pretend play like feeding a doll',
    expectedAgeMonths: { min: 12, max: 24 },
    achieved: false,
    source: WHO_SOURCES.cdcMilestones18months,
  },
  {
    id: 'points-to-pictures',
    domain: 'cognitive',
    title: 'Points to Pictures',
    description: 'Points to pictures when named',
    expectedAgeMonths: { min: 12, max: 18 },
    achieved: false,
    source: WHO_SOURCES.cdcMilestones18months,
  },
  // 18-24 months
  {
    id: 'knows-body-parts',
    domain: 'cognitive',
    title: 'Knows Body Parts',
    description: 'Can point to several body parts when named',
    expectedAgeMonths: { min: 18, max: 24 },
    achieved: false,
    source: WHO_SOURCES.cdcMilestones2years,
  },
  {
    id: 'completes-simple-puzzles',
    domain: 'cognitive',
    title: 'Completes Simple Puzzles',
    description: 'Can complete simple 2-3 piece puzzles',
    expectedAgeMonths: { min: 18, max: 30 },
    achieved: false,
    source: WHO_SOURCES.cdcMilestones2years,
  },
  // 24-36 months
  {
    id: 'sorts-shapes-colors',
    domain: 'cognitive',
    title: 'Sorts Shapes and Colors',
    description: 'Can sort objects by shape or color',
    expectedAgeMonths: { min: 24, max: 36 },
    achieved: false,
    source: WHO_SOURCES.cdcMilestones2years,
  },
  {
    id: 'plays-make-believe',
    domain: 'cognitive',
    title: 'Plays Make-Believe',
    description: 'Engages in imaginative play with dolls, animals, people',
    expectedAgeMonths: { min: 24, max: 36 },
    achieved: false,
    source: WHO_SOURCES.cdcMilestones3years,
  },
  {
    id: 'understands-same-different',
    domain: 'cognitive',
    title: 'Understands Same and Different',
    description: 'Can identify things that are the same or different',
    expectedAgeMonths: { min: 30, max: 42 },
    achieved: false,
    source: WHO_SOURCES.cdcMilestones3years,
  },
  // 36-48 months
  {
    id: 'understands-counting',
    domain: 'cognitive',
    title: 'Understands Counting',
    description: 'Understands the concept of counting and may count to 10',
    expectedAgeMonths: { min: 36, max: 48 },
    achieved: false,
    source: WHO_SOURCES.cdcMilestones4years,
  },
  {
    id: 'names-colors',
    domain: 'cognitive',
    title: 'Names Some Colors',
    description: 'Can correctly name at least 4 colors',
    expectedAgeMonths: { min: 36, max: 48 },
    achieved: false,
    source: WHO_SOURCES.cdcMilestones4years,
  },
  {
    id: 'understands-time-concepts',
    domain: 'cognitive',
    title: 'Understands Time Concepts',
    description: 'Understands "same" and "different", today/tomorrow',
    expectedAgeMonths: { min: 36, max: 48 },
    achieved: false,
    source: WHO_SOURCES.cdcMilestones4years,
  },
  // 48-60 months
  {
    id: 'counts-10-objects',
    domain: 'cognitive',
    title: 'Counts 10+ Objects',
    description: 'Can count 10 or more objects correctly',
    expectedAgeMonths: { min: 48, max: 60 },
    achieved: false,
    source: WHO_SOURCES.cdcMilestones5years,
  },
  {
    id: 'writes-some-letters',
    domain: 'cognitive',
    title: 'Recognizes Letters and Numbers',
    description: 'Can name some letters and numbers',
    expectedAgeMonths: { min: 48, max: 60 },
    achieved: false,
    source: WHO_SOURCES.cdcMilestones5years,
  },
  {
    id: 'understands-rhyming',
    domain: 'cognitive',
    title: 'Understands Rhyming',
    description: 'Can identify words that rhyme',
    expectedAgeMonths: { min: 48, max: 60 },
    achieved: false,
    source: WHO_SOURCES.cdcMilestones5years,
  },
];

// Social-Emotional Milestones - Expanded 0-60 months
export const WHO_SOCIAL_MILESTONES: MilestoneProgress[] = [
  // 0-3 months
  {
    id: 'social-smile',
    domain: 'social',
    title: 'Social Smile',
    description: 'Smiles in response to social interaction',
    expectedAgeMonths: { min: 1, max: 3 },
    achieved: false,
    source: WHO_SOURCES.cdcMilestones2months,
  },
  {
    id: 'calms-to-voice',
    domain: 'social',
    title: 'Calms to Voice',
    description: 'Calms down when spoken to or picked up',
    expectedAgeMonths: { min: 0, max: 3 },
    achieved: false,
    source: WHO_SOURCES.cdcMilestones2months,
  },
  {
    id: 'looks-at-faces',
    domain: 'social',
    title: 'Looks at Faces',
    description: 'Shows interest in looking at faces',
    expectedAgeMonths: { min: 0, max: 3 },
    achieved: false,
    source: WHO_SOURCES.cdcMilestones2months,
  },
  // 3-6 months
  {
    id: 'smiles-spontaneously',
    domain: 'social',
    title: 'Smiles Spontaneously',
    description: 'Smiles spontaneously, especially at people',
    expectedAgeMonths: { min: 3, max: 6 },
    achieved: false,
    source: WHO_SOURCES.cdcMilestones4months,
  },
  {
    id: 'enjoys-play',
    domain: 'social',
    title: 'Enjoys Playing with People',
    description: 'Likes to play with people and might cry when playing stops',
    expectedAgeMonths: { min: 3, max: 6 },
    achieved: false,
    source: WHO_SOURCES.cdcMilestones4months,
  },
  // 6-9 months
  {
    id: 'stranger-anxiety',
    domain: 'social',
    title: 'Stranger Awareness',
    description: 'Shows wariness around unfamiliar people',
    expectedAgeMonths: { min: 6, max: 12 },
    achieved: false,
    source: WHO_SOURCES.cdcMilestones9months,
  },
  {
    id: 'has-favorite-toys',
    domain: 'social',
    title: 'Has Favorite Toys',
    description: 'Shows preferences for certain toys',
    expectedAgeMonths: { min: 6, max: 12 },
    achieved: false,
    source: WHO_SOURCES.cdcMilestones9months,
  },
  {
    id: 'plays-peekaboo',
    domain: 'social',
    title: 'Plays Peek-a-Boo',
    description: 'Enjoys and responds to peek-a-boo games',
    expectedAgeMonths: { min: 6, max: 12 },
    achieved: false,
    source: WHO_SOURCES.cdcMilestones9months,
  },
  // 9-12 months
  {
    id: 'waves-bye',
    domain: 'social',
    title: 'Waves Bye-Bye',
    description: 'Waves goodbye when prompted',
    expectedAgeMonths: { min: 9, max: 15 },
    achieved: false,
    source: WHO_SOURCES.cdcMilestones12months,
  },
  {
    id: 'cries-when-parent-leaves',
    domain: 'social',
    title: 'Separation Anxiety',
    description: 'Cries when parents leave, showing attachment',
    expectedAgeMonths: { min: 8, max: 14 },
    achieved: false,
    source: WHO_SOURCES.cdcMilestones12months,
  },
  // 12-18 months
  {
    id: 'shows-affection',
    domain: 'social',
    title: 'Shows Affection',
    description: 'Shows affection with hugs and kisses',
    expectedAgeMonths: { min: 12, max: 18 },
    achieved: false,
    source: WHO_SOURCES.cdcMilestones18months,
  },
  {
    id: 'plays-simple-pretend',
    domain: 'social',
    title: 'Simple Pretend with Others',
    description: 'Engages in simple pretend play with caregivers',
    expectedAgeMonths: { min: 12, max: 18 },
    achieved: false,
    source: WHO_SOURCES.cdcMilestones18months,
  },
  {
    id: 'shows-you-object',
    domain: 'social',
    title: 'Shows Objects to Others',
    description: 'Shows you objects they like',
    expectedAgeMonths: { min: 12, max: 18 },
    achieved: false,
    source: WHO_SOURCES.cdcMilestones18months,
  },
  // 18-24 months
  {
    id: 'parallel-play',
    domain: 'social',
    title: 'Parallel Play',
    description: 'Plays alongside other children',
    expectedAgeMonths: { min: 18, max: 30 },
    achieved: false,
    source: WHO_SOURCES.cdcMilestones2years,
  },
  {
    id: 'copies-adults',
    domain: 'social',
    title: 'Copies Adults and Children',
    description: 'Imitates behaviors of adults and other children',
    expectedAgeMonths: { min: 18, max: 24 },
    achieved: false,
    source: WHO_SOURCES.cdcMilestones2years,
  },
  {
    id: 'shows-independence',
    domain: 'social',
    title: 'Shows Independence',
    description: 'Shows defiant behavior and wants to do things alone',
    expectedAgeMonths: { min: 18, max: 30 },
    achieved: false,
    source: WHO_SOURCES.cdcMilestones2years,
  },
  // 24-36 months
  {
    id: 'shares-with-others',
    domain: 'social',
    title: 'Begins Sharing',
    description: 'Begins to share toys with other children',
    expectedAgeMonths: { min: 24, max: 42 },
    achieved: false,
    source: WHO_SOURCES.cdcMilestones3years,
  },
  {
    id: 'takes-turns',
    domain: 'social',
    title: 'Takes Turns',
    description: 'Can take turns in games or activities',
    expectedAgeMonths: { min: 24, max: 36 },
    achieved: false,
    source: WHO_SOURCES.cdcMilestones3years,
  },
  {
    id: 'shows-concern',
    domain: 'social',
    title: 'Shows Concern for Others',
    description: 'Shows concern when someone is crying or hurt',
    expectedAgeMonths: { min: 24, max: 36 },
    achieved: false,
    source: WHO_SOURCES.cdcMilestones3years,
  },
  // 36-48 months
  {
    id: 'cooperative-play',
    domain: 'social',
    title: 'Cooperative Play',
    description: 'Plays cooperatively with other children',
    expectedAgeMonths: { min: 36, max: 48 },
    achieved: false,
    source: WHO_SOURCES.cdcMilestones4years,
  },
  {
    id: 'talks-about-interests',
    domain: 'social',
    title: 'Talks About Interests',
    description: 'Talks about what they like and are interested in',
    expectedAgeMonths: { min: 36, max: 48 },
    achieved: false,
    source: WHO_SOURCES.cdcMilestones4years,
  },
  {
    id: 'prefers-friends',
    domain: 'social',
    title: 'Has Favorite Friends',
    description: 'Has favorite friends and knows their names',
    expectedAgeMonths: { min: 36, max: 48 },
    achieved: false,
    source: WHO_SOURCES.cdcMilestones4years,
  },
  // 48-60 months
  {
    id: 'follows-rules',
    domain: 'social',
    title: 'Follows Rules',
    description: 'Follows rules and takes turns in games',
    expectedAgeMonths: { min: 48, max: 60 },
    achieved: false,
    source: WHO_SOURCES.cdcMilestones5years,
  },
  {
    id: 'likes-to-please-friends',
    domain: 'social',
    title: 'Wants to Please Friends',
    description: 'Wants to be like friends and wants to please them',
    expectedAgeMonths: { min: 48, max: 60 },
    achieved: false,
    source: WHO_SOURCES.cdcMilestones5years,
  },
  {
    id: 'distinguishes-real-makebelieve',
    domain: 'social',
    title: 'Real vs. Make-Believe',
    description: 'Can tell the difference between real and make-believe',
    expectedAgeMonths: { min: 48, max: 60 },
    achieved: false,
    source: WHO_SOURCES.cdcMilestones5years,
  },
];

// Sensory Milestones - NEW (0-24 months)
export const WHO_SENSORY_MILESTONES: MilestoneProgress[] = [
  // 0-3 months
  {
    id: 'startles-to-sounds',
    domain: 'sensory',
    title: 'Startles to Loud Sounds',
    description: 'Startles or blinks in response to loud sounds',
    expectedAgeMonths: { min: 0, max: 3 },
    achieved: false,
    source: WHO_SOURCES.cdcMilestones2months,
  },
  {
    id: 'focuses-on-faces',
    domain: 'sensory',
    title: 'Focuses on Faces',
    description: 'Can focus on faces 8-12 inches away',
    expectedAgeMonths: { min: 0, max: 3 },
    achieved: false,
    source: WHO_SOURCES.cdcMilestones2months,
  },
  // 3-6 months
  {
    id: 'tracks-objects',
    domain: 'sensory',
    title: 'Tracks Moving Objects',
    description: 'Follows moving objects with eyes smoothly',
    expectedAgeMonths: { min: 2, max: 6 },
    achieved: false,
    source: WHO_SOURCES.cdcMilestones4months,
  },
  {
    id: 'recognizes-voices',
    domain: 'sensory',
    title: 'Recognizes Familiar Voices',
    description: 'Shows recognition of familiar voices and sounds',
    expectedAgeMonths: { min: 3, max: 6 },
    achieved: false,
    source: WHO_SOURCES.cdcMilestones4months,
  },
  // 6-12 months
  {
    id: 'responds-to-sounds',
    domain: 'sensory',
    title: 'Responds to Sounds from All Directions',
    description: 'Turns head toward sounds from any direction',
    expectedAgeMonths: { min: 6, max: 10 },
    achieved: false,
    source: WHO_SOURCES.cdcMilestones9months,
  },
  {
    id: 'texture-exploration',
    domain: 'sensory',
    title: 'Explores Textures',
    description: 'Shows interest in different textures and surfaces',
    expectedAgeMonths: { min: 6, max: 12 },
    achieved: false,
    source: WHO_SOURCES.developmentalMilestones,
  },
  // 12-24 months
  {
    id: 'identifies-sounds',
    domain: 'sensory',
    title: 'Identifies Common Sounds',
    description: 'Recognizes and responds to familiar sounds (doorbell, phone)',
    expectedAgeMonths: { min: 12, max: 24 },
    achieved: false,
    source: WHO_SOURCES.cdcMilestones18months,
  },
  {
    id: 'tolerates-messy-play',
    domain: 'sensory',
    title: 'Tolerates Messy Play',
    description: 'Can engage with different textures in messy play',
    expectedAgeMonths: { min: 12, max: 24 },
    achieved: false,
    source: WHO_SOURCES.developmentalMilestones,
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
export function getAllMilestones(): MilestoneProgress[] {
  return [
    ...WHO_MOTOR_MILESTONES,
    ...WHO_LANGUAGE_MILESTONES,
    ...WHO_COGNITIVE_MILESTONES,
    ...WHO_SOCIAL_MILESTONES,
    ...WHO_SENSORY_MILESTONES,
  ];
}

export function getMilestonesForAge(ageMonths: number): MilestoneProgress[] {
  const allMilestones = getAllMilestones();

  return allMilestones.filter(
    (m) => m.expectedAgeMonths.min <= ageMonths && ageMonths <= m.expectedAgeMonths.max + 6
  );
}

export function getMilestoneById(id: string): MilestoneProgress | undefined {
  return getAllMilestones().find(m => m.id === id);
}

export function getMilestonesByDomain(domain: 'motor' | 'language' | 'cognitive' | 'social' | 'sensory'): MilestoneProgress[] {
  return getAllMilestones().filter(m => m.domain === domain);
}

export function getUpcomingMilestones(ageMonths: number, count: number = 5): MilestoneProgress[] {
  return getAllMilestones()
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
