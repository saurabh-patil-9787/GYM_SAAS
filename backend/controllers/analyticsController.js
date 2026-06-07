const Member = require('../models/Member');

// ─── Analytics In-Memory Cache (per-gym, 2-minute TTL) ────────────────────────
// Simple Map — sufficient for single-instance Render deployment at current scale.
// Exported so memberController can invalidate when a payment is recorded.
const analyticsCache = new Map();
const ANALYTICS_CACHE_TTL_MS = 2 * 60 * 1000; // 2 minutes

// =============================
// GET REVENUE STATS
// =============================
const getRevenueStats = async (req, res, next) => {
    try {
        const gymId = req.gymOwner.gym;
        // Calculate IST Time (UTC +5:30) to enforce correct boundaries
        const rawDate = new Date();
        const istOffsetMs = 5.5 * 60 * 60 * 1000;
        const istNow = new Date(rawDate.getTime() + istOffsetMs);
        
        const year = istNow.getUTCFullYear();
        const month = istNow.getUTCMonth();
        const date = istNow.getUTCDate();
        
        // Create Exact Bounds by offsetting back to UTC
        const startOfToday = new Date(Date.UTC(year, month, date) - istOffsetMs);
        const endOfToday = new Date(Date.UTC(year, month, date, 23, 59, 59, 999) - istOffsetMs);
        
        const startOfThisMonth = new Date(Date.UTC(year, month, 1) - istOffsetMs);
        const endOfThisMonth = new Date(Date.UTC(year, month + 1, 0, 23, 59, 59, 999) - istOffsetMs);
        
        // Past 2 Months + Current Month
        const startOf3MonthsAgo = new Date(Date.UTC(year, month - 2, 1) - istOffsetMs);
        const endOfLastMonth = endOfThisMonth; // Chart ends with the current month
        const ownerRegistrationDate = req.gymOwner.createdAt ? new Date(req.gymOwner.createdAt) : new Date(0);

        // Combine both lower bounds: chart start (3 months ago) AND owner registration date
        const effectiveChartStart = ownerRegistrationDate > startOf3MonthsAgo ? ownerRegistrationDate : startOf3MonthsAgo;

        const gymIdStr = gymId.toString();

        // ─── In-Memory Cache Check (2-minute TTL per gym) ─────────────────────
        const cached = analyticsCache.get(gymIdStr);
        if (cached && Date.now() - cached.ts < ANALYTICS_CACHE_TTL_MS) {
            return res
                .set('Cache-Control', 'private, max-age=120')
                .set('X-Cache', 'HIT')
                .json(cached.data);
        }

        // ─── Run all 5 aggregations in parallel ───────────────────────────────
        const [
            pendingDuesAgg,
            recentTransactions,
            todayCollectionAgg,
            thisMonthCollectionAgg,
            monthlyDataAgg
        ] = await Promise.all([

            // 1. Total Pending Dues
            Member.aggregate([
                { $match: { gym: gymId } },
                { $project: { pendingAmount: { $subtract: [{ $ifNull: ["$totalFee", 0] }, { $ifNull: ["$paidFee", 0] }] } } },
                { $match: { pendingAmount: { $gt: 0 } } },
                { $group: { _id: null, totalPendingDues: { $sum: "$pendingAmount" } } }
            ]),

            // 2. Top 15 Recent Transactions
            Member.aggregate([
                { $match: { gym: gymId, "paymentHistory.0": { $exists: true } } },
                { $unwind: { path: "$paymentHistory", preserveNullAndEmptyArrays: true } },
                { $sort: { "paymentHistory.date": -1 } },
                { $limit: 15 },
                { $project: {
                    _id: { $ifNull: ["$paymentHistory._id", "$paymentHistory.date"] },
                    memberDbId: "$_id",
                    memberId: 1,
                    memberName: "$name",
                    amount: { $convert: { input: "$paymentHistory.amount", to: "double", onError: 0, onNull: 0 } },
                    date: "$paymentHistory.date",
                    type: { $ifNull: ["$paymentHistory.type", "Cash"] },
                    remark: { $ifNull: ["$paymentHistory.remark", ""] },
                    transactionCategory: { $ifNull: ["$paymentHistory.transactionType", "other"] }
                }}
            ]),

            // 3. Today Collection
            Member.aggregate([
                { $match: { gym: gymId, "paymentHistory.date": { $gte: startOfToday, $lte: endOfToday } } },
                { $unwind: { path: "$paymentHistory", preserveNullAndEmptyArrays: true } },
                { $match: { "paymentHistory.date": { $gte: startOfToday, $lte: endOfToday } } },
                { $group: { _id: null, total: { $sum: { $convert: { input: "$paymentHistory.amount", to: "double", onError: 0, onNull: 0 } } } } }
            ]),

            // 4. This Month Collection
            Member.aggregate([
                { $match: { gym: gymId, "paymentHistory.date": { $gte: startOfThisMonth, $lte: endOfThisMonth } } },
                { $unwind: { path: "$paymentHistory", preserveNullAndEmptyArrays: true } },
                { $match: { "paymentHistory.date": { $gte: startOfThisMonth, $lte: endOfThisMonth } } },
                { $group: { _id: null, total: { $sum: { $convert: { input: "$paymentHistory.amount", to: "double", onError: 0, onNull: 0 } } } } }
            ]),

            // 5. Monthly Chart Data
            Member.aggregate([
                { $match: { gym: gymId, "paymentHistory.date": { $gte: effectiveChartStart, $lte: endOfLastMonth } } },
                { $unwind: { path: "$paymentHistory", preserveNullAndEmptyArrays: true } },
                { $match: { "paymentHistory.date": { $gte: effectiveChartStart, $lte: endOfLastMonth } } },
                { $group: {
                    _id: { $month: "$paymentHistory.date" },
                    totalAmount: { $sum: { $convert: { input: "$paymentHistory.amount", to: "double", onError: 0, onNull: 0 } } }
                } }
            ])
        ]);

        // ─── Post-process results ─────────────────────────────────────────────
        const totalPendingDues = pendingDuesAgg.length > 0 ? pendingDuesAgg[0].totalPendingDues : 0;
        const todayCollection = todayCollectionAgg.length > 0 ? todayCollectionAgg[0].total : 0;
        const thisMonthCollection = thisMonthCollectionAgg.length > 0 ? thisMonthCollectionAgg[0].total : 0;

        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const monthlyData = {
            [monthNames[(month - 2 + 12) % 12]]: 0,
            [monthNames[(month - 1 + 12) % 12]]: 0,
            [monthNames[(month + 12) % 12]]: 0,
        };

        monthlyDataAgg.forEach(entry => {
            if(entry._id && entry._id >= 1 && entry._id <= 12) {
                const monthStr = monthNames[entry._id - 1]; // _id from $month is 1-indexed
                if(monthlyData[monthStr] !== undefined) {
                    monthlyData[monthStr] = entry.totalAmount;
                }
            }
        });

        const chartData = Object.keys(monthlyData).map(m => ({
            name: m,
            amount: monthlyData[m]
        }));

        const responseData = {
            todayCollection,
            thisMonthCollection,
            totalPendingDues,
            chartData,
            recentTransactions
        };

        // Store result in cache
        analyticsCache.set(gymIdStr, { data: responseData, ts: Date.now() });

        res
            .set('Cache-Control', 'private, max-age=120')
            .set('X-Cache', 'MISS')
            .json(responseData);

    } catch (error) {
        next(error);
    }
};

module.exports = {
    getRevenueStats,
    analyticsCache  // exported so memberController can invalidate when a payment is recorded
};
