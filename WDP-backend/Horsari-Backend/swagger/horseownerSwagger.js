/**
 * @swagger
 * /api/horseowner/my-horses:
 *   get:
 *     summary: Get horses owned by the authenticated horse owner (paginated, each enriched with raceResults)
 *     tags: [HorseOwner]
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
 *         description: Paginated list of owned horses
 *
 * /api/horseowner/race-invitations:
 *   get:
 *     summary: Get this owner's race registrations, enriched with race round, tournament, and eligible-horse info
 *     tags: [HorseOwner]
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
 *         schema: { type: string, description: "Matches raceRound.roundName" }
 *       - in: query
 *         name: sortBy
 *         schema: { type: string, default: createdAt }
 *       - in: query
 *         name: order
 *         schema: { type: string, enum: [asc, desc], default: desc }
 *     responses:
 *       200:
 *         description: Paginated list of race invitations with raceRound, tournament, and eligible horses
 *
 * /api/horseowner/registration/{registrationId}/accept:
 *   post:
 *     summary: Accept one of the owner's pending registrations
 *     tags: [HorseOwner]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: registrationId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Registration accepted
 *       400:
 *         description: Tournament is cancelled, or registration already rejected/cancelled
 *       403:
 *         description: Registration does not belong to this owner
 *       404:
 *         description: Registration not found
 *
 * /api/horseowner/invitations:
 *   get:
 *     summary: Get all jockey invitations sent by this horse owner (paginated, searchable by jockey/horse name)
 *     tags: [HorseOwner]
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
 *     responses:
 *       200:
 *         description: Paginated list of jockey invitations
 *   post:
 *     summary: Invite a jockey for a specific horse registration (hire jockey)
 *     description: >
 *       All invitations for the same registration must use the same horse. A jockey cannot be
 *       invited twice to the same registration, and cannot be invited if they already hold an
 *       accepted invitation for this same race round or for another race round scheduled within
 *       90 minutes of it.
 *     tags: [HorseOwner]
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
 *
 * /api/horseowner/horses:
 *   post:
 *     summary: Create a horse under the authenticated horse owner
 *     tags: [HorseOwner]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [horseName]
 *             properties:
 *               horseName: { type: string }
 *               breed: { type: string }
 *               gender: { type: string, enum: [male, female] }
 *               healthStatus: { type: string, enum: [healthy, injured, sick], default: healthy }
 *               registrationDate: { type: string, format: date }
 *               status: { type: string, enum: [active, inactive, retired], default: active }
 *               dateOfBirth: { type: string, format: date }
 *     responses:
 *       201:
 *         description: Horse created (ownerId is taken from the authenticated user)
 *       400:
 *         description: horseName is required
 *
 * /api/horseowner/horses/{id}:
 *   put:
 *     summary: Update a horse
 *     tags: [HorseOwner]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               horseName: { type: string }
 *               breed: { type: string }
 *               gender: { type: string, enum: [male, female] }
 *               healthStatus: { type: string, enum: [healthy, injured, sick] }
 *               status: { type: string, enum: [active, inactive, retired] }
 *               dateOfBirth: { type: string, format: date }
 *               img: { type: string, description: "Cloudinary URL, normally set via /horses/{horseId}/upload-image" }
 *     responses:
 *       200:
 *         description: Horse updated
 *       404:
 *         description: Horse not found
 *
 *   delete:
 *     summary: Delete a horse
 *     tags: [HorseOwner]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Horse deleted
 *       404:
 *         description: Horse not found
 *
 * /api/horseowner/horses/{horseId}/upload-image:
 *   post:
 *     summary: Upload a horse's profile image to Cloudinary
 *     tags: [HorseOwner]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: horseId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [image]
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Image uploaded and horse.img updated
 *       400:
 *         description: Missing horseId or image file
 *       403:
 *         description: Authenticated user is not this horse's owner
 *       404:
 *         description: Horse not found
 *
 * /api/horseowner/horses/{horseId}/profile:
 *   get:
 *     summary: Get a horse's aggregated registration history, race results, and violations
 *     tags: [HorseOwner]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: horseId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: "{ horse, stats, raceHistory, violations }"
 *       403:
 *         description: Horse does not belong to this owner
 *       404:
 *         description: Horse not found
 *
 * /api/horseowner/race-rounds/{raceRoundId}/detail:
 *   get:
 *     summary: Get race detail for the authenticated horse owner
 *     description: >
 *       Returns the race round info, a `competition` object (maxParticipants, confirmedCount,
 *       openSlots, and the roster of other accepted competitors), and the owner's own
 *       `registration` (with horse, jockey invitations, race result, violations) — `registration`
 *       is null if the owner has no registration in this race, but `competition` is always present.
 *     tags: [HorseOwner]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: raceRoundId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: "{ raceRound, registration, competition }"
 *       404:
 *         description: Horse owner or race round not found
 *
 * /api/horseowner/race-rounds/{raceRoundId}/status:
 *   get:
 *     summary: Lightweight, poll-friendly race round status check
 *     tags: [HorseOwner]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: raceRoundId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: "{ raceRoundId, status, registrationStatus, isLive, hasResults }"
 *       403:
 *         description: Owner has no registration in this race round
 *       404:
 *         description: Race round not found
 *
 * /api/horseowner/horses/{horseId}/status:
 *   put:
 *     summary: Update a horse's status
 *     tags: [HorseOwner]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: horseId
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
 *               status: { type: string, enum: [active, inactive, retired] }
 *     responses:
 *       200:
 *         description: Horse status updated
 *       403:
 *         description: Horse does not belong to this owner
 *       404:
 *         description: Horse owner or horse not found
 *
 * /api/horseowner/horses/{horseId}/health-status:
 *   put:
 *     summary: Update a horse's health status
 *     tags: [HorseOwner]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: horseId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [healthStatus]
 *             properties:
 *               healthStatus: { type: string, enum: [healthy, injured, sick] }
 *     responses:
 *       200:
 *         description: Horse health status updated
 *       403:
 *         description: Horse does not belong to this owner
 *       404:
 *         description: Horse owner or horse not found
 *
 * /api/horseowner/race-eligibility-metadata:
 *   get:
 *     summary: Get the eligibility criteria for one race eligibility rule
 *     tags: [HorseOwner]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: ruleId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: "{ eligibilityRules: [{ raceType, minWins, maxWins, minAge, maxAge, requiredGender, requiredBreed }] }"
 *       400:
 *         description: ruleId is required
 *       404:
 *         description: Eligibility rule not found
 *
 * /api/horseowner/dashboard/summary:
 *   get:
 *     summary: Dashboard counts (horses, upcoming races, active invitations) plus a recent-activity feed (last 14 days)
 *     tags: [HorseOwner]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: "{ totalHorses, upcomingRacesCount, activeInvitationsCount, recentActivity }"
 *
 * /api/horseowner/dashboard/top-performers:
 *   get:
 *     summary: Top-performing horses by win rate
 *     tags: [HorseOwner]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 5 }
 *     responses:
 *       200:
 *         description: Array of horses with winRate/wins/totalRaces
 *
 * /api/horseowner/races/browse:
 *   get:
 *     summary: Browse joinable/live race rounds (paginated, searchable), each including the owner's own registration status if any
 *     tags: [HorseOwner]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 12 }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [scheduled, running, awaitingConfirmation, prepared] }
 *     responses:
 *       200:
 *         description: Paginated list of browsable race rounds
 *
 * /api/horseowner/jockeys/{jockeyId}/profile:
 *   get:
 *     summary: Get a jockey's stats, race history, and violations (horse-owner view, for hiring decisions)
 *     tags: [HorseOwner]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: jockeyId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: "{ jockey, stats, recentRaces, violations }"
 *       400:
 *         description: jockeyId is required
 *       404:
 *         description: Jockey not found
 *
 * /api/horseowner/financials/summary:
 *   get:
 *     summary: Financial summary — race wins/losses, prize totals, jockey payouts, wallet balance
 *     tags: [HorseOwner]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: "{ totalRaces, totalWins, totalLosses, totalPrize, totalJockeyPayout, netProfit, totalViolations, balance, wallet }"
 *
 * /api/horseowner/financials/race-results:
 *   get:
 *     summary: Paginated per-race financial breakdown (prize money, jockey payout, net outcome, violations)
 *     tags: [HorseOwner]
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
 *         schema: { type: string, description: "Matches race round name or horse name" }
 *     responses:
 *       200:
 *         description: Paginated financial race result list
 *
 * /api/horseowner/payments:
 *   get:
 *     summary: List the owner's own payments (payee for race_prize, payer for jockey_payout)
 *     tags: [HorseOwner]
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
 * /api/horseowner/payments/{paymentId}/confirm-received:
 *   put:
 *     summary: Owner confirms a race-prize payment has been received (payee-side confirmation)
 *     tags: [HorseOwner]
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
 *         description: Authenticated owner is not the payee on this payment
 *       404:
 *         description: Payment not found
 *       422:
 *         description: Already confirmed as payee
 *
 * /api/horseowner/payments/{paymentId}/confirm-paid:
 *   put:
 *     summary: Owner confirms a jockey-payout payment has been sent (payer-side confirmation)
 *     tags: [HorseOwner]
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
 *         description: Authenticated owner is not the payer on this payment
 *       404:
 *         description: Payment not found
 *       422:
 *         description: Already confirmed as payer
 */

module.exports = {};
