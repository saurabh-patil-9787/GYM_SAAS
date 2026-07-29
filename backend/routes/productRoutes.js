const express = require('express');
const router = express.Router();
const {
    createProduct,
    getOwnerProducts,
    getOwnerProductById,
    updateProduct,
    deleteProduct,
    updateProductStatus,
    getMemberProducts,
    getMemberFeaturedProducts,
    getMemberProductById,
    getMemberGymWhatsapp
} = require('../controllers/productController');
const { protect, requireActivePlan, protectMember } = require('../middleware/authMiddleware');
const uploadProduct = require('../middleware/uploadProduct');

// ── Owner Routes (mounted at /api/products) ─────────────────────────────────
router.post('/', protect, requireActivePlan, uploadProduct.single('image'), createProduct);
router.get('/', protect, requireActivePlan, getOwnerProducts);
router.get('/:id', protect, requireActivePlan, getOwnerProductById);
router.put('/:id', protect, requireActivePlan, uploadProduct.single('image'), updateProduct);
router.delete('/:id', protect, requireActivePlan, deleteProduct);
router.patch('/:id/status', protect, requireActivePlan, updateProductStatus);

module.exports = router;
