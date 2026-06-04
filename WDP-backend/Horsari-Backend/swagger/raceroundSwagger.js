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
 *               - roundName
 *               - raceDate
 *               - trackLength
 *               - maxParticipants
 *               - raceType
 *               - minimalRidingFees
 *             properties:
 *               tournamentId:
 *                 type: string
 *               roundName:
 *                 type: string
 *               raceDate:
 *                 type: string
 *                 format: date-time
 *               trackLength:
 *                 type: number
 *               maxParticipants:
 *                 type: integer
 *               raceType:
 *                 type: string
 *               minimalRidingFees:
 *                 type: number
 *               requireEntranceFees:
 *                 type: boolean
 *           example:
 *             tournamentId: "60f7c2b8d3e2a12f4c8b4567"
 *             roundName: "Final Round"
 *             raceDate: "2026-07-15T10:00:00.000Z"
 *             trackLength: 1200
 *             maxParticipants: 12
 *             raceType: "flat"
 *             minimalRidingFees: 50
 *             requireEntranceFees: true
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
 *               roundName:
 *                 type: string
 *               raceDate:
 *                 type: string
 *                 format: date-time
 *               trackLength:
 *                 type: number
 *               maxParticipants:
 *                 type: integer
 *               status:
 *                 type: string
 *               raceType:
 *                 type: string
 *               minimalRidingFees:
 *                 type: number
 *               requireEntranceFees:
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
