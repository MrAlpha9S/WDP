/**
 * @swagger
 * /api/admin/statistics:
 *   get:
 *     summary: Get dashboard statistics
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Counts for users, horse owners, jockeys, and tournaments
 *         content:
 *           application/json:
 *             example:
 *               code: 200
 *               data:
 *                 users: { countActive: 123 }
 *                 horseOwners: { count: 45, pending: 5, approved: 40 }
 *                 jockeys: { count: 30, pending: 3, approved: 27 }
 *                 tournaments: { count: 12, scheduled: 4, ongoing: 2 }
 *               msg: Statistics retrieved successfully
 *
 * /api/admin/users/all:
 *   get:
 *     summary: Get all users (paginated, filterable by role / search)
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: role
 *         schema: { type: string, enum: [horseowner, jockey, referee, spectator, admin, All] }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: skip
 *         schema: { type: integer, default: 0 }
 *     responses:
 *       200:
 *         description: List of users
 *
 * /api/admin/users/{userId}:
 *   get:
 *     summary: Get user detail by ID (with role entity)
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: User detail
 *       404:
 *         description: User not found
 *
 *
 *
 *
 *
 * /api/admin/tournaments:
 *   get:
 *     summary: Get all tournaments (paginated)
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *     responses:
 *       200:
 *         description: Paginated tournament list
 *
 * /api/admin/race-rounds:
 *   get:
 *     summary: Get race rounds (filterable by tournament, status, search)
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: tournament_id
 *         schema: { type: string }
 *       - in: query
 *         name: raceRound_id
 *         schema: { type: string }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, scheduled, running, completed, cancelled, prepared]
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: sortBy
 *         schema: { type: string, default: raceDate }
 *       - in: query
 *         name: order
 *         schema: { type: string, enum: [asc, desc], default: desc }
 *     responses:
 *       200:
 *         description: Paginated race round list
 *
 * /api/admin/race-rounds/{id}/detail:
 *   get:
 *     summary: Get full detail of one race round (registrations, jockeys, referees)
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Race round detail
 *       404:
 *         description: Not found
 *
 *
 * /api/admin/race-rounds/{id}/confirm-result:
 *   post:
 *     summary: Confirm and publish race results (admin sign-off)
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Results confirmed
 *
 *
 *
 *
 * /api/tournament:
 *   post:
 *     summary: Create a new tournament
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [tournamentName, startDate, endDate, location]
 *             properties:
 *               tournamentName: { type: string }
 *               description: { type: string }
 *               startDate: { type: string, format: date-time }
 *               endDate: { type: string, format: date-time }
 *               location: { type: string }
 *               status:
 *                 type: string
 *                 enum: [draft, scheduled, ongoing, completed, cancelled]
 *     responses:
 *       201:
 *         description: Tournament created
 *
 * /api/tournament/{id}:
 *   put:
 *     summary: Update a tournament
 *     tags: [Admin]
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
 *               location: { type: string }
 *               status: { type: string }
 *     responses:
 *       200:
 *         description: Tournament updated
 *       404:
 *         description: Not found
 *   delete:
 *     summary: Delete a tournament
 *     tags: [Admin]
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
 *
 * /api/raceround:
 *   post:
 *     summary: Create a new race round
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [tournamentId, roundName, raceDate, trackLength, maxParticipants, minimalRidingFees, raceGround]
 *             properties:
 *               tournamentId: { type: string }
 *               roundName: { type: string }
 *               raceDate: { type: string, format: date-time }
 *               trackLength: { type: number }
 *               maxParticipants: { type: integer }
 *               minimalRidingFees: { type: number }
 *               raceGround: { type: string }
 *               requireEntranceFees: { type: boolean }
 *               firstPlacePrize: { type: number }
 *               secondPlacePrize: { type: number }
 *               thirdPlacePrize: { type: number }
 *               currencyType: { type: string }
 *               location: { type: string }
 *               address: { type: string }
 *               eligibilityRuleId: { type: string }
 *     responses:
 *       201:
 *         description: Race round created
 *
 * /api/raceround/{id}:
 *   put:
 *     summary: Update a race round
 *     tags: [Admin]
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
 *               roundName: { type: string }
 *               raceDate: { type: string, format: date-time }
 *               trackLength: { type: number }
 *               maxParticipants: { type: integer }
 *               minimalRidingFees: { type: number }
 *               raceGround: { type: string }
 *               status: { type: string }
 *               firstPlacePrize: { type: number }
 *               secondPlacePrize: { type: number }
 *               thirdPlacePrize: { type: number }
 *     responses:
 *       200:
 *         description: Race round updated
 *       404:
 *         description: Not found
 *
 * /api/raceround/{id}/cancel:
 *   patch:
 *     summary: Cancel a race round
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Race round cancelled
 *
 *
 *
 *
 *
 *
 */
