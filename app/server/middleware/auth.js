// Authentication middleware - ensures user is logged in
export function requireAuth(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.status(401).json({ error: 'Authentication required' });
}

// Optional auth - attaches user if present but doesn't require it
export function optionalAuth(req, res, next) {
    // User is automatically attached by passport if session exists
    next();
}
