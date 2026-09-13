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
      // Allow server-to-server / same-origin tools with no Origin header
      if (!origin) {
        return callback(null, true);
      }

      const normalized = origin.replace(/\/$/, '');

      const isAllowed =
        allowedOrigins.includes(normalized) ||
        normalized.endsWith('.vercel.app') ||
        normalized.endsWith('.replit.dev') ||
        normalized.endsWith('.replit.app');

      // Never throw — throwing breaks preflight with missing CORS headers
      return callback(null, isAllowed);
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'nutribloom-api' });
});

app.use('/api', aiRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
