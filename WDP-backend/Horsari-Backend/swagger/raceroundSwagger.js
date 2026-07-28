/**
 * @swagger
 * /api/raceround:
 *   post:
 *     summary: Create a new race round, optionally with initial referee assignments and horse-owner registrations
 *     description: >
 *       Rejected with 400 if another active race round at the same location is scheduled
 *       within 90 minutes of raceDate. Referee/registration creation failures are logged and
 *       skipped individually rather than failing the whole request.
 *     tags: [RaceRound]
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
 * /api/raceround/{id}:
 *   put:
 *     summary: Update a race round
 *     description: >
 *       Rejected with 400 if rescheduling raceDate to less than 14 days from today, or if the
 *       resulting date/location collides with another active race round within 90 minutes.
 *     tags: [RaceRound]
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
 * /api/raceround/{id}/cancel:
 *   patch:
 *     summary: Cancel a race round
 *     description: >
 *       Cascades: race round + all its RaceReferee assignments + Registrations + Invitations
 *       are set to cancelled, and pending predictions for the race round are refunded in the
 *       background.
 *     tags: [RaceRound]
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
 */

module.exports = {};
