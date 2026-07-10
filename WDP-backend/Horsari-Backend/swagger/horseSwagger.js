/**
 * @swagger
 * tags:
 *   name: Horse
 *   description: Horse CRUD (horseowner-only)
 *
 * /api/horses:
 *   post:
 *     summary: Create a horse under the authenticated horse owner
 *     tags: [Horse]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [horseName]
 *             properties:
 *               horseName: { type: string }
 *               breed: { type: string }
 *               gender: { type: string, enum: [male, female] }
 *               healthStatus: { type: string, enum: [healthy, injured, sick], default: healthy }
 *               registrationDate: { type: string, format: date }
 *               status: { type: string, enum: [active, inactive, retired], default: active }
 *               dateOfBirth: { type: string, format: date }
 *     responses:
 *       201:
 *         description: Horse created (ownerId is taken from the authenticated user)
 *       400:
 *         description: horseName is required
 *
 * /api/horses/{id}:
 *   put:
 *     summary: Update a horse
 *     tags: [Horse]
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
 *               horseName: { type: string }
 *               breed: { type: string }
 *               gender: { type: string, enum: [male, female] }
 *               healthStatus: { type: string, enum: [healthy, injured, sick] }
 *               status: { type: string, enum: [active, inactive, retired] }
 *               dateOfBirth: { type: string, format: date }
 *               img: { type: string, description: "Cloudinary URL, normally set via /upload-image/{horseId}" }
 *     responses:
 *       200:
 *         description: Horse updated
 *       404:
 *         description: Horse not found
 *
 *   delete:
 *     summary: Delete a horse
 *     tags: [Horse]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Horse deleted
 *       404:
 *         description: Horse not found
 *
 * /api/horses/upload-image/{horseId}:
 *   post:
 *     summary: Upload a horse's profile image to Cloudinary
 *     tags: [Horse]
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
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [image]
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Image uploaded and horse.img updated
 *       400:
 *         description: Missing horseId or image file
 *       403:
 *         description: Authenticated user is not this horse's owner
 *       404:
 *         description: Horse not found
 */

module.exports = {};
