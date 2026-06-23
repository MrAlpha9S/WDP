/**
 * @swagger
 * /api/jockey/{uid}:
 *   post:
 *     summary: Create jockey profile for an existing user
 *     tags: [Jockey]
 *     parameters:
 *       - in: path
 *         name: uid
 *         required: true
 *         schema: { type: string }
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [height, weight]
 *             properties:
 *               height: { type: number, example: 165 }
 *               weight: { type: number, example: 55 }
 *               licenseNumber: { type: string }
 *     responses:
 *       201:
 *         description: Jockey profile created
 *       409:
 *         description: Jockey profile already exists
 *
 * /api/jockey/top:
 *   get:
 *     summary: Get top-ranked jockeys by wins
 *     tags: [Jockey]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *     responses:
 *       200:
 *         description: Top jockeys list
 *
 * /api/jockey/status/{status}:
 *   get:
 *     summary: Get jockeys by status
 *     tags: [Jockey]
 *     parameters:
 *       - in: path
 *         name: status
 *         required: true
 *         schema:
 *           type: string
 *           enum: [active, inactive, retired]
 *     responses:
 *       200:
 *         description: Jockeys with the given status
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
 * /api/jockey/change-password:
 *   post:
 *     summary: Change jockey account password (admin accounts are blocked)
 *     tags: [Jockey]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [oldPassword, newPassword, confirmPassword]
 *             properties:
 *               oldPassword:
 *                 type: string
 *                 example: OldPass123!
 *               newPassword:
 *                 type: string
 *                 description: "Min 8 chars: uppercase + lowercase + number + special char"
 *                 example: NewPass456!
 *               confirmPassword:
 *                 type: string
 *                 example: NewPass456!
 *     responses:
 *       200:
 *         description: Password changed successfully
 *       400:
 *         description: Validation error (missing fields, mismatch, weak password, or Google OAuth account)
 *       401:
 *         description: Old password incorrect
 *       403:
 *         description: Admin accounts cannot change password
 *
 * /api/jockey/my-stats:
 *   get:
 *     summary: Get the authenticated jockey's race statistics
 *     tags: [Jockey]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Jockey statistics (wins, matches, rank, etc.)
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
 * /api/jockey/race-history:
 *   get:
 *     summary: Get jockey's completed race results (paginated)
 *     description: Returns races with recorded RaceResult entries for registrations the jockey was accepted for.
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
 *           enum: [raceDate, createdAt, finishPosition, prizeMoney]
 *           default: raceDate
 *       - in: query
 *         name: order
 *         schema: { type: string, enum: [asc, desc], default: desc }
 *     responses:
 *       200:
 *         description: Paginated race history with results
 *
 * /api/jockey/view-race-history:
 *   get:
 *     summary: Get races where the jockey was the confirmed official rider (via jockeyInRaceId)
 *     description: >
 *       Returns all race rounds where the jockey was selected as the confirmed
 *       official rider (Registration.jockeyInRaceId points to one of their Invitation._id).
 *       Includes past and upcoming races with raceRound, tournament, raceResult, and violations.
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
 *         schema: { type: string, enum: [asc, desc], default: desc }
 *     responses:
 *       200:
 *         description: Paginated list of races the jockey officially rode in
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code: { type: integer, example: 200 }
 *                 data:
 *                   type: object
 *                   properties:
 *                     items:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           registration: { type: object }
 *                           invitation: { type: object }
 *                           horse: { type: object }
 *                           raceRound: { type: object }
 *                           tournament: { type: object }
 *                           raceResult: { type: object, nullable: true }
 *                           violations: { type: array }
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         totalItems: { type: integer }
 *                         totalPages: { type: integer }
 *                         currentPage: { type: integer }
 *                         limit: { type: integer }
 *                 msg: { type: string }
 *
 * /api/jockey/horses/{horseId}:
 *   get:
 *     summary: Get horse detail with full race history (for jockey research)
 *     description: >
 *       Returns horse info, owner full name, and a full race history for the horse.
 *       Each history entry contains the Registration, RaceRound, and RaceResult.
 *       Sorted by race date descending.
 *     tags: [Jockey]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: horseId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Horse detail with race history
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code: { type: integer, example: 200 }
 *                 data:
 *                   type: object
 *                   properties:
 *                     horse: { type: object }
 *                     owner:
 *                       type: object
 *                       properties:
 *                         ownerId: { type: string }
 *                         fullName: { type: string }
 *                     raceHistory:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           registration: { type: object }
 *                           raceRound: { type: object }
 *                           raceResult: { type: object, nullable: true }
 *                 msg: { type: string }
 *       404:
 *         description: Horse not found
 *
 * /api/jockey/record-win:
 *   post:
 *     summary: Manually increment jockey win count (admin/testing use)
 *     tags: [Jockey]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Win recorded
 *
 * /api/jockey/record-match:
 *   post:
 *     summary: Manually increment jockey match count (admin/testing use)
 *     tags: [Jockey]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Match recorded
 */

module.exports = {};
