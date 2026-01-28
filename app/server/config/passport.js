import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as MicrosoftStrategy } from 'passport-microsoft';
import { Strategy as GitHubStrategy } from 'passport-github2';
import { Strategy as LocalStrategy } from 'passport-local';
import bcrypt from 'bcrypt';
import db from '../db/database.js';

// Serialize user to session
passport.serializeUser((user, done) => {
    done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser((id, done) => {
    try {
        const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
        done(null, user || null);
    } catch (err) {
        done(err, null);
    }
});

// Find or create user helper
function findOrCreateUser(provider, profile, done) {
    try {
        const email = profile.emails?.[0]?.value || `${profile.id}@${provider}.local`;
        const displayName = profile.displayName || profile.username || email.split('@')[0];
        const avatarUrl = profile.photos?.[0]?.value || null;

        // Check if user exists
        let user = db.prepare(
            'SELECT * FROM users WHERE provider = ? AND provider_id = ?'
        ).get(provider, profile.id);

        if (user) {
            // Update last login
            db.prepare(
                'UPDATE users SET last_login_at = CURRENT_TIMESTAMP, display_name = ?, avatar_url = ? WHERE id = ?'
            ).run(displayName, avatarUrl, user.id);
        } else {
            // Create new user
            const result = db.prepare(
                'INSERT INTO users (email, display_name, avatar_url, provider, provider_id) VALUES (?, ?, ?, ?, ?)'
            ).run(email, displayName, avatarUrl, provider, profile.id);

            user = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);
        }

        done(null, user);
    } catch (err) {
        done(err, null);
    }
}

// Helper to register a local user
export async function registerLocalUser(email, password, displayName) {
    // Check if email already exists
    const existing = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (existing) {
        throw new Error('Email already registered');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const result = db.prepare(
        'INSERT INTO users (email, password_hash, display_name, provider) VALUES (?, ?, ?, ?)'
    ).run(email, passwordHash, displayName || email.split('@')[0], 'local');

    return db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);
}

// Configure strategies
export function configurePassport() {
    // Local Strategy (email/password)
    passport.use(new LocalStrategy({
        usernameField: 'email',
        passwordField: 'password'
    }, async (email, password, done) => {
        try {
            const user = db.prepare(
                'SELECT * FROM users WHERE email = ? AND provider = ?'
            ).get(email, 'local');

            if (!user) {
                return done(null, false, { message: 'Invalid email or password' });
            }

            const isValid = await bcrypt.compare(password, user.password_hash);
            if (!isValid) {
                return done(null, false, { message: 'Invalid email or password' });
            }

            // Update last login
            db.prepare('UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = ?').run(user.id);

            done(null, user);
        } catch (err) {
            done(err);
        }
    }));

    // Google Strategy
    if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
        passport.use(new GoogleStrategy({
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: `${process.env.BASE_URL}/auth/google/callback`
        }, (accessToken, refreshToken, profile, done) => {
            findOrCreateUser('google', profile, done);
        }));
    }

    // Microsoft Strategy
    if (process.env.MICROSOFT_CLIENT_ID && process.env.MICROSOFT_CLIENT_SECRET) {
        passport.use(new MicrosoftStrategy({
            clientID: process.env.MICROSOFT_CLIENT_ID,
            clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
            callbackURL: `${process.env.BASE_URL}/auth/microsoft/callback`,
            scope: ['user.read']
        }, (accessToken, refreshToken, profile, done) => {
            findOrCreateUser('microsoft', profile, done);
        }));
    }

    // GitHub Strategy
    if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
        passport.use(new GitHubStrategy({
            clientID: process.env.GITHUB_CLIENT_ID,
            clientSecret: process.env.GITHUB_CLIENT_SECRET,
            callbackURL: `${process.env.BASE_URL}/auth/github/callback`
        }, (accessToken, refreshToken, profile, done) => {
            findOrCreateUser('github', profile, done);
        }));
    }

    return passport;
}

export default passport;
