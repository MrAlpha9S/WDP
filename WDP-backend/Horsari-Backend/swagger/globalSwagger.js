/**
 * @swagger
 * components:
 *   schemas:
 *     PaginationMeta:
 *       type: object
 *       properties:
 *         totalItems: { type: integer }
 *         totalPages: { type: integer }
 *         currentPage: { type: integer }
 *         limit: { type: integer }
 *     Payment:
 *       type: object
 *       description: >
 *         A Transaction document being used as a two-sided payment-verification record
 *         (paymentType is set; transactionType is left null on these rows). Status is
 *         unpaid until payerConfirmed, then processing until payeeConfirmed too, then paid.
 *       properties:
 *         _id: { type: string }
 *         paymentType: { type: string, enum: [race_prize, jockey_payout, referee_fee] }
 *         payerRole: { type: string, enum: [admin, horseowner] }
 *         payerId: { type: string }
 *         payeeRole: { type: string, enum: [horseowner, jockey, referee] }
 *         payeeId: { type: string }
 *         sourceType: { type: string, enum: [RaceResult, Invitation, RaceReferee] }
 *         sourceId: { type: string }
 *         raceRoundId: { type: string }
 *         amount: { type: number, description: "VND, converted via CurrencyConverter" }
 *         originalAmount: { type: number }
 *         originalCurrency: { type: string }
 *         payerConfirmed: { type: boolean }
 *         payerConfirmedAt: { type: string, format: date-time, nullable: true }
 *         payeeConfirmed: { type: boolean }
 *         payeeConfirmedAt: { type: string, format: date-time, nullable: true }
 *         paymentStatus: { type: string, enum: [unpaid, processing, paid] }
 *
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     description: >
 *       Multipart form. The "license" file is required when role is horseowner, jockey,
 *       or referee (uploaded to Cloudinary and stored as licenseLink, pending admin verification).
 *       Sets an httpOnly "Authorization" cookie on success in addition to returning accessToken.
 *     tags: [Global]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [username, email, password]
 *             properties:
 *               username:
 *                 type: string
 *                 example: john_doe
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john@example.com
 *               password:
 *                 type: string
 *                 description: "Min 8 chars: uppercase + lowercase + number + special char"
 *                 example: SecurePass123!
 *               fullName:
 *                 type: string
 *                 example: John Doe
 *               phoneNumber:
 *                 type: string
 *                 example: "+1234567890"
 *               dateOfBirth:
 *                 type: string
 *                 format: date
 *                 example: "1990-05-15"
 *               role:
 *                 type: string
 *                 enum: [horseowner, jockey, referee, spectator]
 *                 default: spectator
 *               license:
 *                 type: string
 *                 format: binary
 *                 description: Required PDF license when role is horseowner, jockey, or referee
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code: { type: integer, example: 201 }
 *                 data:
 *                   type: object
 *                   properties:
 *                     accessToken: { type: string }
 *                     user:
 *                       type: object
 *                       properties:
 *                         username: { type: string }
 *                         email: { type: string }
 *                         role: { type: string }
 *                         fullName: { type: string }
 *                 msg: { type: string, example: "User registered successfully" }
 *       400:
 *         description: Missing/invalid fields, weak password, or missing license for a licensed role
 *       409:
 *         description: Email or username already exists
 *
 * /api/auth/login:
 *   post:
 *     summary: Login with email and password
 *     description: Sets an httpOnly "Authorization" cookie on success in addition to returning accessToken.
 *     tags: [Global]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john@example.com
 *               password:
 *                 type: string
 *                 example: SecurePass123!
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code: { type: integer, example: 200 }
 *                 data:
 *                   type: object
 *                   properties:
 *                     accessToken: { type: string }
 *                     user:
 *                       type: object
 *                       properties:
 *                         username: { type: string }
 *                         email: { type: string }
 *                         role: { type: string }
 *                         fullName: { type: string }
 *                 msg: { type: string, example: "Login successful" }
 *       400:
 *         description: Missing email or password
 *       401:
 *         description: User not found or invalid password
 *       403:
 *         description: Account not active
 *
 * /api/auth/current-user:
 *   get:
 *     summary: Get the currently authenticated user
 *     tags: [Global]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Current user profile
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code: { type: integer, example: 200 }
 *                 data:
 *                   type: object
 *                   properties:
 *                     id: { type: string }
 *                     username: { type: string }
 *                     email: { type: string }
 *                     fullName: { type: string }
 *                     phoneNumber: { type: string }
 *                     role: { type: string }
 *                     status: { type: string }
 *                 msg: { type: string }
 *       404:
 *         description: User not found
 *
 * /api/auth/logout:
 *   post:
 *     summary: Logout — clears the Authorization cookie
 *     tags: [Global]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg: { type: string, example: "Logout successful" }
 */

module.exports = {};
