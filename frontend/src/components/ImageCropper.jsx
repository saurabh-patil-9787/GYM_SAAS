import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import getCroppedImg from '../utils/cropImage';
import { X, Check } from 'lucide-react';

const ImageCropper = ({ imageFile, onCancel, onCropComplete }) => {
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);

    // Create object URL from File
    // We strictly use memoized version via state/effect instead of raw to avoid memory leaks, 
    // but for simplicity inline URL generation is common if strictly cleaned up.
    const [imageSrc, setImageSrc] = useState(null);

    React.useEffect(() => {
        if (!imageFile) return;
        const objectUrl = URL.createObjectURL(imageFile);
        setImageSrc(objectUrl);
        return () => URL.revokeObjectURL(objectUrl);
    }, [imageFile]);

    const onCropCompleteHandler = useCallback((croppedArea, croppedAreaPixels) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const handleSave = async () => {
        if (!imageSrc || !croppedAreaPixels) return;

        try {
            setIsProcessing(true);
            const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
            
            await onCropComplete(croppedBlob);
        } catch (e) {
            console.error('Error cropping image:', e);
        } finally {
            setIsProcessing(false);
        }
    };

    if (!imageSrc) return null;

    return (
        <div className="fixed inset-0 z-[100] flex flex-col bg-gray-900/95 backdrop-blur-sm">
            {/* Header */}
            <div className="flex justify-between items-center p-4 border-b border-gray-800 bg-gray-900 shadow-sm">
                <h3 className="text-white font-medium text-lg">Crop Photo</h3>
                <button
                    onClick={onCancel}
                    className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-full transition-colors"
                >
                    <X size={24} />
                </button>
            </div>

            {/* Cropper Container */}
            <div className="relative flex-1 w-full bg-black/50">
                <Cropper
                    image={imageSrc}
                    crop={crop}
                    zoom={zoom}
                    aspect={1} // Enforces 1:1 aspect ratio
                    onCropChange={setCrop}
                    onCropComplete={onCropCompleteHandler}
                    onZoomChange={setZoom}
                    cropShape="rect" // Or "round" if requested, but requirement says square (logo/photo)
                    showGrid={true}
                />
            </div>

            {/* Controls & Footer */}
            <div className="p-6 bg-gray-900 border-t border-gray-800">
                <div className="max-w-md mx-auto flex flex-col gap-6">
                    {/* Zoom slider */}
                    <div className="flex items-center gap-4">
                        <span className="text-gray-400 text-sm">Zoom</span>
                        <input
                            type="range"
                            value={zoom}
                            min={1}
                            max={3}
                            step={0.1}
                            aria-labelledby="Zoom"
                            onChange={(e) => setZoom(e.target.value)}
                            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-4">
                        <button
                            onClick={onCancel}
                            disabled={isProcessing}
                            className="flex-1 py-3 px-4 rounded-xl font-medium border border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white transition-colors disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={isProcessing}
                            className="flex-1 py-3 px-4 rounded-xl font-medium bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isProcessing ? (
                                <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    <Check size={20} />
                                    <span>Save Photo</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ImageCropper;
