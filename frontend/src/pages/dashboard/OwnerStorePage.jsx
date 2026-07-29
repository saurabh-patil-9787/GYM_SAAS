import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ShoppingBag, Plus, Edit3, Trash2, X, Check, AlertCircle,
    RefreshCw, Star, Eye, EyeOff, Package, TrendingDown, Upload,
    Image as ImageIcon, ToggleLeft, ToggleRight, ChevronDown, Search
} from 'lucide-react';
import imageCompression from 'browser-image-compression';
import Cropper from 'react-easy-crop';
import getCroppedImg from '../../utils/cropImage';
import { getOwnerProducts, createProduct, updateProduct, deleteProduct, updateProductStatus } from '../../api/productApi';
import { getAccessToken } from '../../api/axios';
import BicepCurlLoader from '../../components/BicepCurlLoader';

const CATEGORIES = ['Protein', 'Supplements', 'Nutrition', 'Accessories', 'Clothing', 'Other'];

const CATEGORY_COLORS = {
    Protein: 'bg-purple-100 text-purple-700 border-purple-200',
    Supplements: 'bg-blue-100 text-blue-700 border-blue-200',
    Nutrition: 'bg-green-100 text-green-700 border-green-200',
    Accessories: 'bg-amber-100 text-amber-700 border-amber-200',
    Clothing: 'bg-pink-100 text-pink-700 border-pink-200',
    Other: 'bg-slate-100 text-slate-700 border-slate-200',
};

// ── Image Crop Modal ──────────────────────────────────────────────────────────
const ProductImageCropper = ({ imageFile, onCancel, onCropComplete }) => {
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [imageSrc, setImageSrc] = useState(null);

    useEffect(() => {
        if (!imageFile) return;
        const url = URL.createObjectURL(imageFile);
        setImageSrc(url);
        return () => URL.revokeObjectURL(url);
    }, [imageFile]);

    const onCropCompleteHandler = useCallback((_, pixels) => setCroppedAreaPixels(pixels), []);

    const handleSave = async () => {
        if (!imageSrc || !croppedAreaPixels) return;
        try {
            setIsProcessing(true);
            const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
            // Compress after crop — 100KB max, high-res
            const compressedFile = await imageCompression(
                new File([croppedBlob], imageFile.name || 'product.jpg', { type: croppedBlob.type }),
                { maxSizeMB: 0.1, maxWidthOrHeight: 800, useWebWorker: true }
            );
            await onCropComplete(compressedFile);
        } catch (e) {
            console.error('Crop error:', e);
        } finally {
            setIsProcessing(false);
        }
    };

    if (!imageSrc) return null;

    return (
        <div className="fixed inset-0 z-[200] flex flex-col bg-slate-900/95 backdrop-blur-sm">
            <div className="flex justify-between items-center p-4 border-b border-slate-700 bg-slate-800">
                <h3 className="text-white font-semibold text-lg">Crop Product Image</h3>
                <button onClick={onCancel} className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-full transition-colors">
                    <X size={22} />
                </button>
            </div>
            <div className="relative flex-1 w-full bg-black/60">
                <Cropper
                    image={imageSrc}
                    crop={crop}
                    zoom={zoom}
                    aspect={1}
                    onCropChange={setCrop}
                    onCropComplete={onCropCompleteHandler}
                    onZoomChange={setZoom}
                    cropShape="rect"
                    showGrid={true}
                />
            </div>
            <div className="p-5 bg-slate-800 border-t border-slate-700">
                <div className="max-w-md mx-auto flex flex-col gap-4">
                    <div className="flex items-center gap-4">
                        <span className="text-slate-400 text-sm">Zoom</span>
                        <input
                            type="range" value={zoom} min={1} max={3} step={0.1}
                            onChange={(e) => setZoom(Number(e.target.value))}
                            className="w-full h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                        />
                    </div>
                    <div className="flex gap-3">
                        <button onClick={onCancel} disabled={isProcessing}
                            className="flex-1 py-3 rounded-xl font-medium border border-slate-600 text-slate-300 hover:bg-slate-700 transition-colors disabled:opacity-50">
                            Cancel
                        </button>
                        <button onClick={handleSave} disabled={isProcessing}
                            className="flex-1 py-3 rounded-xl font-semibold bg-indigo-600 text-white hover:bg-indigo-700 flex items-center justify-center gap-2 transition-all disabled:opacity-50">
                            {isProcessing ? <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <><Check size={18} /> Use Photo</>}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ── Empty State ───────────────────────────────────────────────────────────────
const EmptyState = ({ onAdd }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-20 text-center"
    >
        <div className="w-20 h-20 rounded-3xl bg-indigo-50 flex items-center justify-center mb-5 shadow-inner">
            <ShoppingBag size={36} className="text-indigo-400" strokeWidth={1.5} />
        </div>
        <h3 className="text-xl font-bold text-slate-800 mb-2">No Products Yet</h3>
        <p className="text-slate-500 text-sm mb-6 max-w-xs">Start adding gym products — supplements, accessories, apparel — for your members to browse and order.</p>
        <button onClick={onAdd}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-md transition-all active:scale-95">
            <Plus size={18} /> Add First Product
        </button>
    </motion.div>
);

// ── Product Card ──────────────────────────────────────────────────────────────
const ProductCard = ({ product, onEdit, onDelete, onStatusToggle, onStockToggle, onFeatureToggle }) => {
    const [toggling, setToggling] = useState(false);

    const handleToggle = async (field, value) => {
        setToggling(true);
        await onStatusToggle(product._id, { [field]: value });
        setToggling(false);
    };

    const discount = product.mrp && product.mrp > product.price
        ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
        : null;

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.94 }}
            className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all duration-200 ${product.isActive ? 'border-slate-200' : 'border-slate-200 opacity-60'}`}
        >
            {/* Image */}
            <div className="relative w-full aspect-square bg-slate-50 border-b border-slate-100">
                {product.image?.url ? (
                    <img src={product.image.url} alt={product.name}
                        className="w-full h-full object-contain p-2" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon size={40} className="text-slate-300" strokeWidth={1} />
                    </div>
                )}
                {/* Badges overlaid */}
                <div className="absolute top-2 left-2 flex flex-col gap-1.5">
                    {product.isFeatured && (
                        <span className="flex items-center gap-1 text-[10px] font-bold bg-amber-400 text-amber-900 px-2 py-0.5 rounded-full shadow-sm">
                            <Star size={9} fill="currentColor" /> Featured
                        </span>
                    )}
                    {discount && (
                        <span className="text-[10px] font-bold bg-emerald-500 text-white px-2 py-0.5 rounded-full shadow-sm">
                            {discount}% OFF
                        </span>
                    )}
                </div>
                <div className="absolute top-2 right-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${product.stockStatus === 'IN_STOCK' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-600 border-rose-200'}`}>
                        {product.stockStatus === 'IN_STOCK' ? 'In Stock' : 'Out of Stock'}
                    </span>
                </div>
            </div>

            {/* Info */}
            <div className="p-3">
                <div className="flex items-start justify-between gap-2 mb-1.5">
                    <h3 className="font-semibold text-slate-800 text-sm leading-snug line-clamp-2">{product.name}</h3>
                    <span className={`flex-shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${CATEGORY_COLORS[product.category] || CATEGORY_COLORS.Other}`}>
                        {product.category}
                    </span>
                </div>
                <div className="flex items-baseline gap-1.5 mb-3">
                    <span className="text-base font-bold text-slate-900">₹{product.price}</span>
                    {product.mrp && product.mrp > product.price && (
                        <span className="text-xs text-slate-400 line-through">₹{product.mrp}</span>
                    )}
                </div>

                {/* Toggle Row */}
                <div className="flex items-center gap-2 mb-3 pb-3 border-b border-slate-100">
                    <button
                        disabled={toggling}
                        onClick={() => handleToggle('isActive', !product.isActive)}
                        title={product.isActive ? 'Hide from members' : 'Show to members'}
                        className={`flex items-center gap-1.5 text-[10px] font-semibold px-2 py-1 rounded-lg border transition-all ${product.isActive ? 'bg-indigo-50 text-indigo-600 border-indigo-200' : 'bg-slate-50 text-slate-500 border-slate-200'}`}
                    >
                        {product.isActive ? <Eye size={11} /> : <EyeOff size={11} />}
                        {product.isActive ? 'Visible' : 'Hidden'}
                    </button>
                    <button
                        disabled={toggling}
                        onClick={() => handleToggle('stockStatus', product.stockStatus === 'IN_STOCK' ? 'OUT_OF_STOCK' : 'IN_STOCK')}
                        title="Toggle stock status"
                        className={`flex items-center gap-1.5 text-[10px] font-semibold px-2 py-1 rounded-lg border transition-all ${product.stockStatus === 'IN_STOCK' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-rose-50 text-rose-500 border-rose-200'}`}
                    >
                        <Package size={11} />
                        {product.stockStatus === 'IN_STOCK' ? 'In Stock' : 'Out Stock'}
                    </button>
                    <button
                        disabled={toggling}
                        onClick={() => handleToggle('isFeatured', !product.isFeatured)}
                        title={product.isFeatured ? 'Remove from featured' : 'Add to featured carousel'}
                        className={`flex items-center gap-1.5 text-[10px] font-semibold px-2 py-1 rounded-lg border transition-all ${product.isFeatured ? 'bg-amber-50 text-amber-600 border-amber-200' : 'bg-slate-50 text-slate-400 border-slate-200'}`}
                    >
                        <Star size={11} />
                        {product.isFeatured ? 'Featured' : 'Feature'}
                    </button>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                    <button
                        onClick={() => onEdit(product)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border border-indigo-200 bg-indigo-50 text-indigo-600 text-xs font-semibold hover:bg-indigo-100 transition-all active:scale-95"
                    >
                        <Edit3 size={13} /> Edit
                    </button>
                    <button
                        onClick={() => onDelete(product)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border border-rose-200 bg-rose-50 text-rose-500 text-xs font-semibold hover:bg-rose-100 transition-all active:scale-95"
                    >
                        <Trash2 size={13} /> Delete
                    </button>
                </div>
            </div>
        </motion.div>
    );
};

// ── Toast ─────────────────────────────────────────────────────────────────────
const Toast = ({ toast, onDismiss }) => {
    if (!toast) return null;
    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                className={`fixed top-5 right-5 z-[300] flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl border text-sm font-semibold max-w-xs ${toast.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-700'}`}
            >
                {toast.type === 'success' ? <Check size={16} className="text-emerald-600" /> : <AlertCircle size={16} className="text-rose-500" />}
                {toast.message}
            </motion.div>
        </AnimatePresence>
    );
};

// ── Main Page ─────────────────────────────────────────────────────────────────
const OwnerStorePage = () => {
    const [products, setProducts] = useState([]);
    const [stats, setStats] = useState({ total: 0, active: 0, hidden: 0, outOfStock: 0 });
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const [toast, setToast] = useState(null);
    const [search, setSearch] = useState('');
    const [filterCategory, setFilterCategory] = useState('All');

    // Form state
    const [formData, setFormData] = useState({
        name: '', category: 'Other', price: '', mrp: '', description: '',
        whatsappOverride: '', stockStatus: 'IN_STOCK', isActive: true,
        isFeatured: false, displayOrder: ''
    });
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState('');

    // Image states
    const [rawImageFile, setRawImageFile] = useState(null); // file selected, before crop
    const [showCropper, setShowCropper] = useState(false);
    const [finalImageFile, setFinalImageFile] = useState(null); // after crop+compress
    const [imagePreview, setImagePreview] = useState(null);
    const fileInputRef = useRef(null);

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3500);
    };

    const fetchProducts = useCallback(async () => {
        try {
            setLoading(true);
            const data = await getOwnerProducts();
            setProducts(data.products || []);
            setStats(data.stats || {});
        } catch (e) {
            showToast('Failed to load products', 'error');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    const openAddModal = () => {
        setEditingProduct(null);
        setFormData({ name: '', category: 'Other', price: '', mrp: '', description: '', whatsappOverride: '', stockStatus: 'IN_STOCK', isActive: true, isFeatured: false, displayOrder: '' });
        setFinalImageFile(null);
        setImagePreview(null);
        setFormError('');
        setShowModal(true);
    };

    const openEditModal = (product) => {
        setEditingProduct(product);
        setFormData({
            name: product.name || '',
            category: product.category || 'Other',
            price: product.price?.toString() || '',
            mrp: product.mrp?.toString() || '',
            description: product.description || '',
            whatsappOverride: product.whatsappOverride || '',
            stockStatus: product.stockStatus || 'IN_STOCK',
            isActive: product.isActive !== false,
            isFeatured: product.isFeatured || false,
            displayOrder: product.displayOrder?.toString() || '',
        });
        setFinalImageFile(null);
        setImagePreview(product.image?.url || null);
        setFormError('');
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingProduct(null);
        setFinalImageFile(null);
        setImagePreview(null);
        setRawImageFile(null);
        setShowCropper(false);
    };

    const handleFileSelect = (file) => {
        if (!file) return;
        const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (!allowed.includes(file.type)) {
            setFormError('Only JPEG, PNG, or WebP images allowed.');
            return;
        }
        setRawImageFile(file);
        setShowCropper(true);
    };

    const handleCropComplete = async (croppedCompressedFile) => {
        setFinalImageFile(croppedCompressedFile);
        setImagePreview(URL.createObjectURL(croppedCompressedFile));
        setShowCropper(false);
        setRawImageFile(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError('');
        if (!formData.name.trim()) return setFormError('Product name is required.');
        if (!formData.price || isNaN(Number(formData.price)) || Number(formData.price) < 0) return setFormError('Valid price is required.');

        setSaving(true);
        try {
            const fd = new FormData();
            fd.append('name', formData.name.trim());
            fd.append('category', formData.category);
            fd.append('price', formData.price);
            if (formData.mrp) fd.append('mrp', formData.mrp);
            fd.append('description', formData.description || '');
            fd.append('whatsappOverride', formData.whatsappOverride || '');
            fd.append('stockStatus', formData.stockStatus);
            fd.append('isActive', formData.isActive ? 'true' : 'false');
            fd.append('isFeatured', formData.isFeatured ? 'true' : 'false');
            if (formData.displayOrder) fd.append('displayOrder', formData.displayOrder);
            if (finalImageFile) fd.append('image', finalImageFile);

            if (editingProduct) {
                await updateProduct(editingProduct._id, fd);
                showToast('Product updated successfully!');
            } else {
                await createProduct(fd);
                showToast('Product added successfully!');
            }
            closeModal();
            await fetchProducts();
        } catch (err) {
            setFormError(err.response?.data?.message || err.message || 'Failed to save product.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteConfirm) return;
        setDeleting(true);
        try {
            await deleteProduct(deleteConfirm._id);
            showToast('Product deleted.');
            setDeleteConfirm(null);
            await fetchProducts();
        } catch {
            showToast('Failed to delete product.', 'error');
        } finally {
            setDeleting(false);
        }
    };

    const handleStatusToggle = async (id, fields) => {
        try {
            await updateProductStatus(id, fields);
            await fetchProducts();
        } catch {
            showToast('Failed to update status.', 'error');
        }
    };

    const filtered = products.filter(p => {
        const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase());
        const matchCat = filterCategory === 'All' || p.category === filterCategory;
        return matchSearch && matchCat;
    });

    if (loading) return <BicepCurlLoader text="Loading Store..." fullScreen={false} />;

    return (
        <div className="max-w-6xl mx-auto pb-24">
            <Toast toast={toast} />

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
                        <ShoppingBag size={22} className="text-indigo-500" />
                        Gym Store
                    </h2>
                    <p className="text-slate-500 text-sm mt-0.5">Manage products your members can browse and order</p>
                </div>
                <button
                    onClick={openAddModal}
                    className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-md transition-all active:scale-95"
                >
                    <Plus size={18} /> Add Product
                </button>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                {[
                    { label: 'Total', value: stats.total, color: 'text-slate-800', bg: 'bg-slate-50', border: 'border-slate-200' },
                    { label: 'Active', value: stats.active, color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
                    { label: 'Hidden', value: stats.hidden, color: 'text-slate-500', bg: 'bg-slate-50', border: 'border-slate-200' },
                    { label: 'Out of Stock', value: stats.outOfStock, color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-200' },
                ].map(s => (
                    <div key={s.label} className={`${s.bg} border ${s.border} rounded-2xl p-4 text-center shadow-sm`}>
                        <p className={`text-2xl font-black ${s.color}`}>{s.value ?? 0}</p>
                        <p className="text-xs font-semibold text-slate-500 mt-0.5">{s.label}</p>
                    </div>
                ))}
            </div>

            {/* Search + Filter */}
            {products.length > 0 && (
                <div className="flex flex-col sm:flex-row gap-3 mb-5">
                    <div className="relative flex-1">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            value={search} onChange={e => setSearch(e.target.value)}
                            placeholder="Search products..."
                            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-300 transition-all"
                        />
                    </div>
                    <select
                        value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
                        className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white transition-all"
                    >
                        <option value="All">All Categories</option>
                        {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                    </select>
                </div>
            )}

            {/* Product Grid */}
            {products.length === 0 ? (
                <EmptyState onAdd={openAddModal} />
            ) : filtered.length === 0 ? (
                <div className="text-center py-16 text-slate-400">
                    <Package size={36} className="mx-auto mb-3 opacity-40" strokeWidth={1} />
                    <p className="font-medium">No products match your filters.</p>
                </div>
            ) : (
                <motion.div layout className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    <AnimatePresence>
                        {filtered.map(p => (
                            <ProductCard
                                key={p._id}
                                product={p}
                                onEdit={openEditModal}
                                onDelete={setDeleteConfirm}
                                onStatusToggle={handleStatusToggle}
                            />
                        ))}
                    </AnimatePresence>
                </motion.div>
            )}

            {/* ── Add / Edit Modal ── */}
            <AnimatePresence>
                {showModal && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={closeModal}
                            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{ duration: 0.2 }}
                            className="fixed inset-0 z-[110] overflow-y-auto flex items-start justify-center p-4 pt-8"
                        >
                            <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg relative">
                                <div className="flex items-center justify-between p-6 border-b border-slate-100">
                                    <h3 className="text-lg font-bold text-slate-800">
                                        {editingProduct ? 'Edit Product' : 'Add New Product'}
                                    </h3>
                                    <button onClick={closeModal} className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all">
                                        <X size={18} />
                                    </button>
                                </div>

                                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                                    {/* Image Upload */}
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">Product Image</label>
                                        <div className="flex items-center gap-4">
                                            <div className="w-24 h-24 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 overflow-hidden flex items-center justify-center cursor-pointer hover:border-indigo-300 transition-colors relative group"
                                                onClick={() => fileInputRef.current?.click()}>
                                                {imagePreview ? (
                                                    <img src={imagePreview} alt="preview" className="w-full h-full object-contain p-1" />
                                                ) : (
                                                    <div className="flex flex-col items-center gap-1 text-slate-400">
                                                        <Upload size={20} strokeWidth={1.5} />
                                                        <span className="text-[10px] font-semibold">Upload</span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="text-sm text-slate-500 flex-1">
                                                <p className="font-medium text-slate-700 mb-1">Upload product photo</p>
                                                <p className="text-xs">You can crop and adjust after selecting. Max 5MB, JPEG/PNG/WebP.</p>
                                                <div className="flex gap-2 mt-2">
                                                    <button type="button"
                                                        onClick={() => fileInputRef.current?.click()}
                                                        className="text-xs px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg border border-indigo-200 font-semibold hover:bg-indigo-100 transition-all">
                                                        {imagePreview ? 'Change' : 'Choose File'}
                                                    </button>
                                                    {imagePreview && (
                                                        <button type="button"
                                                            onClick={() => { setImagePreview(null); setFinalImageFile(null); }}
                                                            className="text-xs px-3 py-1.5 bg-rose-50 text-rose-500 rounded-lg border border-rose-200 font-semibold hover:bg-rose-100 transition-all">
                                                            Remove
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <input ref={fileInputRef} type="file" accept="image/jpeg,image/jpg,image/png,image/webp" className="hidden"
                                            onChange={e => { handleFileSelect(e.target.files[0]); e.target.value = ''; }} />
                                    </div>

                                    {/* Name */}
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Product Name *</label>
                                        <input
                                            type="text" value={formData.name}
                                            onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                                            placeholder="e.g. Whey Protein 1kg"
                                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 transition-all"
                                            maxLength={100}
                                        />
                                    </div>

                                    {/* Category */}
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Category</label>
                                        <select
                                            value={formData.category}
                                            onChange={e => setFormData(p => ({ ...p, category: e.target.value }))}
                                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300 transition-all"
                                        >
                                            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                                        </select>
                                    </div>

                                    {/* Price + MRP */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Price (₹) *</label>
                                            <input type="number" value={formData.price} min="0" step="0.01"
                                                onChange={e => setFormData(p => ({ ...p, price: e.target.value }))}
                                                placeholder="999"
                                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 transition-all"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">MRP (₹) <span className="text-slate-400 font-normal">optional</span></label>
                                            <input type="number" value={formData.mrp} min="0" step="0.01"
                                                onChange={e => setFormData(p => ({ ...p, mrp: e.target.value }))}
                                                placeholder="1299"
                                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 transition-all"
                                            />
                                        </div>
                                    </div>

                                    {/* Description */}
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Description <span className="text-slate-400 font-normal">optional</span></label>
                                        <textarea
                                            value={formData.description}
                                            onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
                                            placeholder="Product details, flavors, dosage..."
                                            rows={3}
                                            maxLength={500}
                                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300 transition-all"
                                        />
                                    </div>

                                    {/* WhatsApp Override */}
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                                            WhatsApp Override <span className="text-slate-400 font-normal">optional</span>
                                        </label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">+91</span>
                                            <input
                                                type="tel" value={formData.whatsappOverride}
                                                onChange={e => setFormData(p => ({ ...p, whatsappOverride: e.target.value }))}
                                                placeholder="Leave blank to use gym's default"
                                                maxLength={10}
                                                className="w-full pl-12 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 transition-all"
                                            />
                                        </div>
                                    </div>

                                    {/* Toggles */}
                                    <div className="grid grid-cols-3 gap-3 bg-slate-50 rounded-2xl p-4 border border-slate-100">
                                        {[
                                            { label: 'Active', field: 'isActive', value: formData.isActive, onColor: 'text-indigo-600', description: 'Visible to members' },
                                            { label: 'In Stock', field: 'stockStatus', value: formData.stockStatus === 'IN_STOCK', onColor: 'text-emerald-600', description: 'Available to order' },
                                            { label: 'Featured', field: 'isFeatured', value: formData.isFeatured, onColor: 'text-amber-500', description: 'Show in carousel' },
                                        ].map(toggle => (
                                            <button
                                                key={toggle.field}
                                                type="button"
                                                onClick={() => {
                                                    if (toggle.field === 'stockStatus') {
                                                        setFormData(p => ({ ...p, stockStatus: p.stockStatus === 'IN_STOCK' ? 'OUT_OF_STOCK' : 'IN_STOCK' }));
                                                    } else {
                                                        setFormData(p => ({ ...p, [toggle.field]: !p[toggle.field] }));
                                                    }
                                                }}
                                                className={`flex flex-col items-center gap-1 p-2 rounded-xl border transition-all ${toggle.value ? 'bg-white border-indigo-200 shadow-sm' : 'bg-transparent border-transparent opacity-60'}`}
                                            >
                                                <div className={`${toggle.value ? toggle.onColor : 'text-slate-400'} transition-colors`}>
                                                    {toggle.value ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
                                                </div>
                                                <span className={`text-[10px] font-bold ${toggle.value ? 'text-slate-700' : 'text-slate-400'}`}>{toggle.label}</span>
                                            </button>
                                        ))}
                                    </div>

                                    {/* Error */}
                                    {formError && (
                                        <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-600 text-sm">
                                            <AlertCircle size={15} />
                                            {formError}
                                        </div>
                                    )}

                                    {/* Submit */}
                                    <div className="flex gap-3 pt-1">
                                        <button type="button" onClick={closeModal}
                                            className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50 transition-all">
                                            Cancel
                                        </button>
                                        <button type="submit" disabled={saving}
                                            className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-60">
                                            {saving
                                                ? <><span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> Saving...</>
                                                : <><Check size={16} /> {editingProduct ? 'Update Product' : 'Add Product'}</>
                                            }
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* ── Delete Confirm Modal ── */}
            <AnimatePresence>
                {deleteConfirm && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setDeleteConfirm(null)}
                            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]" />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                            className="fixed inset-0 z-[110] flex items-center justify-center p-4"
                        >
                            <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 max-w-sm w-full text-center">
                                <div className="w-14 h-14 rounded-2xl bg-rose-100 flex items-center justify-center mx-auto mb-4">
                                    <Trash2 size={26} className="text-rose-500" />
                                </div>
                                <h3 className="text-lg font-bold text-slate-800 mb-2">Delete Product?</h3>
                                <p className="text-sm text-slate-500 mb-5">
                                    This will permanently remove <strong>"{deleteConfirm.name}"</strong> and its image. This cannot be undone.
                                </p>
                                <div className="flex gap-3">
                                    <button onClick={() => setDeleteConfirm(null)} disabled={deleting}
                                        className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50 transition-all">
                                        Cancel
                                    </button>
                                    <button onClick={handleDelete} disabled={deleting}
                                        className="flex-1 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-60">
                                        {deleting ? <><RefreshCw size={14} className="animate-spin" /> Deleting...</> : <><Trash2 size={14} /> Delete</>}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* ── Image Crop Modal ── */}
            {showCropper && rawImageFile && (
                <ProductImageCropper
                    imageFile={rawImageFile}
                    onCancel={() => { setShowCropper(false); setRawImageFile(null); }}
                    onCropComplete={handleCropComplete}
                />
            )}
        </div>
    );
};

export default OwnerStorePage;
