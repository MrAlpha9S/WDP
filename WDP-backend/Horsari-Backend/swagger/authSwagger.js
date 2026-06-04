/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     description: |
 *       Create a new user account with username, email, and password.
 *       Optional: include role and other profile details (horseowner, jockey, referee, spectator).
 *       Returns JWT access token (valid 1 hour) and sets httpOnly cookie.
 *       Default role is 'spectator' if not provided.
 *     tags: [Auth]
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
 *                 description: "Unique username"
 *                 example: john_doe
 *               email:
 *                 type: string
 *                 format: email
 *                 description: "Unique email address"
 *                 example: john@example.com
 *               password:
 *                 type: string
 *                 description: "Min 8 chars: uppercase + lowercase + number + special char"
 *                 example: SecurePass123!
 *               fullName:
 *                 type: string
 *                 description: "User's full name (optional)"
 *                 example: John Doe
 *               phoneNumber:
 *                 type: string
 *                 description: "Phone number (optional)"
 *                 example: "+1234567890"
 *               dateOfBirth:
 *                 type: string
 *                 format: date
 *                 description: "Birth date YYYY-MM-DD (optional)"
 *                 example: "1990-05-15"
 *               role:
 *                 type: string
 *                 enum: [horseowner, jockey, referee, spectator]
 *                 description: "User role (optional, defaults to 'spectator')"
 *                 example: spectator
 *     responses:
 *       201:
 *         description: "User registered successfully. Access token set as httpOnly cookie (1 hour)"
 *         headers:
 *           Set-Cookie:
 *             schema:
 *               type: string
 *               example: "Authorization=Bearer <token>; Path=/; HttpOnly; SameSite=Strict; Max-Age=3600"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                   example: 201
 *                 data:
 *                   type: object
 *                   properties:
 *                     accessToken:
 *                       type: string
 *                       description: "JWT access token (valid 1 hour)"
 *                     user:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         username:
 *                           type: string
 *                         email:
 *                           type: string
 *                         role:
 *                           type: string
 *                         fullName:
 *                           type: string
 *                 msg:
 *                   type: string
 *                   example: "User registered successfully"
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                   example: 400
 *                 msg:
 *                   type: string
 *                   example: "Password must be at least 8 characters with uppercase, lowercase, number, and special character"
 *       409:
 *         description: Email or username already exists
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                   example: 409
 *                 msg:
 *                   type: string
 *                   example: "Email already exists"
 *       500:
 *         description: Server error
 *
 * /api/auth/login:
 *   post:
 *     summary: Login user
 *     description: Authenticate user with email and password. Returns access token (valid 1 hour) and sets httpOnly cookie.
 *     tags: [Auth]
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
 *         headers:
 *           Set-Cookie:
 *             schema:
 *               type: string
 *               example: "Authorization=Bearer <token>; Path=/; HttpOnly; SameSite=Strict; Max-Age=3600"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                   example: 200
 *                 data:
 *                   type: object
 *                   properties:
 *                     accessToken:
 *                       type: string
 *                       description: "JWT access token (valid 1 hour)"
 *                     user:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         username:
 *                           type: string
 *                         email:
 *                           type: string
 *                         role:
 *                           type: string
 *                         fullName:
 *                           type: string
 *                 msg:
 *                   type: string
 *                   example: "Login successful"
 *       400:
 *         description: Missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                   example: 400
 *                 msg:
 *                   type: string
 *                   example: "Email and password are required"
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                   example: 401
 *                 msg:
 *                   type: string
 *                   example: "Invalid password"
 *       403:
 *         description: Account is not active
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                   example: 403
 *                 msg:
 *                   type: string
 *                   example: "User account is not active"
 *       500:
 *         description: Server error
 *
 * /api/auth/google/login:
 *   post:
 *     summary: Google Login (creates account if missing)
 *     description: |
 *       Authenticate with Google ID token. If account doesn't exist, creates new account with role 'google_unchosen'.
 *       Returns access token (valid 1 hour) and sets httpOnly cookie.
 *     tags: [Auth]
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
 *                 description: Google ID token (JWT) from client
 *                 example: "eyJhbGciOiJSUzI1NiIsImtpZCI6IjE..."
 *     responses:
 *       200:
 *         description: Existing account logged in
 *         headers:
 *           Set-Cookie:
 *             schema:
 *               type: string
 *               example: "Authorization=Bearer <token>; Path=/; HttpOnly; SameSite=Strict; Max-Age=3600"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                   example: 200
 *                 data:
 *                   type: object
 *                   properties:
 *                     accessToken:
 *                       type: string
 *                       description: "JWT access token (valid 1 hour)"
 *                     user:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         username:
 *                           type: string
 *                         email:
 *                           type: string
 *                         fullName:
 *                           type: string
 *                         role:
 *                           type: string
 *                         isFirstLogin:
 *                           type: boolean
 *                           description: "True if user has no password (Google-only account)"
 *                 msg:
 *                   type: string
 *                   example: "Login successful via Google"
 *       201:
 *         description: New account created and logged in
 *         headers:
 *           Set-Cookie:
 *             schema:
 *               type: string
 *               example: "Authorization=Bearer <token>; Path=/; HttpOnly; SameSite=Strict; Max-Age=3600"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                   example: 201
 *                 data:
 *                   type: object
 *                   properties:
 *                     accessToken:
 *                       type: string
 *                       description: "JWT access token (valid 1 hour)"
 *                     user:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         username:
 *                           type: string
 *                           description: "Auto-generated from email"
 *                         email:
 *                           type: string
 *                         fullName:
 *                           type: string
 *                         role:
 *                           type: string
 *                           example: "google_unchosen"
 *                         isFirstLogin:
 *                           type: boolean
 *                           example: true
 *                 msg:
 *                   type: string
 *                   example: "User registered via Google (login fallback)"
 *       400:
 *         description: Invalid or missing idToken
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                   example: 400
 *                 msg:
 *                   type: string
 *                   example: "Google token did not contain an email"
 *       500:
 *         description: Server error
 *
 * /api/auth/google/login/additional-info:
 *   post:
 *     summary: Complete Google login with role selection and additional info
 *     description: |
 *       After Google login, users can complete their profile by selecting a role and providing role-specific information.
 *       This endpoint updates the user's role and creates the corresponding role entity (jockey, horse owner, referee, spectator, or admin).
 *       
 *       **⚠️ ONE-TIME USE ONLY**: This endpoint can only be called once per user, when their role is `google_unchosen`.
 *       After the role is set, this endpoint will return a 400 error if called again.
 *       Additionally, if a role entity already exists for the user, the endpoint will also return a 400 error to prevent duplicates.
 *       
 *       **Authentication Required**: This endpoint requires a valid JWT token from the Google login response.
 *       The userId is automatically extracted from the JWT token (Authorization header or cookie).
 *       Do NOT send userId in the request body - it will be ignored.
 *       
 *       **Role-specific requirements:**
 *       - **Jockey**: height, weight (required)
 *       - **Horse Owner**: No additional fields required
 *       - **Referee**: No additional fields required
 *       - **Spectator**: No additional fields required
 *       - **Admin**: No additional fields required
 *       
 *       **Note**: After creating the role entity, users can upload their license/certification using the `/api/upload/cert/user/{id}` endpoint.
 *       The uploaded file will automatically update the `licenseLink` field in their role entity.
 *     tags: [Auth]
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
 *                 description: Selected role
 *                 example: "jockey"
 *               height:
 *                 type: number
 *                 description: "Required for jockey role"
 *                 example: 165
 *               weight:
 *                 type: number
 *                 description: "Required for jockey role"
 *                 example: 52
 *     responses:
 *       200:
 *         description: Role updated and entity created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                   example: 200
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         username:
 *                           type: string
 *                         email:
 *                           type: string
 *                         fullName:
 *                           type: string
 *                         role:
 *                           type: string
 *                           example: "jockey"
 *                     roleEntity:
 *                       type: object
 *                       description: "Created role-specific entity (Jockey, HorseOwner, etc.)"
 *                 msg:
 *                   type: string
 *                   example: "User role updated to jockey and profile created successfully"
 *       400:
 *         description: Missing required fields, invalid role, profile already completed, or role entity already exists
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                   example: 400
 *                 msg:
 *                   type: string
 *                   example: "User has already completed profile setup. Role cannot be changed through this endpoint."
 *                   enum:
 *                     - "User ID and role are required"
 *                     - "Invalid role specified"
 *                     - "Height and weight are required for jockey"
 *                     - "User has already completed profile setup. Role cannot be changed through this endpoint."
 *                     - "Role entity already exists for this user. Profile setup has already been completed."
 *       401:
 *         description: Unauthorized - invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                   example: 401
 *                 msg:
 *                   type: string
 *                   example: "No token provided"
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                   example: 404
 *                 msg:
 *                   type: string
 *                   example: "User not found"
 *       500:
 *         description: Server error
 *
 * /api/auth/current-user:
 *   get:
 *     summary: Get current user profile
 *     description: Retrieve authenticated user's information
 *     tags: [Auth]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                   example: 200
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     username:
 *                       type: string
 *                     email:
 *                       type: string
 *                     fullName:
 *                       type: string
 *                     phoneNumber:
 *                       type: string
 *                     role:
 *                       type: string
 *                     status:
 *                       type: string
 *                 msg:
 *                   type: string
 *                   example: "User retrieved successfully"
 *       401:
 *         description: Unauthorized - invalid or missing token
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 *
 * /api/auth/user/{id}:
 *   get:
 *     summary: Get user by ID
 *     description: Retrieve user information by user ID (protected endpoint)
 *     tags: [Auth]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User MongoDB ObjectId
 *         example: 507f1f77bcf86cd799439011
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                   example: 200
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     username:
 *                       type: string
 *                     email:
 *                       type: string
 *                     fullName:
 *                       type: string
 *                     phoneNumber:
 *                       type: string
 *                     role:
 *                       type: string
 *                     status:
 *                       type: string
 *                 msg:
 *                   type: string
 *                   example: "User retrieved successfully"
 *       401:
 *         description: Unauthorized - invalid or missing token
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 *
 * /api/auth/logout:
 *   post:
 *     summary: Logout user
 *     description: Clear access token cookie and end session
 *     tags: [Auth]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful - access token cookie cleared
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: "Logout successful"
 *       401:
 *         description: Unauthorized - invalid or missing token
 */

module.exports = {};
