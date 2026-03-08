const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../utils/cloudinary');

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'gym_saas',
        allowed_formats: ['jpg', 'jpeg', 'png'],
        transformation: [{ width: 400, height: 400, crop: 'fill', quality: 'auto', fetch_format: 'auto' }]
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 2 * 1024 * 1024, // 2MB
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only images are allowed (jpg, jpeg, png)'), false);
        }
    }
});

module.exports = upload;
