import React, { useState } from 'react';
import Step1BasicInfo from './steps/Step1BasicInfo';
import Step2BodyDetails from './steps/Step2BodyDetails';
import Step3PlanPayment from './steps/Step3PlanPayment';
import { compressImage } from '../../utils/compressImage';
import ImageCropper from '../ImageCropper';
import api, { getAccessToken } from '../../api/axios';

const AddMemberWizard = ({ onClose, onSuccess, onDuplicateFound }) => {
    const [currentStep, setCurrentStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [newMember, setNewMember] = useState({
        memberType: 'new',
        name: '', mobile: '', age: '', weight: '', height: '',
        city: '', planDuration: '1', totalFee: '', paidFee: '', dob: '',
        joiningDate: new Date().toISOString().split('T')[0],
        expiryDate: '',
        paymentMethod: 'Cash',
        allowDuplicateMobile: false
    });

    const [addPhotoFile, setAddPhotoFile] = useState(null);
    const [addPhotoPreview, setAddPhotoPreview] = useState(null);
    const [showCropModal, setShowCropModal] = useState(false);
    const [cropImageFile, setCropImageFile] = useState(null);

    const updateData = (fields) => setNewMember(prev => ({ ...prev, ...fields }));

    const handleNext = () => setCurrentStep(prev => Math.min(prev + 1, 3));
    const handleBack = () => setCurrentStep(prev => Math.max(prev - 1, 1));

    // Photo logic
    const handleAddPhotoChange = async (e) => {
        const file = e.target.files[0];
        if (file) {
            try {
                const compressedFile = await compressImage(file);
                if (compressedFile.size > 2 * 1024 * 1024) return alert('File size remains > 2MB after compression. Please choose a smaller file.');
                setCropImageFile(compressedFile);
                setShowCropModal(true);
            } catch (error) {
                alert(error.message || 'Failed to process image');
            } finally {
                e.target.value = '';
            }
        }
    };

    const handleCropComplete = (croppedFile) => {
        setAddPhotoFile(croppedFile);
        setAddPhotoPreview(URL.createObjectURL(croppedFile));
        setShowCropModal(false);
        setCropImageFile(null);
    };

    const handleCropCancel = () => {
        setShowCropModal(false);
        setCropImageFile(null);
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            const formData = new FormData();
            Object.keys(newMember).forEach(key => {
                if (newMember[key] !== undefined && newMember[key] !== '') {
                    formData.append(key, newMember[key]);
                }
            });
            if (addPhotoFile) formData.append('photo', addPhotoFile);

            const token = getAccessToken();
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/members`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            if (!res.ok) {
                const errorData = await res.json();
                if (res.status === 409 && errorData.isDuplicate) {
                    onDuplicateFound(errorData.existingMember);
                    setIsSubmitting(false);
                    return;
                }
                throw new Error(errorData.message || 'Failed to add member');
            }

            const responseData = await res.json();
            onSuccess(responseData.data || responseData);
        } catch (error) {
            alert(error.message || 'Failed to add member');
            setIsSubmitting(false);
        }
    };

    const progressPercent = ((currentStep) / 3) * 100;

    return (
        <div className="flex flex-col h-full bg-gray-900 rounded-b-2xl relative">
            {/* Header & Progress */}
            <div className="px-6 pt-4 pb-2 bg-gray-900 sticky top-0 z-20 border-b border-gray-800">
                <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-2">
                        {currentStep > 1 && (
                            <button onClick={handleBack} className="text-gray-400 hover:text-white p-1 -ml-2 rounded-lg transition-colors">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
                            </button>
                        )}
                        <span className="text-xs font-bold text-blue-400 tracking-widest uppercase">Step {currentStep} of 3</span>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors p-1">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-indigo-500 to-blue-500 transition-all duration-300 ease-out rounded-full" style={{ width: `${progressPercent}%` }}></div>
                </div>
            </div>

            {/* Steps Content */}
            <div className="flex-1 overflow-y-auto min-h-0 pb-28">
                {currentStep === 1 && (
                    <Step1BasicInfo data={newMember} updateData={updateData} onNext={handleNext} />
                )}
                {currentStep === 2 && (
                    <Step2BodyDetails
                        data={newMember}
                        updateData={updateData}
                        onNext={handleNext}
                        onPhotoChange={handleAddPhotoChange}
                        photoPreview={addPhotoPreview}
                        onRemovePhoto={() => { setAddPhotoFile(null); setAddPhotoPreview(null); }}
                    />
                )}
                {currentStep === 3 && (
                    <Step3PlanPayment
                        data={newMember}
                        updateData={updateData}
                        onSubmit={handleSubmit}
                        isSubmitting={isSubmitting}
                    />
                )}
            </div>

            {/* Cropper Modal Overlay */}
            {showCropModal && cropImageFile && (
                <ImageCropper
                    imageFile={cropImageFile}
                    onCropComplete={handleCropComplete}
                    onCancel={handleCropCancel}
                />
            )}
        </div>
    );
};

export default AddMemberWizard;
