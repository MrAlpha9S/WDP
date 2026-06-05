/**
 * @swagger
 * /api/upload/cert/user/{id}:
 *   post:
 *     summary: Upload certification for a user
 *     description: |
 *       Unified endpoint to upload certification documents for horse owners, jockeys, and referees.
 *       The system automatically determines the certification type based on the user's role.
 *       Only PDF files are accepted (max 10MB).
 *       
 *       **After upload, the `licenseLink` field in the user's role entity (HorseOwner, Jockey, or Referee) will be automatically updated with the file path.**
 *       
 *       **Allowed roles:**
 *       - **Horse Owner**: Uploads license document, updates HorseOwner.licenseLink
 *       - **Jockey**: Uploads license document, updates Jockey.licenseLink
 *       - **Referee**: Uploads license document, updates Referee.licenseLink
 *       
 *       **Note**: Spectators and Admins cannot upload certifications.
 *     tags: [Upload]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID to upload certification for
 *         example: "507f1f77bcf86cd799439011"
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - certification
 *             properties:
 *               certification:
 *                 type: string
 *                 format: binary
 *                 description: PDF certification file (max 10MB)
 *     responses:
 *       201:
 *         description: Certification uploaded successfully
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
 *                     filename:
 *                       type: string
 *                       example: "507f1f77bcf86cd799439011_horseowner_certificate_1234567890.pdf"
 *                     filepath:
 *                       type: string
 *                       example: "/uploads/certifications/507f1f77bcf86cd799439011_horseowner_certificate_1234567890.pdf"
 *                       description: "This path is automatically saved to the licenseLink field in the role entity"
 *                     originalName:
 *                       type: string
 *                       example: "my_certificate.pdf"
 *                     size:
 *                       type: number
 *                       example: 524288
 *                     uploadedAt:
 *                       type: string
 *                       format: date-time
 *                 msg:
 *                   type: string
 *                   example: "Certification uploaded successfully"
 *       400:
 *         description: Bad request - missing file or invalid format
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
 *                   example: "Only PDF files are allowed"
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
 *                   example: "Unauthorized"
 *       403:
 *         description: Forbidden - user role not allowed to upload certifications
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
 *                   example: "Only horse owners, jockeys, and referees can upload certifications"
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
 *         description: Server error during upload
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                   example: 500
 *                 msg:
 *                   type: string
 *                   example: "Certification upload error: ..."
 */

module.exports = {};
