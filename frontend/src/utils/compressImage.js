import imageCompression from 'browser-image-compression';

/**
 * Automatically compresses an image strictly for file size and dimensions.
 * Retains high perceived quality for avatars/logos.
 * @param {File} imageFile - The original image file from the input
 * @returns {Promise<File>} - A resolved promise containing the compressed File object, or the original if compressing failed
 */
export const compressImage = async (imageFile) => {
    // Basic validation for image formats we officially support
    const acceptedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!acceptedTypes.includes(imageFile.type)) {
        throw new Error('Only JPG, JPEG, or PNG images are allowed');
    }

    const options = {
        maxSizeMB: 1, // Max file size in MB
        maxWidthOrHeight: 1024, // Max width or height in pixels
        useWebWorker: true, // Use a separate thread to prevent UI freezing
        fileType: imageFile.type, // Preserve original type (e.g., png transparency)
    };

    try {
        const compressedBlob = await imageCompression(imageFile, options);
        // Rename and convert the compressed Blob seamlessly back into a File object so downstream (FormData/Cropper) don't break
        return new File([compressedBlob], imageFile.name, {
            type: compressedBlob.type,
            lastModified: Date.now()
        });
    } catch (error) {
        console.error('Image compression error:', error);
        // Fallback to original if compression catastrophically fails so the user isn't completely blocked
        return imageFile;
    }
};
