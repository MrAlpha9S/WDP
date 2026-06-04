/**
 * @swagger
 * /api/raceround:
 *   post:
 *     summary: Create a new race round
 *     tags: [RaceRound]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tournamentId
 *               - round_name
 *               - race_date
 *               - track_length
 *               - max_participants
 *               - race_type
 *               - minimal_riding_fees
 *             properties:
 *               tournamentId:
 *                 type: string
 *               round_name:
 *                 type: string
 *               race_date:
 *                 type: string
 *                 format: date-time
 *               track_length:
 *                 type: number
 *               max_participants:
 *                 type: integer
 *               race_type:
 *                 type: string
 *               minimal_riding_fees:
 *                 type: number
 *               require_entrance_fees:
 *                 type: boolean
 *           example:
 *             tournamentId: "60f7c2b8d3e2a12f4c8b4567"
 *             round_name: "Final Round"
 *             race_date: "2026-07-15T10:00:00.000Z"
 *             track_length: 1200
 *             max_participants: 12
 *             race_type: "flat"
 *             minimal_riding_fees: 50
 *             require_entrance_fees: true
 *             refereeID: "60f7c2b8d3e2a12f4c8b1234"
 *             listOwnerID:
 *               - "60f7c2b8d3e2a12f4c8b2222"
 *               - "60f7c2b8d3e2a12f4c8b3333"
 *             adminID: "60f7c2b8d3e2a12f4c8b9999"
 *     responses:
 *       201:
 *         description: RaceRound created
 *       400:
 *         description: Bad request
 *
 *   get:
 *     summary: Get all race rounds (paginated)
 *     tags: [RaceRound]
 *     security:
 *       - BearerAuth: []
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
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           description: Filter by status (draft, scheduled, running, completed, cancelled)
 *     responses:
 *       200:
 *         description: List of race rounds
 *
 * /api/raceround/tournament/{tournamentId}:
 *   get:
 *     summary: Get race rounds for a tournament
 *     tags: [RaceRound]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tournamentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Race rounds by tournament
 *
 * /api/raceround/{id}:
 *   get:
 *     summary: Get race round by ID
 *     tags: [RaceRound]
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
 *         description: RaceRound details
 *       404:
 *         description: RaceRound not found
 *   put:
 *     summary: Update race round
 *     tags: [RaceRound]
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
 *               round_name:
 *                 type: string
 *               race_date:
 *                 type: string
 *                 format: date-time
 *               track_length:
 *                 type: number
 *               max_participants:
 *                 type: integer
 *               status:
 *                 type: string
 *               race_type:
 *                 type: string
 *               minimal_riding_fees:
 *                 type: number
 *               require_entrance_fees:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: RaceRound updated
 *       404:
 *         description: RaceRound not found
 *   delete:
 *     summary: Delete race round
 *     tags: [RaceRound]
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
 *         description: RaceRound deleted
 *       404:
 *         description: RaceRound not found
 *
 * /api/raceround/status:
 *   get:
 *     summary: Get race rounds by status
 *     tags: [RaceRound]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Race rounds filtered by status
 */

module.exports = {};
