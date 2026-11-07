import { Router } from 'express';
import { pool } from '../database.js';

import {
  cleanText,
  createPasswordHash,
  createSessionToken,
  hashToken,
  passwordMatches,
  publicUser,
  validEmail
} from '../security.js';

const router = Router();

function sessionCookieOptions() {
  const production = process.env.NODE_ENV === 'production';

  return {
    httpOnly: true,
    secure: production,
    sameSite: production ? 'none' : 'lax',
    maxAge: 24 * 60 * 60 * 1000,
    path: '/'
  };
}

/*
 * CADASTRO
 * POST /api/auth/signup
 */
router.post('/signup', async (req, res, next) => {
  try {
    const name = cleanText(req.body.name, 100);

    const email = cleanText(
      req.body.email,
      254
    ).toLowerCase();

    const password =
      typeof req.body.password === 'string'
        ? req.body.password
        : '';

    if (
      name.length < 2 ||
      !validEmail(email) ||
      password.length < 8 ||
      password.length > 128
    ) {
      return res.status(400).json({
        error:
          'Informe nome, e-mail válido e senha de 8 a 128 caracteres.'
      });
    }

    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rowCount > 0) {
      return res.status(409).json({
        error: 'Este e-mail já está cadastrado.'
      });
    }

    const passwordHash =
      await createPasswordHash(password);

    const result = await pool.query(
      `INSERT INTO users
         (name, email, password_hash)
       VALUES
         ($1, $2, $3)
       RETURNING id, name, email`,
      [
        name,
        email,
        passwordHash
      ]
    );

    const user = result.rows[0];

    const token = createSessionToken();

    await pool.query(
      `INSERT INTO sessions
         (token_hash, user_id, expires_at)
       VALUES
         ($1, $2, NOW() + INTERVAL '24 hours')`,
      [
        hashToken(token),
        user.id
      ]
    );

    res.cookie(
      'sid',
      token,
      sessionCookieOptions()
    );

    return res.status(201).json({
      user: publicUser(user)
    });

  } catch (error) {
    next(error);
  }
});


/*
 * LOGIN
 * POST /api/auth/login
 */
router.post('/login', async (req, res, next) => {
  try {
    const email = cleanText(
      req.body.email,
      254
    ).toLowerCase();

    const password =
      typeof req.body.password === 'string'
        ? req.body.password
        : '';

    const result = await pool.query(
      `SELECT
         id,
         name,
         email,
         password_hash
       FROM users
       WHERE email = $1`,
      [email]
    );

    const user = result.rows[0];

    if (
      !user ||
      !(await passwordMatches(
        password,
        user.password_hash
      ))
    ) {
      return res.status(401).json({
        error: 'E-mail ou senha inválidos.'
      });
    }

    const token = createSessionToken();

    await pool.query(
      `INSERT INTO sessions
         (token_hash, user_id, expires_at)
       VALUES
         ($1, $2, NOW() + INTERVAL '24 hours')`,
      [
        hashToken(token),
        user.id
      ]
    );

    res.cookie(
      'sid',
      token,
      sessionCookieOptions()
    );

    return res.json({
      user: publicUser(user)
    });

  } catch (error) {
    next(error);
  }
});


/*
 * LOGOUT
 * POST /api/auth/logout
 */
router.post('/logout', async (req, res, next) => {
  try {
    const token = req.cookies?.sid;

    if (token) {
      await pool.query(
        `DELETE FROM sessions
         WHERE token_hash = $1`,
        [hashToken(token)]
      );
    }

    res.clearCookie(
      'sid',
      sessionCookieOptions()
    );

    return res.json({
      ok: true
    });

  } catch (error) {
    next(error);
  }
});

export default router;