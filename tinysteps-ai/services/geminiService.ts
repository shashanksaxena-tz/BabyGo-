import { GoogleGenAI, Type } from "@google/genai";
import {
  AnalysisResult,
  ChildProfile,
  BedtimeStory,
  ProductRecommendation,
  Recipe,
  ParentingTip,
  WHOSource,
} from "../types";
import {
  WHO_SOURCES,
  getMilestonesForAge,
  assessGrowth,
  getSourcesForRegion,
} from "./whoDataService";

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

/**
 * Generates an illustration for a story scene using the child's photo as reference
 */
export const generateStoryIllustration = async (
  childPhoto: string,
  sceneDescription: string,
  childName: string,
  style: 'watercolor' | 'cartoon' | 'storybook' = 'storybook'
): Promise<string | null> => {
  const stylePrompts = {
    watercolor: 'soft watercolor illustration style, gentle pastel colors, dreamy atmosphere',
    cartoon: 'friendly cartoon style, bright colors, simple shapes, child-friendly',
    storybook: 'classic storybook illustration, warm and inviting, magical lighting, detailed but whimsical'
  };

  const prompt = `Create a beautiful ${stylePrompts[style]} illustration for a children's bedtime story.

Scene: ${sceneDescription}

The main character is a child named ${childName}. Look at the reference photo provided and make the illustrated child resemble them - capture their hair color, skin tone, and general appearance in the illustration style.

IMPORTANT:
- Make it child-friendly, warm, and magical
- The scene should feel safe and cozy
- Use soft, calming colors suitable for bedtime
- The child character should be clearly visible and central to the scene
- NO text in the image`;

  try {
    // Check if we have a valid photo
    if (!childPhoto || !childPhoto.startsWith('data:')) {
      console.warn('No valid child photo for illustration');
      return null;
    }

    const [mimeInfo, base64Data] = childPhoto.split(',');
    const mimeType = mimeInfo.split(':')[1].split(';')[0];

    const contents = [
      { text: prompt },
      {
        inlineData: {
          mimeType: mimeType,
          data: base64Data
        }
      }
    ];

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: contents,
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
        imageConfig: {
          aspectRatio: '16:9',
          imageSize: '1K',
        },
      }
    });

    // Extract image from response
    const candidate = response.candidates?.[0];
    if (candidate?.content?.parts) {
      for (const part of candidate.content.parts) {
        if (part.inlineData?.data && part.inlineData?.mimeType?.startsWith('image/')) {
          return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
      }
    }

    console.warn('No image in response');
    return null;
  } catch (error) {
    console.error('Illustration generation failed:', error);
    return null;
  }
};

/**
 * Transcribes audio context using Gemini Flash.
 */
export const transcribeAudio = async (audioBlob: Blob): Promise<string> => {
  try {
    const reader = new FileReader();
    return new Promise((resolve, reject) => {
      reader.onloadend = async () => {
        const base64Audio = (reader.result as string).split(',')[1];

        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: {
            parts: [
              {
                inlineData: {
                  mimeType: audioBlob.type,
                  data: base64Audio
                }
              },
              {
                text: "Transcribe this audio note from a parent describing their child's behavior. Return only the text."
              }
            ]
          }
        });

        resolve(response.text || "");
      };
      reader.onerror = reject;
      reader.readAsDataURL(audioBlob);
    });
  } catch (error) {
    console.error("Transcription error:", error);
    return "";
  }
};

/**
 * Analyzes baby sounds and vocalizations
 */
export const analyzeBabySounds = async (audioBlob: Blob, ageMonths: number): Promise<{
  vocalizations: string[];
  languageObservations: string;
  recommendations: string[];
}> => {
  try {
    const reader = new FileReader();
    return new Promise((resolve, reject) => {
      reader.onloadend = async () => {
        const base64Audio = (reader.result as string).split(',')[1];

        const prompt = `
          You are a child development specialist analyzing baby/toddler vocalizations.
          The child is approximately ${ageMonths} months old.

          Listen to this audio and analyze:
          1. Types of vocalizations (babbling, cooing, words, phrases)
          2. Language development observations based on WHO/CDC milestones
          3. Recommendations for language stimulation

          Return a JSON object with:
          - vocalizations: array of observed vocalization types
          - languageObservations: detailed observation text
          - recommendations: array of activity suggestions

          Be warm and encouraging. This is NOT a medical assessment.
        `;

        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: {
            parts: [
              { inlineData: { mimeType: audioBlob.type, data: base64Audio } },
              { text: prompt }
            ]
          },
          config: {
            responseMimeType: "application/json",
          }
        });

        const result = JSON.parse(response.text || "{}");
        resolve({
          vocalizations: result.vocalizations || [],
          languageObservations: result.languageObservations || "Unable to analyze audio",
          recommendations: result.recommendations || [],
        });
      };
      reader.onerror = reject;
      reader.readAsDataURL(audioBlob);
    });
  } catch (error) {
    console.error("Baby sound analysis error:", error);
    return {
      vocalizations: [],
      languageObservations: "Unable to analyze audio",
      recommendations: [],
    };
  }
};

// Interface for achieved milestones context
export interface AchievedMilestoneContext {
  milestoneId: string;
  title: string;
  domain: string;
  achievedDate: string;
}

/**
 * Comprehensive development analysis using WHO data
 */
export const analyzeDevelopment = async (
  mediaFiles: File[],
  child: ChildProfile,
  contextNotes: string,
  _babyAudioBlob?: Blob,
  achievedMilestones?: AchievedMilestoneContext[]
): Promise<Omit<AnalysisResult, 'id'>> => {
  const milestones = getMilestonesForAge(child.ageMonths);
  const growthAssessment = assessGrowth(
    child.weight,
    child.height,
    child.headCircumference,
    child.ageMonths,
    child.gender
  );
  const regionalSources = getSourcesForRegion(child.region.whoRegion);

  // Process all media files
  const mediaPromises = mediaFiles.map(async (file) => {
    const reader = new FileReader();
    return new Promise<{ mimeType: string; data: string }>((resolve, reject) => {
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(',')[1];
        resolve({ mimeType: file.type, data: base64 });
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  });

  const mediaData = await Promise.all(mediaPromises);

  // Build achieved milestones context
  const achievedContext = achievedMilestones && achievedMilestones.length > 0
    ? `
ALREADY ACHIEVED MILESTONES (parent-confirmed):
${achievedMilestones.map(m => `- ${m.title} (${m.domain}) - achieved on ${new Date(m.achievedDate).toLocaleDateString()}`).join('\n')}

IMPORTANT: The child has ALREADY mastered these skills. DO NOT suggest activities to learn these skills.
Instead, suggest more advanced activities that BUILD UPON these achievements.
For example, if "Walking Alone" is achieved, suggest running, climbing, or kicking activities instead.
`
    : '';

  // Build the analysis prompt with WHO context
  const whoContext = `
WHO DEVELOPMENTAL MILESTONES FOR ${child.ageMonths} MONTHS:
${milestones.map(m => `- ${m.title}: ${m.description} (Expected: ${m.expectedAgeMonths.min}-${m.expectedAgeMonths.max} months)${achievedMilestones?.some(a => a.milestoneId === m.id) ? ' [ACHIEVED]' : ''}`).join('\n')}

GROWTH PERCENTILES (WHO Standards):
- Weight: ${growthAssessment.weightPercentile}th percentile
- Height: ${growthAssessment.heightPercentile}th percentile
${growthAssessment.headCircumferencePercentile ? `- Head Circumference: ${growthAssessment.headCircumferencePercentile}th percentile` : ''}
${achievedContext}
CHILD PROFILE:
- Name: ${child.name}
- Age: ${child.ageMonths} months
- Gender: ${child.gender}
- Region: ${child.region.name} (${child.region.whoRegion})
- Interests: ${child.interests.map(i => i.name).join(', ') || 'Not specified'}
`;

  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      headline: {
        type: Type.STRING,
        description: "A personalized, cheerful headline mentioning the child's name"
      },
      overallScore: {
        type: Type.NUMBER,
        description: "Overall development score 0-100"
      },
      motorSkills: {
        type: Type.OBJECT,
        properties: {
          domain: { type: Type.STRING },
          status: { type: Type.STRING, description: "ahead, on-track, monitor, or discuss" },
          description: { type: Type.STRING },
          score: { type: Type.NUMBER },
          percentile: { type: Type.NUMBER },
          observations: { type: Type.ARRAY, items: { type: Type.STRING } },
          recommendations: { type: Type.ARRAY, items: { type: Type.STRING } }
        }
      },
      cognitiveSkills: {
        type: Type.OBJECT,
        properties: {
          domain: { type: Type.STRING },
          status: { type: Type.STRING },
          description: { type: Type.STRING },
          score: { type: Type.NUMBER },
          percentile: { type: Type.NUMBER },
          observations: { type: Type.ARRAY, items: { type: Type.STRING } },
          recommendations: { type: Type.ARRAY, items: { type: Type.STRING } }
        }
      },
      languageSkills: {
        type: Type.OBJECT,
        properties: {
          domain: { type: Type.STRING },
          status: { type: Type.STRING },
          description: { type: Type.STRING },
          score: { type: Type.NUMBER },
          percentile: { type: Type.NUMBER },
          observations: { type: Type.ARRAY, items: { type: Type.STRING } },
          recommendations: { type: Type.ARRAY, items: { type: Type.STRING } }
        }
      },
      socialEmotional: {
        type: Type.OBJECT,
        properties: {
          domain: { type: Type.STRING },
          status: { type: Type.STRING },
          description: { type: Type.STRING },
          score: { type: Type.NUMBER },
          percentile: { type: Type.NUMBER },
          observations: { type: Type.ARRAY, items: { type: Type.STRING } },
          recommendations: { type: Type.ARRAY, items: { type: Type.STRING } }
        }
      },
      activity: {
        type: Type.OBJECT,
        properties: {
          pattern: { type: Type.STRING },
          description: { type: Type.STRING },
          engagementLevel: { type: Type.STRING },
          focusDuration: { type: Type.STRING },
          playStyle: { type: Type.STRING }
        }
      },
      tips: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            category: { type: Type.STRING },
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            forAgeMonths: {
              type: Type.OBJECT,
              properties: {
                min: { type: Type.NUMBER },
                max: { type: Type.NUMBER }
              }
            },
            difficulty: { type: Type.STRING },
            duration: { type: Type.STRING },
            materials: { type: Type.ARRAY, items: { type: Type.STRING } }
          }
        }
      },
      reassurance: { type: Type.STRING },
      warnings: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            severity: { type: Type.STRING },
            domain: { type: Type.STRING },
            message: { type: Type.STRING },
            recommendation: { type: Type.STRING }
          }
        }
      }
    },
    required: ["headline", "overallScore", "motorSkills", "cognitiveSkills", "languageSkills", "socialEmotional", "activity", "tips", "reassurance"]
  };

  const prompt = `
You are TinySteps AI, a friendly, expert child development specialist helping parents understand their child's development.

${whoContext}

PARENT'S NOTES: ${contextNotes || 'None provided'}

TASK:
Analyze the provided media (images/videos) showing ${child.name} and provide a comprehensive developmental assessment.

IMPORTANT GUIDELINES:
1. Compare observations against WHO developmental milestones for a ${child.ageMonths}-month-old
2. Be warm, encouraging, and personalized - use ${child.name}'s name
3. If ${child.interests.length > 0 ? `the child likes ${child.interests.map(i => i.name).join(', ')}, incorporate these into recommendations` : 'no interests are specified, suggest age-appropriate activities'}
4. Provide evidence-based tips backed by WHO/CDC guidelines
5. NEVER diagnose medical conditions - gently suggest consulting a pediatrician if concerns arise
6. Focus on strengths while noting areas for support
7. Make recommendations specific and actionable

Provide your analysis in the specified JSON format.
  `;

  const contentParts = [
    ...mediaData.map(m => ({ inlineData: m })),
    { text: prompt }
  ];

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: { parts: contentParts },
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      }
    });

    const resultJson = JSON.parse(response.text || "{}");

    // Extract grounding metadata for sources
    const groundingUrls: string[] = [];
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (chunks) {
      chunks.forEach((chunk: any) => {
        if (chunk.web?.uri) {
          groundingUrls.push(chunk.web.uri);
        }
      });
    }

    // Combine WHO sources with grounding URLs
    const sources: WHOSource[] = [
      ...regionalSources,
      ...groundingUrls.slice(0, 3).map(url => ({
        title: 'Additional Reference',
        url,
        organization: 'WHO' as const,
        type: 'research' as const,
      }))
    ];

    return {
      childId: child.id,
      timestamp: new Date().toISOString(),
      mediaUploads: [],
      headline: resultJson.headline || `Great progress, ${child.name}!`,
      overallScore: resultJson.overallScore || 75,
      motorSkills: resultJson.motorSkills || {
        domain: 'Motor Skills',
        status: 'on-track',
        description: 'Motor development appears age-appropriate.',
        score: 75,
        observations: [],
        recommendations: []
      },
      cognitiveSkills: resultJson.cognitiveSkills || {
        domain: 'Cognitive Skills',
        status: 'on-track',
        description: 'Cognitive development appears age-appropriate.',
        score: 75,
        observations: [],
        recommendations: []
      },
      languageSkills: resultJson.languageSkills || {
        domain: 'Language Skills',
        status: 'on-track',
        description: 'Language development appears age-appropriate.',
        score: 75,
        observations: [],
        recommendations: []
      },
      socialEmotional: resultJson.socialEmotional || {
        domain: 'Social-Emotional',
        status: 'on-track',
        description: 'Social-emotional development appears age-appropriate.',
        score: 75,
        observations: [],
        recommendations: []
      },
      physicalGrowth: growthAssessment,
      activity: resultJson.activity || {
        pattern: 'Active',
        description: 'Shows good engagement and activity levels.',
        engagementLevel: 'moderate'
      },
      milestones: milestones,
      tips: resultJson.tips || [],
      reassurance: resultJson.reassurance || `${child.name} is doing wonderfully! Every child develops at their own pace, and you're doing a great job supporting their growth.`,
      sources,
      warnings: resultJson.warnings || []
    };
  } catch (error) {
    console.error("Analysis failed", error);
    throw error;
  }
};

/**
 * Generate personalized bedtime story
 */
export const generateBedtimeStory = async (
  child: ChildProfile,
  theme?: string
): Promise<Omit<BedtimeStory, 'id' | 'createdAt'>> => {
  const storyTheme = theme || (child.interests[0]?.name || 'adventure');

  const prompt = `
Create a magical bedtime story for a ${child.ageMonths}-month-old child named ${child.name}.

The attached image is of ${child.name}. Please describe the protagonist in the story to match the child's appearance in the photo (e.g. hair color/style, eye color, glasses if any).

THEME: ${storyTheme}
CHILD'S INTERESTS: ${child.interests.map(i => i.name).join(', ') || 'general adventure'}
FAVORITE CHARACTERS: ${child.favoriteCharacters.join(', ') || 'friendly animals'}
FAVORITE COLORS: ${child.favoriteColors.join(', ') || 'bright colors'}

REQUIREMENTS:
1. Make ${child.name} the protagonist of the story
2. Include gentle, calming elements suitable for bedtime
3. Keep language simple and age-appropriate
4. Include sensory descriptions (soft, warm, gentle sounds)
5. End with ${child.name} feeling safe, loved, and sleepy
6. Story should be 3-5 minutes when read aloud
7. Include a gentle moral or lesson
8. IMPORTANT: In the character description and story text, explicitly mention physical traits observed from the photo

Return JSON with:
- title: story title
- theme: the story theme
- content: array of paragraphs (5-8 paragraphs)
- illustrations: array of scene descriptions for each paragraph. Include details about ${child.name}'s appearance in the scene descriptions so they match the photo.
- duration: estimated reading time in minutes
- characters: array of characters with name, role, description, basedOnChild (true for ${child.name})
- moral: the gentle lesson
  `;

  // Prepare content parts with potential image
  const parts: any[] = [{ text: prompt }];

  // Add profile photo if available and is a data URL
  if (child.profilePhoto && child.profilePhoto.startsWith('data:')) {
    try {
      const [mimeInfo, base64Data] = child.profilePhoto.split(',');
      const mimeType = mimeInfo.split(':')[1].split(';')[0];

      parts.unshift({
        inlineData: {
          mimeType: mimeType,
          data: base64Data
        }
      });
    } catch (e) {
      console.warn('Failed to process profile photo for story generation', e);
    }
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: { parts },
      config: {
        responseMimeType: "application/json",
      }
    });

    const story = JSON.parse(response.text || "{}");

    return {
      childId: child.id,
      title: story.title || `${child.name}'s ${storyTheme} Adventure`,
      theme: storyTheme,
      content: story.content || [],
      illustrations: (story.illustrations || []).map((desc: string, i: number) => ({
        sceneIndex: i,
        description: desc,
        style: 'storybook' as const
      })),
      duration: story.duration || 4,
      characters: story.characters || [{
        name: child.name,
        role: 'protagonist',
        description: `A brave and curious ${child.ageMonths}-month-old`,
        basedOnChild: true
      }],
      moral: story.moral
    };
  } catch (error) {
    console.error("Story generation failed", error);
    throw error;
  }
};

/**
 * Generate product recommendations
 */
export const generateProductRecommendations = async (
  child: ChildProfile
): Promise<ProductRecommendation[]> => {
  const prompt = `
Generate 6 product recommendations for a ${child.ageMonths}-month-old child named ${child.name}.

CHILD'S PROFILE:
- Age: ${child.ageMonths} months
- Interests: ${child.interests.map(i => i.name).join(', ') || 'general play'}
- Favorite things: ${[...child.favoriteCharacters, ...child.favoriteToys].join(', ') || 'not specified'}

REQUIREMENTS:
1. Products must be age-appropriate and safe
2. Include mix of: educational toys, books, developmental toys
3. Align with child's interests when possible
4. Focus on products that support WHO developmental milestones
5. Include products across different price ranges

Return JSON array with each product having:
- name: product name
- emoji: a single emoji representing the product
- description: brief description
- category: toys/books/educational/outdoor
- ageRange: string like "6-12 months"
- developmentAreas: array of skills developed (e.g. ["Fine Motor", "Cognitive"])
- whyRecommended: why this is good for the child
- priceRange: estimated price range
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: { parts: [{ text: prompt }] },
      config: { responseMimeType: "application/json" }
    });

    const products = JSON.parse(response.text || "[]");
    return products.map((p: any, i: number) => ({
      id: `rec-${i}`,
      name: p.name || 'Product',
      emoji: p.emoji || '🧸',
      description: p.description || '',
      category: p.category || 'toys',
      ageRange: p.ageRange || `${Math.max(0, child.ageMonths - 3)}-${child.ageMonths + 6} months`,
      developmentAreas: p.developmentAreas || [],
      whyRecommended: p.whyRecommended || '',
      priceRange: p.priceRange || '$15-30',
      affiliateUrl: '#',
    }));
  } catch (error) {
    console.error("Recommendations failed", error);
    return [];
  }
};

interface RecipeFilters {
  excludeAllergens?: string[];
  dietaryPreferences?: string[];
  foodLikings?: string;
}

/**
 * Generate age-appropriate recipes with filters for allergies, preferences, and region
 */
export const generateRecipes = async (
  child: ChildProfile,
  mealType?: 'breakfast' | 'lunch' | 'dinner' | 'snack',
  filters?: RecipeFilters
): Promise<Recipe[]> => {
  // Build filter sections
  const allergenSection = filters?.excludeAllergens?.length
    ? `\nALLERGEN RESTRICTIONS (MUST AVOID these ingredients completely):
${filters.excludeAllergens.map(a => `- NO ${a.toUpperCase()}`).join('\n')}`
    : '';

  const dietarySection = filters?.dietaryPreferences?.length
    ? `\nDIETARY REQUIREMENTS:
${filters.dietaryPreferences.map(p => `- Must be ${p}`).join('\n')}`
    : '';

  const likingsSection = filters?.foodLikings
    ? `\nCHILD'S FOOD PREFERENCES: ${filters.foodLikings}`
    : '';

  // Regional cuisine mapping
  const regionCuisineMap: Record<string, string> = {
    'IN': 'Indian cuisine (dal, khichdi, roti, rice dishes, mild spices)',
    'US': 'American cuisine (varied, include familiar comfort foods)',
    'GB': 'British cuisine (include traditional weaning foods)',
    'CN': 'Chinese cuisine (congee, steamed dishes, mild flavors)',
    'JP': 'Japanese cuisine (rice porridge, soft vegetables, mild fish)',
    'AU': 'Australian cuisine (varied multicultural options)',
    'DE': 'German cuisine (potatoes, soft vegetables, mild meats)',
    'FR': 'French cuisine (purees, soft cheeses if allowed, vegetables)',
    'CA': 'Canadian cuisine (varied, maple-based, comfort foods)',
    'BR': 'Brazilian cuisine (rice, beans, tropical fruits)',
  };

  const regionCuisine = regionCuisineMap[child.region.code] || 'diverse international cuisine with locally available ingredients';

  const prompt = `
Generate 4 healthy, age-appropriate recipes for a ${child.ageMonths}-month-old child named ${child.name}.

CHILD'S REGION: ${child.region.name}
REGIONAL CUISINE STYLE: ${regionCuisine}
${mealType ? `MEAL TYPE: ${mealType}` : 'Include variety of meal types'}
${allergenSection}
${dietarySection}
${likingsSection}
${child.interests.length > 0 ? `\nCHILD'S INTERESTS (for fun food presentation): ${child.interests.map(i => i.name).join(', ')}` : ''}

REQUIREMENTS:
1. Appropriate texture and consistency for ${child.ageMonths} months
2. Nutritious ingredients based on WHO feeding guidelines
3. Use ingredients commonly available in ${child.region.name}
4. Include cultural/regional dishes suitable for the child's age
5. Easy for parents to prepare
6. Child-friendly flavors
7. If child has interests, suggest fun presentation ideas related to them

IMPORTANT: Strictly follow all allergen restrictions and dietary preferences listed above.

Return JSON array with each recipe having:
- name, description, emoji
- category (Breakfast/Lunch/Dinner/Snacks/Smoothies)
- prepTime (number in minutes)
- servings (string, e.g. "1 child")
- calories (number)
- protein (number, grams)
- fiber (number, grams)
- iron (string, e.g. "High", "Medium")
- ingredients (array of strings)
- steps (array of strings)
- tips (array of strings - include presentation ideas if relevant to child's interests)
- allergens (array of strings - list any allergens present, empty if allergen-free)
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: { parts: [{ text: prompt }] },
      config: { responseMimeType: "application/json" }
    });

    const recipes = JSON.parse(response.text || "[]");
    return recipes.map((r: any, i: number) => ({
      id: `recipe-${i}`,
      ...r,
      source: WHO_SOURCES.nutritionGuidelines
    }));
  } catch (error) {
    console.error("Recipe generation failed", error);
    return [];
  }
};

/**
 * Generate parenting tips based on child's age and needs
 */
export const generateParentingTips = async (
  child: ChildProfile,
  category?: string,
  achievedMilestones?: AchievedMilestoneContext[]
): Promise<ParentingTip[]> => {
  // Build achieved milestones context
  const achievedContext = achievedMilestones && achievedMilestones.length > 0
    ? `
THE CHILD HAS ALREADY ACHIEVED THESE MILESTONES:
${achievedMilestones.map(m => `- ${m.title} (${m.domain})`).join('\n')}

Consider these achievements when providing tips - focus on next steps and how to build upon what the child has already mastered.
`
    : '';

  const prompt = `
Generate 5 evidence-based parenting tips for a parent of a ${child.ageMonths}-month-old.

${category ? `FOCUS AREA: ${category}` : 'Cover various aspects: sleep, feeding, development, bonding'}
${achievedContext}
REQUIREMENTS:
1. Tips must be backed by WHO/CDC/AAP guidelines
2. Practical and actionable
3. Age-appropriate for ${child.ageMonths} months
4. Supportive and encouraging tone
5. Include safety considerations where relevant
6. If development tips, focus on NEXT milestones to work toward, not skills already mastered

Return JSON array with each tip having:
- category (sleep/feeding/behavior/safety/development/health/bonding)
- emoji: a single emoji representing the tip category
- title: short title
- content: detailed explanation
- ageRange (min/max months it applies to)
- importance (essential/recommended/optional)
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: { parts: [{ text: prompt }] },
      config: { responseMimeType: "application/json" }
    });

    const tips = JSON.parse(response.text || "[]");
    const categoryEmojis: Record<string, string> = {
      sleep: '😴', feeding: '🍼', behavior: '🧠', safety: '🛡️',
      development: '📈', health: '💪', bonding: '❤️'
    };
    return tips.map((t: any, i: number) => ({
      id: `tip-${i}`,
      category: t.category || 'development',
      emoji: t.emoji || categoryEmojis[t.category] || '💡',
      title: t.title || 'Parenting Tip',
      content: t.content || '',
      ageRange: t.ageRange,
      importance: t.importance,
      source: WHO_SOURCES.developmentalMilestones
    }));
  } catch (error) {
    console.error("Tips generation failed", error);
    return [];
  }
};

/**
 * Generate age-appropriate development activities
 */
export const generateActivities = async (
  child: ChildProfile,
  domain?: string,
  achievedMilestones?: AchievedMilestoneContext[]
): Promise<any[]> => {
  // Build achieved milestones context
  const achievedContext = achievedMilestones && achievedMilestones.length > 0
    ? `
ALREADY MASTERED SKILLS (DO NOT suggest activities for these - they've been achieved):
${achievedMilestones.map(m => `- ${m.title} (${m.domain})`).join('\n')}

IMPORTANT: Suggest activities that BUILD UPON these achieved milestones, not activities to learn them.
For example:
- If "Walking Alone" is achieved → suggest running games, obstacle courses, kicking balls
- If "Pincer Grasp" is achieved → suggest threading beads, using scissors, drawing
- If "Two-Word Phrases" is achieved → suggest storytelling, singing songs with actions
`
    : '';

  const prompt = `
Generate 5 fun, developmentally appropriate activities for a ${child.ageMonths}-month-old child.

${domain ? `FOCUS DOMAIN: ${domain}` : 'Cover balanced areas: Motor, Cognitive, Language, Social'}
${achievedContext}
REQUIREMENTS:
1. Safe and appropriate for ${child.ageMonths} months
2. Uses common household items
3. Aligned with WHO developmental milestones
4. Clear, simple steps for parents
5. Fun and engaging
6. Activities should challenge and extend BEYOND already mastered skills

Return JSON array with each activity having:
- name, description, emoji
- domain (Motor/Cognitive/Language/Social)
- duration (e.g., "15-20 min")
- materials (array of strings)
- skills (array of skills developed)
- steps (array of instructions)
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: { parts: [{ text: prompt }] },
      config: { responseMimeType: "application/json" }
    });

    const data = JSON.parse(response.text || "[]");
    return data;
  } catch (error) {
    console.error("Activities generation failed", error);
    return [];
  }
};

/**
 * Generate child illustration prompt
 */
export const generateIllustrationPrompt = async (
  child: ChildProfile,
  activity: string,
  style: 'cartoon' | 'anime' | 'watercolor' | 'disney' | 'storybook'
): Promise<string> => {
  const styleDescriptions = {
    cartoon: 'colorful cartoon style, simple shapes, bright colors',
    anime: 'soft anime style, big expressive eyes, gentle colors',
    watercolor: 'soft watercolor illustration, gentle washes of color',
    disney: 'Disney-inspired style, magical and whimsical',
    storybook: 'classic storybook illustration, warm and inviting'
  };

  return `A ${styleDescriptions[style]} illustration of a happy ${child.gender === 'male' ? 'boy' : 'girl'} toddler (${child.ageMonths} months old) ${activity}. ${child.interests.length > 0 ? `The scene includes elements of ${child.interests[0].name}.` : ''} Warm, safe, child-friendly atmosphere. No text.`;
};
