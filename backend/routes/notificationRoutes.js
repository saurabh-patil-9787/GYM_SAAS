const express = require('express');
const router = express.Router();

const {
    getOwnerNotifications,
    markOwnerNotificationRead,
    getOwnerUnreadCount,
    getOwnerLatestUnread,
    broadcastAnnouncement,
    getNotificationAnalytics,
    updateNotificationStatus
} = require('../controllers/notificationController');

const { protect } = require('../middleware/authMiddleware');

// Owner notification routes
router.get('/analytics', protect, getNotificationAnalytics);
router.put('/public/:id/status', updateNotificationStatus);
router.post('/broadcast', protect, broadcastAnnouncement);
router.get('/unread-count', protect, getOwnerUnreadCount);
router.get('/latest-unread', protect, getOwnerLatestUnread);
router.get('/', protect, getOwnerNotifications);
router.put('/:id/read', protect, markOwnerNotificationRead);
// Also define read-all since frontend expects it
const Notification = require('../models/Notification');
router.put('/read-all', protect, async (req, res, next) => {
    try {
        await Notification.updateMany(
            {
                recipient: req.gymOwner._id,
                recipientType: 'GymOwner',
                isRead: false
            },
            { isRead: true }
        );
        res.json({ message: 'All notifications marked as read' });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
