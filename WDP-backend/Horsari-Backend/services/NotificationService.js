const NotificationRepository = require('../repositories/NotificationRepository');
const User = require('../entities/User');

class NotificationService {
    // Single entry point for creating + delivering notifications.
    // Pass either `role` (fans out to all active users of that role) or
    // `recipientIds` (explicit list of User._id), or both.
    async notify({ recipientIds, role, type, title, message, relatedEntityType = null, relatedEntityId = null, actionPayload = null }) {
        try {
            let targets = recipientIds ? recipientIds.map(String) : [];

            if (role) {
                const users = await User.find({ role, status: 'active' }, '_id').lean();
                targets.push(...users.map(u => u._id.toString()));
            }

            targets = [...new Set(targets)];
            if (!targets.length) return [];

            const docs = targets.map(recipientId => ({
                recipientId,
                type,
                title,
                message,
                relatedEntityType,
                relatedEntityId,
                actionPayload,
            }));

            const created = await NotificationRepository.createMany(docs);

            return created;
        } catch (error) {
            console.error('[NotificationService] notify error:', error.message);
            return [];
        }
    }

    async listMine(recipientId, page = 1, limit = 20, unreadOnly = false) {
        try {
            const { items, totalItems, totalPages, currentPage, limit: lim } =
                await NotificationRepository.findByRecipient(recipientId, { page, limit, unreadOnly });
            return {
                code: 200,
                data: { items, pagination: { totalItems, totalPages, currentPage, limit: lim } },
                msg: 'Notifications retrieved successfully',
            };
        } catch (error) {
            return { code: 500, msg: error.message };
        }
    }

    async getUnreadCount(recipientId) {
        try {
            const count = await NotificationRepository.countUnread(recipientId);
            return { code: 200, data: { count }, msg: 'Unread count retrieved successfully' };
        } catch (error) {
            return { code: 500, msg: error.message };
        }
    }

    async markRead(id, recipientId) {
        try {
            const updated = await NotificationRepository.markRead(id, recipientId);
            if (!updated) return { code: 404, msg: 'Notification not found.' };
            return { code: 200, data: updated, msg: 'Notification marked as read.' };
        } catch (error) {
            return { code: 500, msg: error.message };
        }
    }

    async markAllRead(recipientId) {
        try {
            await NotificationRepository.markAllRead(recipientId);
            return { code: 200, msg: 'All notifications marked as read.' };
        } catch (error) {
            return { code: 500, msg: error.message };
        }
    }
}

module.exports = new NotificationService();
