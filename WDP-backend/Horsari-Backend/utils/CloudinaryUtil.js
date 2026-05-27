const cloudinary = require('cloudinary').v2;

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

class CloudinaryUtil {
    // Upload file to Cloudinary
    static async upload(fileBuffer, filename, folder = 'horsari') {
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
                        else resolve(result);
                    }
                );
                stream.end(fileBuffer);
            });
        } catch (error) {
            throw new Error(`Cloudinary upload error: ${error.message}`);
        }
    }

    // Delete file from Cloudinary
    static async delete(publicId) {
        try {
            const result = await cloudinary.uploader.destroy(publicId);
            return result;
        } catch (error) {
            throw new Error(`Cloudinary delete error: ${error.message}`);
        }
    }

    // Update file (delete old, upload new)
    static async update(oldPublicId, newFileBuffer, newFilename, folder = 'horsari') {
        try {
            // Delete old file
            await CloudinaryUtil.delete(oldPublicId);

            // Upload new file
            const result = await CloudinaryUtil.upload(
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
            const parts = url.split('/');
            const filename = parts[parts.length - 1];
            return filename.split('.')[0];
        } catch (error) {
            throw new Error(`Extract public ID error: ${error.message}`);
        }
    }
}

module.exports = CloudinaryUtil;
