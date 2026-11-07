import { Router } from 'express';
import { pool } from '../database.js';
import { cleanText } from '../security.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT
         id,
         report_type AS status,
         pet_name AS name,
         animal_type AS animal,
         location,
         event_date AS date,
         description,
         contact,
         photo,
         created_at AS "createdAt"
       FROM reports
       ORDER BY created_at DESC`
    );

    return res.json({
      reports: result.rows
    });
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const report = {
      status: cleanText(req.body.status, 20),
      name: cleanText(req.body.name, 100),
      animal: cleanText(req.body.animal, 50),
      location: cleanText(req.body.location, 150),
      date: cleanText(req.body.date, 10),
      description: cleanText(req.body.description, 2000),
      contact: cleanText(req.body.contact, 254),
      photo: cleanText(req.body.photo, 4_000_000)
    };

    if (!['perdido', 'encontrado'].includes(report.status)) {
      return res.status(400).json({
        error: 'O tipo deve ser perdido ou encontrado.'
      });
    }

    if (
      !report.name ||
      !report.animal ||
      !report.location ||
      !report.description
    ) {
      return res.status(400).json({
        error: 'Preencha nome, animal, localização e descrição.'
      });
    }

    const result = await pool.query(
      `INSERT INTO reports
       (
         report_type,
         pet_name,
         animal_type,
         location,
         event_date,
         description,
         contact,
         photo
       )
       VALUES ($1, $2, $3, $4, NULLIF($5, '')::date, $6, $7, $8)
       RETURNING
         id,
         report_type AS status,
         pet_name AS name,
         animal_type AS animal,
         location,
         event_date AS date,
         description,
         contact,
         photo,
         created_at AS "createdAt"`,
      [
        report.status,
        report.name,
        report.animal,
        report.location,
        report.date,
        report.description,
        report.contact || null,
        report.photo || null
      ]
    );

    return res.status(201).json({
      report: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
});

export default router;