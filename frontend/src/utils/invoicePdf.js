/**
 * invoicePdf.js
 * Utilities for generating, downloading, and sharing invoice PDFs.
 * Uses jsPDF + html2canvas for client-side generation.
 */

// ─────────────────────────────────────────────────────────────────────────────
// IMAGE RESOLUTION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Convert an external image URL to a base64 data: URL using the Image + Canvas API.
 * This is more reliable than fetch() for cross-origin images because:
 *  • Cloudinary, R2, S3 all set Access-Control-Allow-Origin: * for GET requests
 *  • The Image element respects crossOrigin="anonymous" to avoid canvas taint
 *  • We bypass React's virtual DOM entirely — no re-render can override the result
 *
 * Cache-busting (?_t=...) ensures a fresh CORS response (avoids opaque cached responses
 * that browsers sometimes serve from a non-CORS cache entry).
 *
 * @param {string} url - The external image URL to convert
 * @returns {Promise<string>} base64 data URL, or original URL on any failure
 */
export function resolveLogoUrl(url) {
    if (!url || url.startsWith('data:') || url.startsWith('blob:')) {
        return Promise.resolve(url);
    }

    return new Promise((resolve) => {
        const img = new window.Image();
        img.crossOrigin = 'anonymous';

        img.onload = () => {
            try {
                const canvas  = document.createElement('canvas');
                canvas.width  = img.naturalWidth  || img.width;
                canvas.height = img.naturalHeight || img.height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);
                resolve(canvas.toDataURL('image/png'));
            } catch {
                // Canvas taint — server didn't send CORS headers; fall back gracefully
                resolve(url);
            }
        };

        img.onerror = () => resolve(url);

        // Append cache-buster ONLY if the server allows it (won't hurt Cloudinary/R2)
        const sep = url.includes('?') ? '&' : '?';
        img.src = `${url}${sep}_t=${Date.now()}`;
    });
}

// ─────────────────────────────────────────────────────────────────────────────
// PDF GENERATION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generates a PDF blob from a rendered InvoicePreview DOM node.
 * By the time this is called, gymSettings.logoUrl should already be a base64
 * data URL (resolved via resolveLogoUrl before setting state), so html2canvas
 * captures it without any cross-origin issues.
 *
 * @param {HTMLElement} invoiceEl - The DOM element to capture
 * @returns {Promise<Blob>} PDF blob
 */
export async function generatePdfFromElement(invoiceEl) {
    const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf'),
    ]);

    const canvas = await html2canvas(invoiceEl, {
        scale:           2,        // 2× for retina / crisp PDF
        useCORS:         true,     // safety net for any remaining external urls
        allowTaint:      false,    // keep canvas exportable as toDataURL
        backgroundColor: '#ffffff',
        logging:         false,
        imageTimeout:    10000,    // 10 s per image
    });

    const imgData   = canvas.toDataURL('image/png');
    const A4_W      = 210;
    const A4_H      = 297;
    const pdf       = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const imgWidth  = A4_W;
    const imgHeight = (canvas.height * A4_W) / canvas.width;

    let yOffset   = 0;
    let remaining = imgHeight;
    while (remaining > 0) {
        pdf.addImage(imgData, 'PNG', 0, yOffset < 0 ? yOffset : 0, imgWidth, imgHeight);
        remaining -= A4_H;
        if (remaining > 0) {
            pdf.addPage();
            yOffset -= A4_H;
        }
    }

    return pdf.output('blob');
}

// ─────────────────────────────────────────────────────────────────────────────
// DOWNLOAD
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Triggers a browser download of a PDF blob.
 */
export function downloadPdf(blob, invoiceNumber, memberName, gymName = 'MajhiGym') {
    const safeNum    = invoiceNumber.replace(/\//g, '-');
    const safeMember = (memberName || 'Member').replace(/\s+/g, '-');
    const safeGym    = (gymName    || 'Gym').replace(/\s+/g, '-');
    const filename   = `${safeGym}_${safeNum}_${safeMember}.pdf`;

    const url = URL.createObjectURL(blob);
    const a   = document.createElement('a');
    a.href     = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return filename;
}

// ─────────────────────────────────────────────────────────────────────────────
// SHARE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Attempts to share a PDF via the Web Share API (Level 2).
 * Falls back to download if sharing is not supported or fails.
 */
export async function sharePdf(blob, invoiceNumber, memberName, gymName = 'MajhiGym') {
    const safeNum    = invoiceNumber.replace(/\//g, '-');
    const safeMember = (memberName || 'Member').replace(/\s+/g, '-');
    const safeGym    = (gymName    || 'Gym').replace(/\s+/g, '-');
    const filename   = `${safeGym}_${safeNum}_${safeMember}.pdf`;

    if (navigator.canShare && navigator.share) {
        const file = new File([blob], filename, { type: 'application/pdf' });
        if (navigator.canShare({ files: [file] })) {
            try {
                await navigator.share({
                    title: `Invoice ${invoiceNumber}`,
                    text:  `Invoice for ${memberName}`,
                    files: [file],
                });
                return { shared: true, downloaded: false };
            } catch (err) {
                if (err.name === 'AbortError') {
                    return { shared: false, downloaded: false };
                }
            }
        }
    }

    downloadPdf(blob, invoiceNumber, memberName, gymName);
    return { shared: false, downloaded: true };
}
