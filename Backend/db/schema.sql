CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(254) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sessions (
    id BIGSERIAL PRIMARY KEY,
    token_hash TEXT UNIQUE NOT NULL,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS newsletter (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(254) UNIQUE NOT NULL,
    subscribed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS adoptions (
    id BIGSERIAL PRIMARY KEY,
    pet_name VARCHAR(100) NOT NULL,
    pet_type VARCHAR(50) NOT NULL DEFAULT 'Não informado',
    adopter_name VARCHAR(100) NOT NULL,
    adopter_email VARCHAR(254) NOT NULL,
    adopter_phone VARCHAR(30),
    adopter_city VARCHAR(100),
    message TEXT NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'recebido',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reports (
    id BIGSERIAL PRIMARY KEY,
    report_type VARCHAR(20) NOT NULL
        CHECK (report_type IN ('perdido', 'encontrado')),
    pet_name VARCHAR(100) NOT NULL,
    animal_type VARCHAR(50) NOT NULL,
    location VARCHAR(150) NOT NULL,
    event_date DATE,
    description TEXT NOT NULL,
    contact VARCHAR(254),
    photo TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS partners (
    id BIGSERIAL PRIMARY KEY,
    organization VARCHAR(150) NOT NULL,
    partner_type VARCHAR(100) NOT NULL,
    phone VARCHAR(30) NOT NULL,
    location VARCHAR(150) NOT NULL,
    contact_email VARCHAR(254),
    description TEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'em-analise',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reports_created_at
ON reports(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_partners_created_at
ON partners(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_adoptions_created_at
ON adoptions(created_at DESC);

CREATE TABLE IF NOT EXISTS pets (
    id BIGSERIAL PRIMARY KEY,

    user_id BIGINT
        REFERENCES users(id)
        ON DELETE SET NULL,

    name VARCHAR(100) NOT NULL,
    species VARCHAR(50) NOT NULL,
    breed VARCHAR(100),
    color VARCHAR(100),
    sex VARCHAR(30),
    age VARCHAR(50),
    size VARCHAR(30),
    weight VARCHAR(30),

    identification VARCHAR(150),
    location VARCHAR(150) NOT NULL,

    vaccination VARCHAR(150),
    deworming VARCHAR(150),
    neutering VARCHAR(150),
    microchip VARCHAR(150),

    special_needs TEXT,

    lives_with_dogs VARCHAR(100),
    lives_with_cats VARCHAR(100),
    lives_with_children VARCHAR(100),

    temperament TEXT,
    guardian TEXT,
    story TEXT NOT NULL,

    photo TEXT,

    adoption_status VARCHAR(30)
        NOT NULL
        DEFAULT 'disponivel'
        CHECK (
            adoption_status IN (
                'disponivel',
                'tratamento',
                'lar-temporario',
                'adotado'
            )
        ),

    created_at TIMESTAMPTZ
        NOT NULL
        DEFAULT NOW(),

    updated_at TIMESTAMPTZ
        NOT NULL
        DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pets_created_at
ON pets(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_pets_species
ON pets(species);

CREATE INDEX IF NOT EXISTS idx_pets_adoption_status
ON pets(adoption_status);

/* =========================================================
   DETALHES DE ACHADOS E PERDIDOS
========================================================= */

ALTER TABLE reports
ADD COLUMN IF NOT EXISTS breed VARCHAR(100);

ALTER TABLE reports
ADD COLUMN IF NOT EXISTS color VARCHAR(100);

ALTER TABLE reports
ADD COLUMN IF NOT EXISTS sex VARCHAR(30);

ALTER TABLE reports
ADD COLUMN IF NOT EXISTS age VARCHAR(50);

ALTER TABLE reports
ADD COLUMN IF NOT EXISTS size VARCHAR(30);

ALTER TABLE reports
ADD COLUMN IF NOT EXISTS identification VARCHAR(150);

ALTER TABLE reports
ADD COLUMN IF NOT EXISTS microchip VARCHAR(100);

ALTER TABLE reports
ADD COLUMN IF NOT EXISTS neutering VARCHAR(100);

ALTER TABLE reports
ADD COLUMN IF NOT EXISTS distinctive_features TEXT;

CREATE INDEX IF NOT EXISTS idx_reports_animal_type
ON reports(animal_type);

/* =========================================================
   MODERACAO DE IMAGENS - FASE 1
========================================================= */

/* ---------------------------------------------------------
   PETS
--------------------------------------------------------- */

ALTER TABLE pets
ADD COLUMN IF NOT EXISTS image_status VARCHAR(20);

ALTER TABLE pets
ADD COLUMN IF NOT EXISTS image_moderation_reason VARCHAR(150);

/*
 * Registros que ja existiam antes da moderacao
 * permanecem aprovados.
 */
UPDATE pets
SET image_status = 'approved'
WHERE image_status IS NULL;

ALTER TABLE pets
ALTER COLUMN image_status
SET DEFAULT 'pending';

ALTER TABLE pets
ALTER COLUMN image_status
SET NOT NULL;


/* ---------------------------------------------------------
   ACHADOS E PERDIDOS
--------------------------------------------------------- */

ALTER TABLE reports
ADD COLUMN IF NOT EXISTS image_status VARCHAR(20);

ALTER TABLE reports
ADD COLUMN IF NOT EXISTS image_moderation_reason VARCHAR(150);

/*
 * Registros que ja existiam antes da moderacao
 * permanecem aprovados.
 */
UPDATE reports
SET image_status = 'approved'
WHERE image_status IS NULL;

ALTER TABLE reports
ALTER COLUMN image_status
SET DEFAULT 'pending';

ALTER TABLE reports
ALTER COLUMN image_status
SET NOT NULL;


/* ---------------------------------------------------------
   INDICES
--------------------------------------------------------- */

CREATE INDEX IF NOT EXISTS idx_pets_image_status
ON pets(image_status);

CREATE INDEX IF NOT EXISTS idx_reports_image_status
ON reports(image_status);

/* =========================================================
   VALIDAR ESTADOS DE MODERACAO
========================================================= */

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'pets_image_status_check'
          AND conrelid = 'pets'::regclass
    ) THEN
        ALTER TABLE pets
        ADD CONSTRAINT pets_image_status_check
        CHECK (
            image_status IN (
                'pending',
                'approved',
                'review',
                'blocked'
            )
        );
    END IF;
END
$$;


DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'reports_image_status_check'
          AND conrelid = 'reports'::regclass
    ) THEN
        ALTER TABLE reports
        ADD CONSTRAINT reports_image_status_check
        CHECK (
            image_status IN (
                'pending',
                'approved',
                'review',
                'blocked'
            )
        );
    END IF;
END
$$;

/* =========================================================
   FUNCAO ADMINISTRATIVA DOS USUARIOS
========================================================= */

ALTER TABLE users
ADD COLUMN IF NOT EXISTS role VARCHAR(20);

/*
 * Usuarios que ja existiam antes desta alteracao
 * permanecem como usuarios comuns.
 */
UPDATE users
SET role = 'user'
WHERE role IS NULL;

ALTER TABLE users
ALTER COLUMN role
SET DEFAULT 'user';

ALTER TABLE users
ALTER COLUMN role
SET NOT NULL;


/* =========================================================
   VALIDAR FUNCOES PERMITIDAS
========================================================= */

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'users_role_check'
          AND conrelid = 'users'::regclass
    ) THEN
        ALTER TABLE users
        ADD CONSTRAINT users_role_check
        CHECK (
            role IN (
                'user',
                'admin'
            )
        );
    END IF;
END
$$;

/* =========================================================
   USUARIO RESPONSAVEL POR ACHADOS E PERDIDOS
========================================================= */

ALTER TABLE reports
ADD COLUMN IF NOT EXISTS user_id BIGINT;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'reports_user_id_fkey'
          AND conrelid = 'reports'::regclass
    ) THEN
        ALTER TABLE reports
        ADD CONSTRAINT reports_user_id_fkey
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE SET NULL;
    END IF;
END
$$;

CREATE INDEX IF NOT EXISTS idx_reports_user_id
ON reports(user_id);

/* =========================================================
   STATUS DAS OCORRENCIAS
========================================================= */

ALTER TABLE reports
ADD COLUMN IF NOT EXISTS publication_status VARCHAR(20);

UPDATE reports
SET publication_status = 'active'
WHERE publication_status IS NULL;

ALTER TABLE reports
ALTER COLUMN publication_status
SET DEFAULT 'active';

ALTER TABLE reports
ALTER COLUMN publication_status
SET NOT NULL;


DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'reports_publication_status_check'
          AND conrelid = 'reports'::regclass
    ) THEN
        ALTER TABLE reports
        ADD CONSTRAINT reports_publication_status_check
        CHECK (
            publication_status IN (
                'active',
                'resolved'
            )
        );
    END IF;
END
$$;


CREATE INDEX IF NOT EXISTS idx_reports_publication_status
ON reports(publication_status);

/* =========================================================
   STATUS DAS OCORRENCIAS
========================================================= */

ALTER TABLE reports
ADD COLUMN IF NOT EXISTS publication_status VARCHAR(20);

UPDATE reports
SET publication_status = 'active'
WHERE publication_status IS NULL;

ALTER TABLE reports
ALTER COLUMN publication_status
SET DEFAULT 'active';

ALTER TABLE reports
ALTER COLUMN publication_status
SET NOT NULL;


/* =========================================================
   VALIDAR STATUS DAS OCORRENCIAS
========================================================= */

DO $$
BEGIN
    IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'reports_publication_status_check'
      AND conrelid = 'reports'::regclass
) THEN
        ALTER TABLE reports
        ADD CONSTRAINT reports_publication_status_check
        CHECK (
            publication_status IN (
                'active',
                'resolved'
            )
        );
    END IF;
END
$$;


/* =========================================================
   INDICE DO STATUS
========================================================= */

CREATE INDEX IF NOT EXISTS idx_reports_publication_status
ON reports(publication_status);

/* =========================================================
   WIKIPET - ARTIGOS DA COMUNIDADE
========================================================= */

CREATE TABLE IF NOT EXISTS wiki_articles (
    id BIGSERIAL PRIMARY KEY,

    user_id BIGINT NOT NULL
        REFERENCES users(id)
        ON DELETE CASCADE,

    title VARCHAR(120) NOT NULL,

    category VARCHAR(30) NOT NULL,

    summary VARCHAR(500) NOT NULL,

    content TEXT NOT NULL,

    publication_status VARCHAR(20)
        NOT NULL
        DEFAULT 'active',

    created_at TIMESTAMPTZ
        NOT NULL
        DEFAULT NOW(),

    updated_at TIMESTAMPTZ
        NOT NULL
        DEFAULT NOW(),

    CONSTRAINT wiki_articles_category_check
        CHECK (
            category IN (
                'saude',
                'cuidados',
                'adocao'
            )
        ),

    CONSTRAINT wiki_articles_publication_status_check
        CHECK (
            publication_status IN (
                'active',
                'archived'
            )
        )
);

CREATE INDEX IF NOT EXISTS idx_wiki_articles_user_id
ON wiki_articles(user_id);

CREATE INDEX IF NOT EXISTS idx_wiki_articles_category
ON wiki_articles(category);

CREATE INDEX IF NOT EXISTS idx_wiki_articles_publication_status
ON wiki_articles(publication_status);

CREATE INDEX IF NOT EXISTS idx_wiki_articles_created_at
ON wiki_articles(created_at DESC);