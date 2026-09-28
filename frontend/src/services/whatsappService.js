/**
 * Manual WhatsApp transport.  This deliberately does not claim delivery: a
 * browser can open a share sheet or a WhatsApp chat, but cannot send media to
 * a phone number without the official WhatsApp Business API.
 */
export const normalizeWhatsAppNumber = (mobile, defaultCountryCode = '91') => {
    const digits = String(mobile || '').replace(/\D/g, '');
    const localNumber = digits.length === 10 ? digits :
        (digits.length === 12 && digits.startsWith(defaultCountryCode) ? digits.slice(defaultCountryCode.length) : null);

    // MajhiGym currently validates member mobiles as 10-digit Indian numbers.
    if (!localNumber || !/^[6-9]\d{9}$/.test(localNumber)) return null;
    return `+${defaultCountryCode}${localNumber}`;
};

export const whatsappChatUrl = (e164Number, message) =>
    `https://wa.me/${e164Number.replace(/^\+/, '')}?text=${encodeURIComponent(message)}`;

export const openWhatsAppChat = (e164Number, message) => {
    const url = whatsappChatUrl(e164Number, message);
    const opened = window.open(url, '_blank', 'noopener,noreferrer');
    // Card creation is asynchronous, which can trigger popup blockers in an
    // installed PWA. Navigation remains a reliable direct-chat fallback.
    if (!opened) window.location.assign(url);
};

export const downloadCard = (blob, filename) => {
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 3000);
};

export const shareMemberCardManually = async ({ file, blob, e164Number, message }) => {
    const shareData = { files: [file], text: message };
    if (navigator.share && navigator.canShare?.(shareData)) {
        try {
            await navigator.share(shareData);
            return { status: 'share-opened' };
        } catch (error) {
            if (error?.name === 'AbortError') return { status: 'cancelled' };
            // Some PWAs report file-share support but reject the share call.
            // Continue with the exact-number WhatsApp + download fallback.
            console.warn('[WhatsApp] Native share failed; using direct-chat fallback.', error);
        }
    }

    downloadCard(blob, file.name);
    openWhatsAppChat(e164Number, message);
    return { status: 'whatsapp-opened' };
};

// Reserved boundary for a future server-side WhatsApp Business API transport.
export const sendMemberCardWithOfficialApi = async () => {
    throw new Error('Official WhatsApp API sending is not configured.');
};
