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
        <div className="fixed inset-0 z-[100] flex flex-col bg-slate-50/95 backdrop-blur-sm">
            {/* Header */}
            <div className="flex justify-between items-center p-4 border-b border-slate-200 bg-white shadow-sm">
                <h3 className="text-slate-800 font-medium text-lg">Crop Photo</h3>
                <button
                    onClick={onCancel}
                    className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-full transition-colors"
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
            <div className="p-6 bg-white border-t border-slate-200">
                <div className="max-w-md mx-auto flex flex-col gap-6">
                    {/* Zoom slider */}
                    <div className="flex items-center gap-4">
                        <span className="text-slate-500 text-sm">Zoom</span>
                        <input
                            type="range"
                            value={zoom}
                            min={1}
                            max={3}
                            step={0.1}
                            aria-labelledby="Zoom"
                            onChange={(e) => setZoom(e.target.value)}
                            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-4">
                        <button
                            onClick={onCancel}
                            disabled={isProcessing}
                            className="flex-1 py-3 px-4 rounded-xl font-medium border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={isProcessing}
                            className="flex-1 py-3 px-4 rounded-xl font-medium bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
