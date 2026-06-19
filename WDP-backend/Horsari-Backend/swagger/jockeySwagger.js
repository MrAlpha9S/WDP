/**
 * @swagger
 * /api/jockey/{uid}:
 *   post:
 *     summary: Create jockey profile for an existing user (public)
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
 *               weight:
 *                 type: number
 *               licenseLink:
 *                 type: string
 *                 description: "License document link"
 *     responses:
 *       201:
 *         description: Jockey profile created successfully
 *       400:
 *         description: Bad request
 *       404:
 *         description: User not found
 *       409:
 *         description: Profile already exists
 *
 * /api/jockey/top:
 *   get:
 *     summary: Get top jockeys by ranking
 *     tags: [Jockey]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Top jockeys list
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
 *         description: List of jockeys
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
 *         description: Jockeys with specified status
 *
 * /api/jockey/profile:
 *   get:
 *     summary: Get my jockey profile with user data
 *     tags: [Jockey]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Jockey profile with user information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     jockeyId:
 *                       type: string
 *                     height:
 *                       type: number
 *                     weight:
 *                       type: number
 *                     matchesRaced:
 *                       type: number
 *                     totalWins:
 *                       type: number
 *                     ranking:
 *                       type: number
 *                     status:
 *                       type: string
 *                     licenseLink:
 *                       type: string
 *                     licenseStatus:
 *                       type: string
 *                     user:
 *                       type: object
 *                       properties:
 *                         fullName:
 *                           type: string
 *                         userName:
 *                           type: string
 *                         email:
 *                           type: string
 *                         dateOfBirth:
 *                           type: string
 *                         phoneNumber:
 *                           type: string
 *                         image:
 *                           type: string
 *       404:
 *         description: Profile not found
 *   put:
 *     summary: Update my jockey profile and user data
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
 *               fullName:
 *                 type: string
 *               userName:
 *                 type: string
 *               email:
 *                 type: string
 *               dateOfBirth:
 *                 type: string
 *               phoneNumber:
 *                 type: string
 *               image:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       404:
 *         description: Profile not found
 *       409:
 *         description: Email or username already in use
 *
 * /api/jockey/change-password:
 *   post:
 *     summary: Change password
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
 *               oldPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *               confirmPassword:
 *                 type: string
 *             required:
 *               - oldPassword
 *               - newPassword
 *               - confirmPassword
 *     responses:
 *       200:
 *         description: Password changed successfully
 *       400:
 *         description: Invalid password or validation failed
 *       401:
 *         description: Old password is incorrect
 *
 * /api/jockey/my-stats:
 *   get:
 *     summary: Get my statistics
 *     tags: [Jockey]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Jockey statistics
 *
 * /api/jockey/invitations:
 *   get:
 *     summary: Get my invitations (pending and accepted)
 *     tags: [Jockey]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of invitations
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   invitationId:
 *                     type: string
 *                   invitationStatus:
 *                     type: string
 *                   ownerConfirmation:
 *                     type: boolean
 *                   jockeyConfirmation:
 *                     type: boolean
 *                   isBackup:
 *                     type: boolean
 *                   percentagePayout:
 *                     type: number
 *                   horse:
 *                     type: object
 *                   registration:
 *                     type: object
 *                   horseOwner:
 *                     type: object
 *                   raceRound:
 *                     type: object
 *                   tournament:
 *                     type: object
 *       404:
 *         description: Jockey not found
 *
 * /api/jockey/invitations/respond:
 *   post:
 *     summary: Respond to invitation (accept or reject)
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
 *               invitationId:
 *                 type: string
 *               jockeyConfirmation:
 *                 type: string
 *                 enum: [accepted, rejected]
 *             required:
 *               - invitationId
 *               - jockeyConfirmation
 *     responses:
 *       200:
 *         description: Invitation responded successfully
 *       400:
 *         description: Invalid request or cannot respond
 *       403:
 *         description: Invitation does not belong to you
 *       404:
 *         description: Invitation not found
 *
 * /api/jockey/race-schedule:
 *   get:
 *     summary: Get my race schedule (accepted races)
 *     tags: [Jockey]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of scheduled races
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   horse:
 *                     type: object
 *                   registration:
 *                     type: object
 *                   horseOwner:
 *                     type: object
 *                   raceRound:
 *                     type: object
 *                   raceReferees:
 *                     type: array
 *                   eligibilityRule:
 *                     type: object
 *                   tournament:
 *                     type: object
 *       404:
 *         description: Jockey not found
 *
 * /api/jockey/race-history:
 *   get:
 *     summary: Get my race history with results
 *     tags: [Jockey]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of past races with results
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   raceResult:
 *                     type: object
 *                   registration:
 *                     type: object
 *                   violations:
 *                     type: array
 *                   horse:
 *                     type: object
 *                   raceRound:
 *                     type: object
 *                   tournament:
 *                     type: object
 *       404:
 *         description: Jockey not found
 *
 * /api/jockey/record-win:
 *   post:
 *     summary: Record a win
 *     tags: [Jockey]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Win recorded
 *
 * /api/jockey/record-match:
 *   post:
 *     summary: Record a match participation
 *     tags: [Jockey]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Match recorded
 */

module.exports = {};
