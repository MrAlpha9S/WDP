const { Router } = require('express');
const CloudinaryUtil = require('../utils/CloudinaryUtil');
const upload = require('../middlewares/uploadMiddleware');
const p = Router();
p.post('/upload', upload.single('file'), async (req, res) => {
    const uploadedFile = req.file; // Assuming you have a file upload middleware like multer
    try {
        if (!uploadedFile) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        const bruh = await CloudinaryUtil.uploadFile(uploadedFile.buffer, uploadedFile.originalname);
        if (bruh) {
            res.status(200).json({ message: 'File uploaded successfully', url: bruh });
        }
    } catch (error) {
        console.error('File upload error:', error);
        res.status(500).json({ error: 'File upload failed' });
    }
});

module.exports = p;