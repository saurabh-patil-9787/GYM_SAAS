const Member = require('../models/Member');

// =============================
// GET REVENUE STATS
// =============================
const getRevenueStats = async (req, res, next) => {
    try {
        const gymId = req.gymOwner.gym;
        const now = new Date();
        
        // Exact Today Bounds (00:00:00 to 23:59:59.999)
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
        
        // Exact Month Bounds (1st to last day 23:59:59.999)
        const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfThisMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        
        // Exact Past 3 Months Bounds (Strictly Historical, Excluding Current Month)
        const startOf3MonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
        const ownerRegistrationDate = req.gymOwner.createdAt ? new Date(req.gymOwner.createdAt) : new Date(0);

        // 1. Total Pending Dues (Aggregated directly in DB)
        const pendingDuesAgg = await Member.aggregate([
            { $match: { gym: gymId } },
            { $project: { pendingAmount: { $subtract: [{ $ifNull: ["$totalFee", 0] }, { $ifNull: ["$paidFee", 0] }] } } },
            { $match: { pendingAmount: { $gt: 0 } } },
            { $group: { _id: null, totalPendingDues: { $sum: "$pendingAmount" } } }
        ]);
        const totalPendingDues = pendingDuesAgg.length > 0 ? pendingDuesAgg[0].totalPendingDues : 0;

        // 2. Top 15 Recent Transactions (Sorted across entire gym in DB)
        const recentTransactions = await Member.aggregate([
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
        ]);

        // 3. Today Collection (Pure Aggregation)
        const todayCollectionAgg = await Member.aggregate([
            { $match: { gym: gymId, "paymentHistory.date": { $gte: startOfToday, $lte: endOfToday } } },
            { $unwind: { path: "$paymentHistory", preserveNullAndEmptyArrays: true } },
            { $match: { "paymentHistory.date": { $gte: startOfToday, $lte: endOfToday } } },
            { $group: { _id: null, total: { $sum: { $convert: { input: "$paymentHistory.amount", to: "double", onError: 0, onNull: 0 } } } } }
        ]);
        const todayCollection = todayCollectionAgg.length > 0 ? todayCollectionAgg[0].total : 0;

        // 4. This Month Collection (Pure Aggregation)
        const thisMonthCollectionAgg = await Member.aggregate([
            { $match: { gym: gymId, "paymentHistory.date": { $gte: startOfThisMonth, $lte: endOfThisMonth } } },
            { $unwind: { path: "$paymentHistory", preserveNullAndEmptyArrays: true } },
            { $match: { "paymentHistory.date": { $gte: startOfThisMonth, $lte: endOfThisMonth } } },
            { $group: { _id: null, total: { $sum: { $convert: { input: "$paymentHistory.amount", to: "double", onError: 0, onNull: 0 } } } } }
        ]);
        const thisMonthCollection = thisMonthCollectionAgg.length > 0 ? thisMonthCollectionAgg[0].total : 0;

        // 5. Monthly Chart Data (Aggregated via grouping by month)
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        
        const monthlyDataAgg = await Member.aggregate([
            { $match: { gym: gymId, "paymentHistory.date": { $gte: startOf3MonthsAgo, $lte: endOfLastMonth } } },
            { $unwind: { path: "$paymentHistory", preserveNullAndEmptyArrays: true } },
            { $match: { "paymentHistory.date": { $gte: startOf3MonthsAgo, $lte: endOfLastMonth, $gte: ownerRegistrationDate } } },
            { $group: { 
                _id: { $month: "$paymentHistory.date" },
                totalAmount: { $sum: { $convert: { input: "$paymentHistory.amount", to: "double", onError: 0, onNull: 0 } } }
            } }
        ]);
        
        const monthlyData = {
            [new Date(now.getFullYear(), now.getMonth() - 3, 1).toLocaleString('default', { month: 'short' })]: 0,
            [new Date(now.getFullYear(), now.getMonth() - 2, 1).toLocaleString('default', { month: 'short' })]: 0,
            [new Date(now.getFullYear(), now.getMonth() - 1, 1).toLocaleString('default', { month: 'short' })]: 0,
        };

        monthlyDataAgg.forEach(req => {
            if(req._id && req._id >= 1 && req._id <= 12) {
                const monthStr = monthNames[req._id - 1]; // _id from $month is 1-indexed
                if(monthlyData[monthStr] !== undefined) {
                    monthlyData[monthStr] = req.totalAmount;
                }
            }
        });

        const chartData = Object.keys(monthlyData).map(month => ({
            name: month,
            amount: monthlyData[month]
        }));

        res.json({
            todayCollection,
            thisMonthCollection,
            totalPendingDues,
            chartData,
            recentTransactions
        });

    } catch (error) {
        next(error);
    }
};

module.exports = {
    getRevenueStats
};
