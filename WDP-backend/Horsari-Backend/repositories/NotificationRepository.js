const Notification = require('../entities/Notification');

class NotificationRepository {
    async create(data) {
        const notification = new Notification(data);
        return await notification.save();
    }

    async createMany(dataArray) {
        if (!dataArray.length) return [];
        return await Notification.insertMany(dataArray);
    }

    async findById(id) {
        return await Notification.findById(id);
    }

    async findByRecipient(recipientId, { page = 1, limit = 20, unreadOnly = false } = {}) {
        const skip = (page - 1) * limit;
        const filter = { recipientId };
        if (unreadOnly) filter.read = false;

        const [items, totalItems] = await Promise.all([
            Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
            Notification.countDocuments(filter),
        ]);

        return { items, totalItems, totalPages: Math.ceil(totalItems / limit), currentPage: page, limit };
    }

    async countUnread(recipientId) {
        return await Notification.countDocuments({ recipientId, read: false });
    }

    async markRead(id, recipientId) {
        return await Notification.findOneAndUpdate(
            { _id: id, recipientId },
            { read: true, readAt: new Date() },
            { new: true }
        );
    }

    async markAllRead(recipientId) {
        return await Notification.updateMany(
            { recipientId, read: false },
            { read: true, readAt: new Date() }
        );
    }
}

module.exports = new NotificationRepository();
