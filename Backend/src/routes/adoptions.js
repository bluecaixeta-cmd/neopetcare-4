import { Router } from 'express';
import { pool } from '../database.js';
import { cleanText, validEmail } from '../security.js';

const router = Router();

router.post('/', async (req, res, next) => {
  try {
    const adoption = {
      petName: cleanText(req.body.pet, 100),
      petType: cleanText(
        req.body.petType || 'Não informado',
        50
      ),
      adopterName: cleanText(req.body.name, 100),
      adopterEmail: cleanText(
        req.body.email,
        254
      ).toLowerCase(),
      adopterPhone: cleanText(req.body.phone, 30),
      adopterCity: cleanText(req.body.city, 100),
      message: cleanText(req.body.message, 1500)
    };

    if (
      !adoption.petName ||
      !adoption.adopterName ||
      !validEmail(adoption.adopterEmail) ||
      !adoption.message
    ) {
      return res.status(400).json({
        error: 'Preencha pet, nome, e-mail e mensagem.'
      });
    }

    const result = await pool.query(
      `INSERT INTO adoptions
       (
         pet_name,
         pet_type,
         adopter_name,
         adopter_email,
         adopter_phone,
         adopter_city,
         message
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING
         id,
         pet_name AS "petName",
         status,
         created_at AS "createdAt"`,
      [
        adoption.petName,
        adoption.petType,
        adoption.adopterName,
        adoption.adopterEmail,
        adoption.adopterPhone || null,
        adoption.adopterCity || null,
        adoption.message
      ]
    );

    return res.status(201).json({
      adoption: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
});

export default router;