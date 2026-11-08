import { Router } from 'express';

import { pool } from '../database.js';

import {
  cleanText,
  hashToken
} from '../security.js';


const router = Router();


/* =========================================================
   IDENTIFICAR USUÁRIO LOGADO
========================================================= */

async function getAuthenticatedUser(req) {
  const token = req.cookies?.sid;

  if (!token) {
    return null;
  }

  const result = await pool.query(
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
   FORMATAR ANIMAL PARA O FRONTEND
========================================================= */

function formatPet(row) {
  return {
    id: row.id,

    userId: row.user_id,

    name: row.name,
    species: row.species,
    breed: row.breed,
    color: row.color,
    sex: row.sex,
    age: row.age,
    size: row.size,
    weight: row.weight,

    identification:
      row.identification,

    location:
      row.location,

    vaccination:
      row.vaccination,

    deworming:
      row.deworming,

    neutering:
      row.neutering,

    microchip:
      row.microchip,

    specialNeeds:
      row.special_needs,

    livesWithDogs:
      row.lives_with_dogs,

    livesWithCats:
      row.lives_with_cats,

    livesWithChildren:
      row.lives_with_children,

    temperament:
      row.temperament,

    guardian:
      row.guardian,

    story:
      row.story,

    photo:
  row.photo,

imageStatus:
  row.image_status,

imageModerationReason:
  row.image_moderation_reason,

status:
  row.adoption_status,

    createdAt:
      row.created_at,

    updatedAt:
      row.updated_at
  };
}


/* =========================================================
   LISTAR ANIMAIS
   GET /api/pets
========================================================= */

router.get(
  '/',
  async (req, res, next) => {
    try {
      const result =
        await pool.query(
          `SELECT
             id,
             user_id,
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
             special_needs,
             lives_with_dogs,
             lives_with_cats,
             lives_with_children,
             temperament,
             guardian,
             story,
             photo,
image_status,
image_moderation_reason,
adoption_status,
created_at,
updated_at
FROM pets
WHERE image_status = 'approved'
ORDER BY created_at DESC`
        );

      return res.json({
        pets:
          result.rows.map(
            formatPet
          )
      });

    } catch (error) {
      next(error);
    }
  }
);


/* =========================================================
   CADASTRAR ANIMAL
   POST /api/pets
========================================================= */

router.post(
  '/',
  async (req, res, next) => {
    try {

      /*
       * Somente usuário que possui uma sessão válida
       * poderá cadastrar um novo animal.
       */
      const user =
        await getAuthenticatedUser(req);

      if (!user) {
        return res
          .status(401)
          .json({
            error:
              'Faça login para cadastrar um animal.'
          });
      }


      /* =====================================================
         LIMPAR E LIMITAR OS CAMPOS RECEBIDOS
      ===================================================== */

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

      /*
 * Foto enviada:
 * aguarda moderacao antes da publicacao.
 *
 * Sem foto:
 * pode ser publicada imediatamente.
 */
const imageStatus =
  pet.photo
    ? 'pending'
    : 'approved';

      /* =====================================================
         CAMPOS OBRIGATÓRIOS
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
         SITUAÇÕES PERMITIDAS
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
         SALVAR NO POSTGRESQL
      ===================================================== */

      const result =
        await pool.query(
          `INSERT INTO pets
           (
             user_id,
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
             special_needs,
             lives_with_dogs,
             lives_with_cats,
             lives_with_children,
             temperament,
             guardian,
             story,
             photo,
            image_status,
            adoption_status
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
             $14,
             $15,
             $16,
             $17,
             $18,
             $19,
             $20,
             $21,
             $22,
             $23,
             $24,
             $25
           )
           RETURNING
             id,
             user_id,
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
             special_needs,
             lives_with_dogs,
             lives_with_cats,
             lives_with_children,
             temperament,
             guardian,
             story,
             photo,
image_status,
image_moderation_reason,
adoption_status,
created_at,
updated_at`,
          [
            user.id,

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

imageStatus,

pet.status
          ]
        );


      /* =====================================================
         RESPOSTA AO FRONTEND
      ===================================================== */

      return res
        .status(201)
        .json({
          pet:
            formatPet(
              result.rows[0]
            )
        });

    } catch (error) {
      next(error);
    }
  }
);

export default router;