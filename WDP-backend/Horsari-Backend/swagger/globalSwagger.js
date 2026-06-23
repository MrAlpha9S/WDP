/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Global]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
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
 *                     user: { type: object }
 *                 msg: { type: string, example: "User registered successfully" }
 *       400:
 *         description: Validation error
 *       409:
 *         description: Email or username already exists
 *
 * /api/auth/login:
 *   post:
 *     summary: Login with email and password
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
 *         description: Login successful — returns JWT and sets httpOnly cookie
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
 *                     user: { type: object }
 *                 msg: { type: string, example: "Login successful" }
 *       401:
 *         description: Invalid credentials
 *       403:
 *         description: Account not active
 *
 * /api/auth/google/login:
 *   post:
 *     summary: Login or register via Google ID token
 *     tags: [Global]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [idToken]
 *             properties:
 *               idToken:
 *                 type: string
 *                 description: Google ID token from client
 *     responses:
 *       200:
 *         description: Existing Google account logged in
 *       201:
 *         description: New account created via Google
 *
 * /api/auth/google/login/additional-info:
 *   post:
 *     summary: Complete Google account setup — select role (one-time only)
 *     tags: [Global]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [role]
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [horseowner, jockey, referee, spectator, admin]
 *                 example: jockey
 *               height:
 *                 type: number
 *                 description: Required for jockey role
 *               weight:
 *                 type: number
 *                 description: Required for jockey role
 *     responses:
 *       200:
 *         description: Role set and entity created
 *       400:
 *         description: Already completed or invalid role
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
 *       401:
 *         description: Unauthorized
 *
 * /api/auth/user/{id}:
 *   get:
 *     summary: Get user by ID
 *     tags: [Global]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: User profile
 *       404:
 *         description: User not found
 *
 * /api/auth/logout:
 *   post:
 *     summary: Logout — clears auth cookie
 *     tags: [Global]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 *
 * /api/upload/cert/user/{id}:
 *   post:
 *     summary: Upload certification document (PDF only, max 10 MB)
 *     description: "Available to: horseowner, jockey, referee. Automatically updates licenseLink on the role entity."
 *     tags: [Global]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [certification]
 *             properties:
 *               certification:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Certification uploaded and licenseLink updated
 *       400:
 *         description: Missing file or wrong format
 *       403:
 *         description: Role not allowed to upload certifications
 */

module.exports = {};
