/**
 * streamRoutes.js
 * SSE (Server-Sent Events) endpoint — /api/stream
 *
 * Members  connect with: /api/stream?role=member&token=<JWT>
 * Owners   connect with: /api/stream?role=owner&token=<JWT>
 *
 * EventSource cannot set custom headers, so the JWT is passed as a query param.
 * We verify it here directly via jsonwebtoken.
 */

const express = require('express');
const router  = express.Router();
const jwt     = require('jsonwebtoken');
const Member  = require('../models/Member');
const {
    addMemberClient,
    removeMemberClient,
    addOwnerClient,
    removeOwnerClient,
    getStats
} = require('../utils/sseManager');

// ── Token verification helper ────────────────────────────────────────────────
function verifyToken(token) {
    try {
        return jwt.verify(token, process.env.JWT_SECRET);
    } catch {
        return null;
    }
}

// ── GET /api/stream ──────────────────────────────────────────────────────────
router.get('/stream', (req, res) => {
    const { token, role } = req.query;

    if (!token) {
        return res.status(401).json({ message: 'Missing token' });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
        return res.status(401).json({ message: 'Invalid or expired token' });
    }

    // Determine ID and client maps based on role
    const isMember = role === 'member';
    const userId   = decoded.id || decoded._id;

    if (!userId) {
        return res.status(401).json({ message: 'Invalid token payload' });
    }

    // ── Set SSE headers ──────────────────────────────────────────────────────
    res.setHeader('Content-Type',  'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection',    'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering
    res.flushHeaders();

    // ── Register this connection ─────────────────────────────────────────────
    // For members: resolve gymId once at connect time so sseManager can maintain
    // the gym-scoped map (gymClients) without a DB query per broadcast event.
    if (isMember) {
        // Fire-and-forget lookup — if it fails we still register the connection
        // without a gymId (sendToGym simply won't reach this client).
        Member.findById(userId).select('gym').lean()
            .then(member => {
                const gymId = member?.gym ? String(member.gym) : '';
                addMemberClient(userId, gymId, res);
            })
            .catch(() => {
                addMemberClient(userId, '', res);
            });
    } else {
        addOwnerClient(userId, res);
    }

    // ── Send initial "connected" event so frontend knows it's live ───────────
    res.write(`event: connected\ndata: ${JSON.stringify({ status: 'ok', userId })}\n\n`);

    // ── Heartbeat every 25s — keeps connection alive through proxies/load balancers ──
    const heartbeat = setInterval(() => {
        try {
            res.write(':ping\n\n');
        } catch {
            clearInterval(heartbeat);
        }
    }, 25000);

    // ── Cleanup on disconnect ─────────────────────────────────────────────────
    // removeMemberClient also cleans up gymClients via res._sseGymId set by addMemberClient.
    req.on('close', () => {
        clearInterval(heartbeat);
        if (isMember) {
            removeMemberClient(userId, res);
        } else {
            removeOwnerClient(userId, res);
        }
    });
});

// ── GET /api/stream/stats  (internal diagnostics) ───────────────────────────
router.get('/stream/stats', (req, res) => {
    res.json(getStats());
});

module.exports = router;
