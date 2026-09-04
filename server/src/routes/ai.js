import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();
const apiKey = process.env.GEMINI_API_KEY?.trim();
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

router.post('/estimate-calories', async (req, res) => {
  try {
    const { description } = req.body;

    if (!description || !description.trim()) {
      return res.status(400).json({ error: 'Food description is required' });
    }

    if (!genAI) {
      return res.status(503).json({
        error: 'AI service is not configured. Add a valid GEMINI_API_KEY to server/.env.',
      });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-3.6-flash' });

    const prompt = `You are a nutrition expert. 
Estimate the nutrition for this food: "${description}".

Respond with ONLY a valid JSON object in this exact format:
{"calories": number, "protein": number, "carbs": number, "fat": number, "items": ["item1"]}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text().trim();

    // Clean possible markdown
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();

    const data = JSON.parse(text);

    res.json(data);
  } catch (error) {
    console.error('Full Error:', error);
    const isAuthError = error.message?.includes('401') ||
      error.message?.includes('ACCESS_TOKEN_TYPE_UNSUPPORTED');
    res.status(500).json({ 
      error: isAuthError
        ? 'AI authentication failed. Replace GEMINI_API_KEY with a valid Google AI Studio API key.'
        : 'Failed to estimate calories',
    });
  }
});

router.post('/ai/suggest-meal', async (req, res) => {
  try {
 const {
  remainingCalories,
  remainingProtein,
  remainingCarbs,
  remainingFat,
  mealType = 'snack',
  goal = 'maintain',
} = req.body;

    if (!genAI) {
      return res.status(503).json({
        error:
          'AI service is not configured. Add a valid GEMINI_API_KEY to server/.env.',
      });
    }

    const goalInstructions = {
      gain: `
The user is in WEIGHT GAIN mode.

Recommend calorie-dense but nutritious foods that help support healthy weight gain.
Prefer foods such as:
- Milk
- Banana shake
- Dates
- Peanut butter
- Eggs
- Yogurt
- Nuts
- Oats
- Chicken
- Rice
- Paratha in moderation

Small snacks and drinks are completely acceptable.
Do NOT assume the user wants a huge full meal.
`,

lose: `
The user is in WEIGHT LOSS mode.

The priority is LOW-CALORIE, LIGHT and FILLING food choices.
These suggestions are for the user's NEXT BITE or SMALL SNACK, NOT a full meal.

Prefer options such as:
- Kahwa
- Green tea
- Black coffee
- Unsweetened tea
- Cucumber
- Tomato
- Apple
- Orange
- Guava
- Watermelon
- Low-fat Greek yogurt
- Plain low-fat yogurt
- 1 boiled egg
- Small bowl of clear vegetable soup
- Small portion of roasted chana
- Small salad
- Lemon water without sugar

IMPORTANT WEIGHT-LOSS RULES:
- Prefer suggestions around 0-150 kcal per serving.
- Do NOT try to use up all remaining calories.
- Do NOT suggest 200-300+ kcal snacks unless there is a very strong nutritional reason.
- Avoid fried foods, paratha, large rice portions, desserts, sugary drinks, shakes and calorie-dense mixtures.
- Avoid large portions of nuts, almonds, peanut butter and dates.
- Keep portions small and realistic.
- Drinks such as kahwa, green tea and black coffee can be suggested when appropriate.
- The goal is to give the user a genuinely light next-food option while maintaining good nutrition.
`,

      maintain: `
The user is in WEIGHT MAINTENANCE mode.

Recommend balanced and nutritious foods.
Suggestions can include:
- Eggs
- Fruit
- Yogurt
- Milk
- Oats
- Sandwiches
- Chicken
- Rice
- Daal
- Roti
- Nuts
- Tea or coffee in moderation

Suggestions can be snacks, drinks, breakfast items or meals depending on the context.
`,
    };

    const selectedGoal =
      goalInstructions[goal] || goalInstructions.maintain;

    const model = genAI.getGenerativeModel({
      model: 'gemini-3.6-flash',
    });

    const prompt = `
You are a nutrition assistant inside a Pakistani meal-tracking application called NutriBloom.

USER GOAL:
${goal}

${selectedGoal}

The user wants ideas for their NEXT BITE, not necessarily a complete meal.

Remaining daily nutrition:

Calories: ${Number(remainingCalories) || 0} kcal
Protein: ${Number(remainingProtein) || 0} g
Carbs: ${Number(remainingCarbs) || 0} g
Fat: ${Number(remainingFat) || 0} g

Meal context:
${mealType}

IMPORTANT:

1. Suggest THREE different realistic food or drink options.
2. Suggestions MUST match the user's goal.
3. Suggestions should generally be small or moderate portions rather than trying to consume all remaining daily calories at once.
4. For weight loss, small options such as kahwa, green tea, black coffee, fruit, boiled egg, yogurt, cucumber, soup, etc. are appropriate.
5. For weight gain, calorie-dense nutritious options such as banana shake, dates with milk, peanut butter toast, eggs, nuts, yogurt, etc. are appropriate.
6. For maintenance, provide balanced options.
7. Prefer foods commonly available in Pakistan.
8. Do not recommend unsafe crash diets, starvation, extreme calorie restriction or excessive eating.
9. Nutrition numbers should be reasonable estimates for the suggested serving.
10. Each suggestion must be something the user could realistically eat or drink as their next snack/meal.
11. Do not make every suggestion a full dinner.
12. Keep descriptions short.

Return ONLY valid JSON.

Use exactly this structure:

{
  "suggestions": [
    {
      "foodName": "Black Coffee",
      "description": "A light, low-calorie drink suitable as a small option.",
      "calories": 5,
      "protein": 0,
      "carbs": 1,
      "fat": 0
    }
  ]
}

Return exactly 3 suggestions.
`;

    const result = await model.generateContent(prompt);

    const response = await result.response;

    let text = response.text().trim();

    // Remove markdown code fences if Gemini adds them
    text = text
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();

    const parsed = JSON.parse(text);

    const suggestions = Array.isArray(parsed)
      ? parsed
      : parsed.suggestions;

    if (!Array.isArray(suggestions) || suggestions.length === 0) {
      throw new Error('AI returned no meal suggestions');
    }

    res.json({
      success: true,
      data: suggestions.slice(0, 3),
    });

  } catch (error) {
    console.error('Meal suggestion error:', error);

    const isAuthError =
      error.message?.includes('401') ||
      error.message?.includes('ACCESS_TOKEN_TYPE_UNSUPPORTED');

    const isQuotaError =
      error.message?.includes('429') ||
      error.message?.includes('quota') ||
      error.message?.includes('Too Many Requests');

    const status = isQuotaError
      ? 429
      : isAuthError
        ? 503
        : 500;

    res.status(status).json({
      error: isAuthError
        ? 'AI authentication failed. Replace GEMINI_API_KEY with a valid Google AI Studio API key.'
        : isQuotaError
          ? 'AI request limit reached. Wait for the Google AI Studio quota to reset or enable billing.'
          : 'Failed to generate a meal suggestion',
    });
  }
});


export default router;