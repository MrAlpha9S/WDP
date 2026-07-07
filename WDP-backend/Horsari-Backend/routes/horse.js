const express = require('express');
const HorseController = require('../controllers/HorseController');
const { authMiddleware, authHorseOwner } = require('../middlewares/authMiddleware');
const { upload } = require('../utils/CloudinaryUtil');

const router = express.Router();

require('../swagger/horseSwagger');

// multer in-memory for direct upload to Cloudinary


// CRUD routes
// Create horse (protected)
router.post('/', authMiddleware, authHorseOwner, HorseController.createHorse);

// Update horse (protected)
router.put('/:id', authMiddleware, authHorseOwner, HorseController.updateHorse);

// Delete horse (protected)
router.delete('/:id', authMiddleware, authHorseOwner, HorseController.deleteHorse);

// Upload horse image - horse files only
router.post('/upload-image/:horseId', authMiddleware, authHorseOwner, upload.single('image'), HorseController.uploadHorseImage);

module.exports = router;
