import { Router } from 'express';
import { pool } from '../database.js';
import { cleanText } from '../security.js';

const router = Router();


/* =========================================================
   LISTAR ACHADOS E PERDIDOS
   GET /api/reports
========================================================= */

router.get(
  '/',
  async (req, res, next) => {
    try {
      const result =
        await pool.query(
          `SELECT
             id,

             report_type AS status,
             pet_name AS name,
             animal_type AS animal,

             breed,
             color,
             sex,
             age,
             size,

             identification,
             microchip,
             neutering,

             distinctive_features AS "distinctiveFeatures",

             location,
             event_date AS date,

             description,
contact,
photo,

image_status AS "imageStatus",

image_moderation_reason
  AS "imageModerationReason",

created_at AS "createdAt"

FROM reports

WHERE image_status = 'approved'

ORDER BY created_at DESC`
        );

      return res.json({
        reports: result.rows
      });

    } catch (error) {
      next(error);
    }
  }
);


/* =========================================================
   PUBLICAR OCORRÊNCIA
   POST /api/reports
========================================================= */

router.post(
  '/',
  async (req, res, next) => {
    try {

      /* =====================================================
         LIMPAR DADOS RECEBIDOS
      ===================================================== */

      const report = {

        status:
          cleanText(
            req.body.status,
            20
          ),

        name:
          cleanText(
            req.body.name,
            100
          ),

        animal:
          cleanText(
            req.body.animal,
            50
          ),

        breed:
          cleanText(
            req.body.breed,
            100
          ),

        color:
          cleanText(
            req.body.color,
            100
          ),

        sex:
          cleanText(
            req.body.sex,
            30
          ),

        age:
          cleanText(
            req.body.age,
            50
          ),

        size:
          cleanText(
            req.body.size,
            30
          ),

        identification:
          cleanText(
            req.body.identification,
            150
          ),

        microchip:
          cleanText(
            req.body.microchip,
            100
          ),

        neutering:
          cleanText(
            req.body.neutering,
            100
          ),

        distinctiveFeatures:
          cleanText(
            req.body.distinctiveFeatures,
            2000
          ),

        location:
          cleanText(
            req.body.location,
            150
          ),

        date:
          cleanText(
            req.body.date,
            10
          ),

        description:
          cleanText(
            req.body.description,
            2000
          ),

        contact:
          cleanText(
            req.body.contact,
            254
          ),

        photo:
          cleanText(
            req.body.photo,
            4_000_000
          )
      };

      /*
 * Foto enviada:
 * aguarda moderacao antes da publicacao.
 *
 * Sem foto:
 * pode ser publicada imediatamente.
 */
const imageStatus =
  report.photo
    ? 'pending'
    : 'approved';

      /* =====================================================
         VALIDAR TIPO DA OCORRÊNCIA
      ===================================================== */

      if (
        ![
          'perdido',
          'encontrado'
        ].includes(
          report.status
        )
      ) {
        return res
          .status(400)
          .json({
            error:
              'O tipo deve ser perdido ou encontrado.'
          });
      }


      /* =====================================================
         CAMPOS OBRIGATÓRIOS
      ===================================================== */

      if (
        !report.name ||
        !report.animal ||
        !report.location ||
        !report.description
      ) {
        return res
          .status(400)
          .json({
            error:
              'Preencha nome, animal, localização e descrição.'
          });
      }


      /* =====================================================
         SALVAR NO POSTGRESQL
      ===================================================== */

      const result =
  await pool.query(
    `INSERT INTO reports
     (
       report_type,
       pet_name,
       animal_type,

       breed,
       color,
       sex,
       age,
       size,

       identification,
       microchip,
       neutering,
       distinctive_features,

       location,
       event_date,

       description,
       contact,
       photo,
       image_status
     )

     VALUES
     (
       $1,
       $2,
       $3,
       $4,
       $5,
       $6,
       $7,
       $8,
       $9,
       $10,
       $11,
       $12,
       $13,
       NULLIF($14, '')::date,
       $15,
       $16,
       $17,
       $18
     )

     RETURNING
       id,

       report_type AS status,
       pet_name AS name,
       animal_type AS animal,

       breed,
       color,
       sex,
       age,
       size,

       identification,
       microchip,
       neutering,

       distinctive_features
         AS "distinctiveFeatures",

       location,
       event_date AS date,

       description,
       contact,
       photo,

       image_status
         AS "imageStatus",

       image_moderation_reason
         AS "imageModerationReason",

       created_at AS "createdAt"`,
    [
      report.status,
      report.name,
      report.animal,

      report.breed || null,
      report.color || null,
      report.sex || null,
      report.age || null,
      report.size || null,

      report.identification || null,
      report.microchip || null,
      report.neutering || null,

      report.distinctiveFeatures || null,

      report.location,

      report.date,

      report.description,

      report.contact || null,

      report.photo || null,

      imageStatus
    ]
  );


      /* =====================================================
         RETORNAR OCORRÊNCIA CRIADA
      ===================================================== */

      return res
        .status(201)
        .json({
          report:
            result.rows[0]
        });

    } catch (error) {
      next(error);
    }
  }
);


export default router;