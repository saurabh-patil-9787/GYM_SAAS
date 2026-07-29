import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Search, Package, ChevronRight, X } from 'lucide-react';
import { getMemberProducts } from '../../api/productApi';

const CATEGORIES = ['All', 'Protein', 'Supplements', 'Nutrition', 'Accessories', 'Clothing', 'Other'];

const CATEGORY_EMOJI = {
    All: '🛍️', Protein: '💪', Supplements: '🧬', Nutrition: '🥗',
    Accessories: '⚙️', Clothing: '👕', Other: '📦',
};

// ── Skeleton Loader ───────────────────────────────────────────────────────────
const ProductSkeleton = () => (
    <div className="member-card overflow-hidden animate-pulse">
        <div className="w-full aspect-square bg-member-surface rounded-xl mb-3" />
        <div className="h-3 bg-member-surface rounded-full mb-2 w-3/4" />
        <div className="h-3 bg-member-surface rounded-full w-1/2" />
    </div>
);

// ── Product Card ──────────────────────────────────────────────────────────────
const ProductCard = ({ product, onClick }) => {
    const discount = product.mrp && product.mrp > product.price
        ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
        : null;

    const categoryColors = {
        Protein: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
        Supplements: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
        Nutrition: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
        Accessories: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
        Clothing: 'text-pink-400 bg-pink-500/10 border-pink-500/20',
        Other: 'text-slate-400 bg-slate-500/10 border-slate-500/20',
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            whileTap={{ scale: 0.97 }}
            onClick={onClick}
            className="member-card overflow-hidden cursor-pointer active:scale-95 transition-transform"
        >
            {/* Image container — 1:1 with contain */}
            <div className="relative w-full aspect-square bg-[#1a1a24] rounded-xl mb-3 overflow-hidden">
                {product.image?.url ? (
                    <img
                        src={product.image.url}
                        alt={product.name}
                        className="w-full h-full object-contain p-2"
                        loading="lazy"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <Package size={32} className="text-member-muted opacity-40" strokeWidth={1} />
                    </div>
                )}
                {/* Badges */}
                <div className="absolute top-2 left-2 flex flex-col gap-1">
                    {discount && (
                        <span className="text-[9px] font-black bg-emerald-500 text-white px-1.5 py-0.5 rounded-full leading-none">
                            {discount}% OFF
                        </span>
                    )}
                    {product.stockStatus === 'OUT_OF_STOCK' && (
                        <span className="text-[9px] font-bold bg-rose-500/80 text-white px-1.5 py-0.5 rounded-full leading-none">
                            Out of Stock
                        </span>
                    )}
                </div>
            </div>

            {/* Info */}
            <div>
                {/* Category pill */}
                <span className={`inline-flex items-center text-[9px] font-bold px-1.5 py-0.5 rounded-full border mb-1 ${categoryColors[product.category] || categoryColors.Other}`}>
                    {product.category}
                </span>
                <h3 className="font-syne text-sm font-bold text-member-primary leading-tight line-clamp-2 mb-1.5">
                    {product.name}
                </h3>
                <div className="flex items-baseline gap-1.5 mb-3">
                    <span className="font-syne font-black text-member-accent text-base">₹{product.price}</span>
                    {product.mrp && product.mrp > product.price && (
                        <span className="font-dmsans text-xs text-member-muted line-through">₹{product.mrp}</span>
                    )}
                </div>
                <button className="w-full py-2 rounded-xl bg-member-accent/10 hover:bg-member-accent/20 text-member-accent text-xs font-syne font-bold border border-member-accent/20 flex items-center justify-center gap-1.5 transition-all">
                    View <ChevronRight size={13} />
                </button>
            </div>
        </motion.div>
    );
};

// ── Main Page ─────────────────────────────────────────────────────────────────
const MemberStore = () => {
    const navigate = useNavigate();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [activeCategory, setActiveCategory] = useState('All');
    const [error, setError] = useState('');

    // Debounce search input
    useEffect(() => {
        const t = setTimeout(() => setDebouncedSearch(search), 350);
        return () => clearTimeout(t);
    }, [search]);

    const fetchProducts = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const params = {};
            if (activeCategory !== 'All') params.category = activeCategory;
            if (debouncedSearch) params.search = debouncedSearch;
            const data = await getMemberProducts(params);
            setProducts(Array.isArray(data) ? data : []);
        } catch (e) {
            setError('Could not load products. Please try again.');
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [activeCategory, debouncedSearch]);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    return (
        <div className="p-4 pb-32">
            {/* Page Header */}
            <motion.div
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2.5 mb-5"
            >
                <div className="w-9 h-9 rounded-[12px] bg-member-accent/15 border border-member-accent/20 flex items-center justify-center flex-shrink-0">
                    <ShoppingBag size={18} className="text-member-accent" />
                </div>
                <div>
                    <h1 className="font-syne text-xl font-black text-member-primary leading-none">Gym Store</h1>
                    <p className="font-dmsans text-[10px] text-member-muted mt-0.5">Browse & order products</p>
                </div>
            </motion.div>

            {/* Search Bar */}
            <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="relative mb-4"
            >
                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-member-muted" />
                <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search products..."
                    className="w-full pl-10 pr-10 py-3 rounded-2xl bg-member-surface border border-member-border text-member-primary text-sm font-dmsans placeholder:text-member-muted focus:outline-none focus:border-member-accent/40 transition-all"
                />
                {search && (
                    <button onClick={() => setSearch('')}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-member-muted hover:text-member-secondary transition-colors">
                        <X size={15} />
                    </button>
                )}
            </motion.div>

            {/* Category Pills */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="flex gap-2 overflow-x-auto pb-2 mb-5 scrollbar-hide"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
                {CATEGORIES.map((cat, i) => (
                    <motion.button
                        key={cat}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.08 + i * 0.03 }}
                        onClick={() => setActiveCategory(cat)}
                        className={`flex-shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[11px] font-syne font-bold border transition-all duration-200 ${
                            activeCategory === cat
                                ? 'bg-member-accent text-white border-member-accent shadow-[0_0_14px_rgba(108,92,231,0.4)]'
                                : 'bg-member-surface text-member-secondary border-member-border hover:border-member-accent/40'
                        }`}
                    >
                        <span>{CATEGORY_EMOJI[cat]}</span>
                        {cat}
                    </motion.button>
                ))}
            </motion.div>

            {/* Error State */}
            {error && (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                    <Package size={36} className="text-member-muted opacity-40 mb-3" strokeWidth={1} />
                    <p className="font-syne text-sm text-member-secondary mb-3">{error}</p>
                    <button onClick={fetchProducts}
                        className="text-xs font-syne font-bold text-member-accent bg-member-accent/10 px-4 py-2 rounded-xl border border-member-accent/20 hover:bg-member-accent/20 transition-all">
                        Try Again
                    </button>
                </div>
            )}

            {/* Loading Skeletons */}
            {loading && !error && (
                <div className="grid grid-cols-2 gap-3">
                    {Array.from({ length: 6 }).map((_, i) => <ProductSkeleton key={i} />)}
                </div>
            )}

            {/* Products Grid */}
            {!loading && !error && (
                <AnimatePresence mode="wait">
                    {products.length === 0 ? (
                        <motion.div
                            key="empty"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="flex flex-col items-center justify-center py-20 text-center"
                        >
                            <div className="w-20 h-20 rounded-3xl bg-member-surface border border-member-border flex items-center justify-center mb-5">
                                <ShoppingBag size={34} className="text-member-muted opacity-50" strokeWidth={1.2} />
                            </div>
                            <h3 className="font-syne text-base font-bold text-member-secondary mb-1">No Products Available</h3>
                            <p className="font-dmsans text-xs text-member-muted max-w-xs">
                                {debouncedSearch || activeCategory !== 'All'
                                    ? 'Try a different search or category.'
                                    : 'Your gym hasn\'t added any products yet. Check back soon!'}
                            </p>
                            {(debouncedSearch || activeCategory !== 'All') && (
                                <button onClick={() => { setSearch(''); setActiveCategory('All'); }}
                                    className="mt-4 text-xs font-syne font-bold text-member-accent bg-member-accent/10 px-4 py-2 rounded-xl border border-member-accent/20 transition-all">
                                    Clear Filters
                                </button>
                            )}
                        </motion.div>
                    ) : (
                        <motion.div
                            key="grid"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="grid grid-cols-2 gap-3"
                        >
                            {products.map((product, i) => (
                                <ProductCard
                                    key={product._id}
                                    product={product}
                                    onClick={() => navigate(`/member/store/${product._id}`)}
                                />
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            )}
        </div>
    );
};

export default MemberStore;
