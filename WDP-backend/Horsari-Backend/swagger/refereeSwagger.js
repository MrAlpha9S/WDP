/**
 * @swagger
 * /api/referee/{uid}:
 *   post:
 *     summary: Create referee profile for an existing user (public)
 *     tags: [Referee]
 *     parameters:
 *       - in: path
 *         name: uid
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the user to create a referee profile for
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               license_link:
 *                 type: string
 *                 description: "License document link"
 *     responses:
 *       201:
 *         description: Referee profile created successfully
 *       400:
 *         description: Bad request
 *       404:
 *         description: User not found
 *       409:
 *         description: Profile already exists
 *
 * /api/referee/all:
 *   get:
 *     summary: Get all referees
 *     tags: [Referee]
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
 *         description: List of referees
 *
 * /api/referee/credentials/{certificationNumber}:
 *   get:
 *     summary: Get referee by certification number (DEPRECATED)
 *     description: This endpoint is deprecated. Certification information is now stored as license_link.
 *     tags: [Referee]
 *     parameters:
 *       - in: path
 *         name: certificationNumber
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       400:
 *         description: Endpoint deprecated
 *
 * /api/referee/license/{licenseNumber}:
 *   get:
 *     summary: Get referee by license number (DEPRECATED)
 *     description: This endpoint is deprecated. License information is now stored as license_link.
 *     tags: [Referee]
 *     parameters:
 *       - in: path
 *         name: licenseNumber
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       400:
 *         description: Endpoint deprecated
 *
 * /api/referee/profile:
 *   get:
 *     summary: Get my referee profile
 *     tags: [Referee]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Profile details
 *   put:
 *     summary: Update my profile
 *     tags: [Referee]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               license_link:
 *                 type: string
 *                 description: "License document link"
 *     responses:
 *       200:
 *         description: Profile updated
 *
 * /api/referee/verify-credentials:
 *   post:
 *     summary: Verify referee credentials (DEPRECATED)
 *     description: This endpoint is deprecated. Certification information is now stored as license_link.
 *     tags: [Referee]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               certificationNumber:
 *                 type: string
 *     responses:
 *       400:
 *         description: Endpoint deprecated
 *
 * /api/referee/renew-certification:
 *   post:
 *     summary: Renew certification (DEPRECATED)
 *     description: This endpoint is deprecated. Use update profile to change license_link.
 *     tags: [Referee]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               newCertificationNumber:
 *                 type: string
 *     responses:
 *       400:
 *         description: Endpoint deprecated
 */

module.exports = {};
