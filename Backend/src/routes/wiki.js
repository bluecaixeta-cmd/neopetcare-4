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
   LISTAR ARTIGOS PUBLICOS
   GET /api/wiki
========================================================= */

router.get(
  '/',
  async (req, res, next) => {
    try {
      const result =
        await pool.query(
          `SELECT
             wiki_articles.id,

             wiki_articles.user_id
               AS "userId",

             wiki_articles.title,
             wiki_articles.category,
             wiki_articles.summary,
             wiki_articles.content,

             wiki_articles.publication_status
               AS "publicationStatus",

             wiki_articles.created_at
               AS "createdAt",

             wiki_articles.updated_at
               AS "updatedAt",

             users.name
               AS "authorName"

           FROM wiki_articles

           INNER JOIN users
             ON users.id =
                wiki_articles.user_id

           WHERE
             wiki_articles.publication_status =
             'active'

           ORDER BY
             wiki_articles.created_at DESC`
        );

      return res.json({
        articles:
          result.rows
      });

    } catch (error) {
      next(error);
    }
  }
);


/* =========================================================
   PUBLICAR ARTIGO
   POST /api/wiki
========================================================= */

router.post(
  '/',
  async (req, res, next) => {
    try {
      const user =
        await getAuthenticatedUser(req);

      if (!user) {
        return res
          .status(401)
          .json({
            error:
              'Faça login para publicar na WikiPet.'
          });
      }

      const article = {
        title:
          cleanText(
            req.body.title,
            120
          ),

        category:
          cleanText(
            req.body.category,
            30
          ),

        summary:
          cleanText(
            req.body.summary,
            500
          ),

        content:
          cleanText(
            req.body.content,
            10000
          )
      };


      /* =====================================================
         CAMPOS OBRIGATORIOS
      ===================================================== */

      if (
        !article.title ||
        !article.category ||
        !article.summary ||
        !article.content
      ) {
        return res
          .status(400)
          .json({
            error:
              'Preencha título, categoria, resumo e conteúdo.'
          });
      }


      /* =====================================================
         CATEGORIAS PERMITIDAS
      ===================================================== */

      const allowedCategories = [
        'saude',
        'cuidados',
        'adocao'
      ];

      if (
        !allowedCategories.includes(
          article.category
        )
      ) {
        return res
          .status(400)
          .json({
            error:
              'Categoria da WikiPet inválida.'
          });
      }


      /* =====================================================
         SALVAR NO POSTGRESQL
      ===================================================== */

      const result =
        await pool.query(
          `INSERT INTO wiki_articles
           (
             user_id,
             title,
             category,
             summary,
             content,
             publication_status
           )
           VALUES
           (
             $1,
             $2,
             $3,
             $4,
             $5,
             'active'
           )
           RETURNING
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
               AS "updatedAt"`,
          [
            user.id,
            article.title,
            article.category,
            article.summary,
            article.content
          ]
        );

      const createdArticle =
        result.rows[0];

      return res
        .status(201)
        .json({
          article: {
            ...createdArticle,

            authorName:
              user.name
          },

          message:
            'Artigo publicado na WikiPet com sucesso.'
        });

    } catch (error) {
      next(error);
    }
  }
);

/* =========================================================
   EDITAR MEU ARTIGO
   PATCH /api/wiki/:id
========================================================= */

router.patch(
  '/:id',
  async (req, res, next) => {
    try {
      const user =
        await getAuthenticatedUser(req);

      if (!user) {
        return res
          .status(401)
          .json({
            error:
              'Faça login para editar este artigo.'
          });
      }

      const articleId =
        Number(
          req.params.id
        );

      if (
        !Number.isSafeInteger(articleId) ||
        articleId <= 0
      ) {
        return res
          .status(400)
          .json({
            error:
              'Identificador do artigo inválido.'
          });
      }

      const article = {
        title:
          cleanText(
            req.body.title,
            120
          ),

        category:
          cleanText(
            req.body.category,
            30
          ),

        summary:
          cleanText(
            req.body.summary,
            500
          ),

        content:
          cleanText(
            req.body.content,
            10000
          )
      };

      if (
        !article.title ||
        !article.category ||
        !article.summary ||
        !article.content
      ) {
        return res
          .status(400)
          .json({
            error:
              'Preencha título, categoria, resumo e conteúdo.'
          });
      }

      const allowedCategories = [
        'saude',
        'cuidados',
        'adocao'
      ];

      if (
        !allowedCategories.includes(
          article.category
        )
      ) {
        return res
          .status(400)
          .json({
            error:
              'Categoria da WikiPet inválida.'
          });
      }

      const result =
        await pool.query(
          `UPDATE wiki_articles
           SET
             title = $1,
             category = $2,
             summary = $3,
             content = $4,
             updated_at = NOW()

           WHERE id = $5
             AND user_id = $6

           RETURNING
             id,
             user_id AS "userId",
             title,
             category,
             summary,
             content,
             publication_status
               AS "publicationStatus",
             created_at
               AS "createdAt",
             updated_at
               AS "updatedAt"`,
          [
            article.title,
            article.category,
            article.summary,
            article.content,
            articleId,
            user.id
          ]
        );

      if (!result.rows[0]) {
        return res
          .status(404)
          .json({
            error:
              'Artigo não encontrado ou publicação sem autorização.'
          });
      }

      return res.json({
        article: {
          ...result.rows[0],

          authorName:
            user.name
        },

        message:
          'Artigo atualizado com sucesso.'
      });

    } catch (error) {
      next(error);
    }
  }
);

/* =========================================================
   ARQUIVAR MEU ARTIGO
   PATCH /api/wiki/:id/status
========================================================= */

router.patch(
  '/:id/status',
  async (req, res, next) => {
    try {
      const user =
        await getAuthenticatedUser(req);

      if (!user) {
        return res
          .status(401)
          .json({
            error:
              'Faça login para arquivar este artigo.'
          });
      }

      const articleId =
        Number(
          req.params.id
        );

      if (
        !Number.isSafeInteger(articleId) ||
        articleId <= 0
      ) {
        return res
          .status(400)
          .json({
            error:
              'Identificador do artigo inválido.'
          });
      }

      const result =
        await pool.query(
          `UPDATE wiki_articles
           SET
             publication_status = 'archived',
             updated_at = NOW()
           WHERE id = $1
             AND user_id = $2
           RETURNING
             id,
             user_id AS "userId",
             title,
             category,
             summary,
             content,
             publication_status
               AS "publicationStatus",
             created_at
               AS "createdAt",
             updated_at
               AS "updatedAt"`,
          [
            articleId,
            user.id
          ]
        );

      if (!result.rows[0]) {
        return res
          .status(404)
          .json({
            error:
              'Artigo não encontrado ou publicação sem autorização.'
          });
      }

      return res.json({
        article:
          result.rows[0],

        message:
          'Artigo arquivado com sucesso.'
      });

    } catch (error) {
      next(error);
    }
  }
);

/* =========================================================
   EXCLUIR MEU ARTIGO
   DELETE /api/wiki/:id
========================================================= */

router.delete(
  '/:id',
  async (req, res, next) => {
    try {
      const user =
        await getAuthenticatedUser(req);

      if (!user) {
        return res
          .status(401)
          .json({
            error:
              'Faça login para excluir este artigo.'
          });
      }

      const articleId =
        Number(
          req.params.id
        );

      if (
        !Number.isSafeInteger(articleId) ||
        articleId <= 0
      ) {
        return res
          .status(400)
          .json({
            error:
              'Identificador do artigo inválido.'
          });
      }

      const result =
        await pool.query(
          `DELETE FROM wiki_articles
           WHERE id = $1
             AND user_id = $2
           RETURNING
             id,
             title`,
          [
            articleId,
            user.id
          ]
        );

      if (!result.rows[0]) {
        return res
          .status(404)
          .json({
            error:
              'Artigo não encontrado ou publicação sem autorização.'
          });
      }

      return res.json({
        article:
          result.rows[0],

        message:
          'Artigo excluído com sucesso.'
      });

    } catch (error) {
      next(error);
    }
  }
);

export default router;