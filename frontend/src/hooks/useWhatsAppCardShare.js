import { useRef, useState, useCallback } from 'react';
import html2canvas from 'html2canvas';

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
        console.warn('[ImageProxy] Could not load image via proxy, falling back to direct URL:', err.message);
        // Last-ditch: try loading directly (may taint canvas but worth a try)
        return url;
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
        // Give React one more tick to paint the base64 images
        await new Promise((r) => setTimeout(r, 200));

        const canvas = await html2canvas(cardRef.current, {
            scale: 2,
            useCORS: true,      // still try direct CORS as a secondary attempt
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
        if (!member || !cardRef.current) return;
        setSharing(true);

        const cleanMobile = (member.mobile || '').replace(/\D/g, '');
        const targetMobile = cleanMobile.length === 10 ? `91${cleanMobile}` : cleanMobile;

        try {
            const blob = await generateCardBlob();
            const fileName = `${(member.name || 'member').replace(/\s+/g, '-')}-membership-card.png`;
            const file = new File([blob], fileName, { type: 'image/png' });

            const shareData = {
                title: `${opts.gymName || 'Gym'} Membership Card`,
                text: message,
                files: [file],
            };

            if (navigator.canShare?.(shareData)) {
                // ── Mobile / PWA — native share sheet ──
                await navigator.share(shareData);
            } else {
                // ── Desktop / laptop fallback ──
                // 1. Download the card image so the user can attach it manually
                const objectUrl = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = objectUrl;
                a.download = fileName;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                setTimeout(() => URL.revokeObjectURL(objectUrl), 3000);

                // 2. Open WhatsApp web/desktop directly to the member's number
                const fallbackMsg =
                    message +
                    '\n\n📎 *Membership card has been downloaded* — please attach it to this chat.';
                window.open(
                    `https://wa.me/${targetMobile}?text=${encodeURIComponent(fallbackMsg)}`,
                    '_blank'
                );
            }

            opts.onSuccess?.();
        } catch (err) {
            // AbortError = user cancelled the share sheet — not a real error
            if (err?.name !== 'AbortError') {
                console.error('[WhatsAppCardShare] Share failed:', err);
                opts.onError
                    ? opts.onError(err)
                    : alert('Unable to share the membership card. Please try again.');
            }
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
        const cleanMobile = (member.mobile || '').replace(/\D/g, '');
        const targetMobile = cleanMobile.length === 10 ? `91${cleanMobile}` : cleanMobile;
        window.open(
            `https://wa.me/${targetMobile}?text=${encodeURIComponent(message)}`,
            '_blank'
        );
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
