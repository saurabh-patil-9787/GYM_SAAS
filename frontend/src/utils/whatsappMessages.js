const formatDate = (date) => date
    ? new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })
    : '—';

const plan = (member) => member.planName || `${member.planDuration || 1} Month(s)`;
const money = (amount) => `\u20B9${Number(amount || 0).toLocaleString('en-IN')}`;
const gymLabel = (gymName) => `${gymName || 'Your'} Gym`;

export const MESSAGE_TYPES = [
    { key: 'expiry_reminder', label: 'expire reminder', icon: '!' },
    { key: 'renewal_reminder', label: 'renewal reminder', icon: '↻' },
    { key: 'fee_due', label: 'Payment Due Reminder', icon: '₹' },
];

const MESSAGE_GENERATORS = {
    // Sent before the plan expires.
    expiry_reminder: ({ member = {}, gymName }) =>
        `*${gymLabel(gymName)}*\n\nRenewal Reminder\n\nHello ${member.name || ''}, 👋\n\nYour membership at ${gymLabel(gymName)} is approaching its expiry date.\n\nPlan: ${plan(member)}\nExpiry Date: ${formatDate(member.expiryDate)}\n\nPlease renew your membership on time to continue your workouts without interruption. 💪\n\nWe look forward to seeing you at the gym!\n\nStay Strong. Stay Consistent. 🏋️‍♂️`,

    // Sent after the plan expires.
    renewal_reminder: ({ member = {}, gymName }) =>
        `*${gymLabel(gymName)}*\n\nExpired Membership Reminder\n\nHello ${member.name || ''}, 👋\n\nYour membership at ${gymLabel(gymName)} has expired.\n\nPrevious Plan: ${plan(member)}\nExpired On: ${formatDate(member.expiryDate)}\n\nIt's time to get back on track! 💪\nRenew your membership today and continue your fitness journey with us.\n\nWe're waiting to see you back in the gym! 🏋️‍♂️\n\nStay Strong. Stay Consistent.`,

    fee_due: ({ member = {}, gymName }) => {
        const due = Math.max(0, Number(member.totalFee || 0) - Number(member.paidFee || 0));
        return `*${gymLabel(gymName)}*\n\nPayment Due Reminder\n\nHello ${member.name || ''}, 👋\n\nThis is a friendly reminder regarding your membership payment at ${gymLabel(gymName)}.\n\nPlan: ${plan(member)}\nTotal Fee: ${money(member.totalFee)}\nPaid Amount: ${money(member.paidFee)}\nDue Amount: ${money(due)}\n\nPlease clear your pending amount at your earliest convenience.\n\nThank you for being a part of ${gymLabel(gymName)}! 💪\n\nStay Strong. Stay Consistent. 🏋️‍♂️`;
    },

    renewal_confirmation: ({ member = {}, gymName }) => {
        const due = Math.max(0, Number(member.totalFee || 0) - Number(member.paidFee || 0));
        return `*${gymLabel(gymName)}*\n\nHello ${member.name || ''},\n\nYour membership at ${gymLabel(gymName)} has been successfully renewed.\n\nPlan: ${member.planDuration || 1} Month(s)\n\nTotal Fee: ${money(member.totalFee)}\nPaid Amount: ${money(member.paidFee)}\nDue Amount: ${money(due)}\n\nNext Expiry Date: ${formatDate(member.expiryDate)}\n\nThank you!\n\nStay Strong. Stay Consistent. 💪`;
    },

    welcome: ({ member = {}, gymName }) => {
        const due = Math.max(0, Number(member.totalFee || 0) - Number(member.paidFee || 0));
        return `*${gymLabel(gymName)}*\n\nWelcome to ${gymLabel(gymName)}! 🎉\n\nHello ${member.name || ''},\n\nYour membership has been successfully registered.\n\nPlan: ${plan(member)}\nTotal Fee: ${money(member.totalFee)}\nPaid Amount: ${money(member.paidFee)}\nDue Amount: ${money(due)}\nValidity Till: ${formatDate(member.expiryDate)}\n\nWe're excited to have you on board! 💪\nStay consistent. Push your limits. Become your best self!`;
    },
};

export const generateWhatsAppMessage = (type, context = {}) =>
    (MESSAGE_GENERATORS[type] || MESSAGE_GENERATORS.expiry_reminder)(context);

export const detectMessageType = (member) => {
    if (!member) return 'expiry_reminder';
    const due = Math.max(0, Number(member.totalFee || 0) - Number(member.paidFee || 0));
    if (due > 0) return 'fee_due';
    const expiry = member.expiryDate && new Date(member.expiryDate);
    if (expiry && expiry < new Date()) return 'renewal_reminder';
    return 'expiry_reminder';
};
