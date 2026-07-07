/**
 * @swagger
 *
 *
 *
 * /api/spectator/profile:
 *   get:
 *     summary: Get authenticated spectator's profile
 *     tags: [Spectator]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Spectator profile with user details
 *       401:
 *         description: Unauthorized
 *   put:
 *     summary: Update authenticated spectator's profile
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
 *               fullName: { type: string }
 *               phoneNumber: { type: string }
 *               dateOfBirth: { type: string, format: date }
 *               address: { type: string }
 *               image: { type: string }
 *     responses:
 *       200:
 *         description: Profile updated
 *
 *
 *
 *
 *
 * /api/spectator/wallet:
 *   get:
 *     summary: Get wallet info — reward points balance and total points ever earned
 *     tags: [Spectator]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Wallet info
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code: { type: integer, example: 200 }
 *                 data:
 *                   type: object
 *                   properties:
 *                     rewardPoints: { type: number }
 *                     totalEarned: { type: number }
 *                 msg: { type: string }
 *
 * /api/spectator/transactions:
 *   get:
 *     summary: Get paginated transaction history
 *     tags: [Spectator]
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
 *         name: transactionType
 *         schema: { type: string, enum: [deposit, withdrawal, reward, refund] }
 *         description: Filter by transaction type
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [pending, completed, failed] }
 *         description: Filter by status
 *       - in: query
 *         name: sortBy
 *         schema: { type: string, enum: [date, createdAt, amount], default: date }
 *       - in: query
 *         name: order
 *         schema: { type: string, enum: [asc, desc], default: desc }
 *     responses:
 *       200:
 *         description: Paginated transaction list
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code: { type: integer, example: 200 }
 *                 data:
 *                   type: object
 *                   properties:
 *                     items:
 *                       type: array
 *                       items: { type: object }
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         totalItems: { type: integer }
 *                         totalPages: { type: integer }
 *                         currentPage: { type: integer }
 *                         limit: { type: integer }
 *                 msg: { type: string }
 *
 *
 *
 * /api/spectator/home-feed:
 *   get:
 *     summary: Get home feed — live race, upcoming races, featured horses, reward points
 *     tags: [Spectator]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Home feed data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code: { type: integer, example: 200 }
 *                 data:
 *                   type: object
 *                   properties:
 *                     liveRace:
 *                       type: object
 *                       nullable: true
 *                       description: Currently running race (null if none)
 *                     upcomingRaces:
 *                       type: array
 *                       description: Up to 5 scheduled races sorted by raceDate ASC
 *                       items: { type: object }
 *                     featuredHorses:
 *                       type: array
 *                       description: Top 4 active horses by win rate
 *                       items: { type: object }
 *                     rewardPoints:
 *                       type: number
 *                 msg: { type: string }
 *
 * /api/spectator/race-schedule:
 *   get:
 *     summary: Get paginated race schedule with participant counts
 *     tags: [Spectator]
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
 *         schema: { type: string, enum: [running, scheduled, completed] }
 *         description: Filter by race status
 *       - in: query
 *         name: sortBy
 *         schema: { type: string, enum: [raceDate, createdAt, updatedAt], default: raceDate }
 *       - in: query
 *         name: order
 *         schema: { type: string, enum: [asc, desc], default: asc }
 *     responses:
 *       200:
 *         description: Paginated race schedule — each item includes currentParticipants count
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code: { type: integer, example: 200 }
 *                 data:
 *                   type: object
 *                   properties:
 *                     items:
 *                       type: array
 *                       items: { type: object }
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         totalItems: { type: integer }
 *                         totalPages: { type: integer }
 *                         currentPage: { type: integer }
 *                         limit: { type: integer }
 *                 msg: { type: string }
 *
 * /api/spectator/race-rounds/{raceRoundId}/live:
 *   get:
 *     summary: Get live race detail — registrations with horse, confirmed jockey, and user's prediction
 *     tags: [Spectator]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: raceRoundId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Live race detail with raceRound and enriched registrations
 *       404:
 *         description: Race round not found
 *
 *
 *
 *
 * /api/spectator/predictions:
 *   post:
 *     summary: Create a prediction for a registration
 *     tags: [Spectator]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [registrationId, predictionMethodId]
 *             properties:
 *               registrationId: { type: string }
 *               predictionMethodId: { type: string }
 *               predictedRank: { type: integer, minimum: 1 }
 *     responses:
 *       201:
 *         description: Prediction created
 *       400:
 *         description: Already predicted, method inactive, or missing fields
 *       404:
 *         description: Registration or prediction method not found
 *   get:
 *     summary: Get my predictions (paginated, filterable, sortable)
 *     tags: [Spectator]
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
 *         name: predictionStatus
 *         schema: { type: string, enum: [pending, correct, incorrect, cancelled, refunded] }
 *         description: Filter by prediction status
 *       - in: query
 *         name: sortBy
 *         schema: { type: string, enum: [created_at, updatedAt, predictionStatus, rewardPoints], default: created_at }
 *       - in: query
 *         name: order
 *         schema: { type: string, enum: [asc, desc], default: desc }
 *     responses:
 *       200:
 *         description: Paginated predictions — each item includes predictionMethod, registration, horse, raceRound, tournament
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code: { type: integer, example: 200 }
 *                 data:
 *                   type: object
 *                   properties:
 *                     items:
 *                       type: array
 *                       items: { type: object }
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         totalItems: { type: integer }
 *                         totalPages: { type: integer }
 *                         currentPage: { type: integer }
 *                         limit: { type: integer }
 *                 msg: { type: string }
 *
 * /api/spectator/predictions/{predictionId}:
 *   get:
 *     summary: Get full detail of a single prediction — includes actualResult if race is completed
 *     tags: [Spectator]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: predictionId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Prediction detail with method, registration, horse, raceRound, tournament, and actualResult
 *       403:
 *         description: Access denied — prediction belongs to another spectator
 *       404:
 *         description: Prediction not found
 */

module.exports = {};
