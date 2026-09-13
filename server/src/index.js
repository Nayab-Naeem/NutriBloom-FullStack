import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import aiRoutes from './routes/ai.js';

dotenv.config();

const app = express();

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:4173',
  'https://nutri-bloom-full-stack.vercel.app',
  process.env.CLIENT_URL,
]
  .filter(Boolean)
  .map((url) => url.replace(/\/$/, ''));

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);

      const normalized = origin.replace(/\/$/, '');
      const isAllowed =
        allowedOrigins.includes(normalized) ||
        normalized.endsWith('.vercel.app') ||
        normalized.endsWith('.replit.dev') ||
        normalized.endsWith('.replit.app');

      return callback(null, isAllowed);
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json());

app.get('/', (_req, res) => {
  res.json({
    ok: true,
    service: 'nutribloom-api',
    routes: [
      'GET /health',
      'POST /api/nutrition-targets',
      'POST /api/estimate-calories',
      'POST /api/ai/suggest-meal',
    ],
  });
});

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'nutribloom-api' });
});

app.use('/api', aiRoutes);

app.use((req, res) => {
  res.status(404).json({
    error: `No route for ${req.method} ${req.path}`,
  });
});

const PORT = Number(process.env.PORT) || 5000;

// 0.0.0.0 is required on Replit so the public URL can reach Express
app.listen(PORT, '0.0.0.0', () => {
  console.log(`NutriBloom API running on 0.0.0.0:${PORT}`);
});
