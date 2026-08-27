const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini Client with your API key from .env
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

/**
 * Helper function to safely strip Markdown backticks and parse JSON
 */
const parseAiJsonResponse = (rawText) => {
  const cleanedText = rawText
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .trim();
  return JSON.parse(cleanedText);
};

/**
 * 1. Analyze Food Description input (e.g. "2 boiled eggs and avocado toast")
 * Endpoint: POST /api/ai/analyze-food
 */
exports.analyzeFood = async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ 
        success: false, 
        message: 'Food description prompt is required.' 
      });
    }

    const aiPrompt = `
      Analyze the following food item or meal description: "${prompt}".
      Estimate its nutritional facts.

      Return ONLY a JSON object in this exact schema without markdown, backticks, or extra text:
      {
        "foodName": "Food Name Here",
        "calories": number,
        "protein": number,
        "carbs": number,
        "fat": number
      }
    `;

    const result = await model.generateContent(aiPrompt);
    const responseText = result.response.text();
    const parsedData = parseAiJsonResponse(responseText);

    return res.status(200).json({
      success: true,
      data: parsedData
    });

  } catch (error) {
    console.error('Error in analyzeFood:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to analyze food description. Please try again.'
    });
  }
};

/**
 * 2. Suggest Next Foods based on remaining daily macros
 * Endpoint: POST /api/ai/suggest-meal
 */
exports.suggestMeal = async (req, res) => {
  try {
    const { remainingCalories, remainingProtein, remainingCarbs, remainingFat } = req.body;

    const aiPrompt = `
      The user has the following remaining daily nutrition targets:
      - Calories: ${remainingCalories || 500} kcal
      - Protein: ${remainingProtein || 30}g
      - Carbs: ${remainingCarbs || 50}g
      - Fat: ${remainingFat || 15}g

      Suggest 3 to 4 quick, practical, and common food options the user can eat next right now (e.g. Banana Shake, Grilled Chicken Breast, Milk & Oats, Boiled Eggs, Greek Yogurt, Peanut Butter Toast).

      Return ONLY a valid JSON array of objects without markdown, backticks, or extra text:
      [
        {
          "foodName": "Banana Protein Shake",
          "calories": 250,
          "protein": 20,
          "carbs": 35,
          "fat": 4
        },
        {
          "foodName": "Grilled Chicken Breast",
          "calories": 220,
          "protein": 38,
          "carbs": 0,
          "fat": 5
        },
        {
          "foodName": "Milk & Oats",
          "calories": 280,
          "protein": 12,
          "carbs": 45,
          "fat": 6
        }
      ]
    `;

    const result = await model.generateContent(aiPrompt);
    const responseText = result.response.text();
    const suggestions = parseAiJsonResponse(responseText);

    return res.status(200).json({
      success: true,
      data: suggestions
    });

  } catch (error) {
    console.error('Error in suggestMeal:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate food suggestions. Please try again.'
    });
  }
};