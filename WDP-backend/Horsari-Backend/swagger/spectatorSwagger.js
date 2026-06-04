/**
 * @swagger
 * /api/spectator/{uid}:
 *   post:
 *     summary: Create spectator profile for an existing user (public)
 *     tags: [Spectator]
 *     parameters:
 *       - in: path
 *         name: uid
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the user to create a spectator profile for
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               rewardPoints:
 *                 type: number
 *     responses:
 *       201:
 *         description: Spectator profile created successfully
 *       400:
 *         description: Bad request
 *       404:
 *         description: User not found
 *       409:
 *         description: Profile already exists
 *
 * /api/spectator/top:
 *   get:
 *     summary: Get top spectators by reward points
 *     tags: [Spectator]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Top spectators list
 *
 * /api/spectator/all:
 *   get:
 *     summary: Get all spectators
 *     tags: [Spectator]
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
 *         description: List of spectators
 *
 * /api/spectator/profile:
 *   get:
 *     summary: Get my spectator profile
 *     tags: [Spectator]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Profile details
 *   put:
 *     summary: Update my profile
 *     tags: [Spectator]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Profile updated
 *
 * /api/spectator/rewards:
 *   get:
 *     summary: Get my reward points
 *     tags: [Spectator]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Reward points balance
 *
 * /api/spectator/rewards/add:
 *   post:
 *     summary: Add reward points
 *     tags: [Spectator]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               points:
 *                 type: number
 *     responses:
 *       200:
 *         description: Points added
 *
 * /api/spectator/rewards/deduct:
 *   post:
 *     summary: Deduct reward points
 *     tags: [Spectator]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               points:
 *                 type: number
 *     responses:
 *       200:
 *         description: Points deducted
 *       400:
 *         description: Insufficient points
 */

module.exports = {};
