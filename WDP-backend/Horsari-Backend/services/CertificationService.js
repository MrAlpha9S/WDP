const fs = require('fs');
const path = require('path');

class CertificationService {
    constructor() {
        this.uploadDir = path.join(__dirname, '../public/uploads/certifications');
        this.ensureUploadDir();
    }

    // Ensure upload directory exists
    ensureUploadDir() {
        if (!fs.existsSync(this.uploadDir)) {
            fs.mkdirSync(this.uploadDir, { recursive: true });
        }
    }

    // Save certification file
    async saveCertification(file, userId, fileType = 'certificate', additionalData = {}) {
        try {
            if (!file) {
                return {
                    code: 400,
                    msg: 'No file provided',
                };
            }

            // Validate file type (PDF only for now)
            const allowedMimes = ['application/pdf'];
            if (!allowedMimes.includes(file.mimetype)) {
                return {
                    code: 400,
                    msg: 'Only PDF files are allowed',
                };
            }

            // Generate unique filename
            const timestamp = Date.now();
            const filename = `${userId}_${fileType}_${timestamp}.pdf`;
            const filePath = path.join(this.uploadDir, filename);

            // Save file
            fs.writeFileSync(filePath, file.buffer);

            return {
                code: 201,
                data: {
                    filename,
                    filepath: `/uploads/certifications/${filename}`,
                    originalName: file.originalname,
                    size: file.size,
                    uploadedAt: new Date(),
                },
                msg: 'Certification uploaded successfully',
            };
        } catch (error) {
            return {
                code: 500,
                msg: `Certification upload error: ${error.message}`,
            };
        }
    }

    // Delete certification file
    async deleteCertification(filename) {
        try {
            const filePath = path.join(this.uploadDir, filename);

            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }

            return {
                code: 200,
                msg: 'Certification deleted successfully',
            };
        } catch (error) {
            return {
                code: 500,
                msg: `Certification deletion error: ${error.message}`,
            };
        }
    }

    // Get certification file
    async getCertification(filename) {
        try {
            const filePath = path.join(this.uploadDir, filename);

            if (!fs.existsSync(filePath)) {
                return {
                    code: 404,
                    msg: 'Certification file not found',
                };
            }

            return {
                code: 200,
                data: { filePath },
                msg: 'Certification file found',
            };
        } catch (error) {
            return {
                code: 500,
                msg: `Get certification error: ${error.message}`,
            };
        }
    }
}

module.exports = new CertificationService();
