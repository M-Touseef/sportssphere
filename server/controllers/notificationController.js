const Notification = require('../models/Notification');

const currentUserId = (req) => req.user.id || req.user._id;

// GET /api/notifications?isRead=true|false
exports.getMyNotifications = async (req, res, next) => {
  try {
    const { isRead } = req.query;
    const filter = { user: currentUserId(req) };

    if (isRead === 'true') filter.isRead = true;
    if (isRead === 'false') filter.isRead = false;

    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    res.json({ notifications });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/notifications/:id/read
exports.markNotificationRead = async (req, res, next) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findOneAndUpdate(
      { _id: id, user: currentUserId(req) },
      { $set: { isRead: true } },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.json({ notification });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/notifications/mark-all-read
exports.markAllRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      { user: currentUserId(req), isRead: false },
      { $set: { isRead: true } }
    );

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

// Helper for other controllers: create a notification
exports.createNotification = ({ userId, type, title, message, meta = {} }) => {
  return Notification.create({
    user: userId,
    type,
    title,
    message,
    meta,
  });
};


