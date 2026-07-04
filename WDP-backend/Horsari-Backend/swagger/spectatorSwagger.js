/**
 * @swagger
 * /api/spectator/{uid}:
 *   post:
 *     summary: Create spectator profile for an existing user
 *     tags: [Spectator]
 *     parameters:
 *       - in: path
 *         name: uid
 *         required: true
 *         schema: { type: string }
 *         description: User ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               rewardPoints: { type: number, default: 0 }
 *     responses:
 *       201:
 *         description: Spectator profile created
 *       409:
 *         description: Spectator profile already exists
 *
 * /api/spectator/top:
 *   get:
 *     summary: Get top spectators by reward points
 *     tags: [Spectator]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *     responses:
 *       200:
 *         description: Top spectators list
 *
 * /api/spectator/all:
 *   get:
 *     summary: Get all spectators (paginated)
 *     tags: [Spectator]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: skip
 *         schema: { type: integer, default: 0 }
 *     responses:
 *       200:
 *         description: Spectator list with count
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
 * /api/spectator/change-password:
 *   post:
 *     summary: Change password for the authenticated spectator
 *     tags: [Spectator]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [oldPassword, newPassword, confirmPassword]
 *             properties:
 *               oldPassword: { type: string }
 *               newPassword: { type: string }
 *               confirmPassword: { type: string }
 *     responses:
 *       200:
 *         description: Password changed successfully
 *       400:
 *         description: Validation error (weak password, passwords don't match, Google account)
 *       401:
 *         description: Old password is incorrect
 *
 * /api/spectator/rewards:
 *   get:
 *     summary: Get reward point balance
 *     tags: [Spectator]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Reward points balance
 *
 * /api/spectator/rewards/add:
 *   post:
 *     summary: Add reward points (admin action)
 *     tags: [Spectator]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [points]
 *             properties:
 *               points: { type: number, minimum: 1 }
 *     responses:
 *       200:
 *         description: Points added
 *
 * /api/spectator/rewards/deduct:
 *   post:
 *     summary: Deduct reward points (admin action)
 *     tags: [Spectator]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [points]
 *             properties:
 *               points: { type: number, minimum: 1 }
 *     responses:
 *       200:
 *         description: Points deducted
 *       400:
 *         description: Insufficient points
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
 *                     user:
 *                       type: object
 *                       properties:
 *                         _id: { type: string }
 *                         wallet: { type: number }
 *                     stats:
 *                       type: object
 *                       properties:
 *                         totalEarned: { type: number }
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
 * /api/spectator/deposit:
 *   post:
 *     summary: Deposit points into wallet
 *     tags: [Spectator]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [amount]
 *             properties:
 *               amount: { type: number, minimum: 1 }
 *               description: { type: string }
 *     responses:
 *       200:
 *         description: Points deposited, returns new balance
 *       400:
 *         description: Invalid amount
 *
 * /api/spectator/withdraw:
 *   post:
 *     summary: Withdraw points from wallet
 *     tags: [Spectator]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [amount]
 *             properties:
 *               amount: { type: number, minimum: 1 }
 *               description: { type: string }
 *     responses:
 *       200:
 *         description: Points withdrawn, returns new balance
 *       400:
 *         description: Invalid amount or insufficient balance
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
 * /api/spectator/race-rounds/{raceRoundId}/result:
 *   get:
 *     summary: Get race results sorted by finish position
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
 *         description: Race results with raceRound, each result includes registration, horse, and jockey
 *       404:
 *         description: Race round not found
 *
 * /api/spectator/race-rounds/{raceRoundId}/leaderboard:
 *   get:
 *     summary: Get race leaderboard (same as result, sorted by finish position ASC)
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
 *         description: Leaderboard with registration, horse, and jockey data
 *       404:
 *         description: Race round not found
 *
 * /api/spectator/race-rounds/{raceRoundId}/prediction-methods:
 *   get:
 *     summary: Get available prediction methods for a race — includes userAlreadyPredicted flag
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
 *         description: Active prediction methods enriched with userAlreadyPredicted and existingPredictions
 *       404:
 *         description: Race round not found
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
