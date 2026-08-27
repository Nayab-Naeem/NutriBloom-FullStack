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
      mealType = 'dinner',
    } = req.body;

    if (!genAI) {
      return res.status(503).json({
        error: 'AI service is not configured. Add a valid GEMINI_API_KEY to server/.env.',
      });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-3.6-flash' });
    const prompt = `You are a nutrition expert. Suggest three different healthy Pakistani ${mealType} options that fit these remaining daily targets:
Calories: ${Number(remainingCalories) || 0} kcal
Protein: ${Number(remainingProtein) || 0} g
Carbs: ${Number(remainingCarbs) || 0} g
Fat: ${Number(remainingFat) || 0} g

Respond with ONLY a valid JSON object in this exact format:
  {"suggestions":[{"foodName":"meal name","description":"short description","calories":number,"protein":number,"carbs":number,"fat":number}]}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text().trim();
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();

    const parsed = JSON.parse(text);
    const suggestions = Array.isArray(parsed) ? parsed : parsed.suggestions;

    if (!Array.isArray(suggestions) || suggestions.length === 0) {
      throw new Error('AI returned no meal suggestions');
    }

    res.json({ success: true, data: suggestions });
  } catch (error) {
    console.error('Meal suggestion error:', error);
    const isAuthError = error.message?.includes('401') ||
      error.message?.includes('ACCESS_TOKEN_TYPE_UNSUPPORTED');
    const isQuotaError = error.message?.includes('429') ||
      error.message?.includes('quota') ||
      error.message?.includes('Too Many Requests');
    const status = isQuotaError ? 429 : 500;

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