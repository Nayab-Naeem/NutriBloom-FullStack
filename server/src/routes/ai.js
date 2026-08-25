import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

router.post('/estimate-calories', async (req, res) => {
  try {
    const { description } = req.body;

    if (!description || !description.trim()) {
      return res.status(400).json({ error: 'Food description is required' });
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
    res.status(500).json({ 
      error: 'Failed to estimate calories',
      details: error.message 
    });
  }
});

export default router;