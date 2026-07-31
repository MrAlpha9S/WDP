/**
 * @swagger
 * /api/admin/statistics:
 *   get:
 *     summary: Get dashboard statistics (users, licensing, tournaments, wallet totals)
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Counts for users, horse owners, jockeys, tournaments, and finance (wallet sums)
 *         content:
 *           application/json:
 *             example:
 *               code: 200
 *               data:
 *                 users: { countActive: 123 }
 *                 horseOwners: { count: 45, pending: 5, approved: 40 }
 *                 jockeys: { count: 30, pending: 3, approved: 27 }
 *                 tournaments: { count: 12, scheduled: 4, ongoing: 2 }
 *                 finance: { totalHorseOwnerWallets: 0, totalJockeyWallets: 0, totalRefereeWallets: 0, mainAdminWallet: 0 }
 *               msg: Statistics retrieved successfully
 *
 * /api/admin/statistics/overview:
 *   get:
 *     summary: Get comprehensive system-wide statistics — snapshot totals and breakdowns across every entity
 *     description: >
 *       Current-snapshot only (no time-series/trend data). Every section degrades to 0/[] when
 *       its underlying collection is empty rather than erroring.
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: >
 *           `{ users, licensing, horses, tournaments, raceRounds, registrations, invitations,
 *           violations, predictions, finance, payments, topPerformers }` — see AdminService.getSystemStatistics
 *           for the exact shape of each section (status/role/type breakdowns are plain
 *           `{ [enumValue]: count }` maps built from the real Mongoose enum values).
 *
 * /api/admin/users/all:
 *   get:
 *     summary: Get all users (paginated, filterable by role / search)
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: role
 *         schema: { type: string, enum: [horseowner, jockey, referee, spectator, admin, All] }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: skip
 *         schema: { type: integer, default: 0 }
 *       - in: query
 *         name: sortBy
 *         schema: { type: string, default: createdAt, enum: [fullName, username, email, role, status, createdAt, updatedAt] }
 *       - in: query
 *         name: order
 *         schema: { type: string, enum: [asc, desc], default: desc }
 *     responses:
 *       200:
 *         description: Paginated user list
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
 * /api/admin/users/{userId}:
 *   get:
 *     summary: Get full user detail with role-specific profile (horses/violations, race history, referee assignments, or spectator wallet/predictions/transactions)
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: "{ user, roleProfile }"
 *       404:
 *         description: User not found
 *
 * /api/admin/proxy-license:
 *   get:
 *     summary: Proxy-fetch a Cloudinary license PDF and re-serve it inline
 *     description: Only accepts URLs on the cloudinary.com domain.
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: url
 *         required: true
 *         schema: { type: string }
 *         description: Full Cloudinary resource URL
 *     responses:
 *       200:
 *         description: PDF stream (Content-Type application/pdf)
 *       400:
 *         description: Missing or invalid url
 *       403:
 *         description: URL is not on cloudinary.com
 *       502:
 *         description: Upstream Cloudinary fetch failed
 *
 * /api/admin/users/{userId}/certification:
 *   patch:
 *     summary: Approve or reject a horseowner/jockey/referee's license certification
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [action]
 *             properties:
 *               action: { type: string, enum: [approve, reject] }
 *     responses:
 *       200:
 *         description: "{ licenseStatus }"
 *       400:
 *         description: Invalid action, or role does not support certification
 *       404:
 *         description: User not found
 *
 * /api/admin/horse-owner-invitations:
 *   get:
 *     summary: List horse-owner registrations enriched with race round, horse, and jockey invitation info
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 5 }
 *     responses:
 *       200:
 *         description: Paginated enriched registration list
 *
 * /api/admin/referee-invitations:
 *   get:
 *     summary: List all referee race-assignment records, enriched with race round and referee name
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 5 }
 *     responses:
 *       200:
 *         description: Paginated referee assignment list
 *
 * /api/admin/jockey-invitations:
 *   get:
 *     summary: List all jockey invitations, enriched with registration, race round, and sibling invitations
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 5 }
 *     responses:
 *       200:
 *         description: Paginated jockey invitation list
 *
 * /api/admin/tournaments:
 *   get:
 *     summary: Get all tournaments enriched with race rounds and total prediction reward pool (paginated)
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 5 }
 *     responses:
 *       200:
 *         description: Paginated tournament list
 *   post:
 *     summary: Create a new tournament
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [tournamentName, description, startDate, endDate]
 *             properties:
 *               tournamentName: { type: string }
 *               description: { type: string }
 *               startDate: { type: string, format: date-time }
 *               endDate: { type: string, format: date-time }
 *               status:
 *                 type: string
 *                 enum: [draft, scheduled, ongoing, completed, cancelled]
 *                 default: draft
 *     responses:
 *       201:
 *         description: Tournament created (createdByAdminId is taken from the authenticated user)
 *       400:
 *         description: Missing required fields, or startDate is not before endDate
 *
 * /api/admin/tournaments/{id}:
 *   put:
 *     summary: Update a tournament
 *     description: Emits a "tournament:status_changed" socket event when status changes.
 *     tags: [Admin]
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
 *               tournamentName: { type: string }
 *               description: { type: string }
 *               startDate: { type: string, format: date-time }
 *               endDate: { type: string, format: date-time }
 *               status: { type: string, enum: [draft, scheduled, ongoing, completed, cancelled] }
 *     responses:
 *       200:
 *         description: Tournament updated
 *       404:
 *         description: Tournament not found
 *   delete:
 *     summary: Delete a tournament
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Tournament deleted
 *       404:
 *         description: Tournament not found
 *
 * /api/admin/tournaments/{id}/detail:
 *   get:
 *     summary: Get one tournament's detail with race rounds (auto-completes the tournament if endDate has passed while still "ongoing")
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: "{ tournament, raceRounds }"
 *       404:
 *         description: Tournament not found
 *
 * /api/admin/tournaments/{id}/ranking:
 *   get:
 *     summary: Get horses ranked by cumulative score from official results across all rounds in the tournament
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Array of ranked horse entries, each including a per-round roundBreakdown
 *
 * /api/admin/violations:
 *   get:
 *     summary: List all violations across every race (paginated, filterable)
 *     tags: [Admin]
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
 *         name: severity
 *         schema: { type: integer }
 *       - in: query
 *         name: raceRoundId
 *         schema: { type: string }
 *       - in: query
 *         name: sortBy
 *         schema: { type: string, default: createdAt, enum: [createdAt, severity, violationStatus] }
 *       - in: query
 *         name: order
 *         schema: { type: string, enum: [asc, desc], default: desc }
 *     responses:
 *       200:
 *         description: Paginated violation list
 *
 * /api/admin/violation-types:
 *   get:
 *     summary: List violation types (paginated, filterable)
 *     tags: [Admin]
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
 *         name: type
 *         schema: { type: string }
 *       - in: query
 *         name: category
 *         schema: { type: string }
 *       - in: query
 *         name: sortBy
 *         schema: { type: string, default: createdAt }
 *       - in: query
 *         name: order
 *         schema: { type: string, enum: [asc, desc], default: desc }
 *     responses:
 *       200:
 *         description: Paginated violation type list
 *   post:
 *     summary: Create a violation type
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               violationName: { type: string }
 *               type: { type: string }
 *               category: { type: string }
 *               severity: { type: integer }
 *               defaultPenalty: { type: string }
 *               isActive: { type: boolean, default: true }
 *     responses:
 *       201:
 *         description: Violation type created
 *
 * /api/admin/violation-types/{id}:
 *   put:
 *     summary: Update a violation type
 *     tags: [Admin]
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
 *     responses:
 *       200:
 *         description: Violation type updated
 *       404:
 *         description: Not found
 *
 * /api/admin/violation-types/{id}/active:
 *   patch:
 *     summary: Toggle a violation type's active status (soft delete/restore)
 *     tags: [Admin]
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
 *             required: [isActive]
 *             properties:
 *               isActive: { type: boolean }
 *     responses:
 *       200:
 *         description: Violation type activated/deactivated
 *       404:
 *         description: Not found
 *
 * /api/admin/race-rounds:
 *   get:
 *     summary: Get race rounds (filterable by tournament, status, search)
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: tournament_id
 *         schema: { type: string }
 *       - in: query
 *         name: raceRound_id
 *         schema: { type: string }
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
 *           enum: [draft, scheduled, running, completed, cancelled, awaitingConfirmation, prepared]
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
 *         description: Paginated race round list
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
 *   post:
 *     summary: Create a new race round, optionally with initial referee assignments and horse-owner registrations
 *     description: >
 *       Rejected with 400 if another active race round at the same location is scheduled
 *       within 90 minutes of raceDate. Referee/registration creation failures are logged and
 *       skipped individually rather than failing the whole request.
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [TournamentId, RaceRound]
 *             properties:
 *               TournamentId: { type: string }
 *               RaceRound:
 *                 type: object
 *                 required: [roundName, raceDate, trackLength, maxParticipants, baseFee, raceGround]
 *                 properties:
 *                   roundName: { type: string }
 *                   raceDate: { type: string, format: date-time }
 *                   trackLength: { type: number }
 *                   maxParticipants: { type: integer }
 *                   baseFee: { type: number }
 *                   housingFeePercentage: { type: number, description: "Fraction 0-1 house-take override for race_winner/race_rank predictions on this race round; falls back to the platform default (17%) when omitted." }
 *                   raceGround: { type: string }
 *                   requireEntranceFees: { type: boolean, default: false }
 *                   firstPlacePrize: { type: number, default: 0 }
 *                   secondPlacePrize: { type: number, default: 0 }
 *                   thirdPlacePrize: { type: number, default: 0 }
 *                   currencyType: { type: string, default: VND }
 *                   location: { type: string }
 *                   address: { type: string }
 *                   eligibilityRuleId: { type: string }
 *               HorseOwnerInvitation:
 *                 type: array
 *                 items: { type: string }
 *                 description: HorseOwner IDs to pre-register (pending status)
 *               RefereeInvitation:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     refereeId: { type: string }
 *                     fee: { type: number, description: "Defaults to baseFee if omitted" }
 *     responses:
 *       201:
 *         description: "{ tournament, raceRound, registrations, raceReferees }"
 *       400:
 *         description: Location/time collision with another active race round
 *
 * /api/admin/race-rounds/{id}:
 *   put:
 *     summary: Update a race round
 *     description: >
 *       Rejected with 400 if rescheduling raceDate to less than 14 days from today, or if the
 *       resulting date/location collides with another active race round within 90 minutes.
 *     tags: [Admin]
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
 *               TournamentId: { type: string }
 *               RaceRound:
 *                 type: object
 *                 properties:
 *                   roundName: { type: string }
 *                   raceDate: { type: string, format: date-time }
 *                   trackLength: { type: number }
 *                   maxParticipants: { type: integer }
 *                   baseFee: { type: number }
 *                   housingFeePercentage: { type: number, description: "Fraction 0-1 house-take override for race_winner/race_rank predictions on this race round; falls back to the platform default (17%) when omitted." }
 *                   raceGround: { type: string }
 *                   location: { type: string }
 *                   firstPlacePrize: { type: number }
 *                   secondPlacePrize: { type: number }
 *                   thirdPlacePrize: { type: number }
 *               HorseOwnerInvitation:
 *                 type: array
 *                 items: { type: string }
 *               RefereeInvitation:
 *                 type: array
 *                 items: { type: object }
 *     responses:
 *       200:
 *         description: Race round updated
 *       400:
 *         description: Reschedule too close to today, or a location/time collision
 *       404:
 *         description: Race round not found
 *
 * /api/admin/race-rounds/{id}/cancel:
 *   patch:
 *     summary: Cancel a race round
 *     description: >
 *       Cascades: race round + all its RaceReferee assignments + Registrations + Invitations
 *       are set to cancelled, and pending predictions for the race round are refunded in the
 *       background.
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Race round cancelled
 *       400:
 *         description: Race round is already completed, running, awaitingConfirmation, or cancelled
 *       404:
 *         description: Race round not found
 *
 * /api/admin/race-rounds/{id}/detail:
 *   get:
 *     summary: Get full detail of one race round — registrations, referees, prediction pools, and per-participant Payment status
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: >
 *           Race round detail. Referee[] entries carry a `payment` (referee_fee), and each
 *           Registration entry carries `prizePayment` (race_prize) and `jockeyPayment`
 *           (jockey_payout) — all $ref Payment, null until confirmRaceResult has run.
 *       404:
 *         description: Not found
 *
 * /api/admin/race-rounds/{id}/status:
 *   put:
 *     summary: Start ("running") or cancel a "prepared" race round
 *     description: >
 *       Starting requires a Mux stream to already be provisioned (create-stream first).
 *       Cancelling triggers a background refund of that race round's pending predictions.
 *     tags: [Admin]
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
 *             required: [status]
 *             properties:
 *               status: { type: string, enum: [running, cancelled] }
 *     responses:
 *       200:
 *         description: Updated race round
 *       404:
 *         description: Race round not found
 *       422:
 *         description: Race round is not "prepared", or (for "running") no stream has been created yet
 *
 * /api/admin/race-rounds/{id}/stream:
 *   post:
 *     summary: Provision a Mux live stream for a "prepared" race round (idempotent)
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       201:
 *         description: "{ rtmpUrl, streamKey, playbackId } — stream newly created"
 *       200:
 *         description: Stream already existed — same shape returned
 *       404:
 *         description: Race round not found
 *       422:
 *         description: Race round is not "prepared"
 *   get:
 *     summary: Get Mux stream info (RTMP URL + stream key for the OBS operator, playback ID for viewers)
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Stream info
 *       404:
 *         description: Race round not found, or no stream created yet
 *       422:
 *         description: Race round is not "running" or "prepared"
 *
 * /api/admin/race-rounds/{id}/vod:
 *   get:
 *     summary: Get the Mux VOD playback ID for a race round after its live stream has ended
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: "{ vodPlaybackId }"
 *       404:
 *         description: Race round not found, or VOD not yet processed
 *
 * /api/admin/important-events:
 *   get:
 *     summary: Get the admin dashboard's "important events" feed (pending certifications/registrations, races ready to start, active tournaments)
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: "{ pendingCertifications, racesReadyToStart, activeTournaments, pendingRegistrations }"
 *
 * /api/admin/create-race-metadata:
 *   get:
 *     summary: Get all metadata needed for the "create race round" form (previous tracks, active tournaments, eligibility rules, referees, owners with active horses)
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: "{ previousRaceTracks, tournaments, eligibilityRules, referees, owners }"
 *
 * /api/admin/horses:
 *   get:
 *     summary: List all horses (paginated, filterable by search/status)
 *     tags: [Admin]
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
 *         name: status
 *         schema: { type: string, enum: [active, inactive, retired] }
 *       - in: query
 *         name: sortBy
 *         schema: { type: string, default: createdAt }
 *       - in: query
 *         name: order
 *         schema: { type: string, enum: [asc, desc], default: desc }
 *     responses:
 *       200:
 *         description: Paginated horse list, each item enriched with ownerName
 *
 * /api/admin/horses/{horseId}:
 *   get:
 *     summary: Get one horse's detail with owner info, full race history, and violation counts
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: horseId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: "{ horse, owner, totalRaces, totalViolations, raceHistory }"
 *       404:
 *         description: Horse not found
 *
 * /api/admin/horses/{horseId}/status:
 *   patch:
 *     summary: Update a horse's status
 *     tags: [Admin]
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
 *         description: Horse updated
 *       400:
 *         description: Invalid status
 *       404:
 *         description: Horse not found
 *
 * /api/admin/rules:
 *   get:
 *     summary: List race eligibility rules (paginated, searchable)
 *     tags: [Admin]
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
 *         schema: { type: string, description: "Matches raceType or gradeLevel" }
 *       - in: query
 *         name: sortBy
 *         schema: { type: string, default: createdAt }
 *       - in: query
 *         name: order
 *         schema: { type: string, enum: [asc, desc], default: desc }
 *     responses:
 *       200:
 *         description: Paginated rule list
 *   post:
 *     summary: Create a race eligibility rule
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Rule created
 *
 * /api/admin/rules/{id}:
 *   put:
 *     summary: Update a race eligibility rule
 *     tags: [Admin]
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
 *     responses:
 *       200:
 *         description: Rule updated
 *       404:
 *         description: Not found
 *   delete:
 *     summary: Delete a race eligibility rule
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Rule deleted
 *       404:
 *         description: Not found
 *
 * /api/admin/payments:
 *   get:
 *     summary: List the admin's own payments (as payer — race_prize to horseowners, referee_fee to referees)
 *     tags: [Admin]
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
 * /api/admin/payments/{paymentId}/confirm-paid:
 *   put:
 *     summary: Admin confirms a payment has been sent (payer-side confirmation)
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: paymentId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Payment updated (paymentStatus becomes "processing" or "paid")
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code: { type: integer, example: 200 }
 *                 data: { $ref: '#/components/schemas/Payment' }
 *                 msg: { type: string }
 *       403:
 *         description: Authenticated admin is not the payer on this payment
 *       404:
 *         description: Payment not found
 *       422:
 *         description: Already confirmed as payer
 */

module.exports = {};
