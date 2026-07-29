import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    ChevronLeft, Package, MessageSquare, Share2, 
    AlertCircle, ShoppingBag, ZoomIn, X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getMemberProductById } from '../../api/productApi';

const CATEGORY_COLORS = {
    Protein: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
    Supplements: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    Nutrition: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    Accessories: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    Clothing: 'text-pink-400 bg-pink-500/10 border-pink-500/20',
    Other: 'text-slate-400 bg-slate-500/10 border-slate-500/20',
};

const MemberProductDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [imageZoom, setImageZoom] = useState(false);

    useEffect(() => {
        const fetchProduct = async () => {
            setLoading(true);
            try {
                const data = await getMemberProductById(id);
                setProduct(data);
            } catch (e) {
                setError(e.response?.data?.message || 'Product not found.');
            } finally {
                setLoading(false);
            }
        };
        if (id) fetchProduct();
    }, [id]);

    const handleWhatsAppOrder = () => {
        if (!product) return;
        const phone = product.resolvedWhatsapp;
        if (!phone) {
            alert('WhatsApp number not available for this gym.');
            return;
        }

        const memberName = user?.name || 'A Member';
        const gymName = product.gymName || 'your gym';
        const message = `Hi ${gymName}! 🙏\n\nI'm interested in ordering this product:\n\n*Product:* ${product.name}\n*Price:* ₹${product.price}\n\n*Member:* ${memberName}\n\nPlease confirm availability. Thank you!`;

        const url = `https://wa.me/91${phone}?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank', 'noopener,noreferrer');
    };

    const discount = product?.mrp && product.mrp > product.price
        ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
        : null;

    // ── Loading ───────────────────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="p-4 pb-32 animate-pulse">
                <div className="h-8 w-24 bg-member-surface rounded-xl mb-5" />
                <div className="w-full aspect-square bg-member-surface rounded-2xl mb-5" />
                <div className="h-4 bg-member-surface rounded-full w-1/3 mb-3" />
                <div className="h-6 bg-member-surface rounded-full w-3/4 mb-2" />
                <div className="h-6 bg-member-surface rounded-full w-1/2 mb-4" />
                <div className="h-24 bg-member-surface rounded-2xl mb-6" />
                <div className="h-14 bg-member-surface rounded-2xl" />
            </div>
        );
    }

    // ── Error ─────────────────────────────────────────────────────────────────
    if (error || !product) {
        return (
            <div className="p-4 flex flex-col items-center justify-center min-h-[60vh] text-center">
                <div className="w-16 h-16 rounded-2xl bg-member-surface flex items-center justify-center mb-4 border border-member-border">
                    <AlertCircle size={28} className="text-member-muted" strokeWidth={1.5} />
                </div>
                <h3 className="font-syne font-bold text-member-primary mb-2">Product Not Found</h3>
                <p className="font-dmsans text-sm text-member-muted mb-5">{error || 'This product is not available.'}</p>
                <button onClick={() => navigate('/member/store')}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-member-accent text-white font-syne font-bold text-sm transition-all active:scale-95">
                    <ShoppingBag size={16} /> Back to Store
                </button>
            </div>
        );
    }

    return (
        <div className="pb-36">
            {/* Back Button */}
            <div className="sticky top-0 bg-member-bg/90 backdrop-blur-md border-b border-member-border px-4 py-3 z-10">
                <button
                    onClick={() => navigate('/member/store')}
                    className="flex items-center gap-2 text-member-secondary hover:text-member-primary transition-colors font-syne font-semibold text-sm"
                >
                    <ChevronLeft size={18} />
                    Back to Store
                </button>
            </div>

            <div className="p-4">
                {/* Product Image */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative w-full aspect-square bg-[#1a1a24] rounded-3xl overflow-hidden mb-5 border border-member-border group cursor-pointer"
                    onClick={() => product.image?.url && setImageZoom(true)}
                >
                    {product.image?.url ? (
                        <>
                            <img
                                src={product.image.url}
                                alt={product.name}
                                className="w-full h-full object-contain p-4"
                            />
                            <div className="absolute bottom-3 right-3 w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <ZoomIn size={16} className="text-white" />
                            </div>
                        </>
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <Package size={56} className="text-member-muted opacity-30" strokeWidth={1} />
                        </div>
                    )}
                    {/* Overlay badges */}
                    <div className="absolute top-3 left-3 flex flex-col gap-2">
                        {discount && (
                            <span className="text-[11px] font-black bg-emerald-500 text-white px-2.5 py-1 rounded-full shadow-sm">
                                {discount}% OFF
                            </span>
                        )}
                        {product.stockStatus === 'OUT_OF_STOCK' && (
                            <span className="text-[11px] font-bold bg-rose-500/80 backdrop-blur-sm text-white px-2.5 py-1 rounded-full">
                                Out of Stock
                            </span>
                        )}
                    </div>
                </motion.div>

                {/* Product Info */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.08 }}
                >
                    {/* Category pill */}
                    <span className={`inline-flex items-center text-[10px] font-bold px-2.5 py-1 rounded-full border mb-3 ${CATEGORY_COLORS[product.category] || CATEGORY_COLORS.Other}`}>
                        {product.category}
                    </span>

                    <h1 className="font-syne text-2xl font-black text-member-primary leading-tight mb-3">
                        {product.name}
                    </h1>

                    {/* Price */}
                    <div className="flex items-baseline gap-3 mb-2">
                        <span className="font-syne font-black text-3xl text-member-accent">₹{product.price}</span>
                        {product.mrp && product.mrp > product.price && (
                            <span className="font-dmsans text-member-muted text-base line-through">₹{product.mrp}</span>
                        )}
                        {discount && (
                            <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                                Save {discount}%
                            </span>
                        )}
                    </div>

                    {/* Stock status */}
                    <div className={`inline-flex items-center gap-1.5 text-xs font-syne font-bold px-3 py-1.5 rounded-full border mb-5 ${product.stockStatus === 'IN_STOCK' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-rose-400 bg-rose-500/10 border-rose-500/20'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${product.stockStatus === 'IN_STOCK' ? 'bg-emerald-400' : 'bg-rose-400'} ${product.stockStatus === 'IN_STOCK' ? 'animate-pulse' : ''}`} />
                        {product.stockStatus === 'IN_STOCK' ? 'In Stock' : 'Currently Out of Stock'}
                    </div>

                    {/* Description */}
                    {product.description && (
                        <div className="member-card mb-5">
                            <h3 className="font-syne text-xs font-bold text-member-muted uppercase tracking-wider mb-2">Description</h3>
                            <p className="font-dmsans text-sm text-member-secondary leading-relaxed">
                                {product.description}
                            </p>
                        </div>
                    )}

                    {/* WhatsApp contact info */}
                    {product.resolvedWhatsapp && (
                        <div className="mb-5 p-3 rounded-2xl bg-emerald-500/5 border border-emerald-500/15 flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 flex items-center justify-center flex-shrink-0">
                                <MessageSquare size={15} className="text-emerald-400" />
                            </div>
                            <div>
                                <p className="font-syne text-[10px] font-bold text-member-muted uppercase tracking-wide">Order via WhatsApp</p>
                                <p className="font-syne text-sm font-bold text-emerald-400">+91 {product.resolvedWhatsapp}</p>
                            </div>
                        </div>
                    )}
                </motion.div>
            </div>

            {/* ── CTA Footer ── */}
            <div className="fixed bottom-[68px] left-0 right-0 px-4 pb-3 z-20">
                <div className="max-w-lg mx-auto">
                    <motion.button
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 }}
                        onClick={handleWhatsAppOrder}
                        disabled={product.stockStatus === 'OUT_OF_STOCK' || !product.resolvedWhatsapp}
                        className={`w-full py-4 rounded-2xl flex items-center justify-center gap-3 font-syne font-black text-base transition-all shadow-2xl active:scale-[0.98] ${
                            product.stockStatus === 'OUT_OF_STOCK'
                                ? 'bg-member-surface border border-member-border text-member-muted cursor-not-allowed'
                                : !product.resolvedWhatsapp
                                ? 'bg-member-surface border border-member-border text-member-muted cursor-not-allowed'
                                : 'bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white shadow-[0_8px_32px_rgba(16,185,129,0.4)]'
                        }`}
                    >
                        {/* WhatsApp SVG icon */}
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                        </svg>
                        {product.stockStatus === 'OUT_OF_STOCK'
                            ? 'Out of Stock'
                            : !product.resolvedWhatsapp
                            ? 'Order Unavailable'
                            : 'Order on WhatsApp'}
                    </motion.button>
                </div>
            </div>

            {/* ── Image Zoom Modal ── */}
            <AnimatePresence>
                {imageZoom && product.image?.url && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setImageZoom(false)}
                        className="fixed inset-0 bg-black/95 z-[99999] flex flex-col items-center justify-center p-4"
                    >
                        <button
                            onClick={() => setImageZoom(false)}
                            className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-all"
                        >
                            <X size={20} />
                        </button>
                        <motion.img
                            initial={{ scale: 0.85 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.85 }}
                            src={product.image.url}
                            alt={product.name}
                            onClick={e => e.stopPropagation()}
                            className="max-w-full max-h-[85vh] object-contain rounded-2xl"
                        />
                        <p className="text-white/60 text-xs mt-4 font-syne">{product.name}</p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default MemberProductDetail;
