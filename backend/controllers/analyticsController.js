const Member = require('../models/Member');

// Per-gym and per-filter cache. Payment controllers invalidate this Map after writes.
const analyticsCache = new Map();
const ANALYTICS_CACHE_TTL_MS = 2 * 60 * 1000;
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

const istDayStart = (year, month, day) => new Date(Date.UTC(year, month, day) - IST_OFFSET_MS);
const istDayEnd = (year, month, day) => new Date(Date.UTC(year, month, day, 23, 59, 59, 999) - IST_OFFSET_MS);
const invalidateRevenueCache = (gymId) => {
    const prefix = `${gymId.toString()}:`;
    for (const key of analyticsCache.keys()) if (key.startsWith(prefix)) analyticsCache.delete(key);
};

const getRevenueStats = async (req, res, next) => {
    try {
        const gymId = req.gymOwner.gym;
        const istNow = new Date(Date.now() + IST_OFFSET_MS);
        const year = istNow.getUTCFullYear();
        const month = istNow.getUTCMonth();
        const day = istNow.getUTCDate();
        const period = String(req.query.period || 'this_year').toLowerCase();
        const supportedPeriods = new Set(['today', 'this_month', 'last_month', 'this_year', 'last_year', 'all_time', 'custom']);
        if (!supportedPeriods.has(period)) return res.status(400).json({ message: 'Unsupported revenue period.' });

        const startOfToday = istDayStart(year, month, day);
        const endOfToday = istDayEnd(year, month, day);
        const startOfThisMonth = istDayStart(year, month, 1);
        const endOfThisMonth = istDayEnd(year, month + 1, 0);
        let rangeStart = istDayStart(year, 0, 1);
        let rangeEnd = endOfToday;
        let selectedLabel = 'This year';

        if (period === 'today') { rangeStart = startOfToday; rangeEnd = endOfToday; selectedLabel = 'Today'; }
        if (period === 'last_month') { rangeStart = istDayStart(year, month - 1, 1); rangeEnd = istDayEnd(year, month, 0); selectedLabel = 'Last month'; }
        if (period === 'this_year') { rangeStart = istDayStart(year, 0, 1); rangeEnd = endOfToday; selectedLabel = 'This year'; }
        if (period === 'last_year') { rangeStart = istDayStart(year - 1, 0, 1); rangeEnd = istDayEnd(year - 1, 11, 31); selectedLabel = 'Last year'; }
        if (period === 'all_time') { rangeStart = new Date(0); rangeEnd = endOfToday; selectedLabel = 'All time'; }
        if (period === 'custom') {
            const { startDate, endDate } = req.query;
            if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate || '') || !/^\d{4}-\d{2}-\d{2}$/.test(endDate || '')) return res.status(400).json({ message: 'Choose a valid start and end date.' });
            const [startYear, startMonth, startDay] = startDate.split('-').map(Number);
            const [endYear, endMonth, endDay] = endDate.split('-').map(Number);
            rangeStart = istDayStart(startYear, startMonth - 1, startDay);
            rangeEnd = istDayEnd(endYear, endMonth - 1, endDay);
            if (Number.isNaN(rangeStart.getTime()) || Number.isNaN(rangeEnd.getTime()) || rangeStart > rangeEnd) return res.status(400).json({ message: 'The selected date range is invalid.' });
            selectedLabel = `${startDate} to ${endDate}`;
        }

        const cacheKey = `${gymId}:${period}:${rangeStart.toISOString()}:${rangeEnd.toISOString()}`;
        const cached = analyticsCache.get(cacheKey);
        if (cached && Date.now() - cached.ts < ANALYTICS_CACHE_TTL_MS) return res.set('Cache-Control', 'no-store').set('X-Cache', 'HIT').json(cached.data);

        const paymentAmount = { $convert: { input: '$paymentHistory.amount', to: 'double', onError: 0, onNull: 0 } };
        const paymentAggregate = (start, end) => Member.aggregate([
            { $match: { gym: gymId, 'paymentHistory.date': { $gte: start, $lte: end } } },
            { $unwind: '$paymentHistory' },
            { $match: { 'paymentHistory.date': { $gte: start, $lte: end } } },
            { $group: { _id: null, total: { $sum: paymentAmount }, count: { $sum: 1 } } }
        ]);
        const [todayAgg, monthAgg, lastMonthAgg, pendingDuesAgg, selectedAgg, recentTransactions] = await Promise.all([
            paymentAggregate(startOfToday, endOfToday),
            paymentAggregate(startOfThisMonth, endOfThisMonth),
            paymentAggregate(istDayStart(year, month - 1, 1), istDayEnd(year, month, 0)),
            Member.aggregate([
                { $match: { gym: gymId } },
                { $project: { due: { $cond: [{ $gt: [{ $subtract: [{ $ifNull: ['$totalFee', 0] }, { $ifNull: ['$paidFee', 0] }] }, 0] }, { $subtract: [{ $ifNull: ['$totalFee', 0] }, { $ifNull: ['$paidFee', 0] }] }, 0] } } },
                { $group: { _id: null, total: { $sum: '$due' } } }
            ]),
            paymentAggregate(rangeStart, rangeEnd),
            Member.aggregate([
                // Cashflow stays a live, unfiltered ledger while only the selected total changes.
                { $match: { gym: gymId, 'paymentHistory.0': { $exists: true } } },
                { $unwind: '$paymentHistory' },
                { $sort: { 'paymentHistory.date': -1 } },
                { $limit: 50 },
                { $project: { _id: { $ifNull: ['$paymentHistory._id', '$paymentHistory.date'] }, memberId: 1, memberName: '$name', amount: paymentAmount, date: '$paymentHistory.date', type: { $ifNull: ['$paymentHistory.type', 'Cash'] }, transactionCategory: { $ifNull: ['$paymentHistory.transactionType', 'payment'] } } }
            ])
        ]);
        const data = {
            todayCollection: todayAgg[0]?.total || 0,
            thisMonthCollection: monthAgg[0]?.total || 0,
            lastMonthCollection: lastMonthAgg[0]?.total || 0,
            totalPendingDues: pendingDuesAgg[0]?.total || 0,
            selectedCollection: selectedAgg[0]?.total || 0,
            transactionCount: selectedAgg[0]?.count || 0,
            selectedLabel,
            recentTransactions
        };
        analyticsCache.set(cacheKey, { data, ts: Date.now() });
        res.set('Cache-Control', 'no-store').set('X-Cache', 'MISS').json(data);
    } catch (error) { next(error); }
};

module.exports = { getRevenueStats, analyticsCache, invalidateRevenueCache };
