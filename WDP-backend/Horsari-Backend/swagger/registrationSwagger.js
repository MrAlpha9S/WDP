/**
 * @swagger
 * /api/registration:
 *   post:
 *     summary: Create a new registration for a race round
 *     tags: [Registration]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - raceRoundId
 *               - horseOwnerId
 *             properties:
 *               raceRoundId:
 *                 type: string
 *               horseOwnerId:
 *                 type: string
 *               registration_status:
 *                 type: string
 *                 enum: [pending, approved, rejected]
 *     responses:
 *       201:
 *         description: Registration created
 *       400:
 *         description: Bad request
 *
 * /api/registration/{id}:
 *   get:
 *     summary: Get registration by ID
 *     tags: [Registration]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Registration details
 *       404:
 *         description: Registration not found
 *   put:
 *     summary: Update registration (owner or admin)
 *     tags: [Registration]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               registration_status:
 *                 type: string
 *                 enum: [pending, approved, rejected]
 *     responses:
 *       200:
 *         description: Registration updated
 *       404:
 *         description: Registration not found
 *
 * /api/registration/owner/{ownerId}:
 *   get:
 *     summary: Get registrations for a horse owner
 *     tags: [Registration]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: ownerId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of registrations for owner
 */

module.exports = {};
