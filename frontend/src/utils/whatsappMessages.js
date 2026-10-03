import { formatDate } from './dateUtils';

// ---------- helpers ----------

const formatDateTime = (date) => date
    ? `${formatDate(date)}, ${new Date(date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}`
    : '—';

const plan = (member) => member.planName || `${member.planDuration || 1} Month(s)`;
const money = (amount) => `\u20B9${Number(amount || 0).toLocaleString('en-IN')}`;
const clean = (v) => String(v || '').replace(/\s+/g, ' ').trim();
const gymLabel = (gymName) => clean(gymName) || 'Your Gym';
const memberName = (member) => clean(member.name);
const titleCase = (value) => String(value || 'payment').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
const dueOf = (member) => Math.max(0, Number(member.totalFee || 0) - Number(member.paidFee || 0));

const startOfDay = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
const daysBetween = (from, to) => Math.round((startOfDay(to) - startOfDay(from)) / 86400000);

// Big gym-name title block (WhatsApp has no font sizes, so bold + CAPS + lines)
const LINE = '━━━━━━━━━━━━━━━━━━';
const header = (gymName, icon, title) =>
    `🏋️ *${gymLabel(gymName).toUpperCase()}*\n${LINE}\n\n${icon} *${title}*\n`;

const footer = '_Stay Strong. Stay Consistent._ 💪';

export const MESSAGE_TYPES = [
    { key: 'expiry_reminder', label: 'expire reminder', icon: '!' },
    { key: 'renewal_reminder', label: 'renewal reminder', icon: '↻' },
    { key: 'fee_due', label: 'Payment Due Reminder', icon: '₹' },
];

const MESSAGE_GENERATORS = {
    // Sent BEFORE the plan expires.
    expiry_reminder: ({ member = {}, gymName }) => {
        const left = member.expiryDate ? daysBetween(new Date(), member.expiryDate) : null;
        const urgency = left === null ? 'Your membership is about to expire.'
            : left <= 0 ? '⚠️ Your membership expires *today*.'
                : left === 1 ? '⚠️ Your membership expires *tomorrow*.'
                    : `⏳ Your membership expires in *${left} days*.`;
        return `${header(gymName, '⏳', 'EXPIRE REMINDER')}
Hello *${memberName(member)}* 👋

${urgency}

📋 *Plan:* ${plan(member)}
📅 *Expiry Date:* ${formatDate(member.expiryDate)}

Renew on time and keep your workouts going without a break.

👉 Please visit the gym or contact us to renew.

${footer}`;
    },

    // Sent AFTER the plan expires.
    renewal_reminder: ({ member = {}, gymName }) => {
        const ago = member.expiryDate ? daysBetween(member.expiryDate, new Date()) : null;
        const agoText = ago === null ? '' : ago <= 0 ? ' (today)' : ago === 1 ? ' (1 day ago)' : ` (${ago} days ago)`;
        return `${header(gymName, '🔔', 'RENEWAL REMINDER')}
Hello *${memberName(member)}* 👋

❌ Your membership has *expired*.

📋 *Previous Plan:* ${plan(member)}
📅 *Expired On:* ${formatDate(member.expiryDate)}${agoText}

Don't let your progress stop. Renew today and continue from where you left off.

👉 Please visit the gym or contact us to renew.

We are waiting to see you back! 🙌

${footer}`;
    },

    fee_due: ({ member = {}, gymName }) => `${header(gymName, '🧾', 'PAYMENT DUE REMINDER')}
Hello *${memberName(member)}* 👋

You have a pending payment for your membership.

📋 *Plan:* ${plan(member)}
💳 *Total Fee:* ${money(member.totalFee)}
✅ *Paid:* ${money(member.paidFee)}
🔴 *Balance Due:* *${money(dueOf(member))}*

👉 Please pay the balance at the earliest.

Thank you for training with us! 🙏

${footer}`,

    renewal_confirmation: ({ member = {}, gymName }) => `${header(gymName, '✅', 'MEMBERSHIP RENEWED')}
Hello *${memberName(member)}* 👋

Your membership has been renewed successfully. 🎉

📋 *Plan:* ${plan(member)}
💳 *Total Fee:* ${money(member.totalFee)}
✅ *Paid:* ${money(member.paidFee)}
🔴 *Due:* ${money(dueOf(member))}

📅 *Next Expiry Date:* *${formatDate(member.expiryDate)}*

Thank you for staying with us! 🙏

${footer}`,

    welcome: ({ member = {}, gymName }) => `${header(gymName, '🎉', 'WELCOME TO THE FAMILY')}
Hello *${memberName(member)}* 👋

Your membership is registered successfully. We are happy to have you with us!

📋 *Plan:* ${plan(member)}
💳 *Total Fee:* ${money(member.totalFee)}
✅ *Paid:* ${money(member.paidFee)}
🔴 *Due:* ${money(dueOf(member))}
📅 *Valid Till:* *${formatDate(member.expiryDate)}*

Push your limits. Become your best self! 🔥

${footer}`,
};

export const generateTransactionReceipt = ({ member = {}, transaction = {}, gymName }) => {
    const expiry = transaction.nextExpiryDate || member.expiryDate;
    const previousExpiry = transaction.previousExpiryDate;
    const due = transaction.remainingDue ?? dueOf(member);
    return `${header(gymName, '🧾', 'PAYMENT RECEIPT')}
Hello *${memberName(member)}* 👋

We have received your payment. Thank you! ✅

📌 *Category:* ${titleCase(transaction.transactionType)}
💰 *Amount Received:* *${money(transaction.amount)}* (${transaction.type || 'Cash'})
🕒 *Date & Time:* ${formatDateTime(transaction.date)}
📋 *Plan:* ${transaction.plan || plan(member)}${previousExpiry ? `\n📅 *Previous Expiry:* ${formatDate(previousExpiry)}` : ''}
${Number(transaction.discountAmount) > 0 ? `🏷️ *Discount:* ${money(transaction.discountAmount)}\n💳 *Net Total:* ${money(transaction.netTotal ?? member.totalFee)}\n` : ''}📆 *Plan Expiry:* ${formatDate(expiry)}
🔴 *Remaining Due:* ${money(due)}
👤 *Received By:* ${transaction.collectedBy || 'Gym Owner'}

Thank you for being part of *${gymLabel(gymName)}*! 🙏

${footer}`;
};

export const generateWhatsAppMessage = (type, context = {}) =>
    (MESSAGE_GENERATORS[type] || MESSAGE_GENERATORS.expiry_reminder)(context);

export const detectMessageType = (member) => {
    if (!member) return 'expiry_reminder';
    if (dueOf(member) > 0) return 'fee_due';
    const expiry = member.expiryDate && new Date(member.expiryDate);
    if (expiry && expiry < new Date()) return 'renewal_reminder';
    return 'expiry_reminder';
};
