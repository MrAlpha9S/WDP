/**
 * @swagger
 * /api/jockey/all:
 *   get:
 *     summary: Get all jockeys (public — also used by horse owners to browse available jockeys)
 *     tags: [Jockey]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: sortBy
 *         schema: { type: string, default: createdAt }
 *       - in: query
 *         name: order
 *         schema: { type: string, enum: [asc, desc], default: desc }
 *     responses:
 *       200:
 *         description: Paginated jockey list with user info
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
 *                     pagination: { $ref: '#/components/schemas/PaginationMeta' }
 *                 msg: { type: string }
 *
 * /api/jockey/my-race-schedule:
 *   get:
 *     summary: Get the jockey's accepted-invitation race schedule (mobile-shaped flat list, sorted by raceDate ascending)
 *     tags: [Jockey]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Array of ScheduleItem, each with nested horse/registration/horseOwner/raceRound/tournament
 *       404:
 *         description: Jockey not found
 *
 * /api/jockey/my-invitations:
 *   get:
 *     summary: Get the jockey's invitations (mobile-shaped flat list, nested horseOwner.user)
 *     tags: [Jockey]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [pending, accepted, declined, cancelled] }
 *         description: Defaults to all four statuses if omitted
 *     responses:
 *       200:
 *         description: Array of InvitationItem
 *       404:
 *         description: Jockey not found
 *
 * /api/jockey/invitation/{invitationId}/respond:
 *   put:
 *     summary: Accept or reject a race invitation
 *     description: >
 *       Accepting is rejected with 409 if the jockey already holds an accepted invitation for
 *       this same race round, or for another race round scheduled within 90 minutes of it.
 *     tags: [Jockey]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: invitationId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [jockeyConfirmation]
 *             properties:
 *               jockeyConfirmation: { type: string, enum: [accepted, rejected] }
 *     responses:
 *       200:
 *         description: Invitation updated
 *       400:
 *         description: Invalid jockeyConfirmation, or invitation is no longer pending
 *       403:
 *         description: Invitation does not belong to this jockey
 *       404:
 *         description: Invitation not found
 *       409:
 *         description: Conflicting accepted invitation for this or a nearby race round
 *
 * /api/jockey/wallet:
 *   get:
 *     summary: Get the jockey's statistical wallet info (no real money movement)
 *     tags: [Jockey]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: "{ jockey: { _id, wallet }, stats: { totalPaymentsReceived } }"
 *       404:
 *         description: Jockey not found
 *
 * /api/jockey/payments:
 *   get:
 *     summary: List the jockey's own payments (always payee — jockey_payout)
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
 *         schema: { type: string, enum: [unpaid, processing, paid] }
 *       - in: query
 *         name: direction
 *         schema: { type: string, enum: [all, incoming, outgoing], default: all }
 *     responses:
 *       200:
 *         description: Paginated payment list
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code: { type: integer, example: 200 }
 *                 data:
 *                   type: object
 *                   properties:
 *                     items: { type: array, items: { $ref: '#/components/schemas/Payment' } }
 *                     pagination: { $ref: '#/components/schemas/PaginationMeta' }
 *                 msg: { type: string }
 *
 * /api/jockey/payments/{paymentId}/confirm-received:
 *   put:
 *     summary: Jockey confirms a payout has been received (payee-side confirmation)
 *     tags: [Jockey]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: paymentId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Payment updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code: { type: integer, example: 200 }
 *                 data: { $ref: '#/components/schemas/Payment' }
 *                 msg: { type: string }
 *       403:
 *         description: Authenticated jockey is not the payee on this payment
 *       404:
 *         description: Payment not found
 *       422:
 *         description: Already confirmed as payee
 */

module.exports = {};
