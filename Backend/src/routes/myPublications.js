import { Router } from 'express';

import { pool } from '../database.js';

import {
  hashToken
} from '../security.js';


const router = Router();


/* =========================================================
   IDENTIFICAR USUARIO LOGADO
========================================================= */

async function getAuthenticatedUser(req) {
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
         users.email

       FROM sessions

       INNER JOIN users
         ON users.id = sessions.user_id

       WHERE sessions.token_hash = $1
         AND sessions.expires_at > NOW()

       LIMIT 1`,
      [
        hashToken(token)
      ]
    );

  return result.rows[0] || null;
}


/* =========================================================
   MINHAS PUBLICACOES

   GET /api/my-publications
========================================================= */

router.get(
  '/',
  async (req, res, next) => {
    try {
      const user =
        await getAuthenticatedUser(req);


      /* =====================================================
         EXIGIR LOGIN
      ===================================================== */

      if (!user) {
        return res
          .status(401)
          .json({
            error:
              'Faça login para visualizar suas publicações.'
          });
      }


      /* =====================================================
         MEUS ANIMAIS
      ===================================================== */

      const petsResult =
        await pool.query(
          `SELECT
             id,

             name,
             species,
             breed,
             color,
             sex,
             age,
             size,

             location,

             photo,

             image_status
               AS "imageStatus",

             image_moderation_reason
               AS "imageModerationReason",

             adoption_status
               AS status,

             created_at
               AS "createdAt",

             updated_at
               AS "updatedAt"

           FROM pets

           WHERE user_id = $1

           ORDER BY created_at DESC`,
          [
            user.id
          ]
        );


      /* =====================================================
         MINHAS OCORRENCIAS
      ===================================================== */

      const reportsResult =
        await pool.query(
          `SELECT
             id,

             report_type
               AS status,

             pet_name
               AS name,

             animal_type
               AS animal,

             breed,
             color,
             sex,
             age,
             size,

             location,

             event_date
               AS date,

             description,
             contact,

             photo,

             image_status
               AS "imageStatus",

             image_moderation_reason
               AS "imageModerationReason",

             created_at
               AS "createdAt"

           FROM reports

           WHERE user_id = $1

           ORDER BY created_at DESC`,
          [
            user.id
          ]
        );


      /* =====================================================
         RESPOSTA
      ===================================================== */

      return res.json({
        user: {
          id:
            user.id,

          name:
            user.name,

          email:
            user.email
        },

        pets:
          petsResult.rows,

        reports:
          reportsResult.rows
      });

    } catch (error) {
      next(error);
    }
  }
);


export default router;

/* =========================================================
   CARREGAR MINHAS PUBLICACOES
========================================================= */

async function loadMyPublications() {
  if (
    !myPublicationsSection ||
    !myPublicationsPetsGrid ||
    !myPublicationsReportsGrid
  ) {
    return;
  }

  if (myPublicationsLoading) {
    myPublicationsLoading.hidden = false;
  }

  if (myPublicationsError) {
    myPublicationsError.hidden = true;
  }

  if (myPublicationsPetsEmpty) {
    myPublicationsPetsEmpty.hidden = true;
  }

  if (myPublicationsReportsEmpty) {
    myPublicationsReportsEmpty.hidden = true;
  }

  try {
    const result =
      await apiRequest(
        '/api/my-publications'
      );

    const pets =
      Array.isArray(result.pets)
        ? result.pets
        : [];

    const reports =
      Array.isArray(result.reports)
        ? result.reports
        : [];


    /* =====================================================
       MOSTRAR AREA
    ===================================================== */

    myPublicationsSection.hidden = false;


    /* =====================================================
       CONTADORES
    ===================================================== */

    if (myPublicationsPetsCount) {
      myPublicationsPetsCount.textContent =
        String(pets.length);
    }

    if (myPublicationsReportsCount) {
      myPublicationsReportsCount.textContent =
        String(reports.length);
    }


    /* =====================================================
       LIMPAR GRADES
    ===================================================== */

    myPublicationsPetsGrid.innerHTML = '';

    myPublicationsReportsGrid.innerHTML = '';


    /* =====================================================
       ANIMAIS
    ===================================================== */

    pets.forEach(
      (pet) => {
        renderMyPetPublication(pet);
      }
    );


    /* =====================================================
       OCORRENCIAS
    ===================================================== */

    reports.forEach(
      (report) => {
        renderMyReportPublication(report);
      }
    );


    /* =====================================================
       ESTADOS VAZIOS
    ===================================================== */

    if (
      myPublicationsPetsEmpty
    ) {
      myPublicationsPetsEmpty.hidden =
        pets.length > 0;
    }

    if (
      myPublicationsReportsEmpty
    ) {
      myPublicationsReportsEmpty.hidden =
        reports.length > 0;
    }

  } catch (error) {
    console.error(
      'Erro ao carregar minhas publicações:',
      error
    );


    /*
     * Se não houver sessão válida,
     * a área continua escondida.
     */
    if (
      error.message &&
      (
        error.message.includes('login') ||
        error.message.includes('401')
      )
    ) {
      myPublicationsSection.hidden = true;

      return;
    }


    if (myPublicationsError) {
      myPublicationsError.textContent =
        error.message ||
        'Não foi possível carregar suas publicações.';

      myPublicationsError.hidden = false;
    }

  } finally {
    if (myPublicationsLoading) {
      myPublicationsLoading.hidden = true;
    }
  }
}