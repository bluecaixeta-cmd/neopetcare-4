import { Router } from 'express';
import { pool } from '../database.js';
import { cleanText } from '../security.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT
         id,
         organization,
         partner_type AS "partnerType",
         phone,
         location,
         contact_email AS email,
         description,
         status,
         created_at AS "createdAt"
       FROM partners
       ORDER BY created_at DESC`
    );

    return res.json({
      partners: result.rows
    });
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const partner = {
      organization: cleanText(req.body.organization, 150),
      partnerType: cleanText(req.body.partnerType, 100),
      phone: cleanText(req.body.phone, 30),
      location: cleanText(req.body.location, 150),
      email: cleanText(req.body.email, 254).toLowerCase(),
      description: cleanText(req.body.description, 2000)
    };

    if (
      !partner.organization ||
      !partner.partnerType ||
      !partner.phone ||
      !partner.location
    ) {
      return res.status(400).json({
        error:
          'Preencha organização, tipo, telefone e localização.'
      });
    }

    const result = await pool.query(
      `INSERT INTO partners
       (
         organization,
         partner_type,
         phone,
         location,
         contact_email,
         description
       )
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING
         id,
         organization,
         partner_type AS "partnerType",
         phone,
         location,
         contact_email AS email,
         description,
         status,
         created_at AS "createdAt"`,
      [
        partner.organization,
        partner.partnerType,
        partner.phone,
        partner.location,
        partner.email || null,
        partner.description || null
      ]
    );

    return res.status(201).json({
      partner: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
});

export default router;