const formatDate = (date) => date
    ? new Date(date).toLocaleDateString('en-GB')
    : '—';

const plan = (member) => member.planName || `${member.planDuration || 1} Month(s)`;
const money = (amount) => `\u20B9${Number(amount || 0).toLocaleString('en-IN')}`;
const gymLabel = (gymName) => gymName || 'Your Gym';
const formatDateTime = (date) => date ? `${new Date(date).toLocaleDateString('en-GB')} · ${new Date(date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}` : '—';
const titleCase = (value) => String(value || 'payment').replace(/_/g, ' ').replace(/\b\w/g, letter => letter.toUpperCase());

export const MESSAGE_TYPES = [
    { key: 'expiry_reminder', label: 'expire reminder', icon: '!' },
    { key: 'renewal_reminder', label: 'renewal reminder', icon: '↻' },
    { key: 'fee_due', label: 'Payment Due Reminder', icon: '₹' },
];

const MESSAGE_GENERATORS = {
    // Sent before the plan expires.
    expiry_reminder: ({ member = {}, gymName }) =>
        `*${gymLabel(gymName)}*\n━━━━━━━━━━━━━━\n⏳ *MEMBERSHIP RENEWAL REMINDER*\n\nHello ${member.name || ''} 👋\n\nYour training access is nearing its renewal date. Renew on time so your momentum never pauses. 💪\n\n🏋️ *Plan:* ${plan(member)}\n📅 *Expiry date:* ${formatDate(member.expiryDate)}\n\nPlease visit us or contact the gym to renew.\n\n_Stay strong. Stay consistent._ 🏋️‍♂️`,

    // Sent after the plan expires.
    renewal_reminder: ({ member = {}, gymName }) =>
        `*${gymLabel(gymName)}*\n━━━━━━━━━━━━━━\n🔔 *MEMBERSHIP EXPIRED*\n\nHello ${member.name || ''} 👋\n\nYour membership has expired, but your fitness journey is always welcome here.\n\n🏋️ *Previous plan:* ${plan(member)}\n📅 *Expired on:* ${formatDate(member.expiryDate)}\n\nRenew today and pick up exactly where you left off. 💪\n\n_We look forward to seeing you again!_ 🏋️‍♂️`,

    fee_due: ({ member = {}, gymName }) => {
        const due = Math.max(0, Number(member.totalFee || 0) - Number(member.paidFee || 0));
        return `*${gymLabel(gymName)}*\n━━━━━━━━━━━━━━\n🧾 *PAYMENT DUE REMINDER*\n\nHello ${member.name || ''} 👋\n\nA small balance is pending for your membership.\n\n🏋️ *Plan:* ${plan(member)}\n💳 *Total fee:* ${money(member.totalFee)}\n✅ *Received:* ${money(member.paidFee)}\n🔔 *Balance due:* ${money(due)}\n\nPlease clear the balance at your convenience. Thank you for training with us! 💪\n\n_Stay strong. Stay consistent._ 🏋️‍♂️`;
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

export const generateTransactionReceipt = ({ member = {}, transaction = {}, gymName }) => {
    const expiry = transaction.nextExpiryDate || member.expiryDate;
    const previousExpiry = transaction.previousExpiryDate;
    const due = transaction.remainingDue ?? Math.max(0, Number(member.totalFee || 0) - Number(member.paidFee || 0));
    return `*${gymLabel(gymName)}*\n━━━━━━━━━━━━━━\n🧾 *PAYMENT RECEIPT*\n\nHello ${member.name || ''} 👋\n\nYour transaction has been recorded successfully.\n\n📌 *Category:* ${titleCase(transaction.transactionType)}\n💳 *Amount received:* ${money(transaction.amount)} (${transaction.type || 'Cash'})\n🕒 *Date & time:* ${formatDateTime(transaction.date)}\n🏋️ *Plan:* ${transaction.plan || plan(member)}${previousExpiry ? `\n📅 *Previous expiry:* ${formatDate(previousExpiry)}` : ''}\n📆 *Plan expiry:* ${formatDate(expiry)}\n💰 *Remaining due:* ${money(due)}\n👤 *Received by:* ${transaction.collectedBy || 'Gym Owner'}\n\nThank you for being part of *${gymLabel(gymName)}*! 💪\n\n_Stay strong. Stay consistent._ 🏋️‍♂️`;
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
