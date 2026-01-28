import { Router } from 'express';
import passport from 'passport';
import { registerLocalUser } from '../config/passport.js';

const router = Router();

// Get current user
router.get('/me', (req, res) => {
    if (req.isAuthenticated()) {
        const { id, email, display_name, avatar_url, provider } = req.user;
        res.json({ id, email, displayName: display_name, avatarUrl: avatar_url, provider });
    } else {
        res.json(null);
    }
});

// Get available auth providers
router.get('/providers', (req, res) => {
    const providers = ['local']; // Local auth is always available
    if (process.env.GOOGLE_CLIENT_ID) providers.push('google');
    if (process.env.MICROSOFT_CLIENT_ID) providers.push('microsoft');
    if (process.env.GITHUB_CLIENT_ID) providers.push('github');
    res.json(providers);
});

// Local registration
router.post('/register', async (req, res) => {
    const { email, password, displayName } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    if (password.length < 8) {
        return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    try {
        const user = await registerLocalUser(email, password, displayName);
        req.login(user, (err) => {
            if (err) {
                return res.status(500).json({ error: 'Login failed after registration' });
            }
            const { id, email, display_name, avatar_url, provider } = user;
            res.status(201).json({ id, email, displayName: display_name, avatarUrl: avatar_url, provider });
        });
    } catch (err) {
        if (err.message === 'Email already registered') {
            return res.status(409).json({ error: err.message });
        }
        console.error('Registration error:', err);
        res.status(500).json({ error: 'Registration failed' });
    }
});

// Local login
router.post('/login', (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
        if (err) {
            return res.status(500).json({ error: 'Authentication error' });
        }
        if (!user) {
            return res.status(401).json({ error: info?.message || 'Invalid credentials' });
        }
        req.login(user, (err) => {
            if (err) {
                return res.status(500).json({ error: 'Login failed' });
            }
            const { id, email, display_name, avatar_url, provider } = user;
            res.json({ id, email, displayName: display_name, avatarUrl: avatar_url, provider });
        });
    })(req, res, next);
});

// Google OAuth
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/google/callback',
    passport.authenticate('google', { failureRedirect: '/login?error=google' }),
    (req, res) => res.redirect('/')
);

// Microsoft OAuth
router.get('/microsoft', passport.authenticate('microsoft', { scope: ['user.read'] }));
router.get('/microsoft/callback',
    passport.authenticate('microsoft', { failureRedirect: '/login?error=microsoft' }),
    (req, res) => res.redirect('/')
);

// GitHub OAuth
router.get('/github', passport.authenticate('github', { scope: ['user:email'] }));
router.get('/github/callback',
    passport.authenticate('github', { failureRedirect: '/login?error=github' }),
    (req, res) => res.redirect('/')
);

// Logout
router.get('/logout', (req, res, next) => {
    req.logout((err) => {
        if (err) return next(err);
        res.redirect('/login');
    });
});

export default router;
