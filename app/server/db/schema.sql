-- Users table for multi-user support
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT,
    display_name TEXT,
    avatar_url TEXT,
    provider TEXT NOT NULL,
    provider_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_provider ON users(provider, provider_id) WHERE provider_id IS NOT NULL;

-- Sessions table for express-session
CREATE TABLE IF NOT EXISTS sessions (
    sid TEXT PRIMARY KEY,
    sess TEXT NOT NULL,
    expire INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sessions_expire ON sessions(expire);

-- Contacts table
CREATE TABLE IF NOT EXISTS contacts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    first_name TEXT NOT NULL,
    last_name TEXT,
    nickname TEXT,
    email TEXT,
    phone TEXT,
    address TEXT,
    birthday DATE,
    notes TEXT,
    avatar_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_contacts_user_id ON contacts(user_id);

-- Relationships between contacts
CREATE TABLE IF NOT EXISTS relationships (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    contact_id INTEGER NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    related_contact_id INTEGER NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    relationship_type TEXT NOT NULL,
    category TEXT DEFAULT 'personal',
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(contact_id, related_contact_id, relationship_type)
);
CREATE INDEX IF NOT EXISTS idx_relationships_contact_id ON relationships(contact_id);
CREATE INDEX IF NOT EXISTS idx_relationships_related_contact_id ON relationships(related_contact_id);

-- Business information for contacts
CREATE TABLE IF NOT EXISTS business_info (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    contact_id INTEGER NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    company TEXT,
    title TEXT,
    department TEXT,
    work_email TEXT,
    work_phone TEXT,
    linkedin TEXT,
    notes TEXT,
    is_current BOOLEAN DEFAULT 1,
    start_date DATE,
    end_date DATE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_business_info_contact_id ON business_info(contact_id);

-- Journal entries for tracking interactions
CREATE TABLE IF NOT EXISTS journal_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    contact_id INTEGER NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    title TEXT,
    content TEXT,
    date DATE DEFAULT (date('now')),
    tags TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_journal_entries_contact_id ON journal_entries(contact_id);
CREATE INDEX IF NOT EXISTS idx_journal_entries_date ON journal_entries(date);

-- Custom fields for flexible contact data
CREATE TABLE IF NOT EXISTS custom_fields (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    contact_id INTEGER NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    field_name TEXT NOT NULL,
    field_value TEXT,
    field_type TEXT DEFAULT 'text',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_custom_fields_contact_id ON custom_fields(contact_id);

-- Full-text search virtual table for contacts
CREATE VIRTUAL TABLE IF NOT EXISTS contacts_fts USING fts5(
    first_name,
    last_name,
    nickname,
    email,
    notes,
    content='contacts',
    content_rowid='id'
);

-- Triggers to keep FTS index in sync
CREATE TRIGGER IF NOT EXISTS contacts_ai AFTER INSERT ON contacts BEGIN
    INSERT INTO contacts_fts(rowid, first_name, last_name, nickname, email, notes)
    VALUES (new.id, new.first_name, new.last_name, new.nickname, new.email, new.notes);
END;

CREATE TRIGGER IF NOT EXISTS contacts_ad AFTER DELETE ON contacts BEGIN
    INSERT INTO contacts_fts(contacts_fts, rowid, first_name, last_name, nickname, email, notes)
    VALUES ('delete', old.id, old.first_name, old.last_name, old.nickname, old.email, old.notes);
END;

CREATE TRIGGER IF NOT EXISTS contacts_au AFTER UPDATE ON contacts BEGIN
    INSERT INTO contacts_fts(contacts_fts, rowid, first_name, last_name, nickname, email, notes)
    VALUES ('delete', old.id, old.first_name, old.last_name, old.nickname, old.email, old.notes);
    INSERT INTO contacts_fts(rowid, first_name, last_name, nickname, email, notes)
    VALUES (new.id, new.first_name, new.last_name, new.nickname, new.email, new.notes);
END;

-- Full-text search for journal entries
CREATE VIRTUAL TABLE IF NOT EXISTS journal_fts USING fts5(
    title,
    content,
    tags,
    content='journal_entries',
    content_rowid='id'
);

CREATE TRIGGER IF NOT EXISTS journal_ai AFTER INSERT ON journal_entries BEGIN
    INSERT INTO journal_fts(rowid, title, content, tags)
    VALUES (new.id, new.title, new.content, new.tags);
END;

CREATE TRIGGER IF NOT EXISTS journal_ad AFTER DELETE ON journal_entries BEGIN
    INSERT INTO journal_fts(journal_fts, rowid, title, content, tags)
    VALUES ('delete', old.id, old.title, old.content, old.tags);
END;

CREATE TRIGGER IF NOT EXISTS journal_au AFTER UPDATE ON journal_entries BEGIN
    INSERT INTO journal_fts(journal_fts, rowid, title, content, tags)
    VALUES ('delete', old.id, old.title, old.content, old.tags);
    INSERT INTO journal_fts(rowid, title, content, tags)
    VALUES (new.id, new.title, new.content, new.tags);
END;
