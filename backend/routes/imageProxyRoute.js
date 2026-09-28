const express = require('express');
const router = express.Router();
const https = require('https');
const http = require('http');
const { URL } = require('url');

/**
 * GET /api/proxy-image?url=<encoded-image-url>
 *
 * A lightweight image proxy that:
 * 1. Fetches the remote image (Cloudinary, S3, etc.) server-side
 * 2. Streams it back to the client with permissive CORS headers
 *
 * This allows the browser's canvas (used by html2canvas) to draw the image
 * without CORS taint, enabling membership card screenshot generation.
 *
 * Security:
 * - Only allows https:// and http:// URLs
 * - Only allows image content types
 * - Restricts to known CDN hostnames (Cloudinary, S3, etc.)
 * - No authentication required (images are already public CDN assets)
 */

// Allowed CDN hostnames — add more if you use different storage
const ALLOWED_HOSTS = [
    'res.cloudinary.com',
    's3.amazonaws.com',
    'storage.googleapis.com',
    'firebasestorage.googleapis.com',
    'cdn.majhigym.com',
    // Local dev
    'localhost',
    '127.0.0.1',
];

router.get('/proxy-image', (req, res) => {
    const { url } = req.query;

    if (!url) {
        return res.status(400).json({ error: 'Missing url parameter' });
    }

    let parsedUrl;
    try {
        parsedUrl = new URL(decodeURIComponent(url));
    } catch {
        return res.status(400).json({ error: 'Invalid URL' });
    }

    // Only http/https
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        return res.status(400).json({ error: 'Only http/https URLs are allowed' });
    }

    // Only allowed CDN hosts
    const hostname = parsedUrl.hostname.toLowerCase();
    const isAllowed = ALLOWED_HOSTS.some(
        (h) => hostname === h || hostname.endsWith('.' + h)
    );
    if (!isAllowed) {
        return res.status(403).json({ error: 'Host not allowed' });
    }

    // Set CORS headers so the browser can use this in a canvas
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Cache-Control', 'public, max-age=3600');

    const client = parsedUrl.protocol === 'https:' ? https : http;

    const request = client.get(parsedUrl.toString(), {
        headers: {
            'User-Agent': 'GymSaas-ImageProxy/1.0',
        },
        timeout: 10000,
    }, (proxyRes) => {
        const contentType = proxyRes.headers['content-type'] || '';

        // Only allow image responses
        if (!contentType.startsWith('image/')) {
            return res.status(400).json({ error: 'Remote resource is not an image' });
        }

        res.setHeader('Content-Type', contentType);
        if (proxyRes.headers['content-length']) {
            res.setHeader('Content-Length', proxyRes.headers['content-length']);
        }

        proxyRes.pipe(res);
    });

    request.on('error', (err) => {
        console.error('[ImageProxy] Fetch error:', err.message);
        if (!res.headersSent) {
            res.status(502).json({ error: 'Failed to fetch remote image' });
        }
    });

    request.on('timeout', () => {
        request.destroy();
        if (!res.headersSent) {
            res.status(504).json({ error: 'Remote image fetch timed out' });
        }
    });
});

module.exports = router;
