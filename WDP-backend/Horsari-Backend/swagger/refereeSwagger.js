/**
 * @swagger
 * /api/referee/race-rounds:
 *   get:
 *     summary: Get race rounds assigned to the referee (paginated)
 *     tags: [Referee]
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
 *         schema:
 *           type: string
 *           enum: [draft, scheduled, running, completed, cancelled, prepared]
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: sortBy
 *         schema: { type: string, default: raceDate }
 *       - in: query
 *         name: order
 *         schema: { type: string, enum: [asc, desc], default: desc }
 *     responses:
 *       200:
 *         description: Paginated list of referee's race rounds
 *
 * /api/referee/tournaments:
 *   get:
 *     summary: Get tournaments the referee is assigned to
 *     tags: [Referee]
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
 *         schema: { type: string }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: sortBy
 *         schema: { type: string, default: startDate }
 *       - in: query
 *         name: order
 *         schema: { type: string, enum: [asc, desc], default: desc }
 *     responses:
 *       200:
 *         description: Paginated tournament list
 *
 *
 * /api/referee/invitations:
 *   get:
 *     summary: Get the referee's race assignment invitations
 *     tags: [Referee]
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
 *         schema: { type: string, enum: [pending, accepted, rejected] }
 *     responses:
 *       200:
 *         description: Referee invitations list
 *
 * /api/referee/invitations/{id}/accept:
 *   put:
 *     summary: Accept a race assignment invitation
 *     tags: [Referee]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: Invitation ID
 *     responses:
 *       200:
 *         description: Invitation accepted
 *       404:
 *         description: Invitation not found
 *
 * /api/referee/invitations/{id}/reject:
 *   put:
 *     summary: Reject a race assignment invitation
 *     tags: [Referee]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: Invitation ID
 *     responses:
 *       200:
 *         description: Invitation rejected
 *
 * /api/referee/race-rounds/{id}:
 *   get:
 *     summary: Get full detail of a single race round (with registrations and jockeys)
 *     tags: [Referee]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Race round detail
 *       404:
 *         description: Not found
 *
 * /api/referee/race-rounds/{raceRoundId}/registrations/{registrationId}/verify:
 *   put:
 *     summary: Verify or fail a horse registration (eligibility check)
 *     description: >
 *       When status is "verified", use selectedInvitationId to set jockeyInRaceId on the
 *       Registration — this marks which jockey is the confirmed official rider.
 *     tags: [Referee]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: raceRoundId
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: registrationId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [verified, failed]
 *               verificationFailReason:
 *                 type: string
 *               selectedInvitationId:
 *                 type: string
 *                 description: Invitation._id of the confirmed jockey — sets Registration.jockeyInRaceId
 *               failedChecks:
 *                 type: array
 *                 items: { type: string }
 *               selectedViolationTypeId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Verification result saved
 *
 * /api/referee/race-rounds/{raceRoundId}/registrations/{registrationId}/cancel:
 *   put:
 *     summary: Cancel a horse registration
 *     tags: [Referee]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: raceRoundId
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: registrationId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Registration cancelled
 *
 * /api/referee/race-rounds/{raceRoundId}/finalize:
 *   post:
 *     summary: Finalize a race round (lock results, trigger prize distribution)
 *     tags: [Referee]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: raceRoundId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Race round finalized
 *
 * /api/referee/violation-types:
 *   get:
 *     summary: Get all violation types (paginated)
 *     tags: [Referee]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema: { type: string }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: sortBy
 *         schema: { type: string, default: createdAt }
 *       - in: query
 *         name: order
 *         schema: { type: string, enum: [asc, desc], default: desc }
 *     responses:
 *       200:
 *         description: List of violation types
 *
 * /api/referee/eligibility-rules:
 *   get:
 *     summary: List active race eligibility rules (referee-only, paginated, searchable by raceType)
 *     tags: [Referee]
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
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: sortBy
 *         schema: { type: string, default: createdAt }
 *       - in: query
 *         name: order
 *         schema: { type: string, enum: [asc, desc], default: desc }
 *     responses:
 *       200:
 *         description: Paginated list of active eligibility rules
 *
 * /api/referee/race-rounds/{raceRoundId}/violations:
 *   get:
 *     summary: Get violations recorded in a race round
 *     tags: [Referee]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: raceRoundId
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: status
 *         schema: { type: string }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: sortBy
 *         schema: { type: string, default: createdAt }
 *       - in: query
 *         name: order
 *         schema: { type: string, enum: [asc, desc], default: desc }
 *     responses:
 *       200:
 *         description: Violations for the race round
 *
 * /api/referee/violations:
 *   post:
 *     summary: Record a violation for a registration in a race round
 *     tags: [Referee]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [raceRoundId, registrationId, violationTypeId]
 *             properties:
 *               raceRoundId: { type: string }
 *               registrationId: { type: string }
 *               violationTypeId: { type: string }
 *               description: { type: string }
 *     responses:
 *       201:
 *         description: Violation recorded
 *
 * /api/referee/violations/{violationId}:
 *   delete:
 *     summary: Delete a recorded violation
 *     tags: [Referee]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: violationId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Violation deleted
 *
 * /api/referee/race-rounds/{id}/confirm-result:
 *   post:
 *     summary: Confirm and submit final race results (referee sign-off)
 *     tags: [Referee]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Results confirmed by referee
 *
 * /api/referee/invitations/{invitationId}/no-show:
 *   put:
 *     summary: Mark a jockey as a no-show for race day
 *     tags: [Referee]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: invitationId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Invitation marked "didNotAttend"
 *       403:
 *         description: Referee is not assigned to this race round
 *       404:
 *         description: Invitation or registration not found
 *       422:
 *         description: Invitation is not linked to a registration
 *
 * /api/referee/violations/{violationId}/confirm:
 *   put:
 *     summary: Confirm a recorded violation (locks it in as official)
 *     tags: [Referee]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: violationId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Violation confirmed
 *       403:
 *         description: Referee does not own this violation's assignment
 *       404:
 *         description: Violation not found
 *
 * /api/referee/wallet:
 *   get:
 *     summary: Get the referee's statistical wallet info (no real money movement)
 *     tags: [Referee]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: "{ referee: { _id, wallet }, stats: { totalFeesReceived } }"
 *       404:
 *         description: Referee not found
 *
 * /api/referee/statistics:
 *   get:
 *     summary: Referee statistics snapshot (invitations, races officiated, fees earned/pending)
 *     tags: [Referee]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: "{ wallet, totalInvitations, totalRacesOfficiated, acceptedCount, rejectedCount, pendingCount, totalFeesEarned, pendingFeesAmount }"
 *       404:
 *         description: Referee not found
 *
 * /api/referee/payments:
 *   get:
 *     summary: List the referee's own payments (always payee — referee_fee)
 *     tags: [Referee]
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
 * /api/referee/payments/{paymentId}/confirm-received:
 *   put:
 *     summary: Referee confirms a fee payment has been received (payee-side confirmation)
 *     tags: [Referee]
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
 *         description: Authenticated referee is not the payee on this payment
 *       404:
 *         description: Payment not found
 *       422:
 *         description: Already confirmed as payee
 */

module.exports = {};
