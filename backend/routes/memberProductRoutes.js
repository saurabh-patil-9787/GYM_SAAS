const express = require('express');
const router = express.Router();
const {
    getMemberProducts,
    getMemberFeaturedProducts,
    getMemberProductById,
    getMemberGymWhatsapp
} = require('../controllers/productController');
const { protectMember } = require('../middleware/authMiddleware');

// ── Member Product Routes (mounted at /api/member) ───────────────────────────
// NOTE: /products/featured must come BEFORE /products/:id to avoid param collision
router.get('/products/featured', protectMember, getMemberFeaturedProducts);
router.get('/products', protectMember, getMemberProducts);
router.get('/products/:id', protectMember, getMemberProductById);
router.get('/gym/whatsapp', protectMember, getMemberGymWhatsapp);

module.exports = router;
