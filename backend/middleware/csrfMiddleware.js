/**
 * CSRF Protection Middleware
 * 
 * Strategy: Custom Header Check ("Sec-Fetch-Site" + "X-Requested-With")
 * 
 * How it works:
 * - A CSRF attack works by tricking a browser into making a cross-site request
 *   using the victim's cookies. Example: an attacker's page embeds a form that
 *   auto-submits to /api/auth/refresh, sending the victim's httpOnly cookie.
 * 
 * - However, browsers CANNOT send custom HTTP headers cross-origin without CORS
 *   preflight (OPTIONS) approval. Our CORS whitelist rejects attacker origins.
 * 
 * - So: requiring X-Requested-With: XMLHttpRequest on cookie-based endpoints
 *   means only our legitimate frontend (allowed by CORS) can call them.
 * 
 * - This is a well-established pattern used by Django, Rails, Angular, etc.
 * 
 * Applied to: POST /api/auth/refresh and POST /api/auth/logout
 * These are the only endpoints that accept httpOnly cookies without a Bearer token.
 * 
 * Existing users: NOT affected. Our axios interceptor sends this header on all requests.
 */

const csrfProtect = (req, res, next) => {
    // In development, skip CSRF check to avoid disrupting local development
    if (process.env.NODE_ENV !== 'production') {
        return next();
    }

    const requestedWith = req.headers['x-requested-with'];

    if (!requestedWith || requestedWith.toLowerCase() !== 'xmlhttprequest') {
        console.warn(`[CSRF] Blocked suspicious request to ${req.path} — missing X-Requested-With header. IP: ${req.ip}`);
        return res.status(403).json({
            success: false,
            message: 'Request blocked — CSRF check failed'
        });
    }

    next();
};

module.exports = { csrfProtect };
