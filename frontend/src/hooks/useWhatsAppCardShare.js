import { useRef, useState, useCallback } from 'react';
import html2canvas from 'html2canvas';
import {
    normalizeWhatsAppNumber,
    openWhatsAppChat,
    shareMemberCardManually,
} from '../services/whatsappService';

const API_URL = import.meta.env.VITE_API_URL || '';

/**
 * Converts a remote image URL to a base64 data-URL via our backend proxy.
 *
 * Why proxy? Cloudinary (and most CDNs) set CORS headers that allow the
 * browser to DISPLAY images but not to draw them onto a <canvas> and read
 * pixels back (toDataURL). That causes "tainted canvas" errors in html2canvas.
 *
 * Our /api/proxy-image endpoint fetches the image server-side and re-serves
 * it with `Access-Control-Allow-Origin: *`, so the browser can safely use
 * it in a canvas.
 *
 * @param {string|null} url  - Remote image URL
 * @returns {Promise<string|null>}  base64 data-URL or null on failure
 */
const fetchBase64ViaProxy = async (url) => {
    if (!url) return null;
    // Already a data/blob URL — use as-is
    if (url.startsWith('data:') || url.startsWith('blob:')) return url;

    try {
        const proxyUrl = `${API_URL}/api/proxy-image?url=${encodeURIComponent(url)}`;
        const res = await fetch(proxyUrl);
        if (!res.ok) throw new Error(`Proxy returned ${res.status}`);
        const blob = await res.blob();
        return await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    } catch (err) {
        console.warn('[ImageProxy] Could not load image via proxy:', err.message);
        // Do not fall back to the remote URL: it can taint html2canvas. The
        // card component will render its local placeholder instead.
        return null;
    }
};

/**
 * Hook that:
 *  1. Pre-fetches member photo + gym logo as base64 (via proxy) so html2canvas
 *     can render them without CORS taint on any device (laptop, PWA, mobile).
 *  2. Captures the hidden MembershipShareCard as a PNG.
 *  3. Shares via:
 *       - Mobile/PWA: native Web Share API → user picks WhatsApp
 *       - Desktop fallback: downloads image + opens wa.me/<memberNumber>?text=...
 */
const useWhatsAppCardShare = () => {
    const cardRef = useRef(null);
    const [sharing, setSharing] = useState(false);
    const [memberBase64Photo, setMemberBase64Photo] = useState(null);
    const [gymBase64Logo, setGymBase64Logo] = useState(null);

    /**
     * Call this whenever `shareMember` changes to pre-load images as base64.
     * @param {string|null} memberPhotoUrl
     * @param {string|null} gymLogoUrl
     */
    const prepareImages = useCallback(async (memberPhotoUrl, gymLogoUrl) => {
        // Reset first so stale images don't bleed into a new member's card
        setMemberBase64Photo(null);
        setGymBase64Logo(null);

        const [photo, logo] = await Promise.all([
            fetchBase64ViaProxy(memberPhotoUrl),
            fetchBase64ViaProxy(gymLogoUrl),
        ]);

        setMemberBase64Photo(photo || null);
        setGymBase64Logo(logo || null);
    }, []);

    /**
     * Capture the hidden card DOM node with html2canvas.
     * @returns {Promise<Blob>}
     */
    const generateCardBlob = useCallback(async () => {
        if (!cardRef.current) throw new Error('Card ref not attached');
        // Wait for React, fonts, and every embedded image before capture.
        await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
        if (document.fonts?.ready) await document.fonts.ready;
        const images = Array.from(cardRef.current.querySelectorAll('img'));
        // A completed-but-invalid image is also settled: its card component
        // has already rendered the fallback and must not stall the PWA flow.
        await Promise.all(images.map((image) => image.complete
            ? Promise.resolve()
            : new Promise((resolve) => {
                image.addEventListener('load', resolve, { once: true });
                image.addEventListener('error', resolve, { once: true });
            })));

        const canvas = await html2canvas(cardRef.current, {
            scale: 3,
            useCORS: false,
            allowTaint: false,  // don't allow tainted canvas (would break toDataURL)
            backgroundColor: '#ffffff',
            logging: false,
            imageTimeout: 8000,
        });

        const blob = await new Promise((resolve) =>
            canvas.toBlob(resolve, 'image/png')
        );
        if (!blob) throw new Error('html2canvas returned an empty blob');
        return blob;
    }, []);

    /**
     * Share the membership card image + WhatsApp text.
     *
     * @param {object}   member         – { name, mobile, ... }
     * @param {string}   message        – WhatsApp message text
     * @param {object}   [opts]
     * @param {string}   [opts.gymName]
     * @param {Function} [opts.onSuccess]
     * @param {Function} [opts.onError]
     */
    const shareCard = useCallback(async (member, message, opts = {}) => {
        if (!member || !cardRef.current) return { status: 'failed' };
        setSharing(true);

        const e164Number = normalizeWhatsAppNumber(member.mobile);
        if (!e164Number) {
            opts.onError?.(new Error('Member does not have a valid mobile number.'));
            setSharing(false);
            return { status: 'invalid-number' };
        }

        try {
            const blob = await generateCardBlob();
            const fileName = `member-card-${member._id || member.memberId || 'member'}.png`;
            const file = new File([blob], fileName, { type: 'image/png' });
            const result = await shareMemberCardManually({ file, blob, e164Number, message });
            opts.onSuccess?.(result);
            return result;
        } catch (err) {
            console.error('[WhatsAppCardShare] Share failed:', err);
            opts.onError?.(err);
            return { status: 'failed' };
        } finally {
            setSharing(false);
        }
    }, [generateCardBlob]);

    /**
     * Quick text-only WhatsApp open (no card image).
     * Opens wa.me directly to the member's number with pre-filled message.
     */
    const sendWhatsAppText = useCallback((member, message) => {
        if (!member?.mobile) return;
        const e164Number = normalizeWhatsAppNumber(member.mobile);
        if (!e164Number) return false;
        openWhatsAppChat(e164Number, message);
        return true;
    }, []);

    return {
        cardRef,
        sharing,
        shareCard,
        sendWhatsAppText,
        prepareImages,
        memberBase64Photo,
        gymBase64Logo,
    };
};

export default useWhatsAppCardShare;
