import { Router } from 'express';
import { pool } from '../database.js';
import { cleanText, validEmail } from '../security.js';

const router = Router();

router.post('/', async (req, res, next) => {
  try {
    const email = cleanText(req.body.email, 254).toLowerCase();

    if (!validEmail(email)) {
      return res.status(400).json({
        error: 'Informe um e-mail válido.'
      });
    }

    await pool.query(
      `INSERT INTO newsletter (email)
       VALUES ($1)
       ON CONFLICT (email) DO NOTHING`,
      [email]
    );

    return res.status(201).json({ ok: true });
  } catch (error) {
    next(error);
  }
});

export default router;