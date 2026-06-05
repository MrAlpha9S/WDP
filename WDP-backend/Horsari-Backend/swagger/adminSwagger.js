/**
 * @swagger
 * /api/admin/{uid}:
 *   post:
 *     summary: Create admin profile for an existing user (admin only)
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: uid
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the user to promote to admin
 *     responses:
 *       201:
 *         description: Admin profile created successfully
 *       400:
 *         description: Bad request
 *       404:
 *         description: Admin or user not found
 *
 * /api/admin/profile:
 *   get:
 *     summary: Get admin profile
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Admin profile
 *       404:
 *         description: Admin not found
 *
 * /api/admin/users/all:
 *   get:
 *     summary: Get all users (paginated)
 *     tags: [Admin]
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
 *     responses:
 *       200:
 *         description: List of all users
 *
 * /api/admin/users/role/{role}:
 *   get:
 *     summary: Get users by role
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: role
 *         required: true
 *         schema:
 *           type: string
 *           enum: [horseowner, jockey, referee, spectator, admin]
 *     responses:
 *       200:
 *         description: Users with specified role
 *
 * /api/admin/users/{userId}/status:
 *   put:
 *     summary: Update user status
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
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
 *               status:
 *                 type: string
 *                 enum: [active, inactive, suspended]
 *     responses:
 *       200:
 *         description: User status updated
 *
 *
 *
 * /api/admin/users/{userId}:
 *   delete:
 *     summary: Delete user
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User deleted
 *       404:
 *         description: User not found
 */

/**
 * @swagger
 * /api/admin/staticstic:
 *   get:
 *     summary: Get admin dashboard statistics
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Statistics object
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                 data:
 *                   type: object
 *                   properties:
 *                     users:
 *                       type: object
 *                       properties:
 *                         countActive:
 *                           type: integer
 *                     horseOwners:
 *                       type: object
 *                       properties:
 *                         count:
 *                           type: integer
 *                         pending:
 *                           type: integer
 *                         approved:
 *                           type: integer
 *                     jockeys:
 *                       type: object
 *                       properties:
 *                         count:
 *                           type: integer
 *                         pending:
 *                           type: integer
 *                         approved:
 *                           type: integer
 *                     tournaments:
 *                       type: object
 *                       properties:
 *                         count:
 *                           type: integer
 *                         scheduled:
 *                           type: integer
 *                         ongoing:
 *                           type: integer
 *                 msg:
 *                   type: string
 *             example:
 *               code: 200
 *               data:
 *                 users:
 *                   countActive: 123
 *                 horseOwners:
 *                   count: 45
 *                   pending: 5
 *                   approved: 40
 *                 jockeys:
 *                   count: 30
 *                   pending: 3
 *                   approved: 27
 *                 tournaments:
 *                   count: 12
 *                   scheduled: 4
 *                   ongoing: 2
 *               msg: Statistics retrieved successfully
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/admin/horse-owner-invitations:
 *   get:
 *     summary: Get all horse owner registrations with race, horse, and jockey invitation details
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 5
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: Enriched list of horse owner registrations
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                   example: 200
 *                 data:
 *                   type: object
 *                   properties:
 *                     items:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           registrationId:
 *                             type: string
 *                             example: "664a1b2c3d4e5f6789012345"
 *                           registration_at:
 *                             type: string
 *                             format: date-time
 *                             example: "2026-05-01T10:00:00.000Z"
 *                           registrationStatus:
 *                             type: string
 *                             enum: [pending, approved, rejected]
 *                             example: approved
 *                           raceRound:
 *                             type: object
 *                             nullable: true
 *                             properties:
 *                               raceRoundId:
 *                                 type: string
 *                               roundName:
 *                                 type: string
 *                                 example: "Quarter Final A"
 *                               raceDate:
 *                                 type: string
 *                                 format: date-time
 *                               maxParticipants:
 *                                 type: integer
 *                                 example: 10
 *                               current_participants:
 *                                 type: integer
 *                                 description: Number of accepted invitations in this race round
 *                                 example: 3
 *                               status:
 *                                 type: string
 *                                 enum: [draft, scheduled, running, completed, cancelled]
 *                                 example: scheduled
 *                           horse:
 *                             type: object
 *                             nullable: true
 *                             properties:
 *                               horseId:
 *                                 type: string
 *                               horseName:
 *                                 type: string
 *                                 example: "Thunderbolt"
 *                           invitations:
 *                             type: array
 *                             description: Only accepted or pending invitations
 *                             items:
 *                               type: object
 *                               properties:
 *                                 jockeyName:
 *                                   type: string
 *                                   example: "Sarah Miller"
 *                                 isBackup:
 *                                   type: boolean
 *                                   example: false
 *                                 status:
 *                                   type: string
 *                                   example: "accepted"
 *                           horseOwner:
 *                             type: object
 *                             nullable: true
 *                             properties:
 *                               ownerId:
 *                                 type: string
 *                               fullName:
 *                                 type: string
 *                                 example: "James Weston"
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         totalItems:
 *                           type: integer
 *                           example: 12
 *                         totalPages:
 *                           type: integer
 *                           example: 3
 *                         currentPage:
 *                           type: integer
 *                           example: 1
 *                         limit:
 *                           type: integer
 *                           example: 5
 *                 msg:
 *                   type: string
 *                   example: "Horse owner invitations retrieved successfully"
 *             example:
 *               code: 200
 *               data:
 *                 items:
 *                   - registrationId: "664a1b2c3d4e5f6789012345"
 *                     registration_at: "2026-05-01T10:00:00.000Z"
 *                     registrationStatus: "approved"
 *                     raceRound:
 *                       raceRoundId: "664a000000000000000000aa"
 *                       roundName: "Quarter Final A"
 *                       raceDate: "2026-06-10T08:00:00.000Z"
 *                       maxParticipants: 10
 *                       current_participants: 3
 *                       status: "scheduled"
 *                     horse:
 *                       horseId: "664a000000000000000000bb"
 *                       horseName: "Thunderbolt"
 *                     invitations:
 *                       - jockeyName: "Sarah Miller"
 *                         isBackup: false
 *                         status: "accepted"
 *                       - jockeyName: "Mike Ross"
 *                         isBackup: true
 *                         status: "accepted"
 *                     horseOwner:
 *                       ownerId: "664a000000000000000000cc"
 *                       fullName: "James Weston"
 *                 pagination:
 *                   totalItems: 12
 *                   totalPages: 3
 *                   currentPage: 1
 *                   limit: 5
 *               msg: "Horse owner invitations retrieved successfully"
 *       401:
 *         description: Unauthorized — missing or invalid token
 *       403:
 *         description: Forbidden — admin role required
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/admin/referee-invitations:
 *   get:
 *     summary: Get all referee invitations enriched with race round and user data
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 5
 *         description: Items per page
 *     responses:
 *       200:
 *         description: Referee invitations object
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                 data:
 *                   type: object
 *                   properties:
 *                     items:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           raceReferee:
 *                             type: object
 *                             properties:
 *                               status:
 *                                 type: string
 *                           raceRound:
 *                             type: object
 *                             properties:
 *                               raceRoundId:
 *                                 type: string
 *                               roundName:
 *                                 type: string
 *                               raceDate:
 *                                 type: string
 *                               status:
 *                                 type: string
 *                           referee:
 *                             type: object
 *                             properties:
 *                               refereeId:
 *                                 type: string
 *                               user:
 *                                 type: object
 *                                 properties:
 *                                   fullName:
 *                                     type: string
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         totalItems:
 *                           type: integer
 *                         totalPages:
 *                           type: integer
 *                         currentPage:
 *                           type: integer
 *                         limit:
 *                           type: integer
 *                 msg:
 *                   type: string
 *             example:
 *               code: 200
 *               data:
 *                 items:
 *                   - raceReferee:
 *                       status: "assigned"
 *                     raceRound:
 *                       raceRoundId: "664a000000000000000000aa"
 *                       roundName: "Quarter Final A"
 *                       raceDate: "2026-06-10T08:00:00.000Z"
 *                       status: "scheduled"
 *                     referee:
 *                       refereeId: "664a000000000000000000cc"
 *                       user:
 *                         fullName: "John Doe"
 *                 pagination:
 *                   totalItems: 12
 *                   totalPages: 3
 *                   currentPage: 1
 *                   limit: 5
 *               msg: "Referee invitations retrieved successfully"
 *       401:
 *         description: Unauthorized — missing or invalid token
 *       403:
 *         description: Forbidden — admin role required
 *       500:
 *         description: Internal server error
 */

module.exports = {};
