const Product = require('../models/Product');
const Gym = require('../models/Gym');
const GymOwner = require('../models/GymOwner');
const imageStorageService = require('../utils/imageStorageService');

// ─── Helper: resolve owner's gym ───────────────────────────────────────────
const resolveOwnerGym = async (userId) => {
    const gym = await Gym.findOne({ owner: userId }).lean();
    return gym;
};

// ─── Helper: resolve member's gym ──────────────────────────────────────────
const resolveMemberGym = (member) => {
    return member.gym; // Already stored as ObjectId on the member document
};

// ─── Helper: safely parse boolean from string or boolean ───────────────────
const parseBool = (val) => {
    if (typeof val === 'boolean') return val;
    if (typeof val === 'string') return val.toLowerCase() === 'true';
    return Boolean(val);
};

// ══════════════════════════════════════════════════════════════
//  OWNER ENDPOINTS
// ══════════════════════════════════════════════════════════════

// @desc    Create a new product
// @route   POST /api/products
// @access  Private (Owner)
exports.createProduct = async (req, res, next) => {
    try {
        const gym = await resolveOwnerGym(req.user._id);
        if (!gym) return res.status(404).json({ message: 'Gym not found for this owner' });

        const { name, description, category, price, mrp, whatsappOverride, stockStatus, isActive, isFeatured, displayOrder } = req.body;

        if (!name || !price) {
            return res.status(400).json({ message: 'Product name and price are required' });
        }

        let imageData = { url: null, key: null, provider: 'r2' };

        if (req.file) {
            const uploaded = await imageStorageService.uploadImage(
                req.file.buffer,
                req.file.mimetype,
                'products',
                gym._id.toString()
            );
            imageData = uploaded;
        }

        // Auto-assign displayOrder if not provided
        let order = parseInt(displayOrder) || 0;
        if (!order) {
            const count = await Product.countDocuments({ gym: gym._id });
            order = count + 1;
        }

        const product = await Product.create({
            gym: gym._id,
            name,
            description: description || '',
            category: category || 'Other',
            price: parseFloat(price),
            mrp: mrp ? parseFloat(mrp) : null,
            image: imageData,
            whatsappOverride: whatsappOverride || null,
            stockStatus: stockStatus || 'IN_STOCK',
            isActive: isActive !== undefined ? parseBool(isActive) : true,
            isFeatured: isFeatured !== undefined ? parseBool(isFeatured) : false,
            displayOrder: order
        });

        res.status(201).json(product);
    } catch (error) {
        next(error);
    }
};

// @desc    Get all products for owner's gym
// @route   GET /api/products
// @access  Private (Owner)
exports.getOwnerProducts = async (req, res, next) => {
    try {
        const gym = await resolveOwnerGym(req.user._id);
        if (!gym) return res.status(404).json({ message: 'Gym not found' });

        const products = await Product.find({ gym: gym._id })
            .sort({ displayOrder: 1, createdAt: -1 })
            .lean();

        // Attach summary stats
        const total = products.length;
        const active = products.filter(p => p.isActive).length;
        const hidden = products.filter(p => !p.isActive).length;
        const outOfStock = products.filter(p => p.stockStatus === 'OUT_OF_STOCK').length;

        res.json({ products, stats: { total, active, hidden, outOfStock } });
    } catch (error) {
        next(error);
    }
};

// @desc    Get single product by ID (owner)
// @route   GET /api/products/:id
// @access  Private (Owner)
exports.getOwnerProductById = async (req, res, next) => {
    try {
        const gym = await resolveOwnerGym(req.user._id);
        if (!gym) return res.status(404).json({ message: 'Gym not found' });

        const product = await Product.findById(req.params.id).lean();
        if (!product) return res.status(404).json({ message: 'Product not found' });

        // Ownership check
        if (product.gym.toString() !== gym._id.toString()) {
            return res.status(403).json({ message: 'Access denied — product belongs to another gym' });
        }

        res.json(product);
    } catch (error) {
        next(error);
    }
};

// @desc    Update a product (text fields + optional new image)
// @route   PUT /api/products/:id
// @access  Private (Owner)
exports.updateProduct = async (req, res, next) => {
    try {
        const gym = await resolveOwnerGym(req.user._id);
        if (!gym) return res.status(404).json({ message: 'Gym not found' });

        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ message: 'Product not found' });

        if (product.gym.toString() !== gym._id.toString()) {
            return res.status(403).json({ message: 'Access denied — product belongs to another gym' });
        }

        const { name, description, category, price, mrp, whatsappOverride, stockStatus, isActive, isFeatured, displayOrder } = req.body;

        // Safe image replacement: upload new → update DB → delete old
        let newImageData = null;
        let oldImageInfo = null;

        if (req.file) {
            // Step 1: Upload new image
            try {
                newImageData = await imageStorageService.uploadImage(
                    req.file.buffer,
                    req.file.mimetype,
                    'products',
                    gym._id.toString()
                );
            } catch (uploadErr) {
                console.error('[Product] New image upload failed, keeping old:', uploadErr.message);
                return res.status(500).json({ message: 'Image upload failed — product not changed' });
            }

            // Store old image info for cleanup after DB update
            if (product.image && product.image.key) {
                oldImageInfo = { key: product.image.key, provider: product.image.provider || 'r2' };
            }
        }

        // Step 2: Update fields
        if (name !== undefined) product.name = name;
        if (description !== undefined) product.description = description;
        if (category !== undefined) product.category = category;
        if (price !== undefined) product.price = parseFloat(price);
        if (mrp !== undefined) product.mrp = mrp ? parseFloat(mrp) : null;
        if (whatsappOverride !== undefined) product.whatsappOverride = whatsappOverride || null;
        if (stockStatus !== undefined) product.stockStatus = stockStatus;
        if (isActive !== undefined) product.isActive = parseBool(isActive);
        if (isFeatured !== undefined) product.isFeatured = parseBool(isFeatured);
        if (displayOrder !== undefined) product.displayOrder = parseInt(displayOrder);

        if (newImageData) {
            product.image = newImageData;
        }

        // Step 3: Save to DB
        try {
            const updated = await product.save();

            // Step 4: Delete old image from R2 (after successful DB update)
            if (oldImageInfo) {
                imageStorageService.deleteImage(oldImageInfo.key, oldImageInfo.provider)
                    .catch(err => console.error('[Product] Old image R2 cleanup failed (non-fatal):', err.message));
            }

            res.json(updated);
        } catch (dbErr) {
            // If DB update failed and we uploaded a new image, clean it up
            if (newImageData && newImageData.key) {
                imageStorageService.deleteImage(newImageData.key, 'r2')
                    .catch(e => console.error('[Product] Orphan image cleanup failed:', e.message));
            }
            throw dbErr;
        }
    } catch (error) {
        next(error);
    }
};

// @desc    Delete a product and its R2 image
// @route   DELETE /api/products/:id
// @access  Private (Owner)
exports.deleteProduct = async (req, res, next) => {
    try {
        const gym = await resolveOwnerGym(req.user._id);
        if (!gym) return res.status(404).json({ message: 'Gym not found' });

        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ message: 'Product not found' });

        if (product.gym.toString() !== gym._id.toString()) {
            return res.status(403).json({ message: 'Access denied — product belongs to another gym' });
        }

        // Capture image info before deleting document
        const imageKey = product.image?.key;
        const imageProvider = product.image?.provider || 'r2';

        await product.deleteOne();

        // Delete R2 image asynchronously (non-blocking)
        if (imageKey) {
            imageStorageService.deleteImage(imageKey, imageProvider)
                .catch(err => console.error('[Product] R2 image deletion failed (non-fatal):', err.message));
        }

        res.json({ message: 'Product deleted successfully' });
    } catch (error) {
        next(error);
    }
};

// @desc    Quick status update (isActive, stockStatus, isFeatured)
// @route   PATCH /api/products/:id/status
// @access  Private (Owner)
exports.updateProductStatus = async (req, res, next) => {
    try {
        const gym = await resolveOwnerGym(req.user._id);
        if (!gym) return res.status(404).json({ message: 'Gym not found' });

        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ message: 'Product not found' });

        if (product.gym.toString() !== gym._id.toString()) {
            return res.status(403).json({ message: 'Access denied' });
        }

        const { isActive, stockStatus, isFeatured } = req.body;

        if (isActive !== undefined) product.isActive = Boolean(isActive);
        if (stockStatus !== undefined) product.stockStatus = stockStatus;
        if (isFeatured !== undefined) product.isFeatured = Boolean(isFeatured);

        const updated = await product.save();
        res.json(updated);
    } catch (error) {
        next(error);
    }
};

// ══════════════════════════════════════════════════════════════
//  MEMBER ENDPOINTS
// ══════════════════════════════════════════════════════════════

// @desc    Get all active products for member's gym
// @route   GET /api/member/products
// @access  Private (Member)
exports.getMemberProducts = async (req, res, next) => {
    try {
        const gymId = resolveMemberGym(req.member);
        if (!gymId) return res.status(400).json({ message: 'Member not associated with a gym' });

        const { category, search } = req.query;

        const query = { gym: gymId, isActive: true };
        if (category && category !== 'All') query.category = category;
        if (search) {
            const safeSearch = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            query.$or = [
                { name: { $regex: safeSearch, $options: 'i' } },
                { description: { $regex: safeSearch, $options: 'i' } }
            ];
        }

        const products = await Product.find(query)
            .sort({ displayOrder: 1, createdAt: -1 })
            .lean();

        res.json(products);
    } catch (error) {
        next(error);
    }
};

// @desc    Get featured products for member's gym (home carousel)
// @route   GET /api/member/products/featured
// @access  Private (Member)
exports.getMemberFeaturedProducts = async (req, res, next) => {
    try {
        const gymId = resolveMemberGym(req.member);
        if (!gymId) return res.status(400).json({ message: 'Member not associated with a gym' });

        const products = await Product.find({ gym: gymId, isActive: true, isFeatured: true })
            .sort({ displayOrder: 1, createdAt: -1 })
            .limit(8)
            .lean();

        res.json(products);
    } catch (error) {
        next(error);
    }
};

// @desc    Get single product (member view)
// @route   GET /api/member/products/:id
// @access  Private (Member)
exports.getMemberProductById = async (req, res, next) => {
    try {
        const gymId = resolveMemberGym(req.member);
        if (!gymId) return res.status(400).json({ message: 'Member not associated with a gym' });

        const product = await Product.findById(req.params.id).lean();
        if (!product) return res.status(404).json({ message: 'Product not found' });

        // Multi-tenant check: product must belong to member's gym
        if (product.gym.toString() !== gymId.toString()) {
            return res.status(403).json({ message: 'Access denied' });
        }

        if (!product.isActive) {
            return res.status(404).json({ message: 'Product not available' });
        }

        // Resolve WhatsApp number: product override → gym number → owner mobile
        const gym = await Gym.findById(gymId)
            .populate('owner', 'mobile')
            .lean();

        const whatsappNumber = product.whatsappOverride || gym?.whatsappNumber || gym?.owner?.mobile || null;

        res.json({ ...product, resolvedWhatsapp: whatsappNumber, gymName: gym?.gymName });
    } catch (error) {
        next(error);
    }
};

// @desc    Get WhatsApp number for ordering (used by store/featured list)
// @route   GET /api/member/gym/whatsapp
// @access  Private (Member)
exports.getMemberGymWhatsapp = async (req, res, next) => {
    try {
        const gymId = resolveMemberGym(req.member);
        if (!gymId) return res.status(400).json({ message: 'Member not associated with a gym' });

        const gym = await Gym.findById(gymId)
            .populate('owner', 'mobile')
            .select('whatsappNumber gymName')
            .lean();

        const whatsappNumber = gym?.whatsappNumber || gym?.owner?.mobile || null;

        res.json({ whatsappNumber, gymName: gym?.gymName });
    } catch (error) {
        next(error);
    }
};
