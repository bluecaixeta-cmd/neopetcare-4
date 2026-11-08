import { Router } from 'express';

import { pool } from '../database.js';

import {
  cleanText,
  hashToken
} from '../security.js';


const router = Router();


/* =========================================================
   IDENTIFICAR ADMINISTRADOR
========================================================= */

async function getAuthenticatedAdmin(req) {
  const token =
    req.cookies?.sid;

  if (!token) {
    return null;
  }

  const result =
    await pool.query(
      `SELECT
         users.id,
         users.name,
         users.email,
         users.role
       FROM sessions
       INNER JOIN users
         ON users.id = sessions.user_id
       WHERE sessions.token_hash = $1
         AND sessions.expires_at > NOW()
         AND users.role = 'admin'
       LIMIT 1`,
      [
        hashToken(token)
      ]
    );

  return result.rows[0] || null;
}


/* =========================================================
   PROTEGER TODAS AS ROTAS DE MODERACAO
========================================================= */

router.use(
  async (req, res, next) => {
    try {
      const admin =
        await getAuthenticatedAdmin(req);

      if (!admin) {
        return res
          .status(403)
          .json({
            error:
              'Acesso restrito à moderação.'
          });
      }

      req.admin = admin;

      next();

    } catch (error) {
      next(error);
    }
  }
);


/* =========================================================
   LISTAR FILA DE MODERACAO

   GET /api/moderation/images
========================================================= */

router.get(
  '/images',
  async (req, res, next) => {
    try {
      const requestedStatus =
        cleanText(
          req.query.status,
          20
        ) || 'pending';

      const requestedType =
        cleanText(
          req.query.type,
          20
        ) || 'all';


      const allowedStatuses = [
        'pending',
        'approved',
        'review',
        'blocked'
      ];


      const allowedTypes = [
        'all',
        'pet',
        'report'
      ];


      if (
        !allowedStatuses.includes(
          requestedStatus
        )
      ) {
        return res
          .status(400)
          .json({
            error:
              'Status de moderação inválido.'
          });
      }


      if (
        !allowedTypes.includes(
          requestedType
        )
      ) {
        return res
          .status(400)
          .json({
            error:
              'Tipo de publicação inválido.'
          });
      }


      const items = [];


      /* =====================================================
         PETS
      ===================================================== */

      if (
        requestedType === 'all' ||
        requestedType === 'pet'
      ) {
        const petsResult =
          await pool.query(
            `SELECT
               pets.id,

               'pet' AS "entityType",

               pets.name,

               pets.species
                 AS "animalType",

               pets.location,

               pets.photo,

               pets.image_status
                 AS "imageStatus",

               pets.image_moderation_reason
                 AS "imageModerationReason",

               pets.created_at
                 AS "createdAt",

               users.id
                 AS "userId",

               users.name
                 AS "userName",

               users.email
                 AS "userEmail"

             FROM pets

             LEFT JOIN users
               ON users.id = pets.user_id

             WHERE pets.image_status = $1

             ORDER BY pets.created_at ASC`,
            [
              requestedStatus
            ]
          );


        items.push(
          ...petsResult.rows
        );
      }


      /* =====================================================
         ACHADOS E PERDIDOS
      ===================================================== */

      if (
        requestedType === 'all' ||
        requestedType === 'report'
      ) {
        const reportsResult =
          await pool.query(
            `SELECT
               reports.id,

               'report' AS "entityType",

               reports.pet_name
                 AS name,

               reports.animal_type
                 AS "animalType",

               reports.location,

               reports.photo,

               reports.image_status
                 AS "imageStatus",

               reports.image_moderation_reason
                 AS "imageModerationReason",

               reports.created_at
                 AS "createdAt",

               NULL::BIGINT
                 AS "userId",

               NULL::VARCHAR
                 AS "userName",

               reports.contact
                 AS "userEmail"

             FROM reports

             WHERE reports.image_status = $1

             ORDER BY reports.created_at ASC`,
            [
              requestedStatus
            ]
          );


        items.push(
          ...reportsResult.rows
        );
      }


      /* =====================================================
         ORDENAR FILA
      ===================================================== */

      items.sort(
        (firstItem, secondItem) => {
          const firstDate =
            new Date(
              firstItem.createdAt
            ).getTime();

          const secondDate =
            new Date(
              secondItem.createdAt
            ).getTime();

          return (
            firstDate -
            secondDate
          );
        }
      );


      return res.json({
        status:
          requestedStatus,

        type:
          requestedType,

        items
      });

    } catch (error) {
      next(error);
    }
  }
);


/* =========================================================
   ALTERAR STATUS DA IMAGEM

   PATCH /api/moderation/images/:entityType/:id
========================================================= */

router.patch(
  '/images/:entityType/:id',
  async (req, res, next) => {
    try {
      const entityType =
        cleanText(
          req.params.entityType,
          20
        );


      const entityId =
        Number(
          req.params.id
        );


      const imageStatus =
        cleanText(
          req.body.status,
          20
        );


      const reason =
        cleanText(
          req.body.reason,
          150
        );


      const allowedTypes = [
        'pet',
        'report'
      ];


      const allowedStatuses = [
        'approved',
        'review',
        'blocked'
      ];


      /* =====================================================
         VALIDAR TIPO
      ===================================================== */

      if (
        !allowedTypes.includes(
          entityType
        )
      ) {
        return res
          .status(400)
          .json({
            error:
              'Tipo de publicação inválido.'
          });
      }


      /* =====================================================
         VALIDAR ID
      ===================================================== */

      if (
        !Number.isSafeInteger(
          entityId
        ) ||
        entityId <= 0
      ) {
        return res
          .status(400)
          .json({
            error:
              'Identificador inválido.'
          });
      }


      /* =====================================================
         VALIDAR DECISAO
      ===================================================== */

      if (
        !allowedStatuses.includes(
          imageStatus
        )
      ) {
        return res
          .status(400)
          .json({
            error:
              'A decisão de moderação é inválida.'
          });
      }


      /* =====================================================
         MOTIVO OBRIGATORIO PARA BLOQUEIO/REVISAO
      ===================================================== */

      if (
        imageStatus !== 'approved' &&
        !reason
      ) {
        return res
          .status(400)
          .json({
            error:
              'Informe o motivo da decisão.'
          });
      }


      /* =====================================================
         DEFINIR TABELA
      ===================================================== */

      const tableName =
        entityType === 'pet'
          ? 'pets'
          : 'reports';


      /* =====================================================
         ATUALIZAR PUBLICACAO
      ===================================================== */

      const result =
        await pool.query(
          `UPDATE ${tableName}

           SET
             image_status = $1,
             image_moderation_reason = $2

           WHERE id = $3

           RETURNING
             id,

             image_status
               AS "imageStatus",

             image_moderation_reason
               AS "imageModerationReason"`,
          [
            imageStatus,
            reason || null,
            entityId
          ]
        );


      if (!result.rows[0]) {
        return res
          .status(404)
          .json({
            error:
              'Publicação não encontrada.'
          });
      }


      return res.json({
        item: {
          entityType,
          ...result.rows[0]
        },

        message:
          imageStatus === 'approved'
            ? 'Imagem aprovada com sucesso.'
            : imageStatus === 'blocked'
              ? 'Imagem bloqueada.'
              : 'Imagem encaminhada para revisão.'
      });

    } catch (error) {
      next(error);
    }
  }
);


export default router;