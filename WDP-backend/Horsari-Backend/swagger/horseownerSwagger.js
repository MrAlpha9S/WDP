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
 *               license_link:
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
 *     description: This endpoint is deprecated. License information is now stored as license_link.
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
 *               license_link:
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
 */

module.exports = {};
