/**
 * WHO Data Service
 * Provides WHO developmental milestones, growth standards, and official source citations
 */

const WHO_SOURCES = [
  {
    title: 'WHO Motor Development Study',
    url: 'https://www.who.int/publications/i/item/WHO-TRS-1006',
    description: 'WHO Multicentre Growth Reference Study: Motor development milestones',
    type: 'study',
  },
  {
    title: 'WHO Child Growth Standards',
    url: 'https://www.who.int/tools/child-growth-standards',
    description: 'WHO Child Growth Standards: Methods and development',
    type: 'standard',
  },
  {
    title: 'WHO Developmental Milestones',
    url: 'https://www.who.int/publications/i/item/9789241596503',
    description: 'WHO Motor Development Study: Windows of achievement',
    type: 'study',
  },
  {
    title: 'UNICEF Early Childhood Development',
    url: 'https://www.unicef.org/early-childhood-development',
    description: 'Evidence-based early childhood development resources',
    type: 'reference',
  },
  {
    title: 'CDC Developmental Milestones',
    url: 'https://www.cdc.gov/ncbddd/actearly/milestones/index.html',
    description: 'Learn the Signs. Act Early. Developmental milestones',
    type: 'reference',
  },
];

const REGIONAL_SOURCES = {
  afro: [{
    title: 'WHO Africa Region',
    url: 'https://www.afro.who.int/health-topics/child-health',
    type: 'regional',
  }],
  amro: [{
    title: 'PAHO Child Development',
    url: 'https://www.paho.org/en/topics/child-health',
    type: 'regional',
  }],
  searo: [{
    title: 'WHO South-East Asia Region',
    url: 'https://www.who.int/southeastasia/health-topics/child-health',
    type: 'regional',
  }],
  euro: [{
    title: 'WHO Europe Child Health',
    url: 'https://www.who.int/europe/health-topics/child-health',
    type: 'regional',
  }],
  emro: [{
    title: 'WHO Eastern Mediterranean',
    url: 'https://www.emro.who.int/child-health/index.html',
    type: 'regional',
  }],
  wpro: [{
    title: 'WHO Western Pacific',
    url: 'https://www.who.int/westernpacific/health-topics/child-health',
    type: 'regional',
  }],
};

// Motor Milestones based on WHO standards
const MOTOR_MILESTONES = [
  { id: 'motor_head_control', title: 'Head Control', description: 'Holds head steady when supported', domain: 'motor', minMonths: 1, maxMonths: 4, typicalMonths: 2 },
  { id: 'motor_rolling', title: 'Rolling Over', description: 'Rolls from back to stomach', domain: 'motor', minMonths: 2, maxMonths: 7, typicalMonths: 4 },
  { id: 'motor_sitting_support', title: 'Sitting with Support', description: 'Sits with support', domain: 'motor', minMonths: 4, maxMonths: 8, typicalMonths: 5 },
  { id: 'motor_sitting_alone', title: 'Sitting Without Support', description: 'Sits alone', domain: 'motor', minMonths: 4, maxMonths: 9, typicalMonths: 6 },
  { id: 'motor_crawling', title: 'Crawling', description: 'Crawls on hands and knees', domain: 'motor', minMonths: 5, maxMonths: 13, typicalMonths: 8 },
  { id: 'motor_standing_support', title: 'Standing with Support', description: 'Stands holding on', domain: 'motor', minMonths: 5, maxMonths: 11, typicalMonths: 8 },
  { id: 'motor_walking_support', title: 'Walking with Support', description: 'Takes steps with support', domain: 'motor', minMonths: 6, maxMonths: 14, typicalMonths: 9 },
  { id: 'motor_standing_alone', title: 'Standing Alone', description: 'Stands without support', domain: 'motor', minMonths: 7, maxMonths: 17, typicalMonths: 11 },
  { id: 'motor_walking_alone', title: 'Walking Alone', description: 'Walks independently', domain: 'motor', minMonths: 8, maxMonths: 18, typicalMonths: 12 },
  { id: 'motor_running', title: 'Running', description: 'Runs with coordination', domain: 'motor', minMonths: 15, maxMonths: 24, typicalMonths: 18 },
];

const LANGUAGE_MILESTONES = [
  { id: 'lang_cooing', title: 'Cooing', description: 'Makes cooing sounds', domain: 'language', minMonths: 1, maxMonths: 4, typicalMonths: 2 },
  { id: 'lang_laughing', title: 'Laughing', description: 'Laughs out loud', domain: 'language', minMonths: 2, maxMonths: 6, typicalMonths: 4 },
  { id: 'lang_babbling', title: 'Babbling', description: 'Makes babbling sounds', domain: 'language', minMonths: 4, maxMonths: 10, typicalMonths: 6 },
  { id: 'lang_responds_name', title: 'Responds to Name', description: 'Turns when name is called', domain: 'language', minMonths: 5, maxMonths: 10, typicalMonths: 7 },
  { id: 'lang_gestures', title: 'Using Gestures', description: 'Waves bye-bye, points', domain: 'language', minMonths: 7, maxMonths: 13, typicalMonths: 9 },
  { id: 'lang_first_words', title: 'First Words', description: 'Says first words', domain: 'language', minMonths: 8, maxMonths: 15, typicalMonths: 12 },
  { id: 'lang_10_words', title: '10+ Words', description: 'Uses 10 or more words', domain: 'language', minMonths: 12, maxMonths: 21, typicalMonths: 18 },
  { id: 'lang_two_words', title: 'Two-Word Phrases', description: 'Combines two words', domain: 'language', minMonths: 18, maxMonths: 30, typicalMonths: 24 },
];

const COGNITIVE_MILESTONES = [
  { id: 'cog_follows_objects', title: 'Visual Tracking', description: 'Follows moving objects', domain: 'cognitive', minMonths: 1, maxMonths: 3, typicalMonths: 2 },
  { id: 'cog_reaches_objects', title: 'Reaching', description: 'Reaches for objects', domain: 'cognitive', minMonths: 3, maxMonths: 6, typicalMonths: 4 },
  { id: 'cog_object_permanence', title: 'Object Permanence', description: 'Looks for hidden objects', domain: 'cognitive', minMonths: 6, maxMonths: 12, typicalMonths: 8 },
  { id: 'cog_cause_effect', title: 'Cause and Effect', description: 'Understands cause and effect', domain: 'cognitive', minMonths: 6, maxMonths: 12, typicalMonths: 9 },
  { id: 'cog_imitation', title: 'Imitation', description: 'Imitates actions', domain: 'cognitive', minMonths: 7, maxMonths: 14, typicalMonths: 10 },
  { id: 'cog_problem_solving', title: 'Problem Solving', description: 'Tries different approaches', domain: 'cognitive', minMonths: 10, maxMonths: 18, typicalMonths: 12 },
  { id: 'cog_pretend_play', title: 'Pretend Play', description: 'Engages in pretend play', domain: 'cognitive', minMonths: 12, maxMonths: 24, typicalMonths: 18 },
];

const SOCIAL_MILESTONES = [
  { id: 'social_smile', title: 'Social Smile', description: 'Smiles at others', domain: 'social', minMonths: 1, maxMonths: 4, typicalMonths: 2 },
  { id: 'social_eye_contact', title: 'Eye Contact', description: 'Makes eye contact', domain: 'social', minMonths: 1, maxMonths: 3, typicalMonths: 2 },
  { id: 'social_recognizes_faces', title: 'Recognizes Faces', description: 'Recognizes familiar people', domain: 'social', minMonths: 2, maxMonths: 5, typicalMonths: 3 },
  { id: 'social_stranger_anxiety', title: 'Stranger Awareness', description: 'Shows stranger awareness', domain: 'social', minMonths: 6, maxMonths: 12, typicalMonths: 8 },
  { id: 'social_peek_a_boo', title: 'Plays Peek-a-boo', description: 'Enjoys peek-a-boo', domain: 'social', minMonths: 6, maxMonths: 12, typicalMonths: 9 },
  { id: 'social_shows_affection', title: 'Shows Affection', description: 'Hugs and shows affection', domain: 'social', minMonths: 9, maxMonths: 18, typicalMonths: 12 },
  { id: 'social_parallel_play', title: 'Parallel Play', description: 'Plays alongside others', domain: 'social', minMonths: 12, maxMonths: 24, typicalMonths: 18 },
];

// WHO Growth Standards Data
const BOYS_WEIGHT_MEDIAN = [3.3, 4.5, 5.6, 6.4, 7.0, 7.5, 7.9, 8.3, 8.6, 8.9, 9.2, 9.4, 9.6, 9.9, 10.1, 10.3, 10.5, 10.7, 10.9, 11.1, 11.3, 11.5, 11.8, 12.0, 12.2, 12.4, 12.5, 12.7, 12.9, 13.1, 13.3, 13.5, 13.7, 13.8, 14.0, 14.2, 14.3];
const GIRLS_WEIGHT_MEDIAN = [3.2, 4.2, 5.1, 5.8, 6.4, 6.9, 7.3, 7.6, 7.9, 8.2, 8.5, 8.7, 8.9, 9.2, 9.4, 9.6, 9.8, 10.0, 10.2, 10.4, 10.6, 10.9, 11.1, 11.3, 11.5, 11.7, 11.9, 12.1, 12.3, 12.5, 12.7, 12.9, 13.1, 13.3, 13.5, 13.7, 13.9];
const BOYS_HEIGHT_MEDIAN = [49.9, 54.7, 58.4, 61.4, 63.9, 65.9, 67.6, 69.2, 70.6, 72.0, 73.3, 74.5, 75.7, 76.9, 78.0, 79.1, 80.2, 81.2, 82.3, 83.2, 84.2, 85.1, 86.0, 86.9, 87.8, 88.0, 88.8, 89.6, 90.4, 91.2, 91.9, 92.7, 93.4, 94.1, 94.8, 95.4, 96.1];
const GIRLS_HEIGHT_MEDIAN = [49.1, 53.7, 57.1, 59.8, 62.1, 64.0, 65.7, 67.3, 68.7, 70.1, 71.5, 72.8, 74.0, 75.2, 76.4, 77.5, 78.6, 79.7, 80.7, 81.7, 82.7, 83.7, 84.6, 85.5, 86.4, 86.6, 87.4, 88.3, 89.1, 89.9, 90.7, 91.4, 92.2, 92.9, 93.6, 94.4, 95.1];
const BOYS_HC_MEDIAN = [34.5, 37.3, 39.1, 40.5, 41.6, 42.6, 43.3, 44.0, 44.5, 45.0, 45.4, 45.8, 46.1, 46.3, 46.6, 46.8, 47.0, 47.2, 47.4, 47.5, 47.7, 47.8, 48.0, 48.1, 48.3, 48.4, 48.5, 48.6, 48.8, 48.9, 49.0, 49.1, 49.2, 49.3, 49.4, 49.5, 49.6];
const GIRLS_HC_MEDIAN = [33.9, 36.5, 38.3, 39.5, 40.6, 41.5, 42.2, 42.8, 43.4, 43.8, 44.2, 44.6, 44.9, 45.2, 45.4, 45.7, 45.9, 46.1, 46.2, 46.4, 46.6, 46.7, 46.9, 47.0, 47.2, 47.3, 47.4, 47.5, 47.6, 47.8, 47.9, 48.0, 48.1, 48.2, 48.3, 48.4, 48.5];

function zScoreToPercentile(zScore) {
  const z = Math.max(-4, Math.min(4, zScore));
  return Math.min(99.9, Math.max(0.1, 100 / (1 + Math.exp(-1.7 * z))));
}

function interpretPercentile(percentile) {
  if (percentile < 3) return 'Below typical range - consult pediatrician';
  if (percentile < 15) return 'Lower end of typical range';
  if (percentile < 85) return 'Within typical range';
  if (percentile < 97) return 'Higher end of typical range';
  return 'Above typical range - consult pediatrician';
}

const whoDataService = {
  getAllMilestones() {
    return [...MOTOR_MILESTONES, ...LANGUAGE_MILESTONES, ...COGNITIVE_MILESTONES, ...SOCIAL_MILESTONES];
  },

  getMilestonesForAge(ageMonths) {
    const allMilestones = this.getAllMilestones();
    return allMilestones.filter(m => ageMonths >= m.minMonths - 1 && ageMonths <= m.maxMonths + 3);
  },

  getMilestonesByDomain(domain, ageMonths) {
    const domainMilestones = {
      motor: MOTOR_MILESTONES,
      language: LANGUAGE_MILESTONES,
      cognitive: COGNITIVE_MILESTONES,
      social: SOCIAL_MILESTONES,
    }[domain] || [];

    return domainMilestones.filter(m => ageMonths >= m.minMonths - 1 && ageMonths <= m.maxMonths + 3);
  },

  getSourcesForRegion(region) {
    return [...WHO_SOURCES, ...(REGIONAL_SOURCES[region] || [])];
  },

  calculateWeightPercentile(weightKg, ageMonths, gender) {
    const medians = gender === 'female' ? GIRLS_WEIGHT_MEDIAN : BOYS_WEIGHT_MEDIAN;
    const ageIndex = Math.min(ageMonths, medians.length - 1);
    const median = medians[ageIndex];
    const sd = median * 0.11;
    const zScore = (weightKg - median) / sd;
    return zScoreToPercentile(zScore);
  },

  calculateHeightPercentile(heightCm, ageMonths, gender) {
    const medians = gender === 'female' ? GIRLS_HEIGHT_MEDIAN : BOYS_HEIGHT_MEDIAN;
    const ageIndex = Math.min(ageMonths, medians.length - 1);
    const median = medians[ageIndex];
    const sd = median * 0.035;
    const zScore = (heightCm - median) / sd;
    return zScoreToPercentile(zScore);
  },

  calculateHeadCircumferencePercentile(hcCm, ageMonths, gender) {
    const medians = gender === 'female' ? GIRLS_HC_MEDIAN : BOYS_HC_MEDIAN;
    const ageIndex = Math.min(ageMonths, medians.length - 1);
    const median = medians[ageIndex];
    const sd = median * 0.025;
    const zScore = (hcCm - median) / sd;
    return zScoreToPercentile(zScore);
  },

  assessGrowth(child) {
    const results = [];
    const ageMonths = child.ageInMonths || 0;

    // Weight
    const weightPercentile = this.calculateWeightPercentile(child.weight, ageMonths, child.gender);
    results.push({
      metric: 'weight',
      value: child.weight,
      percentile: weightPercentile,
      interpretation: interpretPercentile(weightPercentile),
    });

    // Height
    const heightPercentile = this.calculateHeightPercentile(child.height, ageMonths, child.gender);
    results.push({
      metric: 'height',
      value: child.height,
      percentile: heightPercentile,
      interpretation: interpretPercentile(heightPercentile),
    });

    // Head circumference (if available and age < 36 months)
    if (child.headCircumference && ageMonths < 36) {
      const hcPercentile = this.calculateHeadCircumferencePercentile(child.headCircumference, ageMonths, child.gender);
      results.push({
        metric: 'headCircumference',
        value: child.headCircumference,
        percentile: hcPercentile,
        interpretation: interpretPercentile(hcPercentile),
      });
    }

    return results;
  },

  getSources() {
    return WHO_SOURCES;
  },
};

export default whoDataService;
