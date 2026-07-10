/**
 * @swagger
 * components:
 *   schemas:
 *     Notification:
 *       type: object
 *       properties:
 *         _id: { type: string }
 *         recipientId: { type: string }
 *         type: { type: string }
 *         title: { type: string }
 *         message: { type: string }
 *         relatedEntityType: { type: string, nullable: true }
 *         relatedEntityId: { type: string, nullable: true }
 *         read: { type: boolean }
 *         readAt: { type: string, format: date-time, nullable: true }
 *         createdAt: { type: string, format: date-time }
 *
 * /api/notifications:
 *   get:
 *     summary: List the authenticated user's own notifications (paginated, newest first)
 *     tags: [Notification]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *       - in: query
 *         name: unreadOnly
 *         schema: { type: boolean, default: false }
 *     responses:
 *       200:
 *         description: Paginated notification list
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code: { type: integer, example: 200 }
 *                 data:
 *                   type: object
 *                   properties:
 *                     items: { type: array, items: { $ref: '#/components/schemas/Notification' } }
 *                     pagination: { $ref: '#/components/schemas/PaginationMeta' }
 *                 msg: { type: string }
 *
 * /api/notifications/unread-count:
 *   get:
 *     summary: Get the authenticated user's unread notification count
 *     tags: [Notification]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: "{ count }"
 *
 * /api/notifications/mark-all-read:
 *   patch:
 *     summary: Mark all of the authenticated user's notifications as read
 *     tags: [Notification]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: All notifications marked as read
 *
 * /api/notifications/{id}/read:
 *   patch:
 *     summary: Mark a single notification as read
 *     tags: [Notification]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Notification marked as read
 *       404:
 *         description: Notification not found, or does not belong to this user
 */

module.exports = {};
