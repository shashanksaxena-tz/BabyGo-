import Milestone from '../models/Milestone.js';
import { v4 as uuidv4 } from 'uuid';

const FINE_MOTOR_IDS = [
  'hands-to-mouth', 'reaches', 'grasps', 'transfers', 'raking', 'pincer',
  'bangs', 'stacks', 'uses-spoon', 'scribbles', 'turns-pages', 'draws',
  'uses-scissors', 'writes',
];

function deriveSubDomain(domain, id) {
  if (domain === 'motor') {
    return FINE_MOTOR_IDS.some((fmId) => id.includes(fmId)) ? 'fine_motor' : 'gross_motor';
  }
  if (domain === 'language') {
    const receptiveIds = ['responds-to', 'understands', 'follows-simple', 'follows-2step', 'points-body'];
    return receptiveIds.some((rId) => id.includes(rId)) ? 'receptive' : 'expressive';
  }
  return 'general';
}

const milestones = [
  // ── MOTOR (39) ─────────────────────────────────────────────────────────
  // Gross Motor 0-6 months
  { id: 'head-control-tummy', title: 'Lifts Head During Tummy Time', description: 'Baby lifts head briefly while on tummy', domain: 'motor', minMonths: 0, maxMonths: 3, typicalMonths: 2 },
  { id: 'head-control-supported', title: 'Head Control When Supported', description: 'Holds head steady when held upright with support', domain: 'motor', minMonths: 1, maxMonths: 4, typicalMonths: 3 },
  { id: 'pushes-up-on-arms', title: 'Pushes Up on Arms', description: 'When on tummy, pushes up on arms to lift chest', domain: 'motor', minMonths: 3, maxMonths: 6, typicalMonths: 4 },
  { id: 'rolls-tummy-to-back', title: 'Rolls Tummy to Back', description: 'Rolls from stomach to back', domain: 'motor', minMonths: 3, maxMonths: 6, typicalMonths: 4 },
  { id: 'rolls-back-to-tummy', title: 'Rolls Back to Tummy', description: 'Rolls from back to stomach', domain: 'motor', minMonths: 4, maxMonths: 7, typicalMonths: 5 },
  // Gross Motor 6-12 months
  { id: 'sitting-without-support', title: 'Sitting Without Support', description: 'Sits alone without support for at least 10 seconds', domain: 'motor', minMonths: 4, maxMonths: 9, typicalMonths: 6 },
  { id: 'standing-with-assistance', title: 'Standing with Assistance', description: 'Stands while holding onto furniture or hands', domain: 'motor', minMonths: 5, maxMonths: 11, typicalMonths: 8 },
  { id: 'hands-and-knees-crawling', title: 'Hands and Knees Crawling', description: 'Moves forward on hands and knees', domain: 'motor', minMonths: 5, maxMonths: 13, typicalMonths: 8 },
  { id: 'pulls-to-stand', title: 'Pulls to Stand', description: 'Pulls self up to standing using furniture', domain: 'motor', minMonths: 6, maxMonths: 12, typicalMonths: 9 },
  { id: 'walking-with-assistance', title: 'Walking with Assistance', description: 'Walks while holding onto furniture or hands', domain: 'motor', minMonths: 6, maxMonths: 14, typicalMonths: 10 },
  { id: 'cruising', title: 'Cruising Along Furniture', description: 'Walks while holding onto furniture', domain: 'motor', minMonths: 8, maxMonths: 14, typicalMonths: 10 },
  { id: 'standing-alone', title: 'Standing Alone', description: 'Stands independently for at least 10 seconds', domain: 'motor', minMonths: 7, maxMonths: 17, typicalMonths: 11 },
  { id: 'walking-alone', title: 'Walking Alone', description: 'Takes at least 5 independent steps', domain: 'motor', minMonths: 8, maxMonths: 18, typicalMonths: 12 },
  // Gross Motor 12-24 months
  { id: 'walks-confidently', title: 'Walks Confidently', description: 'Walks steadily without falling frequently', domain: 'motor', minMonths: 12, maxMonths: 18, typicalMonths: 15 },
  { id: 'runs-well', title: 'Runs Well', description: 'Runs without falling', domain: 'motor', minMonths: 18, maxMonths: 24, typicalMonths: 20 },
  { id: 'climbs-stairs', title: 'Climbs Stairs with Support', description: 'Walks up stairs with support', domain: 'motor', minMonths: 18, maxMonths: 30, typicalMonths: 24 },
  { id: 'kicks-ball', title: 'Kicks Ball Forward', description: 'Kicks a ball forward while standing', domain: 'motor', minMonths: 18, maxMonths: 24, typicalMonths: 21 },
  // Gross Motor 24-48 months
  { id: 'jumps-both-feet', title: 'Jumps with Both Feet', description: 'Jumps off the ground with both feet', domain: 'motor', minMonths: 24, maxMonths: 36, typicalMonths: 30 },
  { id: 'stairs-alternating', title: 'Stairs Alternating Feet', description: 'Climbs stairs with alternating feet', domain: 'motor', minMonths: 30, maxMonths: 42, typicalMonths: 36 },
  { id: 'pedals-tricycle', title: 'Pedals a Tricycle', description: 'Can pedal a tricycle', domain: 'motor', minMonths: 30, maxMonths: 42, typicalMonths: 36 },
  { id: 'hops-one-foot', title: 'Hops on One Foot', description: 'Hops forward on one foot', domain: 'motor', minMonths: 36, maxMonths: 48, typicalMonths: 42 },
  { id: 'catches-ball', title: 'Catches Bounced Ball', description: 'Catches a large bounced ball', domain: 'motor', minMonths: 36, maxMonths: 48, typicalMonths: 42 },
  // Gross Motor 48-60 months
  { id: 'stands-one-foot-10sec', title: 'Stands on One Foot 10+ Seconds', description: 'Balances on one foot for 10 seconds', domain: 'motor', minMonths: 48, maxMonths: 60, typicalMonths: 54 },
  { id: 'skips', title: 'Skips', description: 'Skips forward alternating feet', domain: 'motor', minMonths: 48, maxMonths: 60, typicalMonths: 54 },
  // Fine Motor 0-12 months
  { id: 'hands-to-mouth', title: 'Brings Hands to Mouth', description: 'Brings hands to mouth to explore', domain: 'motor', minMonths: 0, maxMonths: 4, typicalMonths: 2 },
  { id: 'reaches-for-objects', title: 'Reaches for Objects', description: 'Reaches out to grab toys', domain: 'motor', minMonths: 3, maxMonths: 5, typicalMonths: 4 },
  { id: 'grasps-rattle', title: 'Grasps Rattle or Toy', description: 'Holds and shakes toys', domain: 'motor', minMonths: 3, maxMonths: 6, typicalMonths: 4 },
  { id: 'transfers-objects', title: 'Transfers Objects Between Hands', description: 'Passes objects from one hand to the other', domain: 'motor', minMonths: 5, maxMonths: 9, typicalMonths: 7 },
  { id: 'raking-grasp', title: 'Raking Grasp', description: 'Uses whole hand to pick up small objects', domain: 'motor', minMonths: 6, maxMonths: 9, typicalMonths: 7 },
  { id: 'pincer-grasp', title: 'Pincer Grasp', description: 'Picks up small objects with thumb and finger', domain: 'motor', minMonths: 8, maxMonths: 12, typicalMonths: 10 },
  { id: 'bangs-objects', title: 'Bangs Objects Together', description: 'Holds two objects and bangs them together', domain: 'motor', minMonths: 8, maxMonths: 12, typicalMonths: 10 },
  // Fine Motor 12-36 months
  { id: 'stacks-blocks', title: 'Stacks 2-4 Blocks', description: 'Stacks blocks on top of each other', domain: 'motor', minMonths: 12, maxMonths: 24, typicalMonths: 18 },
  { id: 'uses-spoon', title: 'Uses Spoon', description: 'Uses a spoon with minimal spilling', domain: 'motor', minMonths: 15, maxMonths: 24, typicalMonths: 18 },
  { id: 'scribbles', title: 'Scribbles Spontaneously', description: 'Makes marks on paper with crayons', domain: 'motor', minMonths: 12, maxMonths: 18, typicalMonths: 15 },
  { id: 'stacks-6-blocks', title: 'Stacks 6+ Blocks', description: 'Stacks 6 or more blocks', domain: 'motor', minMonths: 24, maxMonths: 36, typicalMonths: 30 },
  { id: 'turns-pages', title: 'Turns Book Pages', description: 'Turns book pages one at a time', domain: 'motor', minMonths: 24, maxMonths: 36, typicalMonths: 30 },
  // Fine Motor 36-60 months
  { id: 'draws-circle', title: 'Draws a Circle', description: 'Copies or draws a circle', domain: 'motor', minMonths: 36, maxMonths: 48, typicalMonths: 42 },
  { id: 'uses-scissors', title: 'Uses Scissors', description: 'Uses child-safe scissors to cut paper', domain: 'motor', minMonths: 36, maxMonths: 48, typicalMonths: 42 },
  { id: 'draws-person-6parts', title: 'Draws Person with 6+ Parts', description: 'Draws recognizable person with body parts', domain: 'motor', minMonths: 48, maxMonths: 60, typicalMonths: 54 },
  { id: 'writes-letters', title: 'Writes Some Letters', description: 'Writes some letters of their name', domain: 'motor', minMonths: 48, maxMonths: 60, typicalMonths: 54 },

  // ── LANGUAGE (27) ──────────────────────────────────────────────────────
  { id: 'coos', title: 'Makes Cooing Sounds', description: 'Makes vowel sounds like "ooo" and "aah"', domain: 'language', minMonths: 1, maxMonths: 4, typicalMonths: 2 },
  { id: 'responds-to-sounds', title: 'Responds to Sounds', description: 'Turns head toward sounds or voices', domain: 'language', minMonths: 0, maxMonths: 3, typicalMonths: 2 },
  { id: 'laughs-aloud', title: 'Laughs Aloud', description: 'Makes laughing sounds when happy', domain: 'language', minMonths: 3, maxMonths: 6, typicalMonths: 4 },
  { id: 'babbles-consonants', title: 'Babbles with Consonants', description: 'Babbles using consonants like "ba-ba"', domain: 'language', minMonths: 4, maxMonths: 8, typicalMonths: 6 },
  { id: 'responds-to-name', title: 'Responds to Name', description: 'Turns head when name is called', domain: 'language', minMonths: 6, maxMonths: 12, typicalMonths: 8 },
  { id: 'understands-no', title: 'Understands "No"', description: 'Responds to "no" by pausing', domain: 'language', minMonths: 6, maxMonths: 12, typicalMonths: 9 },
  { id: 'varied-babbling', title: 'Varied Babbling', description: 'Babbles with different sounds', domain: 'language', minMonths: 6, maxMonths: 10, typicalMonths: 8 },
  { id: 'uses-gestures', title: 'Uses Gestures', description: 'Waves bye-bye, points at objects', domain: 'language', minMonths: 9, maxMonths: 14, typicalMonths: 11 },
  { id: 'first-words', title: 'First Words', description: 'Says first words like "mama" with meaning', domain: 'language', minMonths: 9, maxMonths: 14, typicalMonths: 12 },
  { id: 'follows-simple-commands', title: 'Follows Simple Commands', description: 'Follows instructions like "give me the ball"', domain: 'language', minMonths: 12, maxMonths: 18, typicalMonths: 15 },
  { id: 'says-several-words', title: 'Says Several Words', description: 'Uses 3-5 words besides "mama" and "dada"', domain: 'language', minMonths: 12, maxMonths: 18, typicalMonths: 15 },
  { id: 'points-to-show', title: 'Points to Show Interest', description: 'Points to share interest or get attention', domain: 'language', minMonths: 12, maxMonths: 18, typicalMonths: 15 },
  { id: 'two-word-phrases', title: 'Two-Word Phrases', description: 'Combines two words like "more milk"', domain: 'language', minMonths: 18, maxMonths: 24, typicalMonths: 21 },
  { id: 'fifty-words', title: 'Says 50+ Words', description: 'Vocabulary of 50 or more words', domain: 'language', minMonths: 18, maxMonths: 30, typicalMonths: 24 },
  { id: 'points-body-parts', title: 'Points to Body Parts', description: 'Points to at least 2 body parts when asked', domain: 'language', minMonths: 18, maxMonths: 24, typicalMonths: 21 },
  { id: 'simple-sentences', title: 'Simple Sentences', description: 'Uses 2-3 word sentences', domain: 'language', minMonths: 24, maxMonths: 36, typicalMonths: 30 },
  { id: 'follows-2step-instructions', title: 'Follows 2-Step Instructions', description: 'Follows two-step instructions', domain: 'language', minMonths: 24, maxMonths: 36, typicalMonths: 30 },
  { id: 'names-pictures', title: 'Names Pictures in Books', description: 'Names common objects in picture books', domain: 'language', minMonths: 24, maxMonths: 36, typicalMonths: 30 },
  { id: 'talks-in-sentences', title: 'Talks in Sentences', description: 'Uses 4+ word sentences', domain: 'language', minMonths: 36, maxMonths: 48, typicalMonths: 42 },
  { id: 'asks-questions', title: 'Asks Questions', description: 'Asks "who," "what," "where," and "why" questions', domain: 'language', minMonths: 36, maxMonths: 48, typicalMonths: 42 },
  { id: 'tells-stories', title: 'Tells Simple Stories', description: 'Tells a simple story with beginning and end', domain: 'language', minMonths: 36, maxMonths: 48, typicalMonths: 42 },
  { id: 'speaks-clearly', title: 'Speaks Clearly', description: 'Speech understood by strangers most of the time', domain: 'language', minMonths: 48, maxMonths: 60, typicalMonths: 54 },
  { id: 'tells-detailed-stories', title: 'Tells Detailed Stories', description: 'Tells stories with several details and sequence', domain: 'language', minMonths: 48, maxMonths: 60, typicalMonths: 54 },
  { id: 'uses-future-tense', title: 'Uses Future Tense', description: 'Uses future tense correctly', domain: 'language', minMonths: 48, maxMonths: 60, typicalMonths: 54 },

  // ── COGNITIVE (23) ─────────────────────────────────────────────────────
  { id: 'follows-moving-objects', title: 'Follows Moving Objects', description: 'Tracks moving objects with eyes', domain: 'cognitive', minMonths: 1, maxMonths: 4, typicalMonths: 2 },
  { id: 'recognizes-caregiver', title: 'Recognizes Caregiver', description: 'Shows recognition of familiar faces', domain: 'cognitive', minMonths: 2, maxMonths: 5, typicalMonths: 3 },
  { id: 'brings-things-to-mouth', title: 'Explores with Mouth', description: 'Brings objects to mouth to explore', domain: 'cognitive', minMonths: 3, maxMonths: 8, typicalMonths: 5 },
  { id: 'reaches-for-toy', title: 'Reaches for Nearby Toy', description: 'Shows interest and reaches for toys', domain: 'cognitive', minMonths: 3, maxMonths: 6, typicalMonths: 4 },
  { id: 'looks-for-dropped', title: 'Looks for Dropped Objects', description: 'Looks for toys that fall out of sight', domain: 'cognitive', minMonths: 6, maxMonths: 10, typicalMonths: 8 },
  { id: 'explores-objects', title: 'Explores Objects', description: 'Explores objects by shaking, banging, throwing', domain: 'cognitive', minMonths: 6, maxMonths: 12, typicalMonths: 9 },
  { id: 'object-permanence', title: 'Object Permanence', description: 'Understands objects exist when out of sight', domain: 'cognitive', minMonths: 6, maxMonths: 12, typicalMonths: 9 },
  { id: 'finds-hidden-objects', title: 'Finds Hidden Objects', description: 'Finds objects hidden under cloth', domain: 'cognitive', minMonths: 9, maxMonths: 14, typicalMonths: 11 },
  { id: 'uses-objects-correctly', title: 'Uses Objects Correctly', description: 'Uses objects correctly (drinks from cup)', domain: 'cognitive', minMonths: 9, maxMonths: 15, typicalMonths: 12 },
  { id: 'simple-pretend-play', title: 'Simple Pretend Play', description: 'Engages in simple pretend play', domain: 'cognitive', minMonths: 12, maxMonths: 24, typicalMonths: 18 },
  { id: 'points-to-pictures', title: 'Points to Pictures', description: 'Points to pictures when named', domain: 'cognitive', minMonths: 12, maxMonths: 18, typicalMonths: 15 },
  { id: 'knows-body-parts', title: 'Knows Body Parts', description: 'Points to several body parts when named', domain: 'cognitive', minMonths: 18, maxMonths: 24, typicalMonths: 21 },
  { id: 'completes-simple-puzzles', title: 'Completes Simple Puzzles', description: 'Completes simple 2-3 piece puzzles', domain: 'cognitive', minMonths: 18, maxMonths: 30, typicalMonths: 24 },
  { id: 'sorts-shapes-colors', title: 'Sorts Shapes and Colors', description: 'Sorts objects by shape or color', domain: 'cognitive', minMonths: 24, maxMonths: 36, typicalMonths: 30 },
  { id: 'plays-make-believe', title: 'Plays Make-Believe', description: 'Engages in imaginative play', domain: 'cognitive', minMonths: 24, maxMonths: 36, typicalMonths: 30 },
  { id: 'understands-same-different', title: 'Understands Same and Different', description: 'Identifies things same or different', domain: 'cognitive', minMonths: 30, maxMonths: 42, typicalMonths: 36 },
  { id: 'understands-counting', title: 'Understands Counting', description: 'Understands counting concept', domain: 'cognitive', minMonths: 36, maxMonths: 48, typicalMonths: 42 },
  { id: 'names-colors', title: 'Names Some Colors', description: 'Names at least 4 colors correctly', domain: 'cognitive', minMonths: 36, maxMonths: 48, typicalMonths: 42 },
  { id: 'understands-time-concepts', title: 'Understands Time Concepts', description: 'Understands today/tomorrow', domain: 'cognitive', minMonths: 36, maxMonths: 48, typicalMonths: 42 },
  { id: 'counts-10-objects', title: 'Counts 10+ Objects', description: 'Counts 10 or more objects correctly', domain: 'cognitive', minMonths: 48, maxMonths: 60, typicalMonths: 54 },
  { id: 'recognizes-letters-numbers', title: 'Recognizes Letters and Numbers', description: 'Names some letters and numbers', domain: 'cognitive', minMonths: 48, maxMonths: 60, typicalMonths: 54 },
  { id: 'understands-rhyming', title: 'Understands Rhyming', description: 'Identifies words that rhyme', domain: 'cognitive', minMonths: 48, maxMonths: 60, typicalMonths: 54 },

  // ── SOCIAL (25) ────────────────────────────────────────────────────────
  { id: 'social-smile', title: 'Social Smile', description: 'Smiles in response to social interaction', domain: 'social', minMonths: 1, maxMonths: 3, typicalMonths: 2 },
  { id: 'calms-to-voice', title: 'Calms to Voice', description: 'Calms when spoken to or picked up', domain: 'social', minMonths: 0, maxMonths: 3, typicalMonths: 2 },
  { id: 'looks-at-faces', title: 'Looks at Faces', description: 'Shows interest in looking at faces', domain: 'social', minMonths: 0, maxMonths: 3, typicalMonths: 2 },
  { id: 'smiles-spontaneously', title: 'Smiles Spontaneously', description: 'Smiles spontaneously at people', domain: 'social', minMonths: 3, maxMonths: 6, typicalMonths: 4 },
  { id: 'enjoys-play', title: 'Enjoys Playing with People', description: 'Likes to play with people', domain: 'social', minMonths: 3, maxMonths: 6, typicalMonths: 4 },
  { id: 'stranger-anxiety', title: 'Stranger Awareness', description: 'Shows wariness around strangers', domain: 'social', minMonths: 6, maxMonths: 12, typicalMonths: 8 },
  { id: 'has-favorite-toys', title: 'Has Favorite Toys', description: 'Shows preferences for certain toys', domain: 'social', minMonths: 6, maxMonths: 12, typicalMonths: 9 },
  { id: 'plays-peekaboo', title: 'Plays Peek-a-Boo', description: 'Enjoys and responds to peek-a-boo', domain: 'social', minMonths: 6, maxMonths: 12, typicalMonths: 9 },
  { id: 'waves-bye', title: 'Waves Bye-Bye', description: 'Waves goodbye when prompted', domain: 'social', minMonths: 9, maxMonths: 15, typicalMonths: 11 },
  { id: 'cries-when-parent-leaves', title: 'Separation Anxiety', description: 'Shows attachment when parents leave', domain: 'social', minMonths: 8, maxMonths: 14, typicalMonths: 10 },
  { id: 'shows-affection', title: 'Shows Affection', description: 'Shows affection with hugs and kisses', domain: 'social', minMonths: 12, maxMonths: 18, typicalMonths: 15 },
  { id: 'plays-simple-pretend', title: 'Simple Pretend with Others', description: 'Engages in simple pretend with caregivers', domain: 'social', minMonths: 12, maxMonths: 18, typicalMonths: 15 },
  { id: 'shows-you-object', title: 'Shows Objects to Others', description: 'Shows you objects they like', domain: 'social', minMonths: 12, maxMonths: 18, typicalMonths: 15 },
  { id: 'parallel-play', title: 'Parallel Play', description: 'Plays alongside other children', domain: 'social', minMonths: 18, maxMonths: 30, typicalMonths: 24 },
  { id: 'copies-adults', title: 'Copies Adults and Children', description: 'Imitates behaviors of others', domain: 'social', minMonths: 18, maxMonths: 24, typicalMonths: 21 },
  { id: 'shows-independence', title: 'Shows Independence', description: 'Wants to do things alone', domain: 'social', minMonths: 18, maxMonths: 30, typicalMonths: 24 },
  { id: 'shares-with-others', title: 'Begins Sharing', description: 'Begins to share toys', domain: 'social', minMonths: 24, maxMonths: 42, typicalMonths: 30 },
  { id: 'takes-turns', title: 'Takes Turns', description: 'Takes turns in games', domain: 'social', minMonths: 24, maxMonths: 36, typicalMonths: 30 },
  { id: 'shows-concern', title: 'Shows Concern for Others', description: 'Shows concern when someone is hurt', domain: 'social', minMonths: 24, maxMonths: 36, typicalMonths: 30 },
  { id: 'cooperative-play', title: 'Cooperative Play', description: 'Plays cooperatively with other children', domain: 'social', minMonths: 36, maxMonths: 48, typicalMonths: 42 },
  { id: 'talks-about-interests', title: 'Talks About Interests', description: 'Talks about what they like', domain: 'social', minMonths: 36, maxMonths: 48, typicalMonths: 42 },
  { id: 'prefers-friends', title: 'Has Favorite Friends', description: 'Has favorite friends', domain: 'social', minMonths: 36, maxMonths: 48, typicalMonths: 42 },
  { id: 'follows-rules', title: 'Follows Rules', description: 'Follows rules and takes turns in games', domain: 'social', minMonths: 48, maxMonths: 60, typicalMonths: 54 },
  { id: 'likes-to-please-friends', title: 'Wants to Please Friends', description: 'Wants to be like and please friends', domain: 'social', minMonths: 48, maxMonths: 60, typicalMonths: 54 },
  { id: 'distinguishes-real-makebelieve', title: 'Real vs. Make-Believe', description: 'Tells difference between real and make-believe', domain: 'social', minMonths: 48, maxMonths: 60, typicalMonths: 54 },

  // ── SENSORY (8) ────────────────────────────────────────────────────────
  { id: 'startles-to-sounds', title: 'Startles to Loud Sounds', description: 'Startles or blinks to loud sounds', domain: 'sensory', minMonths: 0, maxMonths: 3, typicalMonths: 1 },
  { id: 'focuses-on-faces', title: 'Focuses on Faces', description: 'Focuses on faces 8-12 inches away', domain: 'sensory', minMonths: 0, maxMonths: 3, typicalMonths: 2 },
  { id: 'tracks-objects', title: 'Tracks Moving Objects', description: 'Follows moving objects with eyes smoothly', domain: 'sensory', minMonths: 2, maxMonths: 6, typicalMonths: 4 },
  { id: 'recognizes-voices', title: 'Recognizes Familiar Voices', description: 'Shows recognition of familiar voices', domain: 'sensory', minMonths: 3, maxMonths: 6, typicalMonths: 4 },
  { id: 'responds-to-sounds-direction', title: 'Responds to Sounds from All Directions', description: 'Turns head toward sounds from any direction', domain: 'sensory', minMonths: 6, maxMonths: 10, typicalMonths: 8 },
  { id: 'texture-exploration', title: 'Explores Textures', description: 'Shows interest in different textures', domain: 'sensory', minMonths: 6, maxMonths: 12, typicalMonths: 9 },
  { id: 'identifies-sounds', title: 'Identifies Common Sounds', description: 'Recognizes familiar sounds', domain: 'sensory', minMonths: 12, maxMonths: 24, typicalMonths: 18 },
  { id: 'tolerates-messy-play', title: 'Tolerates Messy Play', description: 'Engages with different textures in messy play', domain: 'sensory', minMonths: 12, maxMonths: 24, typicalMonths: 18 },
];

export async function up() {
  const count = await Milestone.countDocuments();
  if (count > 0) {
    console.log(`    Milestones collection already has ${count} documents, skipping seed.`);
    return;
  }

  const mappedMilestones = milestones.map((m) => ({
    uuid: uuidv4(),
    legacyId: m.id,
    title: m.title,
    description: m.description,
    domain: m.domain,
    subDomain: deriveSubDomain(m.domain, m.id),
    ageRangeStartMonths: m.minMonths,
    ageRangeEndMonths: m.maxMonths,
    typicalMonths: m.typicalMonths,
    source: 'WHO',
    tags: [],
    isActive: true,
  }));

  const inserted = await Milestone.insertMany(mappedMilestones);
  console.log(`    Seeded ${inserted.length} milestones.`);
}
