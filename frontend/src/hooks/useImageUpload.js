import { useState, useEffect } from "react";
import imageCompression from "browser-image-compression";

export const useImageUpload = () => {
    const [showCropModal, setShowCropModal] = useState(false);
    const [cropImageFile, setCropImageFile] = useState(null);
    const [finalFile, setFinalFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [isCompressing, setIsCompressing] = useState(false);

    // Cleanup preview URL
    useEffect(() => {
        return () => {
            if (previewUrl) URL.revokeObjectURL(previewUrl);
        };
    }, [previewUrl]);

    const handleFileSelect = (file) => {
        if (!file) return;

        // File type check
        if (!file.type.startsWith("image/")) {
            alert("Please upload a valid image");
            return;
        }

        // 10MB guard
        if (file.size > 10 * 1024 * 1024) {
            alert("Image must be under 10MB");
            return;
        }

        setCropImageFile(file);
        setShowCropModal(true);
    };

    const handleCropComplete = async (croppedBlob) => {
        try {
            setIsCompressing(true);

            const croppedFile = new File([croppedBlob], "cropped.jpg", {
                type: "image/jpeg",
            });

            let processedFile;

            try {
                processedFile = await imageCompression(croppedFile, {
                    maxSizeMB: 0.5,
                    maxWidthOrHeight: 1024,
                    useWebWorker: true,
                    exifOrientation: true,
                });
            } catch {
                processedFile = croppedFile;
            }

            // Clean old preview BEFORE setting new
            if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
            }

            const url = URL.createObjectURL(processedFile);

            setFinalFile(processedFile);
            setPreviewUrl(url);
            setShowCropModal(false);
        } catch (err) {
            console.error("Image processing failed:", err);
            alert("Failed to process image");
        } finally {
            setIsCompressing(false);
            setCropImageFile(null);
        }
    };

    const closeCropModal = () => {
        setShowCropModal(false);
        setCropImageFile(null);
    };

    const resetUpload = () => {
        setFinalFile(null);
        setPreviewUrl(null);
    };
    
    // Sometimes we need to pre-fill previewUrl (like edit mode)
    const setInitialPreview = (url) => {
        setPreviewUrl(url);
        setFinalFile(null);
    };

    return {
        showCropModal,
        cropImageFile,
        previewUrl,
        finalFile,
        isCompressing,
        handleFileSelect,
        handleCropComplete,
        closeCropModal,
        resetUpload,
        setInitialPreview
    };
};
