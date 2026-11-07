import cors from 'cors';
import cookieParser from 'cookie-parser';
import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

import { checkDatabase } from './database.js';
import authRoutes from './routes/auth.js';
import newsletterRoutes from './routes/newsletter.js';
import adoptionRoutes from './routes/adoptions.js';
import reportRoutes from './routes/reports.js';
import partnerRoutes from './routes/partners.js';

const app = express();

const allowedOrigins = String(process.env.FRONTEND_URL || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.set('trust proxy', 1);

app.use(
  helmet({
    crossOriginResourcePolicy: {
      policy: 'cross-origin'
    }
  })
);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error('Origem não autorizada.'));
    },
    credentials: true
  })
);

app.use(
  rateLimit({
    windowMs: 60 * 1000,
    limit: 120,
    standardHeaders: true,
    legacyHeaders: false
  })
);

app.use(express.json({ limit: '4mb' }));
app.use(cookieParser());

app.get('/api/health', async (req, res, next) => {
  try {
    const database = await checkDatabase();

    res.json({
      ok: true,
      database: true,
      time: database.current_time
    });
  } catch (error) {
    next(error);
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/newsletter', newsletterRoutes);
app.use('/api/adoptions', adoptionRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/partners', partnerRoutes);

app.use('/api', (req, res) => {
  res.status(404).json({
    error: 'Rota da API não encontrada.'
  });
});

app.use((error, req, res, next) => {
  console.error(error);

  if (error.message === 'Origem não autorizada.') {
    return res.status(403).json({
      error: 'Origem não autorizada.'
    });
  }

  return res.status(500).json({
    error: 'Erro interno do servidor.'
  });
});

export default app;