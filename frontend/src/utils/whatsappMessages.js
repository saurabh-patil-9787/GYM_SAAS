/**
 * Pre-built WhatsApp message templates for different contexts.
 * Each generator receives a context object and returns a ready-to-send string.
 */

const fmt = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const fmtLong = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }) : '—';

/**
 * @param {string}   type   - One of the MESSAGE_TYPES keys
 * @param {object}   ctx    - Context object (member, gymName, etc.)
 * @returns {string}
 */
export const generateWhatsAppMessage = (type, ctx = {}) => {
    const gen = MESSAGE_GENERATORS[type];
    if (!gen) return MESSAGE_GENERATORS.membership(ctx);
    return gen(ctx);
};

/** Available message types with labels for the UI dropdown */
export const MESSAGE_TYPES = [
    { key: 'membership',   label: '💳 Membership Card',       icon: '💳' },
    { key: 'welcome',      label: '🎉 Welcome Message',       icon: '🎉' },
    { key: 'renewal',      label: '🔄 Renewal Confirmation',   icon: '🔄' },
    { key: 'fee_due',      label: '💰 Fee Due Reminder',       icon: '💰' },
    { key: 'expired',      label: '⏰ Plan Expired Reminder',  icon: '⏰' },
    { key: 'reminder_7d',  label: '🔴 Expired 1–7 Days',      icon: '🔴' },
    { key: 'reminder_30d', label: '🟠 Expired 8–30 Days',     icon: '🟠' },
    { key: 'reminder_30p', label: '⚫ Expired 30+ Days',       icon: '⚫' },
    { key: 'birthday',     label: '🎂 Birthday Wish',          icon: '🎂' },
];

const MESSAGE_GENERATORS = {
    /** Generic membership card share */
    membership: ({ member = {}, gymName = 'Gym' }) =>
        `Hello ${member.name || ''},\n\nHere is your ${gymName} membership card.\nKeep it handy for your visits. 💪\n\n— ${gymName}`,

    /** Welcome after registration */
    welcome: ({ member = {}, gymName = 'Gym' }) => {
        const due = Math.max(0, (Number(member.totalFee) || 0) - (Number(member.paidFee) || 0));
        return `Welcome to ${gymName}! 🎉\n\nHello ${member.name || ''},\n\nYour membership has been successfully registered.\n\nPlan: ${member.planName || `${member.planDuration || 1} Month(s)`}\nTotal Fee: ₹${member.totalFee || 0}\nPaid: ₹${member.paidFee || 0}${due > 0 ? `\nDue: ₹${due}` : ''}\nValid Till: ${fmtLong(member.expiryDate)}\n\nWe're excited to have you on board! 💪\nStay consistent. Push your limits. Become your best self!\n\n— ${gymName}`;
    },

    /** After renewal */
    renewal: ({ member = {}, gymName = 'Gym' }) => {
        const due = Math.max(0, (Number(member.totalFee) || 0) - (Number(member.paidFee) || 0));
        return `Hello ${member.name || ''},\n\nYour membership at ${gymName} has been successfully renewed. ✅\n\nPlan: ${member.planName || `${member.planDuration || 1} Month(s)`}\nTotal Fee: ₹${member.totalFee || 0}\nPaid: ₹${member.paidFee || 0}\nDue: ₹${due}\nNext Expiry: ${fmtLong(member.expiryDate)}\n\nThank you!\nStay Strong. Stay Consistent. 💪\n\n— ${gymName}`;
    },

    /** Fee due reminder */
    fee_due: ({ member = {}, gymName = 'Gym' }) => {
        const due = Math.max(0, (Number(member.totalFee) || 0) - (Number(member.paidFee) || 0));
        return `Hello ${member.name || ''},\n\nThis is a friendly reminder that you have a pending balance of ₹${due} at ${gymName}.\n\nPlan: ${member.planName || `${member.planDuration || 1} Month(s)`}\nExpiry: ${fmt(member.expiryDate)}\n\nPlease clear your dues at your earliest convenience. 🙏\nThank you for being part of our gym family!\n\n— ${gymName}`;
    },

    /** Plan expired */
    expired: ({ member = {}, gymName = 'Gym' }) =>
        `Hello ${member.name || ''},\n\nYour gym membership at ${gymName} has expired on ${fmt(member.expiryDate)}.\n\nDon't break your fitness streak! 💪\nRenew your plan today and continue your journey towards a healthier you.\n\nVisit us or contact us to renew.\n\n— ${gymName}`,

    /** Follow-up: 1–7 days expired */
    reminder_7d: ({ member = {}, gymName = 'Gym' }) => {
        const days = member.daysExpired || 0;
        return `नमस्कार ${member.name || ''},\n\nतुमचा जिम प्लॅन ${days} दिवसांपूर्वी संपला आहे.\n\nतुमची फिटनेस journey थांबवू नका 💪\nआजच तुमचा प्लॅन renew करा आणि पुन्हा सुरुवात करा!\n\nआम्ही तुमच्यासोबत आहोत 🙌\n\n— ${gymName}`;
    },

    /** Follow-up: 8–30 days expired */
    reminder_30d: ({ member = {}, gymName = 'Gym' }) => {
        const days = member.daysExpired || 0;
        return `नमस्कार ${member.name || ''},\n\nतुम्हाला जिमला येऊन ${days} दिवस झाले आहेत.\n\nइतके दिवस workout मिस केल्यामुळे तुमचा progress थांबला असेल 😔\n\nआजच पुन्हा सुरुवात करा 💪\nतुमची जिम तुमची वाट पाहत आहे 😊\n\n— ${gymName}`;
    },

    /** Follow-up: 30+ days expired */
    reminder_30p: ({ member = {}, gymName = 'Gym' }) => {
        const days = member.daysExpired || 0;
        return `नमस्कार ${member.name || ''},\n\nतुम्ही जिमला येणं थांबवून ${days} दिवस झाले आहेत.\n\nआम्हाला तुमची खूप आठवण येते 😄\n\nतुमची फिटनेस journey पुन्हा सुरू करा 💪\nआजच परत या — आम्ही तुमच्यासाठी आहोत 🙌\n\n— ${gymName}`;
    },

    /** Birthday wish */
    birthday: ({ member = {}, gymName = 'Gym' }) =>
        `🎉 वाढदिवसाच्या खूप खूप शुभेच्छा ${member.name || ''}! 🎂\n\nतुम्ही आमच्या ${gymName} परिवाराचा एक महत्त्वाचा भाग आहात 💪❤️\nतुमचे फिटनेस गोल्स पूर्ण करण्यासाठी आम्ही नेहमी तुमच्यासोबत आहोत.\n\nया वर्षात तुम्हाला उत्तम आरोग्य, ताकद आणि यश मिळो हीच शुभेच्छा! 🔥\n\nKeep grinding 💪\n— ${gymName} Family`,
};

/**
 * Auto-detect the best message type based on member status.
 * @param {object} member
 * @returns {string} message type key
 */
export const detectMessageType = (member) => {
    if (!member) return 'membership';
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const exp = member.expiryDate ? new Date(member.expiryDate) : null;
    if (exp) exp.setHours(0, 0, 0, 0);
    const due = Math.max(0, (Number(member.totalFee) || 0) - (Number(member.paidFee) || 0));

    if (exp && exp < today) {
        const daysExpired = Math.floor((today - exp) / (1000 * 60 * 60 * 24));
        if (daysExpired <= 7) return 'reminder_7d';
        if (daysExpired <= 30) return 'reminder_30d';
        return 'reminder_30p';
    }
    if (due > 0) return 'fee_due';
    return 'membership';
};
