-- PostgreSQL baseline schema for local development.
-- The vector dimension must match EMBEDDING_DIMENSION in backend/.env.
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(160) NOT NULL,
    email VARCHAR(320) NOT NULL UNIQUE,
    password_hash VARCHAR(255),
    role VARCHAR(20) NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS books (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(300) NOT NULL,
    author VARCHAR(300) NOT NULL DEFAULT 'Author not confirmed',
    description TEXT NOT NULL DEFAULT '',
    genre VARCHAR(160),
    publisher VARCHAR(200),
    publication_year INTEGER,
    stock_quantity INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
    embedding_status VARCHAR(20) NOT NULL DEFAULT 'pending'
        CHECK (embedding_status IN ('pending', 'ready', 'failed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_books_title ON books(title);

CREATE TABLE IF NOT EXISTS book_embeddings (
    book_id UUID PRIMARY KEY REFERENCES books(id) ON DELETE CASCADE,
    embedded_text TEXT NOT NULL,
    embedding vector(1536) NOT NULL,
    embedding_model VARCHAR(160) NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS loans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    book_id UUID NOT NULL REFERENCES books(id),
    borrowed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    due_at TIMESTAMPTZ NOT NULL,
    returned_at TIMESTAMPTZ,
    reminder_sent_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS ix_loans_due_returned ON loans(due_at, returned_at);
CREATE INDEX IF NOT EXISTS ix_loans_user_id ON loans(user_id);
CREATE INDEX IF NOT EXISTS ix_loans_book_id ON loans(book_id);

CREATE TABLE IF NOT EXISTS faqs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    category VARCHAR(160),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS faq_embeddings (
    faq_id UUID PRIMARY KEY REFERENCES faqs(id) ON DELETE CASCADE,
    embedded_text TEXT NOT NULL,
    embedding vector(1536) NOT NULL,
    embedding_model VARCHAR(160) NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS purchase_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    book_id UUID NOT NULL REFERENCES books(id),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    amount_minor INTEGER,
    currency VARCHAR(3) NOT NULL DEFAULT 'INR',
    purchased_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    idempotency_key VARCHAR(180) UNIQUE
);
CREATE INDEX IF NOT EXISTS ix_purchase_events_purchased_at ON purchase_events(purchased_at);
CREATE INDEX IF NOT EXISTS ix_purchase_events_user_id ON purchase_events(user_id);
CREATE INDEX IF NOT EXISTS ix_purchase_events_book_id ON purchase_events(book_id);
