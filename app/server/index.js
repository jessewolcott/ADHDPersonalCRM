import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import session from 'express-session';
import SqliteStore from 'better-sqlite3-session-store';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

import db, { initializeDatabase } from './db/database.js';
import passport, { configurePassport } from './config/passport.js';
import { requireAuth } from './middleware/auth.js';

import authRoutes from './routes/auth.js';
import contactsRoutes from './routes/contacts.js';
import relationshipsRoutes from './routes/relationships.js';
import journalRoutes from './routes/journal.js';
import businessRoutes from './routes/business.js';
import fieldsRoutes from './routes/fields.js';
import searchRoutes from './routes/search.js';
import dataRoutes from './routes/data.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

// Initialize database
initializeDatabase();

// Configure session store
const SQLiteStore = SqliteStore(session);
const sessionStore = new SQLiteStore({
    client: db,
    expired: {
        clear: true,
        intervalMs: 900000 // 15 minutes
    }
});

// Middleware
app.use(cors({
    origin: process.env.NODE_ENV === 'production' ? process.env.BASE_URL : 'http://localhost:5173',
    credentials: true
}));
app.use(express.json());
app.use(session({
    store: sessionStore,
    secret: process.env.SESSION_SECRET || 'dev-secret-change-me',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        sameSite: 'lax'
    }
}));

// Initialize Passport
configurePassport();
app.use(passport.initialize());
app.use(passport.session());

// Auth routes (not protected)
app.use('/auth', authRoutes);

// API routes (protected)
app.use('/api/me', requireAuth, (req, res) => {
    const { id, email, display_name, avatar_url, provider } = req.user;
    res.json({ id, email, displayName: display_name, avatarUrl: avatar_url, provider });
});
app.use('/api/contacts', requireAuth, contactsRoutes);
app.use('/api/relationships', requireAuth, relationshipsRoutes);
app.use('/api/journal', requireAuth, journalRoutes);
app.use('/api/business', requireAuth, businessRoutes);
app.use('/api/fields', requireAuth, fieldsRoutes);
app.use('/api/search', requireAuth, searchRoutes);
app.use('/api/data', requireAuth, dataRoutes);

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(join(__dirname, '../dist')));
    app.get('*', (req, res) => {
        res.sendFile(join(__dirname, '../dist/index.html'));
    });
}

// Error handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
