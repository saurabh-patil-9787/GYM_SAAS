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

        const members = await Member.find({ gym: gymId }, 'paymentHistory paidFee totalFee name memberId').lean();

        let todayCollection = 0;
        let thisMonthCollection = 0;
        let totalPendingDues = 0;
        
        const monthlyData = {
            [new Date(now.getFullYear(), now.getMonth() - 3, 1).toLocaleString('default', { month: 'short' })]: 0,
            [new Date(now.getFullYear(), now.getMonth() - 2, 1).toLocaleString('default', { month: 'short' })]: 0,
            [new Date(now.getFullYear(), now.getMonth() - 1, 1).toLocaleString('default', { month: 'short' })]: 0,
        };
        
        const recentTransactions = [];

        members.forEach(member => {
            const pendingAmount = (Number(member.totalFee) || 0) - (Number(member.paidFee) || 0);
            if (pendingAmount > 0) {
                totalPendingDues += pendingAmount;
            }

            if (member.paymentHistory && member.paymentHistory.length > 0) {
                member.paymentHistory.forEach(payment => {
                    const pDate = new Date(payment.date);
                    const pAmount = Number(payment.amount) || 0;
                    
                    recentTransactions.push({
                        _id: payment._id ? payment._id.toString() : Math.random().toString(),
                        memberDbId: member._id,
                        memberId: member.memberId,
                        memberName: member.name,
                        amount: pAmount,
                        date: payment.date,
                        type: payment.type || 'Cash',
                        remark: payment.remark || '',
                        transactionCategory: payment.transactionType || 'other'
                    });

                    if (pDate >= startOfToday && pDate <= endOfToday) {
                        todayCollection += pAmount;
                    }
                    if (pDate >= startOfThisMonth && pDate <= endOfThisMonth) {
                        thisMonthCollection += pAmount;
                    }
                    
                    // Filter: Only count towards 3-months chart if it falls strictly in the past 3 months window & AFTER owner registered!
                    const ownerRegistrationDate = new Date(req.gymOwner.createdAt);
                    
                    if (pDate >= startOf3MonthsAgo && pDate <= endOfLastMonth && pDate >= ownerRegistrationDate) {
                         const monthStr = pDate.toLocaleString('default', { month: 'short' });
                         if (monthlyData[monthStr] !== undefined) {
                             monthlyData[monthStr] += pAmount;
                         }
                    }
                });
            }
        });

        const chartData = Object.keys(monthlyData).map(month => ({
            name: month,
            amount: monthlyData[month]
        }));
        
        // Sort Date Descending (Latest first) and Limit to 15
        recentTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));
        const topRecentTransactions = recentTransactions.slice(0, 15);

        res.json({
            todayCollection,
            thisMonthCollection,
            totalPendingDues,
            chartData,
            recentTransactions: topRecentTransactions
        });

    } catch (error) {
        next(error);
    }
};

module.exports = {
    getRevenueStats
};
