/**
 * @swagger
 * tags:
 *   name: Jockey
 *   description: Jockey profile management and race operations
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     JockeyProfile:
 *       type: object
 *       properties:
 *         jockeyId:
 *           type: string
 *         height:
 *           type: number
 *         weight:
 *           type: number
 *         matchesRaced:
 *           type: number
 *         totalWins:
 *           type: number
 *         ranking:
 *           type: number
 *           nullable: true
 *         status:
 *           type: string
 *           enum: [active, inactive, retired]
 *         licenseLink:
 *           type: string
 *           nullable: true
 *         licenseStatus:
 *           type: string
 *           enum: [pending, approved, rejected]
 *         user:
 *           type: object
 *           properties:
 *             fullName:
 *               type: string
 *             userName:
 *               type: string
 *             email:
 *               type: string
 *             dateOfBirth:
 *               type: string
 *               format: date-time
 *             phoneNumber:
 *               type: string
 *             image:
 *               type: string
 *               nullable: true
 *
 *     JockeyStats:
 *       type: object
 *       properties:
 *         matchesRaced:
 *           type: number
 *         totalWins:
 *           type: number
 *         winRate:
 *           type: string
 *           example: "54.93%"
 *         ranking:
 *           type: number
 *           nullable: true
 *
 *     InvitationItem:
 *       type: object
 *       properties:
 *         invitationId:
 *           type: string
 *         invitationStatus:
 *           type: string
 *           enum: [pending, accepted, declined, cancelled]
 *         ownerConfirmation:
 *           type: boolean
 *         jockeyConfirmation:
 *           type: boolean
 *         isBackup:
 *           type: boolean
 *         percentagePayout:
 *           type: number
 *         horse:
 *           type: object
 *           nullable: true
 *           properties:
 *             horseId:
 *               type: string
 *             horseName:
 *               type: string
 *             breed:
 *               type: string
 *             gender:
 *               type: string
 *         registration:
 *           type: object
 *           nullable: true
 *           properties:
 *             registrationId:
 *               type: string
 *             registrationStatus:
 *               type: string
 *             registeredAt:
 *               type: string
 *               format: date-time
 *         horseOwner:
 *           type: object
 *           nullable: true
 *           properties:
 *             ownerId:
 *               type: string
 *             user:
 *               type: object
 *               properties:
 *                 fullName:
 *                   type: string
 *                 phoneNumber:
 *                   type: string
 *         raceRound:
 *           type: object
 *           nullable: true
 *           properties:
 *             raceRoundId:
 *               type: string
 *             roundName:
 *               type: string
 *             raceDate:
 *               type: string
 *               format: date-time
 *               nullable: true
 *             trackLength:
 *               type: number
 *             location:
 *               type: string
 *             raceGround:
 *               type: string
 *             status:
 *               type: string
 *             minimalRidingFees:
 *               type: number
 *         tournament:
 *           type: object
 *           nullable: true
 *           properties:
 *             tournamentId:
 *               type: string
 *             tournamentName:
 *               type: string
 *
 *     ScheduleItem:
 *       type: object
 *       properties:
 *         invitationId:
 *           type: string
 *         isBackup:
 *           type: boolean
 *         percentagePayout:
 *           type: number
 *         horse:
 *           type: object
 *           nullable: true
 *           properties:
 *             horseId:
 *               type: string
 *             horseName:
 *               type: string
 *             breed:
 *               type: string
 *             healthStatus:
 *               type: string
 *         registration:
 *           type: object
 *           nullable: true
 *           properties:
 *             registrationId:
 *               type: string
 *         horseOwner:
 *           type: object
 *           nullable: true
 *           properties:
 *             ownerId:
 *               type: string
 *             user:
 *               type: object
 *               nullable: true
 *               properties:
 *                 fullName:
 *                   type: string
 *         raceRound:
 *           type: object
 *           nullable: true
 *           properties:
 *             raceRoundId:
 *               type: string
 *             roundName:
 *               type: string
 *             raceDate:
 *               type: string
 *               format: date-time
 *             trackLength:
 *               type: number
 *             location:
 *               type: string
 *             address:
 *               type: string
 *             raceGround:
 *               type: string
 *             maxParticipants:
 *               type: number
 *             status:
 *               type: string
 *             requireEntranceFees:
 *               type: number
 *         raceReferees:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               referee:
 *                 type: object
 *                 nullable: true
 *                 properties:
 *                   user:
 *                     type: object
 *                     properties:
 *                       fullName:
 *                         type: string
 *         raceEligibilityRule:
 *           type: object
 *           nullable: true
 *           properties:
 *             raceType:
 *               type: string
 *             minAge:
 *               type: number
 *             maxAge:
 *               type: number
 *         tournament:
 *           type: object
 *           nullable: true
 *           properties:
 *             tournamentName:
 *               type: string
 *             startDate:
 *               type: string
 *               format: date-time
 *             endDate:
 *               type: string
 *               format: date-time
 *
 *     RaceHistoryItem:
 *       type: object
 *       properties:
 *         resultId:
 *           type: string
 *         finishPosition:
 *           type: number
 *         finishTime:
 *           type: string
 *         prizeMoney:
 *           type: number
 *         resultStatus:
 *           type: string
 *         registration:
 *           type: object
 *           properties:
 *             registrationId:
 *               type: string
 *         horse:
 *           type: object
 *           nullable: true
 *           properties:
 *             horseName:
 *               type: string
 *         raceRound:
 *           type: object
 *           nullable: true
 *           properties:
 *             roundName:
 *               type: string
 *             raceDate:
 *               type: string
 *               format: date-time
 *             trackLength:
 *               type: number
 *             location:
 *               type: string
 *             raceGround:
 *               type: string
 *         tournament:
 *           type: object
 *           nullable: true
 *           properties:
 *             tournamentName:
 *               type: string
 *         violations:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               description:
 *                 type: string
 *               actualPenalty:
 *                 type: string
 *               violationStatus:
 *                 type: string
 *               violationType:
 *                 type: object
 *                 nullable: true
 *                 properties:
 *                   violationName:
 *                     type: string
 */

/**
 * @swagger
 * /api/jockey/top:
 *   get:
 *     summary: Get top jockeys by total wins
 *     tags: [Jockey]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Maximum number of jockeys to return
 *     responses:
 *       200:
 *         description: Top jockeys retrieved successfully
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
 *                     jockeys:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/JockeyProfile'
 *                     count:
 *                       type: integer
 *                 msg:
 *                   type: string
 *                   example: Top jockeys retrieved successfully
 *       500:
 *         description: Internal server error
 *
 * /api/jockey/all:
 *   get:
 *     summary: Get all jockeys (paginated)
 *     tags: [Jockey]
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
 *         description: Jockeys retrieved successfully
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
 *                     jockeys:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/JockeyProfile'
 *                 msg:
 *                   type: string
 *                   example: Jockeys retrieved successfully
 *       500:
 *         description: Internal server error
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
 *         description: Jockeys retrieved successfully
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
 *                     jockeys:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/JockeyProfile'
 *                     count:
 *                       type: integer
 *                 msg:
 *                   type: string
 *       400:
 *         description: Invalid status value
 *       500:
 *         description: Internal server error
 *
 * /api/jockey/{uid}:
 *   post:
 *     summary: Create a jockey profile for an existing user
 *     tags: [Jockey]
 *     parameters:
 *       - in: path
 *         name: uid
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the user to create a jockey profile for
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               height:
 *                 type: number
 *                 example: 165
 *               weight:
 *                 type: number
 *                 example: 55
 *               licenseLink:
 *                 type: string
 *                 example: "https://example.com/license.pdf"
 *     responses:
 *       201:
 *         description: Jockey profile created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                   example: 201
 *                 data:
 *                   $ref: '#/components/schemas/JockeyProfile'
 *                 msg:
 *                   type: string
 *                   example: Jockey profile created successfully
 *       400:
 *         description: jockeyId is required
 *       404:
 *         description: User not found
 *       409:
 *         description: Jockey profile already exists
 *       500:
 *         description: Internal server error
 *
 * /api/jockey/profile:
 *   get:
 *     summary: Get my jockey profile
 *     tags: [Jockey]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Jockey profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                   example: 200
 *                 data:
 *                   $ref: '#/components/schemas/JockeyProfile'
 *                 msg:
 *                   type: string
 *                   example: Jockey profile retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Jockey profile not found
 *       500:
 *         description: Internal server error
 *   put:
 *     summary: Update my jockey profile
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
 *               height:
 *                 type: number
 *               weight:
 *                 type: number
 *               licenseLink:
 *                 type: string
 *                 description: Must be a valid URL
 *               fullName:
 *                 type: string
 *               userName:
 *                 type: string
 *               email:
 *                 type: string
 *               dateOfBirth:
 *                 type: string
 *                 format: date-time
 *               phoneNumber:
 *                 type: string
 *               image:
 *                 type: string
 *     responses:
 *       200:
 *         description: Jockey profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                   example: 200
 *                 data:
 *                   $ref: '#/components/schemas/JockeyProfile'
 *                 msg:
 *                   type: string
 *                   example: Jockey profile updated successfully
 *       400:
 *         description: licenseLink must be a valid URL
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Jockey not found
 *       500:
 *         description: Internal server error
 *
 * /api/jockey/change-password:
 *   put:
 *     summary: Change my password
 *     tags: [Jockey]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - oldPassword
 *               - newPassword
 *               - confirmPassword
 *             properties:
 *               oldPassword:
 *                 type: string
 *                 example: OldPass@123
 *               newPassword:
 *                 type: string
 *                 example: NewPass@456
 *                 description: "Min 8 chars, must include uppercase, lowercase, number, and special character"
 *               confirmPassword:
 *                 type: string
 *                 example: NewPass@456
 *     responses:
 *       200:
 *         description: Password changed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                   example: 200
 *                 msg:
 *                   type: string
 *                   example: Password changed successfully
 *       400:
 *         description: Validation error (missing fields, mismatch, incorrect old password, or weak password)
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 *
 * /api/jockey/my-stats:
 *   get:
 *     summary: Get my race statistics
 *     tags: [Jockey]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Jockey statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                   example: 200
 *                 data:
 *                   $ref: '#/components/schemas/JockeyStats'
 *                 msg:
 *                   type: string
 *                   example: Jockey statistics retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Jockey not found
 *       500:
 *         description: Internal server error
 *
 * /api/jockey/my-invitations:
 *   get:
 *     summary: Get my pending, accepted, and declined invitations
 *     tags: [Jockey]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Invitations retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                   example: 200
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/InvitationItem'
 *                 msg:
 *                   type: string
 *                   example: Invitations retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 *
 * /api/jockey/invitation/{invitationId}/respond:
 *   put:
 *     summary: Respond to an invitation (accept or reject)
 *     tags: [Jockey]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: invitationId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the invitation to respond to
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - jockeyConfirmation
 *             properties:
 *               jockeyConfirmation:
 *                 type: string
 *                 enum: [accepted, rejected]
 *                 example: accepted
 *     responses:
 *       200:
 *         description: Invitation response recorded successfully
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
 *                     invitationId:
 *                       type: string
 *                     jockeyConfirmation:
 *                       type: boolean
 *                     invitationStatus:
 *                       type: string
 *                       enum: [pending, accepted, declined]
 *                 msg:
 *                   type: string
 *                   example: Invitation response recorded successfully
 *       400:
 *         description: Missing fields, invalid value, or invitation is cancelled
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Not authorized to respond to this invitation
 *       404:
 *         description: Invitation not found
 *       500:
 *         description: Internal server error
 *
 * /api/jockey/my-race-schedule:
 *   get:
 *     summary: Get my upcoming race schedule (accepted invitations)
 *     tags: [Jockey]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Race schedule retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                   example: 200
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ScheduleItem'
 *                 msg:
 *                   type: string
 *                   example: Race schedule retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 *
 * /api/jockey/my-race-history:
 *   get:
 *     summary: Get my race result history
 *     tags: [Jockey]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Race history retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                   example: 200
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/RaceHistoryItem'
 *                 msg:
 *                   type: string
 *                   example: Race history retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 *
 * /api/jockey/record-win:
 *   post:
 *     summary: Record a win (increments totalWins and matchesRaced)
 *     tags: [Jockey]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Win recorded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                   example: 200
 *                 data:
 *                   $ref: '#/components/schemas/JockeyProfile'
 *                 msg:
 *                   type: string
 *                   example: Win recorded successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Jockey not found
 *       500:
 *         description: Internal server error
 *
 * /api/jockey/record-match:
 *   post:
 *     summary: Record a match participation (increments matchesRaced only)
 *     tags: [Jockey]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Match recorded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                   example: 200
 *                 data:
 *                   $ref: '#/components/schemas/JockeyProfile'
 *                 msg:
 *                   type: string
 *                   example: Match recorded successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Jockey not found
 *       500:
 *         description: Internal server error
 */

module.exports = {};
