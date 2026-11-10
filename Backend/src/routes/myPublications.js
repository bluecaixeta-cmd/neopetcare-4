import { Router } from 'express';

import { pool } from '../database.js';

import {
  cleanText,
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

publication_status
  AS "publicationStatus",

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
   MEUS ARTIGOS DA WIKIPET
===================================================== */

const wikiResult =
  await pool.query(
    `SELECT
       id,

       user_id
         AS "userId",

       title,
       category,
       summary,
       content,

       publication_status
         AS "publicationStatus",

       created_at
         AS "createdAt",

       updated_at
         AS "updatedAt"

     FROM wiki_articles

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
          reportsResult.rows,

          wiki:
  wikiResult.rows
      });

    } catch (error) {
      next(error);
    }
  }
);

/* =========================================================
   MARCAR ANIMAL COMO ADOTADO

   PATCH /api/my-publications/pets/:id/status
========================================================= */

router.patch(
  '/pets/:id/status',
  async (req, res, next) => {
    try {
      const user =
        await getAuthenticatedUser(req);

      if (!user) {
        return res
          .status(401)
          .json({
            error:
              'Faça login para atualizar esta publicação.'
          });
      }


      const petId =
        Number(
          req.params.id
        );


      if (
        !Number.isSafeInteger(petId) ||
        petId <= 0
      ) {
        return res
          .status(400)
          .json({
            error:
              'Identificador do animal inválido.'
          });
      }


      /*
       * O user_id da sessão é usado na consulta.
       * Assim, uma pessoa não consegue alterar
       * uma publicação pertencente a outra conta.
       */
      const result =
        await pool.query(
          `UPDATE pets

           SET
             adoption_status = 'adotado',
             updated_at = NOW()

           WHERE id = $1
             AND user_id = $2

           RETURNING
             id,
             name,

             adoption_status
               AS status,

             updated_at
               AS "updatedAt"`,
          [
            petId,
            user.id
          ]
        );


      if (!result.rows[0]) {
        return res
          .status(404)
          .json({
            error:
              'Animal não encontrado ou publicação sem autorização.'
          });
      }


      return res.json({
        pet:
          result.rows[0],

        message:
          'Animal marcado como adotado.'
      });

    } catch (error) {
      next(error);
    }
  }
);

/* =========================================================
   ENCERRAR OCORRENCIA

   PATCH /api/my-publications/reports/:id/status
========================================================= */

router.patch(
  '/reports/:id/status',
  async (req, res, next) => {
    try {
      const user =
        await getAuthenticatedUser(req);

      if (!user) {
        return res
          .status(401)
          .json({
            error:
              'Faça login para atualizar esta publicação.'
          });
      }


      const reportId =
        Number(
          req.params.id
        );


      if (
        !Number.isSafeInteger(reportId) ||
        reportId <= 0
      ) {
        return res
          .status(400)
          .json({
            error:
              'Identificador da ocorrência inválido.'
          });
      }


      /*
       * A ocorrência só será atualizada se
       * pertencer ao usuário da sessão atual.
       */
      const result =
        await pool.query(
          `UPDATE reports

           SET
             publication_status = 'resolved'

           WHERE id = $1
             AND user_id = $2

           RETURNING
             id,

             pet_name
               AS name,

             report_type
               AS status,

             publication_status
               AS "publicationStatus",

             created_at
               AS "createdAt"`,
          [
            reportId,
            user.id
          ]
        );


      if (!result.rows[0]) {
        return res
          .status(404)
          .json({
            error:
              'Ocorrência não encontrada ou publicação sem autorização.'
          });
      }


      const report =
        result.rows[0];


      const resolvedMessage =
        report.status === 'perdido'
          ? 'Ocorrência encerrada como animal reencontrado.'
          : 'Ocorrência encerrada como animal entregue ao responsável.';


      return res.json({
        report,

        message:
          resolvedMessage
      });

    } catch (error) {
      next(error);
    }
  }
);

/* =========================================================
EXCLUIR MEU ANIMAL
 
DELETE /api/my-publications/pets/:id
========================================================= */
 
router.delete(
'/pets/:id',
async (req, res, next) => {
try {
const user =
await getAuthenticatedUser(req);
 
if (!user) {
return res
.status(401)
.json({
error:
'Faça login para excluir esta publicação.'
});
}
 
const petId =
Number(
req.params.id
);
 
if (
!Number.isSafeInteger(petId) ||
petId <= 0
) {
return res
.status(400)
.json({
error:
'Identificador do animal inválido.'
});
}
 
/*
* Só exclui se o animal pertencer
* ao usuário da sessão atual.
*/
const result =
  await pool.query(
    `DELETE FROM pets
     WHERE id = $1
       AND user_id = $2
     RETURNING id, name`,
    [
      petId,
      user.id
    ]
  );
 
if (!result.rows[0]) {
return res
.status(404)
.json({
error:
'Animal não encontrado ou publicação sem autorização.'
});
}
 
return res.json({
pet:
result.rows[0],
 
message:
'Publicação do animal excluída com sucesso.'
});
 
} catch (error) {
next(error);
}
}
);

/* =========================================================
   EXCLUIR MINHA OCORRENCIA

   DELETE /api/my-publications/reports/:id
========================================================= */

router.delete(
  '/reports/:id',
  async (req, res, next) => {
    try {
      const user =
        await getAuthenticatedUser(req);

      if (!user) {
        return res
          .status(401)
          .json({
            error:
              'Faça login para excluir esta publicação.'
          });
      }

      const reportId =
        Number(
          req.params.id
        );

      if (
        !Number.isSafeInteger(reportId) ||
        reportId <= 0
      ) {
        return res
          .status(400)
          .json({
            error:
              'Identificador da ocorrência inválido.'
          });
      }

      /*
       * Só exclui se a ocorrência pertencer
       * ao usuário da sessão atual.
       */
      const result =
  await pool.query(
    `DELETE FROM reports
     WHERE id = $1
       AND user_id = $2
     RETURNING
       id,
       pet_name AS name,
       report_type AS status`,
    [
      reportId,
      user.id
    ]
  );

      if (!result.rows[0]) {
        return res
          .status(404)
          .json({
            error:
              'Ocorrência não encontrada ou publicação sem autorização.'
          });
      }

      return res.json({
        report:
          result.rows[0],

        message:
          'Ocorrência excluída com sucesso.'
      });

    } catch (error) {
      next(error);
    }
  }
);

/* =========================================================
   EDITAR MINHA OCORRENCIA

   PATCH /api/my-publications/reports/:id
========================================================= */

router.patch(
  '/reports/:id',
  async (req, res, next) => {
    try {
      const user =
        await getAuthenticatedUser(req);

      if (!user) {
        return res
          .status(401)
          .json({
            error:
              'Faça login para editar esta publicação.'
          });
      }

      const reportId =
        Number(
          req.params.id
        );

      if (
        !Number.isSafeInteger(reportId) ||
        reportId <= 0
      ) {
        return res
          .status(400)
          .json({
            error:
              'Identificador da ocorrência inválido.'
          });
      }

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

      /* =====================================================
         VALIDAR TIPO
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
         CAMPOS OBRIGATORIOS
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
         ATUALIZAR NO POSTGRESQL
      ===================================================== */

      const result =
        await pool.query(
          `UPDATE reports
           SET
             report_type = $1,
             pet_name = $2,
             animal_type = $3,

             breed = $4,
             color = $5,
             sex = $6,
             age = $7,
             size = $8,

             identification = $9,
             microchip = $10,
             neutering = $11,
             distinctive_features = $12,

             location = $13,

             event_date =
               NULLIF($14, '')::date,

             description = $15,
             contact = $16,
             photo = $17,

             image_status =
               CASE
                 WHEN photo IS DISTINCT FROM $17
                 THEN
                   CASE
                     WHEN $17 IS NULL
                     THEN 'approved'
                     ELSE 'pending'
                   END
                 ELSE image_status
               END,

             image_moderation_reason =
               CASE
                 WHEN photo IS DISTINCT FROM $17
                 THEN NULL
                 ELSE image_moderation_reason
               END,

             updated_at = NOW()

           WHERE id = $18
             AND user_id = $19

           RETURNING
             id,

             user_id AS "userId",

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

             publication_status
               AS "publicationStatus",

             created_at
               AS "createdAt",

             updated_at
               AS "updatedAt"`,
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

            reportId,
            user.id
          ]
        );

      /* =====================================================
         VERIFICAR AUTORIZACAO
      ===================================================== */

      if (!result.rows[0]) {
        return res
          .status(404)
          .json({
            error:
              'Ocorrência não encontrada ou publicação sem autorização.'
          });
      }

      /* =====================================================
         RESPOSTA
      ===================================================== */

      return res.json({
        report:
          result.rows[0],

        message:
          'Ocorrência atualizada com sucesso.'
      });

    } catch (error) {
      next(error);
    }
  }
);
/* =========================================================
   EDITAR MEU ANIMAL

   PATCH /api/my-publications/pets/:id
========================================================= */

router.patch(
  '/pets/:id',
  async (req, res, next) => {
    try {
      const user =
        await getAuthenticatedUser(req);

      if (!user) {
        return res
          .status(401)
          .json({
            error:
              'Faça login para editar esta publicação.'
          });
      }

      const petId =
        Number(
          req.params.id
        );

      if (
        !Number.isSafeInteger(petId) ||
        petId <= 0
      ) {
        return res
          .status(400)
          .json({
            error:
              'Identificador do animal inválido.'
          });
      }

      const pet = {
        name:
          cleanText(
            req.body.name,
            100
          ),

        species:
          cleanText(
            req.body.species,
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

        weight:
          cleanText(
            req.body.weight,
            30
          ),

        identification:
          cleanText(
            req.body.identification,
            150
          ),

        location:
          cleanText(
            req.body.location,
            150
          ),

        vaccination:
          cleanText(
            req.body.vaccination,
            150
          ),

        deworming:
          cleanText(
            req.body.deworming,
            150
          ),

        neutering:
          cleanText(
            req.body.neutering,
            150
          ),

        microchip:
          cleanText(
            req.body.microchip,
            150
          ),

        specialNeeds:
          cleanText(
            req.body.specialNeeds,
            2000
          ),

        livesWithDogs:
          cleanText(
            req.body.livesWithDogs,
            100
          ),

        livesWithCats:
          cleanText(
            req.body.livesWithCats,
            100
          ),

        livesWithChildren:
          cleanText(
            req.body.livesWithChildren,
            100
          ),

        temperament:
          cleanText(
            req.body.temperament,
            2000
          ),

        guardian:
          cleanText(
            req.body.guardian,
            2000
          ),

        story:
          cleanText(
            req.body.story,
            5000
          ),

        photo:
          cleanText(
            req.body.photo,
            4_000_000
          ),

        status:
          cleanText(
            req.body.status,
            30
          ) || 'disponivel'
      };

      /* =====================================================
         CAMPOS OBRIGATORIOS
      ===================================================== */

      if (
        !pet.name ||
        !pet.species ||
        !pet.location ||
        !pet.story
      ) {
        return res
          .status(400)
          .json({
            error:
              'Preencha nome, espécie, localização e história do animal.'
          });
      }

      /* =====================================================
         SITUACOES PERMITIDAS
      ===================================================== */

      const allowedStatuses = [
        'disponivel',
        'tratamento',
        'lar-temporario',
        'adotado'
      ];

      if (
        !allowedStatuses.includes(
          pet.status
        )
      ) {
        return res
          .status(400)
          .json({
            error:
              'Situação de adoção inválida.'
          });
      }

      /* =====================================================
         ATUALIZAR NO POSTGRESQL
      ===================================================== */

      const result =
        await pool.query(
          `UPDATE pets
           SET
             name = $1,
             species = $2,
             breed = $3,
             color = $4,
             sex = $5,
             age = $6,
             size = $7,
             weight = $8,

             identification = $9,
             location = $10,

             vaccination = $11,
             deworming = $12,
             neutering = $13,
             microchip = $14,

             special_needs = $15,

             lives_with_dogs = $16,
             lives_with_cats = $17,
             lives_with_children = $18,

             temperament = $19,
             guardian = $20,
             story = $21,
             photo = $22,

             adoption_status = $23,

             image_status =
               CASE
                 WHEN photo IS DISTINCT FROM $22
                 THEN
                   CASE
                     WHEN $22 IS NULL
                     THEN 'approved'
                     ELSE 'pending'
                   END
                 ELSE image_status
               END,

             image_moderation_reason =
               CASE
                 WHEN photo IS DISTINCT FROM $22
                 THEN NULL
                 ELSE image_moderation_reason
               END,

             updated_at = NOW()

           WHERE id = $24
             AND user_id = $25

           RETURNING
             id,

             user_id AS "userId",

             name,
             species,
             breed,
             color,
             sex,
             age,
             size,
             weight,

             identification,
             location,

             vaccination,
             deworming,
             neutering,
             microchip,

             special_needs
               AS "specialNeeds",

             lives_with_dogs
               AS "livesWithDogs",

             lives_with_cats
               AS "livesWithCats",

             lives_with_children
               AS "livesWithChildren",

             temperament,
             guardian,
             story,
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
               AS "updatedAt"`,
          [
            pet.name,
            pet.species,

            pet.breed || null,
            pet.color || null,
            pet.sex || null,
            pet.age || null,
            pet.size || null,
            pet.weight || null,

            pet.identification || null,
            pet.location,

            pet.vaccination || null,
            pet.deworming || null,
            pet.neutering || null,
            pet.microchip || null,

            pet.specialNeeds || null,

            pet.livesWithDogs || null,
            pet.livesWithCats || null,
            pet.livesWithChildren || null,

            pet.temperament || null,
            pet.guardian || null,
            pet.story,
            pet.photo || null,

            pet.status,

            petId,
            user.id
          ]
        );

      /* =====================================================
         VERIFICAR AUTORIZACAO
      ===================================================== */

      if (!result.rows[0]) {
        return res
          .status(404)
          .json({
            error:
              'Animal não encontrado ou publicação sem autorização.'
          });
      }

      /* =====================================================
         RESPOSTA
      ===================================================== */

      return res.json({
        pet:
          result.rows[0],

        message:
          'Publicação atualizada com sucesso.'
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