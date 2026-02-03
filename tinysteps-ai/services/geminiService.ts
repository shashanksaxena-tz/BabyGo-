import { GoogleGenAI, Type } from "@google/genai";
import {
  AnalysisResult,
  ChildProfile,
  BedtimeStory,
  ProductRecommendation,
  Recipe,
  ParentingTip,
  DevelopmentTip,
  WHOSource,
} from "../types";
import {
  WHO_SOURCES,
  getMilestonesForAge,
  assessGrowth,
  getSourcesForRegion,
} from "./whoDataService";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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
          model: 'gemini-2.0-flash',
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
          model: 'gemini-2.0-flash',
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

/**
 * Comprehensive development analysis using WHO data
 */
export const analyzeDevelopment = async (
  mediaFiles: File[],
  child: ChildProfile,
  contextNotes: string,
  babyAudioBlob?: Blob
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

  // Build the analysis prompt with WHO context
  const whoContext = `
WHO DEVELOPMENTAL MILESTONES FOR ${child.ageMonths} MONTHS:
${milestones.map(m => `- ${m.title}: ${m.description} (Expected: ${m.expectedAgeMonths.min}-${m.expectedAgeMonths.max} months)`).join('\n')}

GROWTH PERCENTILES (WHO Standards):
- Weight: ${growthAssessment.weightPercentile}th percentile
- Height: ${growthAssessment.heightPercentile}th percentile
${growthAssessment.headCircumferencePercentile ? `- Head Circumference: ${growthAssessment.headCircumferencePercentile}th percentile` : ''}

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
      model: 'gemini-2.0-flash',
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

Return JSON with:
- title: story title
- theme: the story theme
- content: array of paragraphs (5-8 paragraphs)
- illustrations: array of scene descriptions for each paragraph
- duration: estimated reading time in minutes
- characters: array of characters with name, role, description, basedOnChild (true for ${child.name})
- moral: the gentle lesson
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: { parts: [{ text: prompt }] },
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
- name, description, category (toys/books/educational/outdoor)
- imageUrl (placeholder), price estimate
- ageRange (min/max months), interests related to
- rating (4-5), benefits array
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: { parts: [{ text: prompt }] },
      config: { responseMimeType: "application/json" }
    });

    const products = JSON.parse(response.text || "[]");
    return products.map((p: any, i: number) => ({
      id: `rec-${i}`,
      name: p.name,
      description: p.description,
      category: p.category || 'toys',
      imageUrl: p.imageUrl || 'https://via.placeholder.com/200',
      price: p.price || '$19.99',
      affiliateUrl: '#',
      ageRange: p.ageRange || { min: child.ageMonths - 6, max: child.ageMonths + 12 },
      interests: p.interests || [],
      rating: p.rating || 4.5,
      benefits: p.benefits || [],
      source: 'amazon' as const
    }));
  } catch (error) {
    console.error("Recommendations failed", error);
    return [];
  }
};

/**
 * Generate age-appropriate recipes
 */
export const generateRecipes = async (
  child: ChildProfile,
  mealType?: 'breakfast' | 'lunch' | 'dinner' | 'snack'
): Promise<Recipe[]> => {
  const prompt = `
Generate 3 healthy, age-appropriate recipes for a ${child.ageMonths}-month-old child.

${mealType ? `MEAL TYPE: ${mealType}` : 'Include variety of meal types'}

REQUIREMENTS:
1. Appropriate texture and consistency for ${child.ageMonths} months
2. Nutritious ingredients based on WHO feeding guidelines
3. Easy for parents to prepare
4. Include common allergen warnings
5. Child-friendly flavors

Return JSON array with each recipe having:
- name, description
- ageRange (min/max months)
- prepTime, cookTime, servings
- ingredients (array with name, amount, unit)
- instructions (array of steps)
- nutritionInfo (calories, protein, carbs, fat, fiber)
- allergens (array)
- difficulty (easy/medium/hard)
- mealType
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
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
  category?: string
): Promise<ParentingTip[]> => {
  const prompt = `
Generate 5 evidence-based parenting tips for a parent of a ${child.ageMonths}-month-old.

${category ? `FOCUS AREA: ${category}` : 'Cover various aspects: sleep, feeding, development, bonding'}

REQUIREMENTS:
1. Tips must be backed by WHO/CDC/AAP guidelines
2. Practical and actionable
3. Age-appropriate for ${child.ageMonths} months
4. Supportive and encouraging tone
5. Include safety considerations where relevant

Return JSON array with each tip having:
- category (sleep/feeding/behavior/safety/development/health/bonding)
- title, content (detailed explanation)
- ageRange (min/max months it applies to)
- importance (essential/recommended/optional)
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: { parts: [{ text: prompt }] },
      config: { responseMimeType: "application/json" }
    });

    const tips = JSON.parse(response.text || "[]");
    return tips.map((t: any, i: number) => ({
      id: `tip-${i}`,
      ...t,
      source: WHO_SOURCES.developmentalMilestones
    }));
  } catch (error) {
    console.error("Tips generation failed", error);
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
