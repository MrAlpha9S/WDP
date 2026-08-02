/**
 * @swagger
 * /api/horseowner/invitations:
 *   post:
 *     summary: Invite a jockey for a specific horse registration (hire jockey)
 *     description: >
 *       All invitations for the same registration must use the same horse. A jockey cannot be
 *       invited twice to the same registration, and cannot be invited if they already hold an
 *       accepted invitation for this same race round or for another race round scheduled within
 *       90 minutes of it.
 *     tags: [Invitation]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [registrationId, horseId, jockeyId]
 *             properties:
 *               registrationId: { type: string }
 *               horseId: { type: string }
 *               jockeyId: { type: string }
 *               percentagePayout:
 *                 type: number
 *                 description: "Jockey's share of prize money (0–100)"
 *               isBackup:
 *                 type: boolean
 *                 default: false
 *               bookingFees:
 *                 type: number
 *                 description: Flat fee paid to the jockey regardless of race outcome
 *     responses:
 *       201:
 *         description: Invitation created
 *       400:
 *         description: Missing registrationId, horseId, or jockeyId
 *       403:
 *         description: Caller does not own the registration or the horse
 *       404:
 *         description: Registration or horse not found
 *       409:
 *         description: Jockey already invited to this registration, invitation uses a different horse than an existing one, or jockey has a conflicting accepted invitation
 *       422:
 *         description: Registration is not "accepted"
 */

module.exports = {};
