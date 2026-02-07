import '../models/analysis_result.dart';
import '../models/child_profile.dart';

/// WHO Data Service - Provides WHO developmental milestones, growth standards,
/// and official source citations for child development analysis.
/// Expanded to 80+ milestones covering 0-60 months with verified sources.
class WHODataService {
  // Official WHO/CDC Sources with URLs
  static const List<WHOSource> whoSources = [
    WHOSource(
      title: 'WHO Motor Development Study',
      url: 'https://www.who.int/publications/i/item/9789241596275',
      description: 'WHO Multicentre Growth Reference Study: Motor development milestones',
      type: 'study',
    ),
    WHOSource(
      title: 'WHO Child Growth Standards',
      url: 'https://www.who.int/tools/child-growth-standards/standards',
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

  // Age-specific CDC milestone sources
  static const WHOSource cdcMilestones2months = WHOSource(
    title: 'CDC Milestones at 2 Months',
    url: 'https://www.cdc.gov/ncbddd/actearly/milestones/milestones-2mo.html',
    description: 'CDC developmental milestones checklist for 2 months',
    type: 'guideline',
  );

  static const WHOSource cdcMilestones4months = WHOSource(
    title: 'CDC Milestones at 4 Months',
    url: 'https://www.cdc.gov/ncbddd/actearly/milestones/milestones-4mo.html',
    description: 'CDC developmental milestones checklist for 4 months',
    type: 'guideline',
  );

  static const WHOSource cdcMilestones6months = WHOSource(
    title: 'CDC Milestones at 6 Months',
    url: 'https://www.cdc.gov/ncbddd/actearly/milestones/milestones-6mo.html',
    description: 'CDC developmental milestones checklist for 6 months',
    type: 'guideline',
  );

  static const WHOSource cdcMilestones9months = WHOSource(
    title: 'CDC Milestones at 9 Months',
    url: 'https://www.cdc.gov/ncbddd/actearly/milestones/milestones-9mo.html',
    description: 'CDC developmental milestones checklist for 9 months',
    type: 'guideline',
  );

  static const WHOSource cdcMilestones12months = WHOSource(
    title: 'CDC Milestones at 12 Months',
    url: 'https://www.cdc.gov/ncbddd/actearly/milestones/milestones-1yr.html',
    description: 'CDC developmental milestones checklist for 12 months',
    type: 'guideline',
  );

  static const WHOSource cdcMilestones18months = WHOSource(
    title: 'CDC Milestones at 18 Months',
    url: 'https://www.cdc.gov/ncbddd/actearly/milestones/milestones-18mo.html',
    description: 'CDC developmental milestones checklist for 18 months',
    type: 'guideline',
  );

  static const WHOSource cdcMilestones2years = WHOSource(
    title: 'CDC Milestones at 2 Years',
    url: 'https://www.cdc.gov/ncbddd/actearly/milestones/milestones-2yr.html',
    description: 'CDC developmental milestones checklist for 2 years',
    type: 'guideline',
  );

  static const WHOSource cdcMilestones3years = WHOSource(
    title: 'CDC Milestones at 3 Years',
    url: 'https://www.cdc.gov/ncbddd/actearly/milestones/milestones-3yr.html',
    description: 'CDC developmental milestones checklist for 3 years',
    type: 'guideline',
  );

  static const WHOSource cdcMilestones4years = WHOSource(
    title: 'CDC Milestones at 4 Years',
    url: 'https://www.cdc.gov/ncbddd/actearly/milestones/milestones-4yr.html',
    description: 'CDC developmental milestones checklist for 4 years',
    type: 'guideline',
  );

  static const WHOSource cdcMilestones5years = WHOSource(
    title: 'CDC Milestones at 5 Years',
    url: 'https://www.cdc.gov/ncbddd/actearly/milestones/milestones-5yr.html',
    description: 'CDC developmental milestones checklist for 5 years',
    type: 'guideline',
  );

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

  // Motor Milestones - Expanded 0-60 months
  static final List<Milestone> motorMilestones = [
    // 0-3 months - Gross Motor
    Milestone(
      id: 'head-control-tummy',
      title: 'Lifts Head During Tummy Time',
      description: 'Baby lifts head briefly while on tummy, developing neck strength',
      domain: DevelopmentDomain.motor,
      minMonths: 0,
      maxMonths: 3,
      typicalMonths: 2,
      source: cdcMilestones2months,
    ),
    Milestone(
      id: 'head-control-supported',
      title: 'Head Control When Supported',
      description: 'Holds head steady when held upright with support',
      domain: DevelopmentDomain.motor,
      minMonths: 1,
      maxMonths: 4,
      typicalMonths: 2,
      source: whoSources[0],
    ),
    // 3-6 months - Gross Motor
    Milestone(
      id: 'pushes-up-on-arms',
      title: 'Pushes Up on Arms',
      description: 'When on tummy, pushes up on arms to lift chest off surface',
      domain: DevelopmentDomain.motor,
      minMonths: 3,
      maxMonths: 6,
      typicalMonths: 4,
      source: cdcMilestones4months,
    ),
    Milestone(
      id: 'rolls-tummy-to-back',
      title: 'Rolls from Tummy to Back',
      description: 'Can roll from stomach to back independently',
      domain: DevelopmentDomain.motor,
      minMonths: 3,
      maxMonths: 6,
      typicalMonths: 4,
      source: cdcMilestones4months,
    ),
    Milestone(
      id: 'rolls-back-to-tummy',
      title: 'Rolls from Back to Tummy',
      description: 'Can roll from back to stomach independently',
      domain: DevelopmentDomain.motor,
      minMonths: 4,
      maxMonths: 7,
      typicalMonths: 5,
      source: cdcMilestones6months,
    ),
    // 4-9 months - Gross Motor
    Milestone(
      id: 'sitting-without-support',
      title: 'Sitting Without Support',
      description: 'Child can sit alone without support for at least 10 seconds',
      domain: DevelopmentDomain.motor,
      minMonths: 4,
      maxMonths: 9,
      typicalMonths: 6,
      source: whoSources[0],
    ),
    Milestone(
      id: 'standing-with-assistance',
      title: 'Standing with Assistance',
      description: 'Child can stand while holding onto furniture or someone\'s hands',
      domain: DevelopmentDomain.motor,
      minMonths: 5,
      maxMonths: 11,
      typicalMonths: 8,
      source: whoSources[0],
    ),
    Milestone(
      id: 'hands-and-knees-crawling',
      title: 'Hands and Knees Crawling',
      description: 'Child moves forward on hands and knees',
      domain: DevelopmentDomain.motor,
      minMonths: 5,
      maxMonths: 13,
      typicalMonths: 8,
      source: whoSources[0],
    ),
    Milestone(
      id: 'pulls-to-stand',
      title: 'Pulls to Stand',
      description: 'Pulls self up to standing position using furniture',
      domain: DevelopmentDomain.motor,
      minMonths: 6,
      maxMonths: 12,
      typicalMonths: 9,
      source: cdcMilestones9months,
    ),
    // 6-14 months - Gross Motor
    Milestone(
      id: 'walking-with-assistance',
      title: 'Walking with Assistance',
      description: 'Child can walk while holding onto furniture or someone\'s hands',
      domain: DevelopmentDomain.motor,
      minMonths: 6,
      maxMonths: 14,
      typicalMonths: 9,
      source: whoSources[0],
    ),
    Milestone(
      id: 'cruising',
      title: 'Cruising Along Furniture',
      description: 'Walks while holding onto furniture for support',
      domain: DevelopmentDomain.motor,
      minMonths: 8,
      maxMonths: 14,
      typicalMonths: 10,
      source: cdcMilestones12months,
    ),
    Milestone(
      id: 'standing-alone',
      title: 'Standing Alone',
      description: 'Child can stand independently without support for at least 10 seconds',
      domain: DevelopmentDomain.motor,
      minMonths: 7,
      maxMonths: 17,
      typicalMonths: 11,
      source: whoSources[0],
    ),
    Milestone(
      id: 'walking-alone',
      title: 'Walking Alone',
      description: 'Child takes at least 5 independent steps without support',
      domain: DevelopmentDomain.motor,
      minMonths: 8,
      maxMonths: 18,
      typicalMonths: 12,
      source: whoSources[0],
    ),
    // 15-24 months - Gross Motor
    Milestone(
      id: 'walks-confidently',
      title: 'Walks Confidently',
      description: 'Walks steadily without falling frequently',
      domain: DevelopmentDomain.motor,
      minMonths: 12,
      maxMonths: 18,
      typicalMonths: 15,
      source: cdcMilestones18months,
    ),
    Milestone(
      id: 'runs-well',
      title: 'Runs Well',
      description: 'Child can run without falling',
      domain: DevelopmentDomain.motor,
      minMonths: 18,
      maxMonths: 24,
      typicalMonths: 20,
      source: cdcMilestones2years,
    ),
    Milestone(
      id: 'climbs-stairs',
      title: 'Climbs Stairs with Support',
      description: 'Child can walk up stairs with support, one step at a time',
      domain: DevelopmentDomain.motor,
      minMonths: 18,
      maxMonths: 30,
      typicalMonths: 24,
      source: cdcMilestones2years,
    ),
    Milestone(
      id: 'kicks-ball',
      title: 'Kicks Ball Forward',
      description: 'Can kick a ball forward while standing',
      domain: DevelopmentDomain.motor,
      minMonths: 18,
      maxMonths: 24,
      typicalMonths: 21,
      source: cdcMilestones2years,
    ),
    // 24-36 months - Gross Motor
    Milestone(
      id: 'jumps-both-feet',
      title: 'Jumps with Both Feet',
      description: 'Child can jump off the ground with both feet',
      domain: DevelopmentDomain.motor,
      minMonths: 24,
      maxMonths: 36,
      typicalMonths: 30,
      source: cdcMilestones2years,
    ),
    Milestone(
      id: 'stairs-alternating',
      title: 'Walks Up Stairs Alternating Feet',
      description: 'Climbs stairs with alternating feet, one foot per step',
      domain: DevelopmentDomain.motor,
      minMonths: 30,
      maxMonths: 42,
      typicalMonths: 36,
      source: cdcMilestones3years,
    ),
    // 36-48 months - Gross Motor
    Milestone(
      id: 'pedals-tricycle',
      title: 'Pedals a Tricycle',
      description: 'Child can pedal a tricycle',
      domain: DevelopmentDomain.motor,
      minMonths: 30,
      maxMonths: 42,
      typicalMonths: 36,
      source: cdcMilestones3years,
    ),
    Milestone(
      id: 'hops-one-foot',
      title: 'Hops on One Foot',
      description: 'Can hop forward on one foot',
      domain: DevelopmentDomain.motor,
      minMonths: 36,
      maxMonths: 48,
      typicalMonths: 42,
      source: cdcMilestones4years,
    ),
    Milestone(
      id: 'catches-ball',
      title: 'Catches Bounced Ball',
      description: 'Can catch a large ball that has been bounced',
      domain: DevelopmentDomain.motor,
      minMonths: 36,
      maxMonths: 48,
      typicalMonths: 42,
      source: cdcMilestones4years,
    ),
    // 48-60 months - Gross Motor
    Milestone(
      id: 'stands-one-foot-10sec',
      title: 'Stands on One Foot 10+ Seconds',
      description: 'Can balance on one foot for 10 seconds or longer',
      domain: DevelopmentDomain.motor,
      minMonths: 48,
      maxMonths: 60,
      typicalMonths: 54,
      source: cdcMilestones5years,
    ),
    Milestone(
      id: 'skips',
      title: 'Skips',
      description: 'Can skip forward alternating feet',
      domain: DevelopmentDomain.motor,
      minMonths: 48,
      maxMonths: 60,
      typicalMonths: 54,
      source: cdcMilestones5years,
    ),
    // Fine Motor Milestones - 0-6 months
    Milestone(
      id: 'hands-to-mouth',
      title: 'Brings Hands to Mouth',
      description: 'Brings hands to mouth to explore',
      domain: DevelopmentDomain.motor,
      minMonths: 0,
      maxMonths: 4,
      typicalMonths: 2,
      source: cdcMilestones2months,
    ),
    Milestone(
      id: 'reaches-for-objects',
      title: 'Reaches for Objects',
      description: 'Child reaches out to grab toys and objects',
      domain: DevelopmentDomain.motor,
      minMonths: 3,
      maxMonths: 5,
      typicalMonths: 4,
      source: cdcMilestones4months,
    ),
    Milestone(
      id: 'grasps-rattle',
      title: 'Grasps Rattle or Toy',
      description: 'Holds and shakes toys like rattles',
      domain: DevelopmentDomain.motor,
      minMonths: 3,
      maxMonths: 6,
      typicalMonths: 4,
      source: cdcMilestones4months,
    ),
    // Fine Motor - 6-12 months
    Milestone(
      id: 'transfers-objects',
      title: 'Transfers Objects Between Hands',
      description: 'Child can pass objects from one hand to the other',
      domain: DevelopmentDomain.motor,
      minMonths: 5,
      maxMonths: 9,
      typicalMonths: 7,
      source: cdcMilestones6months,
    ),
    Milestone(
      id: 'pincer-grasp',
      title: 'Pincer Grasp',
      description: 'Child picks up small objects between thumb and index finger',
      domain: DevelopmentDomain.motor,
      minMonths: 8,
      maxMonths: 12,
      typicalMonths: 10,
      source: cdcMilestones12months,
    ),
    Milestone(
      id: 'bangs-objects',
      title: 'Bangs Objects Together',
      description: 'Holds two objects and bangs them together',
      domain: DevelopmentDomain.motor,
      minMonths: 8,
      maxMonths: 12,
      typicalMonths: 10,
      source: cdcMilestones9months,
    ),
    // Fine Motor - 12-24 months
    Milestone(
      id: 'stacks-blocks',
      title: 'Stacks 2-4 Blocks',
      description: 'Child can stack 2-4 blocks on top of each other',
      domain: DevelopmentDomain.motor,
      minMonths: 12,
      maxMonths: 24,
      typicalMonths: 18,
      source: cdcMilestones18months,
    ),
    Milestone(
      id: 'uses-spoon',
      title: 'Uses Spoon',
      description: 'Child can use a spoon to eat with minimal spilling',
      domain: DevelopmentDomain.motor,
      minMonths: 15,
      maxMonths: 24,
      typicalMonths: 18,
      source: cdcMilestones18months,
    ),
    Milestone(
      id: 'scribbles',
      title: 'Scribbles Spontaneously',
      description: 'Makes marks on paper with crayons or pencils',
      domain: DevelopmentDomain.motor,
      minMonths: 12,
      maxMonths: 18,
      typicalMonths: 15,
      source: cdcMilestones18months,
    ),
    // Fine Motor - 24-48 months
    Milestone(
      id: 'stacks-6-blocks',
      title: 'Stacks 6+ Blocks',
      description: 'Can stack 6 or more blocks in a tower',
      domain: DevelopmentDomain.motor,
      minMonths: 24,
      maxMonths: 36,
      typicalMonths: 30,
      source: cdcMilestones2years,
    ),
    Milestone(
      id: 'turns-pages',
      title: 'Turns Book Pages',
      description: 'Turns pages of a book one at a time',
      domain: DevelopmentDomain.motor,
      minMonths: 24,
      maxMonths: 36,
      typicalMonths: 30,
      source: cdcMilestones2years,
    ),
    Milestone(
      id: 'draws-circle',
      title: 'Draws a Circle',
      description: 'Can copy or draw a circle',
      domain: DevelopmentDomain.motor,
      minMonths: 36,
      maxMonths: 48,
      typicalMonths: 42,
      source: cdcMilestones3years,
    ),
    Milestone(
      id: 'uses-scissors',
      title: 'Uses Scissors',
      description: 'Can use child-safe scissors to cut paper',
      domain: DevelopmentDomain.motor,
      minMonths: 36,
      maxMonths: 48,
      typicalMonths: 42,
      source: cdcMilestones4years,
    ),
    // Fine Motor - 48-60 months
    Milestone(
      id: 'draws-person-6parts',
      title: 'Draws Person with 6+ Body Parts',
      description: 'Can draw a recognizable person with head, body, arms, legs',
      domain: DevelopmentDomain.motor,
      minMonths: 48,
      maxMonths: 60,
      typicalMonths: 54,
      source: cdcMilestones5years,
    ),
    Milestone(
      id: 'writes-letters',
      title: 'Writes Some Letters',
      description: 'Can write some letters of their name',
      domain: DevelopmentDomain.motor,
      minMonths: 48,
      maxMonths: 60,
      typicalMonths: 54,
      source: cdcMilestones5years,
    ),
  ];

  // Language Milestones - Expanded 0-60 months
  static final List<Milestone> languageMilestones = [
    // 0-3 months
    Milestone(
      id: 'coos',
      title: 'Makes Cooing Sounds',
      description: 'Makes vowel sounds like "ooo" and "aah"',
      domain: DevelopmentDomain.language,
      minMonths: 1,
      maxMonths: 4,
      typicalMonths: 2,
      source: cdcMilestones2months,
    ),
    Milestone(
      id: 'responds-to-sounds',
      title: 'Responds to Sounds',
      description: 'Turns head toward sounds or voices',
      domain: DevelopmentDomain.language,
      minMonths: 0,
      maxMonths: 3,
      typicalMonths: 2,
      source: cdcMilestones2months,
    ),
    // 3-6 months
    Milestone(
      id: 'laughs-aloud',
      title: 'Laughs Aloud',
      description: 'Makes laughing sounds when happy',
      domain: DevelopmentDomain.language,
      minMonths: 3,
      maxMonths: 6,
      typicalMonths: 4,
      source: cdcMilestones4months,
    ),
    Milestone(
      id: 'babbles-consonants',
      title: 'Babbles with Consonants',
      description: 'Makes babbling sounds using consonants like "ba-ba" or "ma-ma"',
      domain: DevelopmentDomain.language,
      minMonths: 4,
      maxMonths: 8,
      typicalMonths: 6,
      source: cdcMilestones6months,
    ),
    // 6-9 months
    Milestone(
      id: 'responds-to-name',
      title: 'Responds to Name',
      description: 'Turns head when name is called',
      domain: DevelopmentDomain.language,
      minMonths: 6,
      maxMonths: 12,
      typicalMonths: 9,
      source: cdcMilestones9months,
    ),
    Milestone(
      id: 'understands-no',
      title: 'Understands "No"',
      description: 'Responds to "no" by pausing or looking',
      domain: DevelopmentDomain.language,
      minMonths: 6,
      maxMonths: 12,
      typicalMonths: 9,
      source: cdcMilestones9months,
    ),
    // 9-12 months
    Milestone(
      id: 'uses-gestures',
      title: 'Uses Gestures',
      description: 'Waves bye-bye, points at objects, or reaches to be picked up',
      domain: DevelopmentDomain.language,
      minMonths: 9,
      maxMonths: 14,
      typicalMonths: 11,
      source: cdcMilestones12months,
    ),
    Milestone(
      id: 'first-words',
      title: 'First Words',
      description: 'Says first words like "mama" or "dada" with meaning',
      domain: DevelopmentDomain.language,
      minMonths: 9,
      maxMonths: 14,
      typicalMonths: 12,
      source: cdcMilestones12months,
    ),
    // 12-18 months
    Milestone(
      id: 'follows-simple-commands',
      title: 'Follows Simple Commands',
      description: 'Follows simple instructions like "give me the ball"',
      domain: DevelopmentDomain.language,
      minMonths: 12,
      maxMonths: 18,
      typicalMonths: 15,
      source: cdcMilestones12months,
    ),
    Milestone(
      id: 'says-several-words',
      title: 'Says Several Words',
      description: 'Uses 3-5 words besides "mama" and "dada"',
      domain: DevelopmentDomain.language,
      minMonths: 12,
      maxMonths: 18,
      typicalMonths: 15,
      source: cdcMilestones18months,
    ),
    Milestone(
      id: 'points-to-show',
      title: 'Points to Show Interest',
      description: 'Points to things to share interest or get attention',
      domain: DevelopmentDomain.language,
      minMonths: 12,
      maxMonths: 18,
      typicalMonths: 15,
      source: cdcMilestones18months,
    ),
    // 18-24 months
    Milestone(
      id: 'two-word-phrases',
      title: 'Two-Word Phrases',
      description: 'Combines two words like "more milk" or "daddy go"',
      domain: DevelopmentDomain.language,
      minMonths: 18,
      maxMonths: 24,
      typicalMonths: 21,
      source: cdcMilestones2years,
    ),
    Milestone(
      id: 'fifty-words',
      title: 'Says 50+ Words',
      description: 'Vocabulary of 50 or more words',
      domain: DevelopmentDomain.language,
      minMonths: 18,
      maxMonths: 30,
      typicalMonths: 24,
      source: cdcMilestones2years,
    ),
    Milestone(
      id: 'points-body-parts',
      title: 'Points to Body Parts',
      description: 'Points to at least 2 body parts when asked',
      domain: DevelopmentDomain.language,
      minMonths: 18,
      maxMonths: 24,
      typicalMonths: 21,
      source: cdcMilestones2years,
    ),
    // 24-36 months
    Milestone(
      id: 'simple-sentences',
      title: 'Simple Sentences',
      description: 'Uses 2-3 word sentences',
      domain: DevelopmentDomain.language,
      minMonths: 24,
      maxMonths: 36,
      typicalMonths: 30,
      source: cdcMilestones2years,
    ),
    Milestone(
      id: 'follows-2step-instructions',
      title: 'Follows 2-Step Instructions',
      description: 'Can follow two-step instructions like "Pick up the toy and put it on the table"',
      domain: DevelopmentDomain.language,
      minMonths: 24,
      maxMonths: 36,
      typicalMonths: 30,
      source: cdcMilestones2years,
    ),
    // 36-48 months
    Milestone(
      id: 'talks-in-sentences',
      title: 'Talks in Sentences',
      description: 'Uses 4+ word sentences',
      domain: DevelopmentDomain.language,
      minMonths: 36,
      maxMonths: 48,
      typicalMonths: 42,
      source: cdcMilestones3years,
    ),
    Milestone(
      id: 'asks-questions',
      title: 'Asks Questions',
      description: 'Asks "who," "what," "where," and "why" questions',
      domain: DevelopmentDomain.language,
      minMonths: 36,
      maxMonths: 48,
      typicalMonths: 42,
      source: cdcMilestones3years,
    ),
    Milestone(
      id: 'tells-stories',
      title: 'Tells Simple Stories',
      description: 'Can tell a simple story with a beginning and end',
      domain: DevelopmentDomain.language,
      minMonths: 36,
      maxMonths: 48,
      typicalMonths: 42,
      source: cdcMilestones4years,
    ),
    // 48-60 months
    Milestone(
      id: 'speaks-clearly',
      title: 'Speaks Clearly',
      description: 'Speech is understood by strangers most of the time',
      domain: DevelopmentDomain.language,
      minMonths: 48,
      maxMonths: 60,
      typicalMonths: 54,
      source: cdcMilestones4years,
    ),
    Milestone(
      id: 'tells-detailed-stories',
      title: 'Tells Detailed Stories',
      description: 'Can tell stories with several details and a clear sequence',
      domain: DevelopmentDomain.language,
      minMonths: 48,
      maxMonths: 60,
      typicalMonths: 54,
      source: cdcMilestones5years,
    ),
  ];

  // Cognitive Milestones - Expanded 0-60 months
  static final List<Milestone> cognitiveMilestones = [
    // 0-3 months
    Milestone(
      id: 'follows-moving-objects',
      title: 'Follows Moving Objects',
      description: 'Tracks moving objects with eyes',
      domain: DevelopmentDomain.cognitive,
      minMonths: 1,
      maxMonths: 4,
      typicalMonths: 2,
      source: cdcMilestones2months,
    ),
    Milestone(
      id: 'recognizes-caregiver',
      title: 'Recognizes Caregiver',
      description: 'Shows recognition of familiar faces and voices',
      domain: DevelopmentDomain.cognitive,
      minMonths: 2,
      maxMonths: 5,
      typicalMonths: 3,
      source: cdcMilestones4months,
    ),
    // 3-6 months
    Milestone(
      id: 'brings-things-to-mouth',
      title: 'Explores with Mouth',
      description: 'Brings objects to mouth to explore them',
      domain: DevelopmentDomain.cognitive,
      minMonths: 3,
      maxMonths: 8,
      typicalMonths: 5,
      source: cdcMilestones4months,
    ),
    Milestone(
      id: 'reaches-for-toy',
      title: 'Reaches for Nearby Toy',
      description: 'Shows interest and reaches for toys',
      domain: DevelopmentDomain.cognitive,
      minMonths: 3,
      maxMonths: 6,
      typicalMonths: 4,
      source: cdcMilestones4months,
    ),
    // 6-9 months
    Milestone(
      id: 'looks-for-dropped',
      title: 'Looks for Dropped Objects',
      description: 'Looks for toys that fall out of sight',
      domain: DevelopmentDomain.cognitive,
      minMonths: 6,
      maxMonths: 10,
      typicalMonths: 8,
      source: cdcMilestones6months,
    ),
    Milestone(
      id: 'explores-objects',
      title: 'Explores Objects',
      description: 'Explores objects in different ways (shaking, banging, throwing)',
      domain: DevelopmentDomain.cognitive,
      minMonths: 6,
      maxMonths: 12,
      typicalMonths: 9,
      source: cdcMilestones9months,
    ),
    // 9-12 months
    Milestone(
      id: 'object-permanence',
      title: 'Object Permanence',
      description: 'Understands that objects exist even when out of sight',
      domain: DevelopmentDomain.cognitive,
      minMonths: 6,
      maxMonths: 12,
      typicalMonths: 9,
      source: whoSources[2],
    ),
    Milestone(
      id: 'finds-hidden-objects',
      title: 'Finds Hidden Objects',
      description: 'Finds objects hidden under a cloth or container',
      domain: DevelopmentDomain.cognitive,
      minMonths: 9,
      maxMonths: 14,
      typicalMonths: 11,
      source: cdcMilestones12months,
    ),
    Milestone(
      id: 'uses-objects-correctly',
      title: 'Uses Objects Correctly',
      description: 'Uses objects correctly (drinks from cup, brushes hair)',
      domain: DevelopmentDomain.cognitive,
      minMonths: 9,
      maxMonths: 15,
      typicalMonths: 12,
      source: cdcMilestones12months,
    ),
    // 12-18 months
    Milestone(
      id: 'simple-pretend-play',
      title: 'Simple Pretend Play',
      description: 'Engages in simple pretend play like feeding a doll',
      domain: DevelopmentDomain.cognitive,
      minMonths: 12,
      maxMonths: 24,
      typicalMonths: 18,
      source: cdcMilestones18months,
    ),
    Milestone(
      id: 'points-to-pictures',
      title: 'Points to Pictures',
      description: 'Points to pictures when named',
      domain: DevelopmentDomain.cognitive,
      minMonths: 12,
      maxMonths: 18,
      typicalMonths: 15,
      source: cdcMilestones18months,
    ),
    // 18-24 months
    Milestone(
      id: 'knows-body-parts',
      title: 'Knows Body Parts',
      description: 'Can point to several body parts when named',
      domain: DevelopmentDomain.cognitive,
      minMonths: 18,
      maxMonths: 24,
      typicalMonths: 21,
      source: cdcMilestones2years,
    ),
    Milestone(
      id: 'completes-simple-puzzles',
      title: 'Completes Simple Puzzles',
      description: 'Can complete simple 2-3 piece puzzles',
      domain: DevelopmentDomain.cognitive,
      minMonths: 18,
      maxMonths: 30,
      typicalMonths: 24,
      source: cdcMilestones2years,
    ),
    // 24-36 months
    Milestone(
      id: 'sorts-shapes-colors',
      title: 'Sorts Shapes and Colors',
      description: 'Can sort objects by shape or color',
      domain: DevelopmentDomain.cognitive,
      minMonths: 24,
      maxMonths: 36,
      typicalMonths: 30,
      source: cdcMilestones2years,
    ),
    Milestone(
      id: 'plays-make-believe',
      title: 'Plays Make-Believe',
      description: 'Engages in imaginative play with dolls, animals, people',
      domain: DevelopmentDomain.cognitive,
      minMonths: 24,
      maxMonths: 36,
      typicalMonths: 30,
      source: cdcMilestones3years,
    ),
    // 36-48 months
    Milestone(
      id: 'understands-counting',
      title: 'Understands Counting',
      description: 'Understands the concept of counting and may count to 10',
      domain: DevelopmentDomain.cognitive,
      minMonths: 36,
      maxMonths: 48,
      typicalMonths: 42,
      source: cdcMilestones4years,
    ),
    Milestone(
      id: 'names-colors',
      title: 'Names Some Colors',
      description: 'Can correctly name at least 4 colors',
      domain: DevelopmentDomain.cognitive,
      minMonths: 36,
      maxMonths: 48,
      typicalMonths: 42,
      source: cdcMilestones4years,
    ),
    // 48-60 months
    Milestone(
      id: 'counts-10-objects',
      title: 'Counts 10+ Objects',
      description: 'Can count 10 or more objects correctly',
      domain: DevelopmentDomain.cognitive,
      minMonths: 48,
      maxMonths: 60,
      typicalMonths: 54,
      source: cdcMilestones5years,
    ),
    Milestone(
      id: 'recognizes-letters-numbers',
      title: 'Recognizes Letters and Numbers',
      description: 'Can name some letters and numbers',
      domain: DevelopmentDomain.cognitive,
      minMonths: 48,
      maxMonths: 60,
      typicalMonths: 54,
      source: cdcMilestones5years,
    ),
  ];

  // Social-Emotional Milestones - Expanded 0-60 months
  static final List<Milestone> socialMilestones = [
    // 0-3 months
    Milestone(
      id: 'social-smile',
      title: 'Social Smile',
      description: 'Smiles in response to social interaction',
      domain: DevelopmentDomain.social,
      minMonths: 1,
      maxMonths: 3,
      typicalMonths: 2,
      source: cdcMilestones2months,
    ),
    Milestone(
      id: 'calms-to-voice',
      title: 'Calms to Voice',
      description: 'Calms down when spoken to or picked up',
      domain: DevelopmentDomain.social,
      minMonths: 0,
      maxMonths: 3,
      typicalMonths: 1,
      source: cdcMilestones2months,
    ),
    Milestone(
      id: 'looks-at-faces',
      title: 'Looks at Faces',
      description: 'Shows interest in looking at faces',
      domain: DevelopmentDomain.social,
      minMonths: 0,
      maxMonths: 3,
      typicalMonths: 1,
      source: cdcMilestones2months,
    ),
    // 3-6 months
    Milestone(
      id: 'smiles-spontaneously',
      title: 'Smiles Spontaneously',
      description: 'Smiles spontaneously, especially at people',
      domain: DevelopmentDomain.social,
      minMonths: 3,
      maxMonths: 6,
      typicalMonths: 4,
      source: cdcMilestones4months,
    ),
    Milestone(
      id: 'enjoys-play',
      title: 'Enjoys Playing with People',
      description: 'Likes to play with people and might cry when playing stops',
      domain: DevelopmentDomain.social,
      minMonths: 3,
      maxMonths: 6,
      typicalMonths: 4,
      source: cdcMilestones4months,
    ),
    // 6-9 months
    Milestone(
      id: 'stranger-anxiety',
      title: 'Stranger Awareness',
      description: 'Shows wariness around unfamiliar people',
      domain: DevelopmentDomain.social,
      minMonths: 6,
      maxMonths: 12,
      typicalMonths: 8,
      source: cdcMilestones9months,
    ),
    Milestone(
      id: 'has-favorite-toys',
      title: 'Has Favorite Toys',
      description: 'Shows preferences for certain toys',
      domain: DevelopmentDomain.social,
      minMonths: 6,
      maxMonths: 12,
      typicalMonths: 9,
      source: cdcMilestones9months,
    ),
    Milestone(
      id: 'plays-peekaboo',
      title: 'Plays Peek-a-Boo',
      description: 'Enjoys and responds to peek-a-boo games',
      domain: DevelopmentDomain.social,
      minMonths: 6,
      maxMonths: 12,
      typicalMonths: 9,
      source: cdcMilestones9months,
    ),
    // 9-12 months
    Milestone(
      id: 'waves-bye',
      title: 'Waves Bye-Bye',
      description: 'Waves goodbye when prompted',
      domain: DevelopmentDomain.social,
      minMonths: 9,
      maxMonths: 15,
      typicalMonths: 12,
      source: cdcMilestones12months,
    ),
    Milestone(
      id: 'cries-when-parent-leaves',
      title: 'Separation Anxiety',
      description: 'Cries when parents leave, showing attachment',
      domain: DevelopmentDomain.social,
      minMonths: 8,
      maxMonths: 14,
      typicalMonths: 10,
      source: cdcMilestones12months,
    ),
    // 12-18 months
    Milestone(
      id: 'shows-affection',
      title: 'Shows Affection',
      description: 'Shows affection with hugs and kisses',
      domain: DevelopmentDomain.social,
      minMonths: 12,
      maxMonths: 18,
      typicalMonths: 15,
      source: cdcMilestones18months,
    ),
    Milestone(
      id: 'shows-you-object',
      title: 'Shows Objects to Others',
      description: 'Shows you objects they like',
      domain: DevelopmentDomain.social,
      minMonths: 12,
      maxMonths: 18,
      typicalMonths: 15,
      source: cdcMilestones18months,
    ),
    // 18-24 months
    Milestone(
      id: 'parallel-play',
      title: 'Parallel Play',
      description: 'Plays alongside other children',
      domain: DevelopmentDomain.social,
      minMonths: 18,
      maxMonths: 30,
      typicalMonths: 24,
      source: cdcMilestones2years,
    ),
    Milestone(
      id: 'copies-adults',
      title: 'Copies Adults and Children',
      description: 'Imitates behaviors of adults and other children',
      domain: DevelopmentDomain.social,
      minMonths: 18,
      maxMonths: 24,
      typicalMonths: 21,
      source: cdcMilestones2years,
    ),
    Milestone(
      id: 'shows-independence',
      title: 'Shows Independence',
      description: 'Shows defiant behavior and wants to do things alone',
      domain: DevelopmentDomain.social,
      minMonths: 18,
      maxMonths: 30,
      typicalMonths: 24,
      source: cdcMilestones2years,
    ),
    // 24-36 months
    Milestone(
      id: 'shares-with-others',
      title: 'Begins Sharing',
      description: 'Begins to share toys with other children',
      domain: DevelopmentDomain.social,
      minMonths: 24,
      maxMonths: 42,
      typicalMonths: 33,
      source: cdcMilestones3years,
    ),
    Milestone(
      id: 'takes-turns',
      title: 'Takes Turns',
      description: 'Can take turns in games or activities',
      domain: DevelopmentDomain.social,
      minMonths: 24,
      maxMonths: 36,
      typicalMonths: 30,
      source: cdcMilestones3years,
    ),
    Milestone(
      id: 'shows-concern',
      title: 'Shows Concern for Others',
      description: 'Shows concern when someone is crying or hurt',
      domain: DevelopmentDomain.social,
      minMonths: 24,
      maxMonths: 36,
      typicalMonths: 30,
      source: cdcMilestones3years,
    ),
    // 36-48 months
    Milestone(
      id: 'cooperative-play',
      title: 'Cooperative Play',
      description: 'Plays cooperatively with other children',
      domain: DevelopmentDomain.social,
      minMonths: 36,
      maxMonths: 48,
      typicalMonths: 42,
      source: cdcMilestones4years,
    ),
    Milestone(
      id: 'prefers-friends',
      title: 'Has Favorite Friends',
      description: 'Has favorite friends and knows their names',
      domain: DevelopmentDomain.social,
      minMonths: 36,
      maxMonths: 48,
      typicalMonths: 42,
      source: cdcMilestones4years,
    ),
    // 48-60 months
    Milestone(
      id: 'follows-rules',
      title: 'Follows Rules',
      description: 'Follows rules and takes turns in games',
      domain: DevelopmentDomain.social,
      minMonths: 48,
      maxMonths: 60,
      typicalMonths: 54,
      source: cdcMilestones5years,
    ),
    Milestone(
      id: 'likes-to-please-friends',
      title: 'Wants to Please Friends',
      description: 'Wants to be like friends and wants to please them',
      domain: DevelopmentDomain.social,
      minMonths: 48,
      maxMonths: 60,
      typicalMonths: 54,
      source: cdcMilestones5years,
    ),
  ];

  // Sensory Milestones - NEW (0-24 months)
  static final List<Milestone> sensoryMilestones = [
    // 0-3 months
    Milestone(
      id: 'startles-to-sounds',
      title: 'Startles to Loud Sounds',
      description: 'Startles or blinks in response to loud sounds',
      domain: DevelopmentDomain.sensory,
      minMonths: 0,
      maxMonths: 3,
      typicalMonths: 1,
      source: cdcMilestones2months,
    ),
    Milestone(
      id: 'focuses-on-faces',
      title: 'Focuses on Faces',
      description: 'Can focus on faces 8-12 inches away',
      domain: DevelopmentDomain.sensory,
      minMonths: 0,
      maxMonths: 3,
      typicalMonths: 1,
      source: cdcMilestones2months,
    ),
    // 3-6 months
    Milestone(
      id: 'tracks-objects',
      title: 'Tracks Moving Objects',
      description: 'Follows moving objects with eyes smoothly',
      domain: DevelopmentDomain.sensory,
      minMonths: 2,
      maxMonths: 6,
      typicalMonths: 4,
      source: cdcMilestones4months,
    ),
    Milestone(
      id: 'recognizes-voices',
      title: 'Recognizes Familiar Voices',
      description: 'Shows recognition of familiar voices and sounds',
      domain: DevelopmentDomain.sensory,
      minMonths: 3,
      maxMonths: 6,
      typicalMonths: 4,
      source: cdcMilestones4months,
    ),
    // 6-12 months
    Milestone(
      id: 'responds-to-sounds-direction',
      title: 'Responds to Sounds from All Directions',
      description: 'Turns head toward sounds from any direction',
      domain: DevelopmentDomain.sensory,
      minMonths: 6,
      maxMonths: 10,
      typicalMonths: 8,
      source: cdcMilestones9months,
    ),
    Milestone(
      id: 'texture-exploration',
      title: 'Explores Textures',
      description: 'Shows interest in different textures and surfaces',
      domain: DevelopmentDomain.sensory,
      minMonths: 6,
      maxMonths: 12,
      typicalMonths: 9,
      source: whoSources[2],
    ),
    // 12-24 months
    Milestone(
      id: 'identifies-sounds',
      title: 'Identifies Common Sounds',
      description: 'Recognizes and responds to familiar sounds (doorbell, phone)',
      domain: DevelopmentDomain.sensory,
      minMonths: 12,
      maxMonths: 24,
      typicalMonths: 18,
      source: cdcMilestones18months,
    ),
    Milestone(
      id: 'tolerates-messy-play',
      title: 'Tolerates Messy Play',
      description: 'Can engage with different textures in messy play',
      domain: DevelopmentDomain.sensory,
      minMonths: 12,
      maxMonths: 24,
      typicalMonths: 18,
      source: whoSources[2],
    ),
  ];

  /// Get all milestones
  static List<Milestone> getAllMilestones() {
    return [
      ...motorMilestones,
      ...languageMilestones,
      ...cognitiveMilestones,
      ...socialMilestones,
      ...sensoryMilestones,
    ];
  }

  /// Get a milestone by ID
  static Milestone? getMilestoneById(String id) {
    final all = getAllMilestones();
    try {
      return all.firstWhere((m) => m.id == id);
    } catch (_) {
      return null;
    }
  }

  /// Get all milestones for a specific age range
  static List<Milestone> getMilestonesForAge(int ageMonths) {
    final allMilestones = getAllMilestones();

    // Get milestones that are relevant for this age
    // Include milestones where the child is within the achievement window
    // or up to 6 months ahead (upcoming milestones)
    return allMilestones.where((m) {
      return ageMonths >= m.minMonths - 1 && ageMonths <= m.maxMonths + 6;
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
      case DevelopmentDomain.sensory:
        domainMilestones = sensoryMilestones;
        break;
    }

    return domainMilestones.where((m) {
      return ageMonths >= m.minMonths - 1 && ageMonths <= m.maxMonths + 6;
    }).toList();
  }

  /// Get upcoming milestones for a child
  static List<Milestone> getUpcomingMilestones(int ageMonths, {int count = 10}) {
    return getAllMilestones()
        .where((m) => m.minMonths > ageMonths)
        .toList()
      ..sort((a, b) => a.minMonths.compareTo(b.minMonths))
      ..take(count);
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

  // WHO median values for boys weight (kg) by month (0-60)
  static const List<double> _boysWeightMedian = [
    3.3, 4.5, 5.6, 6.4, 7.0, 7.5, 7.9, 8.3, 8.6, 8.9, 9.2, 9.4, 9.6,
    9.9, 10.1, 10.3, 10.5, 10.7, 10.9, 11.1, 11.3, 11.5, 11.8, 12.0, 12.2,
    12.4, 12.5, 12.7, 12.9, 13.1, 13.3, 13.5, 13.7, 13.8, 14.0, 14.2, 14.3,
    14.5, 14.7, 14.9, 15.1, 15.3, 15.5, 15.7, 15.9, 16.1, 16.3, 16.5, 16.7,
    16.9, 17.1, 17.3, 17.5, 17.8, 18.0, 18.2, 18.4, 18.6, 18.9, 19.1, 19.3,
  ];

  // WHO median values for girls weight (kg) by month (0-60)
  static const List<double> _girlsWeightMedian = [
    3.2, 4.2, 5.1, 5.8, 6.4, 6.9, 7.3, 7.6, 7.9, 8.2, 8.5, 8.7, 8.9,
    9.2, 9.4, 9.6, 9.8, 10.0, 10.2, 10.4, 10.6, 10.9, 11.1, 11.3, 11.5,
    11.7, 11.9, 12.1, 12.3, 12.5, 12.7, 12.9, 13.1, 13.3, 13.5, 13.7, 13.9,
    14.1, 14.3, 14.5, 14.7, 14.9, 15.1, 15.4, 15.6, 15.8, 16.0, 16.2, 16.5,
    16.7, 16.9, 17.1, 17.4, 17.6, 17.8, 18.1, 18.3, 18.6, 18.8, 19.0, 19.3,
  ];

  // WHO median values for boys height (cm) by month (0-60)
  static const List<double> _boysHeightMedian = [
    49.9, 54.7, 58.4, 61.4, 63.9, 65.9, 67.6, 69.2, 70.6, 72.0, 73.3, 74.5, 75.7,
    76.9, 78.0, 79.1, 80.2, 81.2, 82.3, 83.2, 84.2, 85.1, 86.0, 86.9, 87.8,
    88.0, 88.8, 89.6, 90.4, 91.2, 91.9, 92.7, 93.4, 94.1, 94.8, 95.4, 96.1,
    96.7, 97.4, 98.0, 98.6, 99.2, 99.9, 100.5, 101.1, 101.7, 102.3, 102.9, 103.5,
    104.1, 104.7, 105.3, 105.9, 106.5, 107.1, 107.7, 108.3, 108.9, 109.4, 110.0, 110.6,
  ];

  // WHO median values for girls height (cm) by month (0-60)
  static const List<double> _girlsHeightMedian = [
    49.1, 53.7, 57.1, 59.8, 62.1, 64.0, 65.7, 67.3, 68.7, 70.1, 71.5, 72.8, 74.0,
    75.2, 76.4, 77.5, 78.6, 79.7, 80.7, 81.7, 82.7, 83.7, 84.6, 85.5, 86.4,
    86.6, 87.4, 88.3, 89.1, 89.9, 90.7, 91.4, 92.2, 92.9, 93.6, 94.4, 95.1,
    95.8, 96.5, 97.2, 97.9, 98.6, 99.3, 99.9, 100.6, 101.3, 101.9, 102.6, 103.2,
    103.9, 104.5, 105.2, 105.8, 106.5, 107.1, 107.8, 108.4, 109.0, 109.6, 110.3, 110.9,
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
