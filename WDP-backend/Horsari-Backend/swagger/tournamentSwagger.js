/**
 * @swagger
 * /api/tournament:
 *   post:
 *     summary: Create a new tournament
 *     tags: [Tournament]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [tournamentName, description, startDate, endDate]
 *             properties:
 *               tournamentName: { type: string }
 *               description: { type: string }
 *               startDate: { type: string, format: date-time }
 *               endDate: { type: string, format: date-time }
 *               status:
 *                 type: string
 *                 enum: [draft, scheduled, ongoing, completed, cancelled]
 *                 default: draft
 *     responses:
 *       201:
 *         description: Tournament created (createdByAdminId is taken from the authenticated user)
 *       400:
 *         description: Missing required fields, or startDate is not before endDate
 *
 * /api/tournament/{id}:
 *   put:
 *     summary: Update a tournament
 *     description: Emits a "tournament:status_changed" socket event when status changes.
 *     tags: [Tournament]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               tournamentName: { type: string }
 *               description: { type: string }
 *               startDate: { type: string, format: date-time }
 *               endDate: { type: string, format: date-time }
 *               status: { type: string, enum: [draft, scheduled, ongoing, completed, cancelled] }
 *     responses:
 *       200:
 *         description: Tournament updated
 *       404:
 *         description: Tournament not found
 *   delete:
 *     summary: Delete a tournament
 *     tags: [Tournament]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Tournament deleted
 *       404:
 *         description: Tournament not found
 */

module.exports = {};
