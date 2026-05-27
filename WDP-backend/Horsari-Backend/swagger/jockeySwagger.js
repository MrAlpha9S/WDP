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
 *               license_link:
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
 *     summary: Get my jockey profile
 *     tags: [Jockey]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Jockey profile
 *       404:
 *         description: Profile not found
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
 *                 type: string
 *               weight:
 *                 type: string
 *               ranking:
 *                 type: number
 *               license_link:
 *                 type: string
 *                 description: "License document link"
 *     responses:
 *       200:
 *         description: Profile updated
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
