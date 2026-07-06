const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../utils/cloudinary');

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'gym_saas_videos',
        resource_type: 'video', // important for videos
        allowed_formats: ['mp4', 'mov', 'avi', 'webm'],
        // we can apply eager transformations if needed, but Cloudinary optimizes videos well.
    }
});

const uploadVideo = multer({
    storage: storage,
    limits: {
        fileSize: 50 * 1024 * 1024, // 50MB limit for short videos
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('video/')) {
            cb(null, true);
        } else {
            cb(new Error('Only videos are allowed (mp4, mov, avi, webm)'), false);
        }
    }
});

module.exports = uploadVideo;
