/**
 * @swagger
 *
 *
 *
 * /api/jockey/profile:
 *   get:
 *     summary: Get authenticated jockey's profile (with user details)
 *     tags: [Jockey]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Jockey profile
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code: { type: integer, example: 200 }
 *                 data:
 *                   type: object
 *                   properties:
 *                     jockeyId: { type: string }
 *                     height: { type: number }
 *                     weight: { type: number }
 *                     matchesRaced: { type: number }
 *                     totalWins: { type: number }
 *                     ranking: { type: number }
 *                     status: { type: string }
 *                     licenseLink: { type: string }
 *                     licenseStatus: { type: string }
 *                     user:
 *                       type: object
 *                       properties:
 *                         fullName: { type: string }
 *                         email: { type: string }
 *                         phoneNumber: { type: string }
 *                         dateOfBirth: { type: string }
 *                         image: { type: string }
 *       401:
 *         description: Unauthorized
 *   put:
 *     summary: Update authenticated jockey's profile
 *     tags: [Jockey]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               height: { type: number }
 *               weight: { type: number }
 *               fullName: { type: string }
 *               phoneNumber: { type: string }
 *               dateOfBirth: { type: string, format: date }
 *               image: { type: string }
 *     responses:
 *       200:
 *         description: Profile updated
 *
 *
 *
 * /api/jockey/invitations:
 *   get:
 *     summary: Get jockey's race invitations (paginated, filterable by status)
 *     tags: [Jockey]
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
 *         schema:
 *           type: string
 *           enum: [pending, accepted, rejected]
 *         description: Filter by invitation status (defaults to pending + accepted if omitted)
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, updatedAt, invitationStatus, percentagePayout, raceDate]
 *           default: createdAt
 *       - in: query
 *         name: order
 *         schema: { type: string, enum: [asc, desc], default: desc }
 *     responses:
 *       200:
 *         description: Paginated invitations with race round and horse details
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
 * /api/jockey/invitations/respond:
 *   post:
 *     summary: Accept or reject a race invitation
 *     tags: [Jockey]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [invitationId, jockeyConfirmation]
 *             properties:
 *               invitationId:
 *                 type: string
 *               jockeyConfirmation:
 *                 type: string
 *                 enum: [accepted, rejected]
 *     responses:
 *       200:
 *         description: Response recorded
 *       404:
 *         description: Invitation not found
 *
 * /api/jockey/race-schedule:
 *   get:
 *     summary: Get upcoming races the jockey is scheduled for (accepted invitations, paginated)
 *     tags: [Jockey]
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
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [raceDate, createdAt, updatedAt]
 *           default: raceDate
 *       - in: query
 *         name: order
 *         schema: { type: string, enum: [asc, desc], default: asc }
 *     responses:
 *       200:
 *         description: Paginated upcoming race schedule
 *
 *
 *
 *
 *
 */
