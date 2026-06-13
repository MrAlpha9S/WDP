/**
 * @swagger
 * /api/invitations/horseowner/{ownerId}:
 *   get:
 *     summary: Get invitations for a horse owner (paginated)
 *     tags: [Invitation]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: ownerId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number (1-based)
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: Paginated list of invitations
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/InvitationListResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - not a horse owner
 */

module.exports = {};

/**
 * @swagger
 * /api/invitations:
 *   get:
 *     summary: Get all invitations (paginated)
 *     tags: [Invitation]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *     responses:
 *       200:
 *         description: List of invitations
 *   post:
 *     summary: Create an invitation
 *     tags: [Invitation]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - horseId
 *               - registrationId
 *             properties:
 *               horseId:
 *                 type: string
 *               jockeyId:
 *                 type: string
 *               registrationId:
 *                 type: string
 *               percentagePayout:
 *                 type: number
 *               isBackup:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Invitation created
 *       400:
 *         description: Bad request
 *
 * /api/invitations/{id}:
 *   get:
 *     summary: Get invitation by ID
 *     tags: [Invitation]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Invitation details
 *       404:
 *         description: Invitation not found
 *   put:
 *     summary: Update invitation
 *     tags: [Invitation]
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
 *               jockeyId:
 *                 type: string
 *               ownerConfirmation:
 *                 type: boolean
 *               jockeyConfirmation:
 *                 type: boolean
 *               invitationStatus:
 *                 type: string
 *                 enum: [pending, accepted, declined, cancelled]
 *               percentagePayout:
 *                 type: number
 *               isBackup:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Invitation updated
 *       404:
 *         description: Invitation not found
 *   delete:
 *     summary: Delete invitation
 *     tags: [Invitation]
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
 *         description: Invitation deleted
 *       404:
 *         description: Invitation not found
 *
 * /api/invitations/jockey/{jockeyId}:
 *   get:
 *     summary: Get invitations for a jockey
 *     tags: [Invitation]
 *     parameters:
 *       - in: path
 *         name: jockeyId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Invitations list
 *
 * /api/invitations/{invitationIds}/tournaments:
 *   get:
 *     summary: Get tournaments with rounds and invitations for given invitation IDs
 *     tags: [Invitation, Tournament]
 *     parameters:
 *       - in: path
 *         name: invitationIds
 *         required: true
 *         description: Single invitation id or comma-separated list of invitation ids
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     tournaments:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           name:
 *                             type: string
 *                           race_rounds:
 *                             type: array
 *                             items:
 *                               type: object
 *                               properties:
 *                                 _id:
 *                                   type: string
 *                                 roundName:
 *                                   type: string
 *                                 invitations:
 *                                   type: array
 *                                   items:
 *                                     type: object
 *       404:
 *         description: No tournaments found for provided invitations
 */

module.exports = {};
