const express = require('express');
const router = express.Router();
const { protect, requireActivePlan } = require('../middleware/authMiddleware');
const {
    getInvoiceSettings,
    updateInvoiceSettings,
    createInvoice,
    getRecentInvoices,
    getInvoiceById,
    getMemberInvoices
} = require('../controllers/invoiceController');

// All owner routes require authentication + active subscription plan
const ownerGuard = [protect, requireActivePlan];

// Invoice Settings
router.get('/settings',  ...ownerGuard, getInvoiceSettings);
router.put('/settings',  ...ownerGuard, updateInvoiceSettings);

// Invoice list & creation
// NOTE: /recent MUST be before /:id — otherwise "recent" is treated as an :id param
router.get('/recent',               ...ownerGuard, getRecentInvoices);
router.post('/',                    ...ownerGuard, createInvoice);
router.get('/member/:memberId',     ...ownerGuard, getMemberInvoices);
router.get('/:id',                  ...ownerGuard, getInvoiceById);

module.exports = router;
