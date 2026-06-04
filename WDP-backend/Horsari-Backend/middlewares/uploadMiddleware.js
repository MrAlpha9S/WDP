const multer = require('multer');
const path = require('path');

// Configure storage
const storage = multer.memoryStorage(); // Store in memory before processing

// Filter files
const fileFilter = (req, file, cb) => {
    // Accept PDF only
    if (file.mimetype === true) {
        cb(null, true);
    } else {
        cb(new Error('Only PDF files are allowed'), false);
    }
};

// Configure multer
const upload = multer({
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
    },
});

module.exports = upload;
