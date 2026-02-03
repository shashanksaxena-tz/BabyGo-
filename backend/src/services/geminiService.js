import { GoogleGenerativeAI } from '@google/generative-ai';
import whoDataService from './whoDataService.js';

class GeminiService {
  constructor() {
    this.model = null;
    this.visionModel = null;
  }

  initialize(apiKey) {
    const genAI = new GoogleGenerativeAI(apiKey);
    this.model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    this.visionModel = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  }

  isInitialized() {
    return this.model !== null;
  }

  async analyzeDevelopment(child, mediaData = [], audioData = null) {
    if (!this.model) {
      throw new Error('Gemini service not initialized');
    }

    const ageMonths = child.ageInMonths;
    const milestones = whoDataService.getMilestonesForAge(ageMonths);
    const growthPercentiles = whoDataService.assessGrowth(child);
    const sources = whoDataService.getSourcesForRegion(child.region);

    const milestoneContext = this._buildMilestoneContext(milestones, ageMonths);
    const growthContext = this._buildGrowthContext(growthPercentiles);

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

Analyze the child's development based on the provided information and any media content.

IMPORTANT GUIDELINES:
1. Base assessments on WHO developmental milestones only
2. This is for informational purposes - NOT medical advice
3. Do not diagnose conditions or diseases
4. Recommend consulting a pediatrician for any concerns
5. Be encouraging and supportive in tone
6. Provide specific, actionable activities for each domain

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
  "personalizedTips": ["tip1", "tip2", "tip3"]
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
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const data = JSON.parse(jsonMatch[0]);
        return this._buildAnalysisResult(data, child, milestones, growthPercentiles, sources);
      }

      throw new Error('Invalid response format from AI');
    } catch (error) {
      console.error('Gemini analysis error:', error);
      throw error;
    }
  }

  async generateBedtimeStory(child, theme) {
    if (!this.model) {
      throw new Error('Gemini service not initialized');
    }

    const prompt = `
Create a bedtime story for a ${child.ageInMonths}-month-old child named ${child.name}.

STORY REQUIREMENTS:
- Theme: ${theme.name} (${theme.description || ''})
- Make ${child.name} the protagonist/hero of the story
- Include their interests: ${child.interests?.join(', ') || 'general'}
- Include their favorite characters if relevant: ${child.favoriteCharacters?.join(', ') || 'none specified'}
- Use simple, age-appropriate language
- Story should be calming and lead to sleep
- 4-6 pages, each with 2-3 short paragraphs
- Include a gentle moral or lesson
- End with ${child.name} falling peacefully asleep

Respond in this JSON format:
{
  "title": "Story Title",
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

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const data = JSON.parse(jsonMatch[0]);
        return {
          title: data.title || `A Story for ${child.name}`,
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

  async generateRecommendations(child, category) {
    if (!this.model) {
      throw new Error('Gemini service not initialized');
    }

    const prompt = `
Recommend age-appropriate ${category} for a ${child.ageInMonths}-month-old child.

CHILD PROFILE:
- Age: ${child.ageInMonths} months
- Interests: ${child.interests?.join(', ') || 'general'}
- Favorite characters: ${child.favoriteCharacters?.join(', ') || 'none'}

Provide 5 recommendations focusing on developmental benefits.

Respond in JSON format:
{
  "recommendations": [
    {
      "name": "Product/Activity Name",
      "description": "Brief description",
      "category": "${category}",
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

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]).recommendations || [];
      }

      return [];
    } catch (error) {
      console.error('Recommendations error:', error);
      return [];
    }
  }

  async generateRecipes(child, count = 3) {
    if (!this.model) {
      throw new Error('Gemini service not initialized');
    }

    const prompt = `
Create ${count} age-appropriate recipes for a ${child.ageInMonths}-month-old child.

Consider:
- Age-appropriate textures and ingredients
- Nutritional needs for this age
- Easy preparation
- WHO feeding guidelines

Respond in JSON format:
{
  "recipes": [
    {
      "name": "Recipe Name",
      "description": "Brief description",
      "ingredients": ["ingredient1", "ingredient2"],
      "instructions": ["step1", "step2"],
      "prepTime": "10 mins",
      "cookTime": "15 mins",
      "nutritionHighlights": ["Iron-rich", "Good source of protein"],
      "allergens": ["dairy"],
      "difficulty": "Easy"
    }
  ]
}
`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]).recipes || [];
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
      : 'Cover all development areas.';

    const prompt = `
Provide 5 research-backed parenting tips for a ${child.ageInMonths}-month-old child.

${focusText}

Child's interests: ${child.interests?.join(', ') || 'general'}

Tips should be:
- Specific and actionable
- Based on developmental science
- Incorporate the child's interests when possible
- Appropriate for the child's age

Respond in JSON format:
{
  "tips": ["tip1", "tip2", "tip3", "tip4", "tip5"]
}
`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]).tips || [];
      }

      return [];
    } catch (error) {
      console.error('Tips error:', error);
      return [];
    }
  }

  _buildMilestoneContext(milestones, ageMonths) {
    const byDomain = {};
    for (const m of milestones) {
      if (!byDomain[m.domain]) byDomain[m.domain] = [];
      byDomain[m.domain].push(m);
    }

    let context = '';
    for (const domain of ['motor', 'language', 'cognitive', 'social']) {
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
    };
  }
}

export default new GeminiService();
