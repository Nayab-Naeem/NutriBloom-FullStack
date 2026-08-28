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

exports.suggestMeal = async (req, res) => {
  try {
    const { remainingCalories } = req.body;
    const maxCal = Math.max(100, Number(remainingCalories) || 500);

    const aiPrompt = `
      The user needs quick everyday food suggestions to complete their remaining ${maxCal} kcal goal for today.

      Suggest 4 simple, everyday foods (like Paratha, Eggs, Milk, Banana Shake, Dates, Toast, Rice with Daal).

      STRICT RULES:
      1. Keep food names short and natural (e.g. "1 Paratha", "2 Boiled Eggs", "1 Glass of Milk", "Banana Shake").
      2. Each item's calories MUST BE LESS THAN OR EQUAL TO ${maxCal} kcal.

      Return ONLY a JSON array without markdown or extra text:
      [
        { "foodName": "1 Paratha", "calories": 280, "protein": 6, "carbs": 32, "fat": 14 },
        { "foodName": "2 Boiled Eggs", "calories": 140, "protein": 12, "carbs": 1, "fat": 10 },
        { "foodName": "1 Glass of Milk", "calories": 150, "protein": 8, "carbs": 12, "fat": 8 },
        { "foodName": "Banana Shake", "calories": 220, "protein": 8, "carbs": 35, "fat": 5 }
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
      message: 'Failed to generate suggestions.'
    });
  }
};