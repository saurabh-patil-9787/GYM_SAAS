const multer = require('multer');

// Separate multer config for product images
// Higher size limit than profile photos since product images need more quality
const uploadProduct = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB backend limit (frontend compresses to ~150KB)
    },
    fileFilter: (req, file, cb) => {
        const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (allowedMimes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Only JPEG, PNG, and WebP images are allowed for products'), false);
        }
    }
});

module.exports = uploadProduct;
