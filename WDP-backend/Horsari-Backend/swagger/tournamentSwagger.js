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
 *             required:
 *               - tournamentName
 *               - startDate
 *               - endDate
 *               - location
 *             properties:
 *               tournamentName:
 *                 type: string
 *               description:
 *                 type: string
 *               startDate:
 *                 type: string
 *                 format: date-time
 *               endDate:
 *                 type: string
 *                 format: date-time
 *               location:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [draft, scheduled, ongoing, completed, cancelled]
 *     responses:
 *       201:
 *         description: Tournament created
 *       400:
 *         description: Bad request
 *
 *   get:
 *     summary: Get tournaments (paginated)
 *     tags: [Tournament]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: skip
 *         schema:
 *           type: integer
 *           default: 0
 *     responses:
 *       200:
 *         description: List of tournaments
 *
 * /api/tournament/{id}:
 *   get:
 *     summary: Get tournament by ID
 *     tags: [Tournament]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Tournament details
 *       404:
 *         description: Tournament not found
 *   put:
 *     summary: Update tournament
 *     tags: [Tournament]
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
 *               tournamentName:
 *                 type: string
 *               description:
 *                 type: string
 *               startDate:
 *                 type: string
 *                 format: date-time
 *               endDate:
 *                 type: string
 *                 format: date-time
 *               location:
 *                 type: string
 *               status:
 *                 type: string
 *     responses:
 *       200:
 *         description: Tournament updated
 *       404:
 *         description: Tournament not found
 *   delete:
 *     summary: Delete tournament
 *     tags: [Tournament]
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
 *         description: Tournament deleted
 *       404:
 *         description: Tournament not found
 */

module.exports = {};
