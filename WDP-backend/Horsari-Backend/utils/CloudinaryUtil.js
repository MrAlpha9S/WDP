const cloudinary = require('cloudinary').v2;
const dotenv = require('dotenv');
dotenv.config();
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });
class CloudinaryUtil {
    // Upload file to Cloudinary
    static async uploadFile(fileBuffer, filename, folder = 'horsari') {
        try {
            return new Promise((resolve, reject) => {
                // Generate unique public_id using timestamp
                const timestamp = Date.now();
                const uniqueFilename = `${timestamp}_${filename.replace(/\.[^/.]+$/, '')}`;

                const stream = cloudinary.uploader.upload_stream(
                    {
                        resource_type: 'auto',
                        folder: folder,
                        public_id: uniqueFilename,
                    },
                    (error, result) => {
                        if (error) reject(error);
                        else resolve(result.secure_url);
                    }
                );
                stream.end(fileBuffer);
            });
        } catch (error) {
            throw new Error(`Cloudinary upload error: ${error.message}`);
        }
    }

    // Delete file from Cloudinary
    static async deleteFile(publicId) {
        try {
            const result = await cloudinary.uploader.destroy(publicId);
            return result;
        } catch (error) {
            throw new Error(`Cloudinary delete error: ${error.message}`);
        }
    }

    // Update file (delete old, upload new)
    static async updateFile(oldPublicId, newFileBuffer, newFilename, folder = 'horsari') {
        try {
            // Delete old file
            await CloudinaryUtil.deleteFile(oldPublicId);

            // Upload new file
            const result = await CloudinaryUtil.uploadFile(
                newFileBuffer,
                newFilename,
                folder
            );

            return result;
        } catch (error) {
            throw new Error(`Cloudinary update error: ${error.message}`);
        }
    }

    // Get file URL by public ID
    static getUrl(publicId) {
        try {
            return cloudinary.url(publicId, {
                secure: true,
                type: 'upload',
            });
        } catch (error) {
            throw new Error(`Cloudinary URL error: ${error.message}`);
        }
    }

    // Extract public ID from URL
    static extractPublicId(url) {
        try {
            // Use URL parsing to reliably get the pathname
            const parsed = new URL(url);
            const path = parsed.pathname; // e.g. /<cloud_name>/image/upload/v1234/folder/file.png
            const parts = path.split('/');
            const uploadIndex = parts.findIndex(p => p === 'upload');
            if (uploadIndex === -1) {
                // fallback: take last segment without extension
                const filename = parts[parts.length - 1] || '';
                const withoutExt = filename.replace(/\.[^/.]+$/, '');
                return decodeURIComponent(withoutExt);
            }

            // Everything after 'upload' is version (optional) + folders + public_id.ext
            let pubParts = parts.slice(uploadIndex + 1);
            // remove version segment like 'v123456' if present
            if (pubParts.length && /^v\d+$/.test(pubParts[0])) pubParts = pubParts.slice(1);

            // Join remaining parts and strip extension
            const joined = pubParts.join('/');
            const withoutExt = joined.replace(/\.[^/.]+$/, '');
            // Decode percent-encoding (e.g. %20 -> space)
            return decodeURIComponent(withoutExt);
        } catch (error) {
            throw new Error(`Extract public ID error: ${error.message}`);
        }
    }
}

module.exports = {CloudinaryUtil, upload};
