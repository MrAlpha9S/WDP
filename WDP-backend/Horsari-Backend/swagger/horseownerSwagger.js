/**
 * @swagger
 * /api/horseowner/{uid}:
 *   post:
 *     summary: Create horse owner profile for an existing user (public)
 *     tags: [HorseOwner]
 *     parameters:
 *       - in: path
 *         name: uid
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the user to create a horse owner profile for
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               licenseLink:
 *                 type: string
 *                 description: "License document link"
 *                 example: "https://cloudinary.com/license/abc123"
 *     responses:
 *       201:
 *         description: Horse owner profile created successfully
 *       400:
 *         description: Bad request
 *       404:
 *         description: User not found
 *       409:
 *         description: Profile already exists
 *
 * /api/horseowner/all:
 *   get:
 *     summary: Get all horse owners
 *     tags: [HorseOwner]
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
 *         description: List of horse owners
 *
 * /api/horseowner/license/{licenseNumber}:
 *   get:
 *     summary: Get horse owner by license number (DEPRECATED)
 *     description: This endpoint is deprecated. License information is now stored as licenseLink.
 *     tags: [HorseOwner]
 *     parameters:
 *       - in: path
 *         name: licenseNumber
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       400:
 *         description: Endpoint deprecated
 *
 * /api/horseowner/profile:
 *   get:
 *     summary: Get my horse owner profile
 *     tags: [HorseOwner]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Profile details
 *   put:
 *     summary: Update my profile
 *     tags: [HorseOwner]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               licenseLink:
 *                 type: string
 *                 description: "License document link"
 *     responses:
 *       200:
 *         description: Profile updated
 *
 * /api/horseowner/my-horses:
 *   get:
 *     summary: Get my horses
 *     tags: [HorseOwner]
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
 *         description: My horses
 *
 * /api/horseowner/my-horses/stats:
 *   get:
 *     summary: Get my horses statistics
 *     tags: [HorseOwner]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Statistics
 *
 * /api/horseowner/my-horses/health/{healthStatus}:
 *   get:
 *     summary: Get horses by health status
 *     tags: [HorseOwner]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: healthStatus
 *         required: true
 *         schema:
 *           type: string
 *           enum: [healthy, injured, sick]
 *     responses:
 *       200:
 *         description: Horses with specified health status
 *
 * /api/horseowner/jockeys:
 *   get:
 *     summary: Get all jockeys (horse owner view)
 *     tags: [HorseOwner]
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
 *         description: List of jockeys with user info
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - not a horse owner
 *
 * /api/horseowner/race-invitations:
 *   get:
 *     summary: Get race invitations for horse owner
 *     tags: [HorseOwner]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Array of registrations with raceRound, tournament and eligibleHorseIds
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/RaceInvitation'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - not a horse owner
 *
 * /api/horseowner/registration/{registrationId}/approve:
 *   post:
 *     summary: Approve a registration (horse owner)
 *     tags: [HorseOwner]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: registrationId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Registration approved
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - not the owner
 *
 * /api/horseowner/registration/{registrationId}/reject:
 *   post:
 *     summary: Reject a registration (horse owner)
 *     tags: [HorseOwner]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: registrationId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Registration rejected
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - not the owner

 * components:
 *   schemas:
 *     RaceInvitation:
 *       type: object
 *       properties:
 *         registration:
 *           $ref: '#/components/schemas/Registration'
 *         raceRound:
 *           $ref: '#/components/schemas/RaceRound'
 *         tournament:
 *           $ref: '#/components/schemas/Tournament'
 *         eligibleHorseIds:
 *           type: array
 *           items:
 *             type: string
 *     Registration:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         raceRoundId:
 *           type: string
 *         registrationStatus:
 *           type: string
 *         registeredAt:
 *           type: string
 *         horseOwnerId:
 *           type: string
 *     RaceRound:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         roundName:
 *           type: string
 *         raceDate:
 *           type: string
 *           format: date-time
 *         trackLength:
 *           type: number
 *         location:
 *           type: string
 *         raceGround:
 *           type: string
 *         eligibilityRuleId:
 *           type: string
 *     Tournament:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         tournamentName:
 *           type: string
 */

module.exports = {};
