import { GoogleGenerativeAI } from '@google/generative-ai';
import whoDataService from './whoDataService.js';
import { DOMAINS, REGION_CUISINE_MAP } from '../config/appConfig.js';

class GeminiService {
  constructor() {
    this.model = null;
    this.visionModel = null;
  }

  initialize(apiKey) {
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    this.visionModel = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  }

  isInitialized() {
    return this.model !== null;
  }

  async analyzeDevelopment(child, mediaData = [], audioData = null, achievedMilestones = []) {
    if (!this.model) {
      throw new Error('Gemini service not initialized');
    }

    const ageMonths = child.ageInMonths;
    const milestones = whoDataService.getMilestonesForAge(ageMonths);
    const growthPercentiles = whoDataService.assessGrowth(child);
    const sources = whoDataService.getSourcesForRegion(child.region);

    const milestoneContext = this._buildMilestoneContext(milestones, ageMonths);
    const growthContext = this._buildGrowthContext(growthPercentiles);

    let achievedContext = '';
    if (achievedMilestones && achievedMilestones.length > 0) {
      achievedContext = `\n\nALREADY ACHIEVED MILESTONES (do NOT re-suggest these, instead suggest building upon them):\n`;
      achievedContext += achievedMilestones.map(m => `- [ACHIEVED] ${m.title} (${m.domain})`).join('\n');
    }

    const prompt = `
You are a child development specialist using WHO standards to analyze a ${ageMonths}-month-old ${child.gender} child named ${child.name}.

CHILD PROFILE:
- Age: ${ageMonths} months
- Weight: ${child.weight} kg
- Height: ${child.height} cm
${child.headCircumference ? `- Head Circumference: ${child.headCircumference} cm` : ''}
- Region: ${child.region.toUpperCase()}
- Interests: ${child.interests?.join(', ') || 'Not specified'}

CURRENT GROWTH ASSESSMENT:
${growthContext}

WHO DEVELOPMENTAL MILESTONES FOR THIS AGE:
${milestoneContext}
${achievedContext}

Analyze the child's development based on the provided information and any media content.

IMPORTANT GUIDELINES:
1. Base assessments on WHO developmental milestones only
2. This is for informational purposes - NOT medical advice
3. Do not diagnose conditions or diseases
4. Recommend consulting a pediatrician for any concerns
5. Be encouraging and supportive in tone
6. Provide specific, actionable activities for each domain
7. Use ONLY these status values for "overallStatus" and each domain "status":
   - "ahead": Child exceeds age-typical expectations
   - "on_track": Meeting expected developmental milestones
   - "on_track_with_monitoring": Generally on track but specific areas need watching
   - "emerging": Skills are developing but behind typical timeline
   - "needs_support": Significant delay requiring professional guidance

Respond in this JSON format:
{
  "overallScore": 85,
  "overallStatus": "on_track",
  "summary": "Overall development summary...",
  "motor": {
    "score": 85,
    "status": "on_track",
    "observations": ["observation1", "observation2"],
    "strengths": ["strength1"],
    "areasToSupport": ["area1"],
    "achievedMilestones": ["milestone_id1"],
    "activities": ["activity1", "activity2"]
  },
  "language": {
    "score": 80,
    "status": "on_track",
    "observations": ["observation1"],
    "strengths": ["strength1"],
    "areasToSupport": [],
    "achievedMilestones": ["milestone_id1"],
    "activities": ["activity1"]
  },
  "cognitive": {
    "score": 90,
    "status": "on_track",
    "observations": ["observation1"],
    "strengths": ["strength1"],
    "areasToSupport": [],
    "achievedMilestones": ["milestone_id1"],
    "activities": ["activity1"]
  },
  "social": {
    "score": 85,
    "status": "on_track",
    "observations": ["observation1"],
    "strengths": ["strength1"],
    "areasToSupport": [],
    "achievedMilestones": ["milestone_id1"],
    "activities": ["activity1"]
  },
  "personalizedTips": ["tip1", "tip2", "tip3"],
  "structuredTips": [
    { "category": "sleep|feeding|behavior|safety|development|health|bonding", "title": "...", "description": "...", "priority": "high|medium|low" }
  ],
  "activityProfile": {
    "pattern": "description of observed activity patterns",
    "description": "detailed activity assessment",
    "engagementLevel": "high|moderate|low",
    "focusDuration": "estimated focus duration",
    "playStyle": "description of play style"
  },
  "warnings": ["any developmental concerns requiring professional attention"]
}
`;

    try {
      const parts = [{ text: prompt }];

      // Add media content if available
      if (mediaData && mediaData.length > 0) {
        for (const media of mediaData) {
          if (media.data && media.mimeType) {
            parts.push({
              inlineData: {
                data: media.data,
                mimeType: media.mimeType,
              },
            });
          }
        }
      }

      const result = await this.visionModel.generateContent(parts);
      const response = await result.response;
      const text = response.text();

      // Parse JSON from response
      const data = this._parseJsonResponse(text);
      if (data) {
        return this._buildAnalysisResult(data, child, milestones, growthPercentiles, sources);
      }

      throw new Error('Invalid response format from AI');
    } catch (error) {
      console.error('Gemini analysis error:', error);
      throw error;
    }
  }

  async generateBedtimeStory(child, theme, childPhotoBase64 = null, childPhotoMime = 'image/jpeg') {
    if (!this.model) {
      throw new Error('Gemini service not initialized');
    }

    // If a child photo is provided, describe the child's appearance for story personalization
    let appearanceDescription = '';
    if (childPhotoBase64) {
      try {
        appearanceDescription = await this.describeImage(childPhotoBase64, childPhotoMime);
      } catch (err) {
        console.warn('Failed to describe child photo for story:', err.message);
      }
    }

    const prompt = `
Create a bedtime story for a ${child.ageInMonths}-month-old child named ${child.name}.

STORY REQUIREMENTS:
- Theme: ${theme.name} (${theme.description || ''})
- Make ${child.name} the protagonist/hero of the story
${appearanceDescription ? `- ${child.name}'s appearance: ${appearanceDescription}` : ''}
- Include their interests: ${child.interests?.join(', ') || 'general'}
- Include their favorite characters if relevant: ${child.favoriteCharacters?.join(', ') || 'none specified'}
- Use simple, age-appropriate language
- Story should be calming and lead to sleep
- 4-6 pages, each with 2-3 short paragraphs
- Include a gentle moral or lesson
- End with ${child.name} falling peacefully asleep
- Include a list of all characters in the story with a brief description of each

Respond in this JSON format:
{
  "title": "Story Title",
  "characters": [
    { "name": "Character Name", "description": "Brief character description", "role": "protagonist|supporting|companion" }
  ],
  "duration": "estimated reading time in minutes (e.g. 5)",
  "pages": [
    {
      "pageNumber": 1,
      "text": "Story text for page 1...",
      "illustrationPrompt": "Description for illustration"
    }
  ],
  "moral": "The gentle lesson of the story"
}
`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      const data = this._parseJsonResponse(text);
      if (data) {
        return {
          title: data.title || `A Story for ${child.name}`,
          characters: data.characters || [],
          duration: data.duration || null,
          pages: data.pages || [],
          moral: data.moral || '',
          theme: theme,
          childAgeAtCreation: child.ageInMonths,
        };
      }

      throw new Error('Invalid response format from AI');
    } catch (error) {
      console.error('Story generation error:', error);
      throw error;
    }
  }

  /**
   * Describe a character/toy image using Gemini Vision.
   * Returns a 1-2 sentence visual description suitable for embedding in story prompts.
   *
   * @param {string} imageBase64 - Base64-encoded image data (no data URL prefix)
   * @param {string} mimeType - e.g. 'image/jpeg'
   * @returns {Promise<string>}
   */
  async describeImage(imageBase64, mimeType = 'image/jpeg') {
    if (!this.visionModel) throw new Error('Gemini service not initialized');
    const parts = [
      {
        text: "Describe this toy or character in 1-2 sentences for a children's bedtime story illustration. "
          + 'Focus on visual appearance: shape, colour, notable features. Keep it imaginative and child-friendly.',
      },
      { inlineData: { data: imageBase64, mimeType } },
    ];
    const result = await this.visionModel.generateContent(parts);
    return result.response.text().trim();
  }

  /**
   * Generate a fully custom bedtime story based on user-defined parameters.
   *
   * @param {Object} child - Child document
   * @param {Object} opts
   * @param {string}   opts.customPrompt        - Free-form user instructions
   * @param {string[]} opts.characters          - Extra character names
   * @param {string}   opts.setting             - Setting/place
   * @param {string}   opts.action              - Plot driver
   * @param {string[]} opts.characterDescriptions - Gemini Vision descriptions of character images
   * @param {string}   opts.childAvatarDescription - Vision description of child's story avatar
   * @returns {Promise<Object>} { title, coverImageDescription, pages, moral }
   */
  async generateCustomStory(child, opts = {}) {
    if (!this.model) throw new Error('Gemini service not initialized');

    const {
      customPrompt = '',
      characters = [],
      setting = '',
      action = '',
      characterDescriptions = [],
      childAvatarDescription = '',
    } = opts;

    const characterLines = characters
      .map((name, i) => characterDescriptions[i] ? `- ${name}: ${characterDescriptions[i]}` : `- ${name}`)
      .join('\n');

    const prompt = `
Create a custom bedtime story for a ${child.ageInMonths}-month-old child named ${child.name}.

MANDATORY PROTAGONIST:
- ${child.name} is the hero of this story (always featured on every page)
${childAvatarDescription ? `- ${child.name}'s appearance: ${childAvatarDescription}` : ''}

STORY REQUIREMENTS:
- Setting: ${setting || 'a magical, cosy world'}
- Plot / action: ${action || 'a gentle adventure that ends in sleep'}
${characters.length > 0 ? `- Additional characters:\n${characterLines}` : ''}
- Use simple, age-appropriate language suitable for a toddler bedtime story
- Story should be calming and gently lead towards sleep
- 4-6 pages, each with 2-3 short paragraphs
- Include a gentle moral or lesson
- End with ${child.name} falling peacefully asleep
${customPrompt ? `\nSPECIAL INSTRUCTIONS FROM PARENT:\n${customPrompt}` : ''}

Respond in this JSON format:
{
  "title": "Story Title",
  "coverImageDescription": "Vivid 1-sentence description for the cover art showing ${child.name} in the main scene",
  "pages": [
    {
      "pageNumber": 1,
      "text": "Story text for page 1...",
      "illustrationPrompt": "Detailed description for page illustration including ${child.name} and the scene"
    }
  ],
  "moral": "The gentle lesson of the story"
}
`;

    const result = await this.model.generateContent(prompt);
    const text = result.response.text();
    const data = this._parseJsonResponse(text);
    if (!data) throw new Error('Invalid response format from AI');
    return {
      title: data.title || `${child.name}'s Special Story`,
      coverImageDescription: data.coverImageDescription || '',
      pages: data.pages || [],
      moral: data.moral || '',
    };
  }

  async generateRecommendations(child, category) {
    if (!this.model) {
      throw new Error('Gemini service not initialized');
    }

    const ageMin = Math.max(0, child.ageInMonths - 3);
    const ageMax = child.ageInMonths + 6;

    const prompt = `
Recommend 6 age-appropriate products for a ${child.ageInMonths}-month-old child.

CHILD PROFILE:
- Age: ${child.ageInMonths} months
- Target age range for products: ${ageMin}-${ageMax} months
- Interests: ${child.interests?.join(', ') || 'general'}
- Favorite characters: ${child.favoriteCharacters?.join(', ') || 'none'}

REQUIREMENTS:
- Provide 6 product recommendations
- Mix categories: toys, books, educational, outdoor, sensory
${category !== 'all' ? `- Focus on category: ${category}` : '- Include a variety from all categories'}
- Each product should have clear developmental benefits
- Include a relevant emoji, price range, and target age range

Respond in JSON format:
{
  "recommendations": [
    {
      "name": "Product Name",
      "description": "Brief description",
      "category": "toys|books|educational|outdoor|sensory",
      "emoji": "relevant emoji",
      "priceRange": "$10-$20",
      "ageRange": "${ageMin}-${ageMax} months",
      "developmentAreas": ["motor", "cognitive"],
      "whyRecommended": "Why this helps development"
    }
  ]
}
`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      const data = this._parseJsonResponse(text);
      if (data) {
        return data.recommendations || [];
      }

      return [];
    } catch (error) {
      console.error('Recommendations error:', error);
      return [];
    }
  }

  async generateRecipes(child, count = 6, filters = {}) {
    if (!this.model) {
      throw new Error('Gemini service not initialized');
    }

    const { excludeAllergens, dietaryPreferences, foodLikings } = filters;

    // Regional cuisine context
    const regionInfo = REGION_CUISINE_MAP[child.region] || REGION_CUISINE_MAP['US'] || { name: 'International', description: 'varied global cuisine' };

    let filterInstructions = '';
    if (excludeAllergens && excludeAllergens.length > 0) {
      filterInstructions += `\nCRITICAL ALLERGEN RESTRICTION - This is a safety requirement:
- ABSOLUTELY EXCLUDE these allergens: ${Array.isArray(excludeAllergens) ? excludeAllergens.join(', ') : excludeAllergens}
- Do NOT use any ingredients that contain or may contain these allergens
- Do NOT suggest recipes where cross-contamination is likely
- Double-check every ingredient against the allergen list`;
    }
    if (dietaryPreferences && dietaryPreferences.length > 0) {
      filterInstructions += `\n- Respect these dietary preferences: ${Array.isArray(dietaryPreferences) ? dietaryPreferences.join(', ') : dietaryPreferences}.`;
    }
    if (foodLikings && foodLikings.length > 0) {
      filterInstructions += `\n- Incorporate these food preferences/likings where possible: ${Array.isArray(foodLikings) ? foodLikings.join(', ') : foodLikings}.`;
    }

    const prompt = `
Create ${count} age-appropriate recipes for a ${child.ageInMonths}-month-old child.

REGIONAL CUISINE CONTEXT:
- Region: ${child.region || 'US'}
- Cuisine style: ${regionInfo.name} (${regionInfo.description})
- Incorporate regional flavors and ingredients familiar to this cuisine tradition

Consider:
- Age-appropriate textures and ingredients for a ${child.ageInMonths}-month-old
- Nutritional needs for this age (iron, protein, fiber are critical)
- Easy preparation for busy parents
- WHO complementary feeding guidelines
- Mix of mealTypes: include at least one each of breakfast, lunch, dinner, and snack
${filterInstructions}

Respond in JSON format:
{
  "recipes": [
    {
      "name": "Recipe Name",
      "description": "Brief description",
      "mealType": "breakfast|lunch|dinner|snack",
      "ingredients": ["ingredient1", "ingredient2"],
      "instructions": ["step1", "step2"],
      "prepTime": "10 mins",
      "cookTime": "15 mins",
      "difficulty": "Easy",
      "allergens": ["dairy"],
      "nutrition": { "calories": 150, "protein": "5g", "fiber": "2g", "iron": "1mg" },
      "nutritionHighlights": ["Iron-rich", "Good source of protein"],
      "ageAppropriate": "Why this recipe suits a ${child.ageInMonths}-month-old",
      "texture": "pureed|mashed|soft chunks|finger food"
    }
  ]
}
`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      const data = this._parseJsonResponse(text);
      if (data) {
        return data.recipes || [];
      }

      return [];
    } catch (error) {
      console.error('Recipes error:', error);
      return [];
    }
  }

  async generateParentingTips(child, focusArea = null) {
    if (!this.model) {
      throw new Error('Gemini service not initialized');
    }

    const focusText = focusArea
      ? `Focus on ${focusArea} development.`
      : 'Cover all development areas including sleep, feeding, behavior, safety, development, health, and bonding.';

    const regionNote = child.region
      ? `\nCULTURAL CONTEXT: The family is in region "${child.region}". Be culturally sensitive and consider local parenting norms and practices.`
      : '';

    const prompt = `
Provide 6 research-backed parenting tips for a ${child.ageInMonths}-month-old child.

${focusText}
${regionNote}

Child's interests: ${child.interests?.join(', ') || 'general'}

Tips should be:
- Specific and actionable with concrete steps
- Based on developmental science from WHO, AAP, or CDC guidelines
- Incorporate the child's interests when possible
- Appropriate for the child's age
- Include a relevant emoji for visual appeal
- Include source attribution (WHO, AAP, or CDC)

Respond in JSON format:
{
  "tips": [
    {
      "title": "Short tip title",
      "description": "Detailed explanation of the tip",
      "category": "sleep|feeding|behavior|safety|development|health|bonding",
      "emoji": "relevant emoji",
      "priority": "high|medium|low",
      "actionSteps": ["Concrete step 1", "Concrete step 2"],
      "source": "WHO/AAP/CDC source name",
      "sourceUrl": "URL to source or null"
    }
  ]
}
`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      const data = this._parseJsonResponse(text);
      if (data) {
        return data.tips || [];
      }

      return [];
    } catch (error) {
      console.error('Tips error:', error);
      return [];
    }
  }

  async generateIllustration(prompt, childPhotoBase64 = null, childPhotoMime = 'image/jpeg') {
    if (!this.model) throw new Error('Gemini service not initialized');

    const styledPrompt = `Create a children's storybook illustration in a warm, friendly, watercolor-pastel style.
The scene: ${prompt}
Style: Soft colors, gentle lighting, child-friendly, no scary elements. Suitable for a bedtime storybook. Round shapes, warm tones.`;

    const parts = [{ text: styledPrompt }];

    if (childPhotoBase64) {
      parts.unshift({ inlineData: { data: childPhotoBase64, mimeType: childPhotoMime } });
      parts[parts.length - 1].text += '\nBase the main child character appearance on the provided photo.';
    }

    try {
      const imageModel = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash-preview-image-generation' });
      const result = await imageModel.generateContent({
        contents: [{ role: 'user', parts }],
        generationConfig: { responseModalities: ['image', 'text'] },
      });

      const response = result.response;
      for (const candidate of response.candidates || []) {
        for (const part of candidate.content?.parts || []) {
          if (part.inlineData) {
            return { data: part.inlineData.data, mimeType: part.inlineData.mimeType || 'image/png' };
          }
        }
      }
      return null;
    } catch (error) {
      console.error('Illustration generation error:', error.message);
      return null;
    }
  }

  /**
   * Generate improvement resources for a child based on their latest analysis.
   * Produces activities, books, videos, toys, and apps per developmental domain.
   *
   * @param {Object} child - Child document (with dateOfBirth, achievedMilestones, etc.)
   * @param {Object} analysis - Analysis document with domain assessments
   * @returns {Promise<Array>} Array of resource objects
   */
  async generateImprovementResources(child, analysis) {
    if (!this.model) {
      throw new Error('Gemini service not initialized');
    }

    const ageMonths = Math.floor(
      (Date.now() - new Date(child.dateOfBirth).getTime()) / (30.44 * 24 * 60 * 60 * 1000)
    );

    const allResources = [];

    for (const domain of DOMAINS) {
      const assessment = analysis[`${domain}Assessment`];
      if (!assessment) continue;

      const isFlagged = assessment.score < 80 ||
        assessment.status === 'emerging' ||
        assessment.status === 'needs_support';
      const resourceCount = isFlagged ? 12 : 6;

      const achievedMilestoneIds = (child.achievedMilestones || [])
        .map(m => m.milestoneId)
        .join(', ');

      const prompt = `
You are a child development specialist. Generate exactly ${resourceCount} improvement resources for the "${domain}" developmental domain for a ${ageMonths}-month-old child.

CHILD CONTEXT:
- Age: ${ageMonths} months
- Domain: ${domain}
- Assessment Score: ${assessment.score}/100
- Status: ${assessment.status}
- Strengths: ${(assessment.strengths || []).join(', ') || 'None noted'}
- Areas to support: ${(assessment.areasToSupport || []).join(', ') || 'None noted'}
- Already achieved milestones: ${achievedMilestoneIds || 'None recorded'}

IMPORTANT:
- Do NOT suggest resources for already-achieved milestones
- Focus on areas that need support and upcoming milestones
- Mix resource types: activities, books, videos, toys, apps
- Each resource should be practical and age-appropriate
- For flagged domains (score < 80), prioritize high-priority resources

Respond in this JSON format:
{
  "resources": [
    {
      "type": "activity",
      "title": "Resource Title",
      "description": "Clear description of the resource and how it helps development",
      "tags": ["tag1", "tag2"],
      "ageRange": "${ageMonths - 2}-${ageMonths + 4} months",
      "duration": "10-15 min",
      "difficulty": "easy",
      "priority": "high"
    }
  ]
}

Valid types: activity, book, video, toy, app
Valid difficulties: easy, moderate, challenging
Valid priorities: high, medium, low
`;

      try {
        const result = await this.model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        const data = this._parseJsonResponse(text);
        if (data) {
          const resources = (data.resources || []).map(r => ({
            type: r.type || 'activity',
            title: r.title || 'Untitled Resource',
            description: r.description || '',
            tags: r.tags || [],
            ageRange: r.ageRange || `${ageMonths}-${ageMonths + 6} months`,
            duration: r.duration || '10-15 min',
            difficulty: r.difficulty || 'easy',
            priority: r.priority || 'medium',
            domain,
          }));
          allResources.push(...resources);
        }
      } catch (domainError) {
        console.error(`Resource generation error for ${domain}:`, domainError.message);
        // Continue with other domains
      }
    }

    return allResources;
  }

  /**
   * Robustly parse JSON from Gemini's text response.
   * Handles code fences, truncated arrays/objects, and greedy regex fallback.
   */
  _parseJsonResponse(text) {
    // Strategy 1: Extract from ```json ... ``` code fences
    const fenceMatch = text.match(/```json\s*([\s\S]*?)```/);
    if (fenceMatch) {
      try {
        return JSON.parse(fenceMatch[1].trim());
      } catch (_) {
        // Fence content may be truncated, try to repair below
        const repaired = this._repairTruncatedJson(fenceMatch[1].trim());
        if (repaired) return repaired;
      }
    }

    // Strategy 2: Greedy regex to find outermost { ... }
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch (_) {
        // Attempt repair on the matched text
        const repaired = this._repairTruncatedJson(jsonMatch[0]);
        if (repaired) return repaired;
      }
    }

    // Strategy 3: Find the first '{' and try to parse from there
    const firstBrace = text.indexOf('{');
    if (firstBrace !== -1) {
      const candidate = text.slice(firstBrace);
      const repaired = this._repairTruncatedJson(candidate);
      if (repaired) return repaired;
    }

    return null;
  }

  /**
   * Try to repair truncated JSON by closing open brackets/braces.
   * Handles the common Gemini issue where an array is cut mid-element.
   */
  _repairTruncatedJson(text) {
    // Remove any trailing incomplete string/value after the last complete element
    // Find the last complete object in an array by looking for the last '}' that
    // could be an array element boundary
    let candidate = text.trim();

    // Remove trailing comma if present
    candidate = candidate.replace(/,\s*$/, '');

    // Count open vs close brackets/braces
    let braces = 0;
    let brackets = 0;
    let inString = false;
    let escape = false;
    let lastValidEnd = -1;

    for (let i = 0; i < candidate.length; i++) {
      const ch = candidate[i];
      if (escape) {
        escape = false;
        continue;
      }
      if (ch === '\\' && inString) {
        escape = true;
        continue;
      }
      if (ch === '"') {
        inString = !inString;
        continue;
      }
      if (inString) continue;

      if (ch === '{') braces++;
      else if (ch === '}') {
        braces--;
        if (braces >= 0) lastValidEnd = i;
      }
      else if (ch === '[') brackets++;
      else if (ch === ']') {
        brackets--;
        if (brackets >= 0) lastValidEnd = i;
      }
    }

    // If already balanced, try parsing directly
    if (braces === 0 && brackets === 0 && !inString) {
      try {
        return JSON.parse(candidate);
      } catch (_) {
        // fall through to truncation repair
      }
    }

    // If we were inside a string, close it
    if (inString) {
      candidate += '"';
    }

    // Remove trailing partial value after the last complete element
    // Look backward from the end for a clean cut point (after a complete element)
    // Try truncating at the last '}' or ']' that was balanced
    if (lastValidEnd > 0 && (braces > 0 || brackets > 0)) {
      // Truncate to last valid end, then close remaining open brackets/braces
      candidate = candidate.slice(0, lastValidEnd + 1);
      // Recount
      braces = 0;
      brackets = 0;
      inString = false;
      escape = false;
      for (let i = 0; i < candidate.length; i++) {
        const ch = candidate[i];
        if (escape) { escape = false; continue; }
        if (ch === '\\' && inString) { escape = true; continue; }
        if (ch === '"') { inString = !inString; continue; }
        if (inString) continue;
        if (ch === '{') braces++;
        else if (ch === '}') braces--;
        else if (ch === '[') brackets++;
        else if (ch === ']') brackets--;
      }
    }

    // Remove trailing comma before we close
    candidate = candidate.replace(/,\s*$/, '');

    // Close open brackets and braces in LIFO order
    // We need to track the actual order they were opened
    const openStack = [];
    inString = false;
    escape = false;
    for (let i = 0; i < candidate.length; i++) {
      const ch = candidate[i];
      if (escape) { escape = false; continue; }
      if (ch === '\\' && inString) { escape = true; continue; }
      if (ch === '"') { inString = !inString; continue; }
      if (inString) continue;
      if (ch === '{') openStack.push('}');
      else if (ch === '[') openStack.push(']');
      else if (ch === '}' || ch === ']') openStack.pop();
    }

    // Close in reverse order
    while (openStack.length > 0) {
      candidate += openStack.pop();
    }

    try {
      return JSON.parse(candidate);
    } catch (_) {
      return null;
    }
  }

  _buildMilestoneContext(milestones, ageMonths) {
    const byDomain = {};
    for (const m of milestones) {
      if (!byDomain[m.domain]) byDomain[m.domain] = [];
      byDomain[m.domain].push(m);
    }

    let context = '';
    for (const domain of DOMAINS) {
      const domainMilestones = byDomain[domain] || [];
      if (domainMilestones.length === 0) continue;

      context += `\n${domain.toUpperCase()}:\n`;
      for (const m of domainMilestones) {
        const status = ageMonths >= m.typicalMonths ? 'expected' : 'upcoming';
        context += `- [${m.id}] ${m.title} (${status} at ${m.typicalMonths}mo): ${m.description}\n`;
      }
    }

    return context;
  }

  _buildGrowthContext(percentiles) {
    return percentiles
      .map(p => `- ${p.metric}: ${p.value} (${p.percentile.toFixed(0)}th percentile - ${p.interpretation})`)
      .join('\n');
  }

  _buildAnalysisResult(data, child, milestones, growthPercentiles, sources) {
    const buildAssessment = (domain, domainData) => {
      if (!domainData) {
        return {
          domain,
          score: 50,
          status: 'unknown',
          observations: [],
          strengths: [],
          areasToSupport: [],
          achievedMilestones: [],
          upcomingMilestones: [],
          activities: [],
        };
      }

      const achievedIds = domainData.achievedMilestones || [];
      const domainMilestones = milestones.filter(m => m.domain === domain);

      return {
        domain,
        score: domainData.score || 50,
        status: domainData.status || 'unknown',
        observations: domainData.observations || [],
        strengths: domainData.strengths || [],
        areasToSupport: domainData.areasToSupport || [],
        achievedMilestones: domainMilestones
          .filter(m => achievedIds.includes(m.id))
          .map(m => ({ id: m.id, title: m.title, achievedDate: new Date() })),
        upcomingMilestones: domainMilestones
          .filter(m => !achievedIds.includes(m.id))
          .map(m => ({ id: m.id, title: m.title, typicalMonths: m.typicalMonths })),
        activities: domainData.activities || [],
      };
    };

    return {
      overallScore: data.overallScore || 50,
      overallStatus: data.overallStatus || 'unknown',
      summary: data.summary || '',
      motorAssessment: buildAssessment('motor', data.motor),
      languageAssessment: buildAssessment('language', data.language),
      cognitiveAssessment: buildAssessment('cognitive', data.cognitive),
      socialAssessment: buildAssessment('social', data.social),
      growthPercentiles,
      personalizedTips: data.personalizedTips || [],
      sources: sources.slice(0, 5),
      childAgeAtAnalysis: child.ageInMonths,
      ...(data.structuredTips ? { structuredTips: data.structuredTips } : {}),
      ...(data.activityProfile ? { activityProfile: data.activityProfile } : {}),
      ...(data.warnings ? { warnings: data.warnings } : {}),
    };
  }
  async generateActivities(child, domain = null, achievedMilestones = []) {
    if (!this.model) throw new Error('Gemini service not initialized');
    const ageMonths = child.ageInMonths || child.ageMonths || 12;

    let achievedContext = '';
    if (achievedMilestones.length > 0) {
      achievedContext = `\nAlready achieved milestones (suggest building upon these, DO NOT re-suggest):\n`;
      achievedContext += achievedMilestones.map(m => `- ${m.title}`).join('\n');
    }

    const domainFilter = domain ? `Focus on the "${domain}" development domain.` : 'Cover all 4 domains: motor, cognitive, language, social.';

    const prompt = `You are a child development expert. Generate 8 age-appropriate developmental activities for a ${ageMonths}-month-old child named ${child.name}.

${domainFilter}
${achievedContext}

Use common household items only. Each activity should last 10-20 minutes.

Return JSON array:
[
  {
    "title": "Activity name",
    "description": "How to do the activity",
    "domain": "motor|cognitive|language|social",
    "duration": "10-15 min",
    "materials": ["item1", "item2"],
    "skills": ["skill being developed"],
    "difficulty": "easy|medium|challenging",
    "milestoneTarget": "Which milestone this helps achieve"
  }
]`;

    const result = await this.model.generateContent(prompt);
    const text = result.response.text();
    const parsed = this._parseJsonResponse(text);
    return Array.isArray(parsed) ? parsed : parsed.activities || [];
  }

  async analyzeBabySounds(child, audioData) {
    if (!this.model) throw new Error('Gemini service not initialized');
    const ageMonths = child.ageInMonths || child.ageMonths || 12;

    const prompt = `You are a pediatric speech-language development expert. Analyze this baby audio recording for a ${ageMonths}-month-old ${child.gender || 'child'} named ${child.name}.

Evaluate the vocalizations for age-appropriate speech and language development based on WHO milestones.

Return JSON:
{
  "vocalizations": [
    { "type": "babbling|cooing|word_attempt|word|phrase|cry|laugh|other", "description": "Description of what you hear", "developmentalSignificance": "What this means for development" }
  ],
  "languageObservations": ["observation1", "observation2"],
  "recommendations": ["recommendation1", "recommendation2"],
  "developmentStatus": "on_track|emerging|needs_support",
  "summary": "Brief overall assessment"
}`;

    const parts = [{ text: prompt }];
    if (audioData) {
      parts.push({ inlineData: { data: audioData.data || audioData.base64, mimeType: audioData.mimeType || 'audio/webm' } });
    }

    const result = await this.model.generateContent(parts);
    const text = result.response.text();
    return this._parseJsonResponse(text);
  }

  async transcribeAudio(audioData) {
    if (!this.model) throw new Error('Gemini service not initialized');

    const prompt = `Transcribe this audio recording. The speaker is a parent describing their child's behavior, activities, or development. Return the transcription as plain text, cleaning up any filler words or false starts for clarity.`;

    const parts = [
      { text: prompt },
      { inlineData: { data: audioData.data || audioData.base64, mimeType: audioData.mimeType || 'audio/webm' } },
    ];

    const result = await this.model.generateContent(parts);
    return result.response.text().trim();
  }
}

export default new GeminiService();
