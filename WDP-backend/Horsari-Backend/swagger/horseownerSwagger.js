/**
 * @swagger
 * /api/horseowner/my-horses:
 *   get:
 *     summary: Get horses owned by the authenticated horse owner (paginated)
 *     tags: [HorseOwner]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: sortBy
 *         schema: { type: string, default: createdAt }
 *       - in: query
 *         name: order
 *         schema: { type: string, enum: [asc, desc], default: desc }
 *     responses:
 *       200:
 *         description: Paginated list of owned horses
 *
 * /api/horseowner/race-invitations:
 *   get:
 *     summary: Get race round registrations (invitations) for the horse owner's horses
 *     tags: [HorseOwner]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: status
 *         schema: { type: string }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: sortBy
 *         schema: { type: string, default: createdAt }
 *       - in: query
 *         name: order
 *         schema: { type: string, enum: [asc, desc], default: desc }
 *     responses:
 *       200:
 *         description: Paginated list of race invitations with raceRound, tournament, and eligible horses
 *
 * /api/horseowner/race-rounds/{raceRoundId}/detail:
 *   get:
 *     summary: Get race detail for the authenticated horse owner
 *     description: Returns the race round info, the owner's registration (with horse and lane), all jockey invitations sent for that registration, and the race result. `registration` is null if the owner has no registration in this race.
 *     tags: [HorseOwner]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: raceRoundId
 *         required: true
 *         schema: { type: string }
 *         description: ID of the race round
 *     responses:
 *       200:
 *         description: Race detail with owner registration, invitations, and result
 *       404:
 *         description: Horse owner or race round not found
 *       500:
 *         description: Internal server error
 *
 * /api/jockey/all:
 *   get:
 *     summary: Get all jockeys (also used by horse owners to browse available jockeys)
 *     tags: [HorseOwner, Jockey]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: sortBy
 *         schema: { type: string, default: createdAt }
 *       - in: query
 *         name: order
 *         schema: { type: string, enum: [asc, desc], default: desc }
 *     responses:
 *       200:
 *         description: Paginated jockey list with user info
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code: { type: integer, example: 200 }
 *                 data:
 *                   type: object
 *                   properties:
 *                     items: { type: array, items: { type: object } }
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         totalItems: { type: integer }
 *                         totalPages: { type: integer }
 *                         currentPage: { type: integer }
 *                         limit: { type: integer }
 *                 msg: { type: string }
 *
 * /api/horseowner/registration/{registrationId}/approve:
 *   post:
 *     summary: Approve a horse registration for a race round
 *     tags: [HorseOwner]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: registrationId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Registration approved
 *       404:
 *         description: Registration not found
 *
 * /api/invitations:
 *   post:
 *     summary: Invite a jockey for a specific horse registration (HireJockey)
 *     tags: [HorseOwner]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [horseId, jockeyId, registrationId]
 *             properties:
 *               horseId:
 *                 type: string
 *               jockeyId:
 *                 type: string
 *               registrationId:
 *                 type: string
 *               percentagePayout:
 *                 type: number
 *                 description: "Jockey's share of prize money (0–100)"
 *               isBackup:
 *                 type: boolean
 *                 default: false
 *                 description: Whether this jockey is a backup rider
 *     responses:
 *       201:
 *         description: Invitation sent to jockey
 *       400:
 *         description: Validation error or duplicate invitation
 *
 * /api/horseowner/invitations:
 *   get:
 *     summary: Get all jockey invitations sent by this horse owner
 *     tags: [HorseOwner]
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
 *         description: Paginated list of jockey invitations
 */

module.exports = {};
