-- Gestor Kanri — PostgreSQL schema

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT,
    role TEXT NOT NULL DEFAULT 'user',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS dependencies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT
);

CREATE TABLE IF NOT EXISTS procedure_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    response_days INTEGER NOT NULL DEFAULT 5
);

CREATE TABLE IF NOT EXISTS procedures (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    type_id UUID REFERENCES procedure_types(id) ON DELETE SET NULL,
    dependency_id UUID REFERENCES dependencies(id) ON DELETE SET NULL,
    assigned_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    responsible_type TEXT NOT NULL DEFAULT 'internal',
    due_date TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'on_time',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    procedure_id UUID NOT NULL REFERENCES procedures(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_procedures_client ON procedures(client_id);
CREATE INDEX IF NOT EXISTS idx_procedures_assigned ON procedures(assigned_user_id);
CREATE INDEX IF NOT EXISTS idx_procedures_status ON procedures(status);
CREATE INDEX IF NOT EXISTS idx_notes_procedure ON notes(procedure_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, read);
