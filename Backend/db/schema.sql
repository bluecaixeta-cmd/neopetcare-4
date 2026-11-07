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