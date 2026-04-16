const normalizeMobile = (mobile) => {
    if (!mobile) return '';
    return String(mobile).replace(/\D/g, '').slice(-10);
};

module.exports = {
    normalizeMobile
};
