/**
 * @swagger
 * /api/horse:
 *   get:
 *     summary: Get all horses (paginated)
 *     tags: [Horse]
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
 *         description: List of horses
 *   post:
 *     summary: Create a new horse
 *     tags: [Horse]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - ownerId
 *               - horseName
 *             properties:
 *               ownerId:
 *                 type: string
 *               horseName:
 *                 type: string
 *               breed:
 *                 type: string
 *               age:
 *                 type: number
 *               gender:
 *                 type: string
 *                 enum: [male, female]
 *               color:
 *                 type: string
 *               healthStatus:
 *                 type: string
 *                 enum: [healthy, injured, sick]
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *     responses:
 *       201:
 *         description: Horse created successfully
 *       400:
 *         description: Bad request
 *
 * /api/horse/{id}:
 *   get:
 *     summary: Get horse by ID
 *     tags: [Horse]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Horse details
 *       404:
 *         description: Horse not found
 *   put:
 *     summary: Update horse
 *     tags: [Horse]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
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
 *               horseName:
 *                 type: string
 *               breed:
 *                 type: string
 *               age:
 *                 type: number
 *               healthStatus:
 *                 type: string
 *               status:
 *                 type: string
 *     responses:
 *       200:
 *         description: Horse updated
 *       404:
 *         description: Horse not found
 *   delete:
 *     summary: Delete horse
 *     tags: [Horse]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Horse deleted
 *       404:
 *         description: Horse not found
 *
 * /api/horse/owner/{ownerId}:
 *   get:
 *     summary: Get horses by owner ID
 *     tags: [Horse]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: ownerId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: skip
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of owner's horses
 *
 * /api/horse/owner/{ownerId}/search:
 *   post:
 *     summary: Search owner's horses by keywords
 *     tags: [Horse]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: ownerId
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
 *               keywords:
 *                 type: string
 *     responses:
 *       200:
 *         description: Search results
 *
 * /api/horse/stats/all:
 *   get:
 *     summary: Get horse statistics
 *     tags: [Horse]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Horse statistics
 */

module.exports = {};
