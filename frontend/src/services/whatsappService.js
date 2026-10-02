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

export const whatsappChatUrl = (e164Number, message) => {
    const cleanNumber = String(e164Number || '').replace(/^\+/, '');
    const encodedMessage = encodeURIComponent(message);
    const isMobileDevice = typeof navigator !== 'undefined' && (
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent || '') ||
        (navigator.maxTouchPoints && navigator.maxTouchPoints > 2)
    );

    if (isMobileDevice) {
        return `whatsapp://send?phone=${cleanNumber}&text=${encodedMessage}`;
    }
    return `https://wa.me/${cleanNumber}?text=${encodedMessage}`;
};

export const openWhatsAppChat = (e164Number, message) => {
    const cleanNumber = String(e164Number || '').replace(/^\+/, '');
    const encodedMessage = encodeURIComponent(message);
    const nativeSchemeUrl = `whatsapp://send?phone=${cleanNumber}&text=${encodedMessage}`;
    const webUrl = `https://wa.me/${cleanNumber}?text=${encodedMessage}`;

    const isMobileDevice = typeof navigator !== 'undefined' && (
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent || '') ||
        (navigator.maxTouchPoints && navigator.maxTouchPoints > 2)
    );

    if (isMobileDevice) {
        // Trigger direct native scheme via anchor click.
        // This launches native WhatsApp directly without opening an intermediate wa.me/api.whatsapp.com page.
        const link = document.createElement('a');
        link.href = nativeSchemeUrl;
        link.rel = 'noopener noreferrer';
        document.body.appendChild(link);
        link.click();
        link.remove();
    } else {
        const opened = window.open(webUrl, '_blank', 'noopener,noreferrer');
        if (!opened) {
            const link = document.createElement('a');
            link.href = webUrl;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            document.body.appendChild(link);
            link.click();
            link.remove();
        }
    }
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
