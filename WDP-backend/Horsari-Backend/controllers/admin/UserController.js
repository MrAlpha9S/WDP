const AdminUserService = require('../../services/AdminUserService');
const https = require('https');
const http = require('http');
const cloudinary = require('cloudinary').v2;
require('dotenv').config();
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key:    process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

class UserController {
    // Get all users
    async getAllUsers(req, res) {
        const { role, search, sortBy = 'createdAt', order = 'desc' } = req.query;
        const limit = parseInt(req.query.limit) || 10;
        const skip = parseInt(req.query.skip) || 0;
        const response = await AdminUserService.getAllUsers(role, search, limit, skip, sortBy, order);
        return res.status(response.code).json(response);
    }

    // Get full user detail with role-specific profile
    async getUsersDetail(req, res) {
        const { userId } = req.params;
        const response = await AdminUserService.getUsersDetail(userId);
        return res.status(response.code).json(response);
    }

    async verifyCertification(req, res) {
        const { userId } = req.params;
        const { action } = req.body;
        const io = req.app.get('io');
        const response = await AdminUserService.verifyCertification(userId, action, io);
        return res.status(response.code).json(response);
    }

    // ── PDF Proxy ────────────────────────────────────────────────────────────────
    // Fetches a Cloudinary license URL server-side using a signed URL so that
    // even 401-restricted resources can be proxied, then re-serves with:
    //   Content-Type: application/pdf
    //   Content-Disposition: inline
    async proxyLicense(req, res) {
        const { url } = req.query;
        if (!url) return res.status(400).json({ code: 400, msg: 'url query param is required' });

        // Security: only proxy Cloudinary URLs
        let parsed;
        try { parsed = new URL(url); } catch {
            return res.status(400).json({ code: 400, msg: 'Invalid URL' });
        }
        if (!parsed.hostname.endsWith('cloudinary.com')) {
            return res.status(403).json({ code: 403, msg: 'Only Cloudinary URLs are allowed' });
        }

        try {
            // Extract components from the Cloudinary URL
            // Format: /v{version}/{folder}/{publicId}.{ext}  (after /{resourceType}/upload/)
            const pathParts = parsed.pathname.split('/');
            const uploadIdx = pathParts.findIndex(p => p === 'upload');
            if (uploadIdx === -1) return res.status(400).json({ code: 400, msg: 'Not a valid Cloudinary upload URL' });

            const resourceType = pathParts[uploadIdx - 1] ?? 'image'; // 'image' | 'raw' | 'video'
            let afterUpload = pathParts.slice(uploadIdx + 1);
            // strip version segment like 'v1783448756'
            if (afterUpload[0] && /^v\d+$/.test(afterUpload[0])) afterUpload = afterUpload.slice(1);
            // Join and strip the .pdf extension to get the public_id
            const joined  = afterUpload.join('/');
            const publicId = decodeURIComponent(joined.replace(/\.[^/.]+$/, ''));

            // Generate a private download URL authenticated via API key + secret.
            // Unlike sign_url (CDN URL signing), this works on all Cloudinary plans
            // because it routes through api.cloudinary.com, not the CDN.
            const format = joined.includes('.') ? joined.split('.').pop() : 'pdf';
            const downloadUrl = cloudinary.utils.private_download_url(publicId, format, {
                resource_type: resourceType,
                type: 'upload',
                expires_at: Math.floor(Date.now() / 1000) + 300,
            });
            console.log('[proxy-license] publicId:', publicId, '| downloadUrl:', downloadUrl);

            // Fetch the download URL server-side
            const lib = downloadUrl.startsWith('https') ? https : http;
            lib.get(downloadUrl, (upstream) => {
                if (upstream.statusCode !== 200) {
                    console.error('[proxy-license] Cloudinary status:', upstream.statusCode);
                    return res.status(upstream.statusCode ?? 502)
                        .json({ code: upstream.statusCode, msg: 'Cloudinary fetch failed' });
                }
                res.setHeader('Content-Type', 'application/pdf');
                res.setHeader('Content-Disposition', 'inline; filename="license.pdf"');
                res.setHeader('Cache-Control', 'private, max-age=300');
                upstream.pipe(res);
            }).on('error', (err) => {
                console.error('[proxy-license] fetch error:', err.message);
                res.status(500).json({ code: 500, msg: err.message });
            });
        } catch (err) {
            res.status(500).json({ code: 500, msg: err.message });
        }
    }
}

module.exports = new UserController();
