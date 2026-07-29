const multer = require('multer');
const path = require('path');

// Configure storage
const storage = multer.memoryStorage(); // Store in memory before processing

// Filter files — accept PDF only. Some mobile document pickers report a
// generic mimetype (e.g. application/octet-stream) for a picked .pdf file,
// so fall back to the file extension when the mimetype check fails.
const fileFilter = (req, file, cb) => {
    const hasPdfExtension = path.extname(file.originalname).toLowerCase() === '.pdf';
    if (file.mimetype === 'application/pdf' || hasPdfExtension) {
        cb(null, true);
    } else {
        cb(new Error('Only PDF files are allowed'), false);
    }
};

// Configure multer
const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
    },
});

module.exports = upload;
