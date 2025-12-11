import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

import { authRouter } from './routes/auth.routes';
import { swaggerRouter } from './routes/swagger.routes';
import { profileRouter } from './routes/profile.routes';
import { discoverRouter } from './routes/discover.routes';


dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// CORS настройки
const corsOptions = {
  origin: process.env.CORS_ORIGIN || '*', // В production укажите конкретные домены
  credentials: true,
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.use(express.json());

// Trust proxy для правильной работы за nginx
app.set('trust proxy', 1);

// Swagger documentation
app.use('/api/docs', swaggerRouter);

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/profile', profileRouter);
app.use('/api/discover', discoverRouter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

