/**
 * Formats dates consistently throughout the app, independent of the browser
 * or operating-system locale.
 */
export const formatDate = (value) => {
    if (!value) return '—';

    // A date-only ISO value must be interpreted as a calendar date. Parsing it
    // as UTC can otherwise show the previous day in time zones west of UTC.
    const date = typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
        ? new Date(Number(value.slice(0, 4)), Number(value.slice(5, 7)) - 1, Number(value.slice(8, 10)))
        : new Date(value);

    if (Number.isNaN(date.getTime())) return '—';

    return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
};
