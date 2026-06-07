const Notification = require('../models/Notification');
const Member = require('../models/Member');

// =============================
// MEMBER: GET NOTIFICATIONS (paginated)
// =============================
// @route   GET /api/member/notifications
// @access  Private (Member)
const getMemberNotifications = async (req, res, next) => {
    try {
        const page = Math.max(parseInt(req.query.page) || 1, 1);
        const limit = Math.min(parseInt(req.query.limit) || 20, 50);
        const skip = (page - 1) * limit;

        const [notifications, total, unreadCount] = await Promise.all([
            Notification.find({
                recipient: req.member._id,
                recipientType: 'Member',
                gym: req.member.gym
            })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean()
            .maxTimeMS(2000),

            Notification.countDocuments({
                recipient: req.member._id,
                recipientType: 'Member',
                gym: req.member.gym
            }),

            Notification.countDocuments({
                recipient: req.member._id,
                recipientType: 'Member',
                isRead: false,
                gym: req.member.gym
            })
        ]);

        // TELEMETRY: Mark any fetched 'sent' notifications as 'delivered'
        const sentNotifIds = notifications
            .filter(n => n.deliveryStatus === 'sent' || !n.deliveryStatus)
            .map(n => n._id);

        if (sentNotifIds.length > 0) {
            await Notification.updateMany(
                { _id: { $in: sentNotifIds } },
                { deliveryStatus: 'delivered', deliveredAt: new Date() }
            );
            // Update local array elements so response reflects the delivery change
            notifications.forEach(n => {
                if (sentNotifIds.some(id => id.toString() === n._id.toString())) {
                    n.deliveryStatus = 'delivered';
                    n.deliveredAt = new Date();
                }
            });
        }

        res.json({
            notifications,
            total,
            unreadCount,
            page,
            pages: Math.ceil(total / limit)
        });
    } catch (error) {
        next(error);
    }
};

// =============================
// MEMBER: MARK NOTIFICATION AS READ
// =============================
// @route   PUT /api/member/notifications/:id/read
// @access  Private (Member)
const markNotificationRead = async (req, res, next) => {
    try {
        const notification = await Notification.findOneAndUpdate(
            {
                _id: req.params.id,
                recipient: req.member._id,
                recipientType: 'Member',
                gym: req.member.gym
            },
            { 
                isRead: true,
                deliveryStatus: 'clicked',
                clickedAt: new Date()
            },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }

        res.json({ message: 'Notification marked as read' });
    } catch (error) {
        next(error);
    }
};

// =============================
// MEMBER: MARK ALL NOTIFICATIONS AS READ
// =============================
// @route   PUT /api/member/notifications/read-all
// @access  Private (Member)
const markAllNotificationsRead = async (req, res, next) => {
    try {
        await Notification.updateMany(
            {
                recipient: req.member._id,
                recipientType: 'Member',
                isRead: false,
                gym: req.member.gym
            },
            { 
                isRead: true,
                deliveryStatus: 'clicked',
                clickedAt: new Date()
            }
        );

        res.json({ message: 'All notifications marked as read' });
    } catch (error) {
        next(error);
    }
};

// =============================
// MEMBER: GET UNREAD COUNT
// =============================
// @route   GET /api/member/notifications/unread-count
// @access  Private (Member)
const getUnreadCount = async (req, res, next) => {
    try {
        const count = await Notification.countDocuments({
            recipient: req.member._id,
            recipientType: 'Member',
            isRead: false,
            gym: req.member.gym
        });

        res.set('Cache-Control', 'private, max-age=30');
        res.json({ count });
    } catch (error) {
        next(error);
    }
};

// =============================
// OWNER: GET NOTIFICATIONS
// =============================
// @route   GET /api/owner/notifications
// @access  Private (Owner)
const getOwnerNotifications = async (req, res, next) => {
    try {
        const page = Math.max(parseInt(req.query.page) || 1, 1);
        const limit = Math.min(parseInt(req.query.limit) || 20, 50);
        const skip = (page - 1) * limit;

        const [notifications, total, unreadCount] = await Promise.all([
            Notification.find({
                recipient: req.gymOwner._id,
                recipientType: 'GymOwner'
            })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean()
            .maxTimeMS(2000),

            Notification.countDocuments({
                recipient: req.gymOwner._id,
                recipientType: 'GymOwner'
            }),

            Notification.countDocuments({
                recipient: req.gymOwner._id,
                recipientType: 'GymOwner',
                isRead: false
            })
        ]);

        res.json({
            notifications,
            total,
            unreadCount,
            page,
            pages: Math.ceil(total / limit)
        });
    } catch (error) {
        next(error);
    }
};

// =============================
// OWNER: MARK NOTIFICATION AS READ
// =============================
// @route   PUT /api/owner/notifications/:id/read
// @access  Private (Owner)
const markOwnerNotificationRead = async (req, res, next) => {
    try {
        const notification = await Notification.findOneAndUpdate(
            {
                _id: req.params.id,
                recipient: req.gymOwner._id,
                recipientType: 'GymOwner'
            },
            { isRead: true },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }

        res.json({ message: 'Notification marked as read' });
    } catch (error) {
        next(error);
    }
};

// =============================
// OWNER: GET UNREAD COUNT
// =============================
// @route   GET /api/owner/notifications/unread-count
// @access  Private (Owner)
const getOwnerUnreadCount = async (req, res, next) => {
    try {
        const count = await Notification.countDocuments({
            recipient: req.gymOwner._id,
            recipientType: 'GymOwner',
            isRead: false
        });
        res.set('Cache-Control', 'private, max-age=30');
        res.json({ count });
    } catch (error) {
        next(error);
    }
};

// =============================
// OWNER: GET LATEST UNREAD (for toast polling)
// =============================
// @route   GET /api/owner/notifications/latest-unread
// @access  Private (Owner)
const getOwnerLatestUnread = async (req, res, next) => {
    try {
        const notifications = await Notification.find({
            recipient: req.gymOwner._id,
            recipientType: 'GymOwner',
            isRead: false
        })
        .sort({ createdAt: -1 })
        .limit(5)
        .lean()
        .maxTimeMS(2000);
        res.json(notifications);
    } catch (error) {
        next(error);
    }
};

// =============================
// OWNER: BROADCAST ANNOUNCEMENT TO ALL MEMBERS
// =============================
// @route   POST /api/notifications/broadcast
// @access  Private (Owner)
const broadcastAnnouncement = async (req, res, next) => {
    const { title, message } = req.body;

    if (!title || !message) {
        return res.status(400).json({ message: 'Title and message are required' });
    }

    try {
        const gymId = req.gymOwner.gym;

        // Fetch all approved members of this gym
        const members = await Member.find({
            gym: gymId,
            registrationStatus: 'approved'
        }).select('_id fcmTokens notificationPreferences');

        if (members.length === 0) {
            return res.status(404).json({ message: 'No members found to broadcast to' });
        }

        // Prepare notifications for all members
        const notificationsData = members.map(member => ({
            recipient: member._id,
            recipientType: 'Member',
            gym: gymId,
            title,
            message,
            type: 'gym_announcement'
        }));

        // Insert all notifications in bulk
        const createdNotifications = await Notification.insertMany(notificationsData);

        // ─── Respond immediately — don't block on FCM push delivery ──────────
        res.status(201).json({
            message: `Announcement broadcasted to ${members.length} members successfully.`,
            count: members.length
        });

        // ─── Fire-and-forget: send all FCM pushes in parallel after response ─
        setImmediate(async () => {
            try {
                const { sendPushNotification, isFCMAvailable } = require('../services/fcmService');
                if (!isFCMAvailable()) return;

                const pushTasks = members.flatMap(member => {
                    const preferences = member.notificationPreferences || {};
                    const isAnnouncementsEnabled = preferences.gymAnnouncements !== false;
                    if (!isAnnouncementsEnabled || !member.fcmTokens?.length) return [];

                    const memberNotif = createdNotifications.find(
                        n => n.recipient.toString() === member._id.toString()
                    );
                    if (!memberNotif) return [];

                    return member.fcmTokens
                        .map(t => t.token || t)
                        .filter(Boolean)
                        .map(token =>
                            sendPushNotification(token, title, message, {
                                type: 'gym_announcement',
                                link: `/member/notifications?notifId=${memberNotif._id}&action=clicked`,
                                notificationId: memberNotif._id.toString()
                            }).catch(err => console.error('[Broadcast] Push failed:', err.message))
                        );
                });

                await Promise.allSettled(pushTasks);
            } catch (err) {
                console.error('[Broadcast] Async push error:', err.message);
            }
        });
    } catch (error) {
        next(error);
    }
};

// =============================
// OWNER: GET NOTIFICATION CLICK ANALYTICS
// =============================
// @route   GET /api/notifications/analytics
// @access  Private (Owner)
const getNotificationAnalytics = async (req, res, next) => {
    try {
        const gymId = req.gymOwner.gym;

        // Group notifications sent to members of this gym by type and deliveryStatus
        const stats = await Notification.aggregate([
            {
                $match: {
                    gym: gymId,
                    recipientType: 'Member'
                }
            },
            {
                $group: {
                    _id: { type: '$type', status: '$deliveryStatus' },
                    count: { $sum: 1 }
                }
            }
        ]);

        const formatted = {};
        stats.forEach(item => {
            const type = item._id.type;
            const status = item._id.status || 'sent';
            if (!formatted[type]) {
                formatted[type] = { sent: 0, delivered: 0, clicked: 0, ignored: 0, total: 0 };
            }
            formatted[type][status] = item.count;
            formatted[type].total += item.count;
        });

        res.json(formatted);
    } catch (error) {
        next(error);
    }
};

// =============================
// PUBLIC: UPDATE NOTIFICATION DELIVERY STATUS
// =============================
// @route   PUT /api/notifications/public/:id/status
// @access  Public (PWA Service Worker / client background tracking)
const updateNotificationStatus = async (req, res, next) => {
    const { status } = req.body;
    if (!['delivered', 'clicked', 'ignored'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status' });
    }

    try {
        const updateData = { deliveryStatus: status };
        if (status === 'delivered') updateData.deliveredAt = new Date();
        if (status === 'clicked') updateData.clickedAt = new Date();
        if (status === 'ignored') updateData.ignoredAt = new Date();

        const notification = await Notification.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }

        res.json({ message: `Notification status updated to ${status}` });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getMemberNotifications,
    markNotificationRead,
    markAllNotificationsRead,
    getUnreadCount,
    getOwnerNotifications,
    markOwnerNotificationRead,
    getOwnerUnreadCount,
    getOwnerLatestUnread,
    broadcastAnnouncement,
    getNotificationAnalytics,
    updateNotificationStatus
};
