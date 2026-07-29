const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const crypto = require('crypto');
const cloudinary = require('./cloudinary'); // We keep this for fallback deletions

const r2Client = new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
});

/**
 * Upload an image buffer to Cloudflare R2
 * @param {Buffer} buffer - The image buffer to upload
 * @param {String} mimeType - The MIME type of the file
 * @param {String} folder - Base folder (e.g., 'members', 'logos')
 * @param {String} gymId - The gym ID for organization
 * @returns {Promise<Object>} - The uploaded image details { url, key, provider }
 */
const uploadImage = async (buffer, mimeType, folder, gymId) => {
    // Basic extension extraction from mimetype or default to webp since frontend compression outputs it, 
    // actually browser-image-compression outputs jpeg by default unless specified. Let's use generic logic.
    let ext = 'jpg';
    if (mimeType === 'image/png') ext = 'png';
    else if (mimeType === 'image/webp') ext = 'webp';

    const uuid = crypto.randomUUID();
    const key = `${folder}/${gymId}/${uuid}.${ext}`;

    const command = new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: key,
        Body: buffer,
        ContentType: mimeType,
    });

    await r2Client.send(command);

    // Build the public URL
    const publicUrl = process.env.R2_PUBLIC_URL 
        ? `${process.env.R2_PUBLIC_URL}/${key}`
        : `https://${process.env.R2_BUCKET_NAME}.${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${key}`;

    return {
        url: publicUrl,
        key: key,
        provider: 'r2'
    };
};

/**
 * Delete an image from its respective provider
 * @param {String} key - The object key (or Cloudinary public ID)
 * @param {String} provider - 'cloudinary' or 'r2'
 */
const deleteImage = async (key, provider = 'cloudinary') => {
    if (!key) return;

    try {
        if (provider === 'cloudinary') {
            await cloudinary.uploader.destroy(key);
        } else if (provider === 'r2') {
            const command = new DeleteObjectCommand({
                Bucket: process.env.R2_BUCKET_NAME,
                Key: key,
            });
            await r2Client.send(command);
        }
    } catch (error) {
        console.error(`Error deleting image (${key}) from ${provider}:`, error);
        // We don't throw error to prevent breaking the main flow if a deletion fails
    }
};

module.exports = {
    uploadImage,
    deleteImage
};
