/**
 * productApi.js — Thin wrappers over axios for all product-related API calls.
 * Keeps product network logic out of component files for clean separation.
 */
import api from './axios';

// ── Owner APIs ──────────────────────────────────────────────────────────────

/**
 * Fetch all products for the owner's gym (with stats).
 * @returns {Promise<{ products: Product[], stats: object }>}
 */
export const getOwnerProducts = () => api.get('/api/products').then(r => r.data);

/**
 * Get a single product by ID (owner).
 */
export const getOwnerProductById = (id) => api.get(`/api/products/${id}`).then(r => r.data);

/**
 * Create a new product. Accepts FormData (with optional 'image' file).
 */
export const createProduct = (formData) =>
    api.post('/api/products', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }).then(r => r.data);

/**
 * Update a product. Accepts FormData (with optional 'image' file).
 */
export const updateProduct = (id, formData) =>
    api.put(`/api/products/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }).then(r => r.data);

/**
 * Delete a product and its R2 image.
 */
export const deleteProduct = (id) => api.delete(`/api/products/${id}`).then(r => r.data);

/**
 * Quick status toggle — isActive, stockStatus, isFeatured.
 * @param {string} id
 * @param {object} statusFields — subset of { isActive, stockStatus, isFeatured }
 */
export const updateProductStatus = (id, statusFields) =>
    api.patch(`/api/products/${id}/status`, statusFields).then(r => r.data);

// ── Member APIs ─────────────────────────────────────────────────────────────

/**
 * Get all active products for the member's gym.
 * @param {{ category?: string, search?: string }} params
 */
export const getMemberProducts = (params = {}) =>
    api.get('/api/member/products', { params }).then(r => r.data);

/**
 * Get featured products for the member's gym (for carousel, max 8).
 */
export const getMemberFeaturedProducts = () =>
    api.get('/api/member/products/featured').then(r => r.data);

/**
 * Get a single active product by ID (member view, includes resolvedWhatsapp).
 */
export const getMemberProductById = (id) =>
    api.get(`/api/member/products/${id}`).then(r => r.data);

/**
 * Get the gym's WhatsApp number for store ordering.
 */
export const getMemberGymWhatsapp = () =>
    api.get('/api/member/gym/whatsapp').then(r => r.data);
