/**
 * @swagger
 * tags:
 *   name: Spectator
 *   description: Spectator endpoints
 *
 * /api/spectator/{uid}:
 *   post:
 *     summary: Create spectator profile for an existing user (public)
 *     tags: [Spectator]
 *     parameters:
 *       - in: path
 *         name: uid
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               rewardPoints:
 *                 type: number
 *     responses:
 *       201:
 *         description: Spectator profile created
 *       409:
 *         description: Profile already exists
 *
 * /api/spectator/top:
 *   get:
 *     summary: Get top spectators by reward points (public)
 *     tags: [Spectator]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Top spectators list
 *
 * /api/spectator/all:
 *   get:
 *     summary: Get all spectators (public)
 *     tags: [Spectator]
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
 *         description: Spectator list
 *
 * /api/spectator/profile:
 *   get:
 *     summary: GetProfile — returns spectator info, user info, and prediction stats
 *     tags: [Spectator]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Profile with stats
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     spectator:
 *                       type: object
 *                       properties:
 *                         _id:
 *                           type: string
 *                         rewardPoints:
 *                           type: number
 *                     user:
 *                       type: object
 *                       properties:
 *                         fullName:
 *                           type: string
 *                         username:
 *                           type: string
 *                         email:
 *                           type: string
 *                         dateOfBirth:
 *                           type: string
 *                         phoneNumber:
 *                           type: string
 *                         image:
 *                           type: string
 *                         address:
 *                           type: string
 *                         status:
 *                           type: string
 *                     stats:
 *                       type: object
 *                       properties:
 *                         totalPredictions:
 *                           type: integer
 *                         totalCorrectPredictions:
 *                           type: integer
 *                         winRate:
 *                           type: number
 *   put:
 *     summary: UpdateProfile — update user fields
 *     tags: [Spectator]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fullName:
 *                 type: string
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *               dateOfBirth:
 *                 type: string
 *               phoneNumber:
 *                 type: string
 *               image:
 *                 type: string
 *               address:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated
 *
 * /api/spectator/change-password:
 *   put:
 *     summary: ChangePassword
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
 *               oldPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *               confirmPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password changed
 *       400:
 *         description: Validation error
 *
 * /api/spectator/wallet:
 *   get:
 *     summary: GetWalletInfo — rewardPoints and total earned
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
 *                 data:
 *                   type: object
 *                   properties:
 *                     spectator:
 *                       type: object
 *                       properties:
 *                         _id:
 *                           type: string
 *                         rewardPoints:
 *                           type: number
 *                     stats:
 *                       type: object
 *                       properties:
 *                         totalEarned:
 *                           type: number
 *
 * /api/spectator/transactions:
 *   get:
 *     summary: GetTransactionHistory — paginated, filterable
 *     tags: [Spectator]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: transactionType
 *         schema:
 *           type: string
 *           enum: [reward, deposit, withdrawal, refund]
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, completed, failed]
 *     responses:
 *       200:
 *         description: Transaction history with pagination meta
 *
 * /api/spectator/transactions/deposit:
 *   post:
 *     summary: DepositPoints — create deposit transaction
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
 *               amount:
 *                 type: number
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Deposit successful
 *       400:
 *         description: Invalid amount
 *
 * /api/spectator/transactions/withdraw:
 *   post:
 *     summary: WithdrawPoints — create withdrawal transaction
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
 *               amount:
 *                 type: number
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Withdrawal successful
 *       400:
 *         description: Insufficient points or invalid amount
 *
 * /api/spectator/home-feed:
 *   get:
 *     summary: GetHomeFeed — live race, upcoming races, featured horses, spectator points
 *     tags: [Spectator]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Home feed data
 *
 * /api/spectator/race-schedule:
 *   get:
 *     summary: GetRaceSchedule — paginated race rounds by status
 *     tags: [Spectator]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: filter
 *         schema:
 *           type: string
 *           enum: [running, scheduled, completed]
 *           default: scheduled
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Race schedule with pagination meta
 *
 * /api/spectator/race/{raceRoundId}/live:
 *   get:
 *     summary: GetLiveRaceDetail — race details with registrations and user predictions
 *     tags: [Spectator]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: raceRoundId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Live race detail
 *       404:
 *         description: Race round not found
 *
 * /api/spectator/race/{raceRoundId}/results:
 *   get:
 *     summary: GetRaceResult — final results sorted by finish position
 *     tags: [Spectator]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: raceRoundId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Race results
 *       404:
 *         description: Race round not found
 *
 * /api/spectator/race/{raceRoundId}/leaderboard:
 *   get:
 *     summary: GetRaceLeaderboard — simplified leaderboard
 *     tags: [Spectator]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: raceRoundId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Leaderboard
 *       404:
 *         description: Race round not found
 *
 * /api/spectator/race/{raceRoundId}/prediction-methods:
 *   get:
 *     summary: GetAvailablePredictionMethods — active methods and user's existing predictions
 *     tags: [Spectator]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: raceRoundId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Prediction methods with userAlreadyPredicted flag
 *       404:
 *         description: Race round not found
 *
 * /api/spectator/predictions:
 *   post:
 *     summary: CreatePrediction
 *     tags: [Spectator]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [registrationId, predictionMethodId, predictedRank]
 *             properties:
 *               registrationId:
 *                 type: string
 *               predictionMethodId:
 *                 type: string
 *               predictedRank:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Prediction created
 *       400:
 *         description: Validation error
 *       404:
 *         description: Registration or method not found
 *       409:
 *         description: Duplicate prediction
 *   get:
 *     summary: GetMyPredictions — paginated, filterable by status
 *     tags: [Spectator]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: predictionStatus
 *         schema:
 *           type: string
 *           enum: [pending, correct, incorrect, cancelled, refunded, all]
 *           default: all
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: My predictions with pagination meta
 *
 * /api/spectator/predictions/{predictionId}:
 *   get:
 *     summary: GetPredictionDetail — full prediction with actual result if available
 *     tags: [Spectator]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: predictionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Prediction detail
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Prediction not found
 *
 * /api/spectator/rewards:
 *   get:
 *     summary: Get reward points balance (legacy)
 *     tags: [Spectator]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Reward points
 *
 * /api/spectator/rewards/add:
 *   post:
 *     summary: Add reward points (legacy)
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
 *               points:
 *                 type: number
 *     responses:
 *       200:
 *         description: Points added
 *
 * /api/spectator/rewards/deduct:
 *   post:
 *     summary: Deduct reward points (legacy)
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
 *               points:
 *                 type: number
 *     responses:
 *       200:
 *         description: Points deducted
 *       400:
 *         description: Insufficient points
 */

module.exports = {};
