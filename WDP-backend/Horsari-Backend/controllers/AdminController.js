const AdminService = require('../services/AdminService');
const { broadcastAdminEvent } = require('../services/AdminEventBroadcaster');
const https = require('https');
const http = require('http');
const cloudinary = require('cloudinary').v2;
require('dotenv').config();
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key:    process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

class AdminController {
    // Get statistics
    async getStatistics(req, res) {
        const response = await AdminService.getStatistics();
        return res.status(response.code).json(response);
    }

    // Get comprehensive system-wide statistics (all entities, snapshot breakdowns)
    async getSystemStatistics(req, res) {
        const response = await AdminService.getSystemStatistics();
        return res.status(response.code).json(response);
    }

    // Get all users
    async getAllUsers(req, res) {
        const { role, search, sortBy = 'createdAt', order = 'desc' } = req.query;
        const limit = parseInt(req.query.limit) || 10;
        const skip = parseInt(req.query.skip) || 0;
        const response = await AdminService.getAllUsers(role, search, limit, skip, sortBy, order);
        return res.status(response.code).json(response);
    }

    // Get full user detail with role-specific profile
    async getUsersDetail(req, res) {
        const { userId } = req.params;
        const response = await AdminService.getUsersDetail(userId);
        return res.status(response.code).json(response);
    }

    // Get horse owner invitation list (enriched)
    async getHorseOwnerInvitations(req, res) {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 5;
        const response = await AdminService.getHorseOwnerInvitations(page, limit);
        return res.status(response.code).json(response);
    }

    // Get referee invitation list
    async getRefereeInvitations(req, res) {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 5;
        const response = await AdminService.getRefereeInvitations(page, limit);
        return res.status(response.code).json(response);
    }

    // Get jockey invitation list
    async getJockeyInvitations(req, res) {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 5;
        const response = await AdminService.getJockeyInvitations(page, limit);
        return res.status(response.code).json(response);
    }

    // Get tournaments with enriched details
    async getTournamentsWithDetails(req, res) {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const response = await AdminService.getTournamentsWithDetails(page, limit);
        return res.status(response.code).json(response);
    }

    // Get race rounds
    async getRaceRounds(req, res) {
        const tournament_id = req.query.tournament_id || null;
        const raceRound_id = req.query.raceRound_id || null;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const { status, search, sortBy = 'raceDate', order = 'desc' } = req.query;
        const response = await AdminService.getRaceRounds(tournament_id, raceRound_id, page, limit, status, search, sortBy, order);
        return res.status(response.code).json(response);
    }

    // Get race round detail
    async getRaceRoundDetail(req, res) {
        const id = req.params.id;
        const response = await AdminService.getRaceRoundDetail(id);
        return res.status(response.code).json(response);
    }

    // Get metadata for create race modal
    async getCreateRaceMetadata(req, res) {
        const response = await AdminService.getCreateRaceMetadata();
        return res.status(response.code).json(response);
    }

    // --- Race Eligibility Rule CRUD ---

    async verifyCertification(req, res) {
        const { userId } = req.params;
        const { action } = req.body;
        const io = req.app.get('io');
        const response = await AdminService.verifyCertification(userId, action, io);
        if (response.code === 200) {
            const label = action === 'approve' ? 'Approved' : 'Rejected';
            broadcastAdminEvent(req.app.get('io'), 'system_alert',
                `Certification ${label}`,
                `A user certification has been ${label.toLowerCase()}.`,
            );
        }
        return res.status(response.code).json(response);
    }

    async getAllRules(req, res) {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const { search, sortBy = 'createdAt', order = 'desc' } = req.query;
        const response = await AdminService.getAllRules(page, limit, search, sortBy, order);
        return res.status(response.code).json(response);
    }

    async createRule(req, res) {
        const response = await AdminService.createRule(req.body);
        return res.status(response.code).json(response);
    }

    async updateRule(req, res) {
        const { id } = req.params;
        const response = await AdminService.updateRule(id, req.body);
        return res.status(response.code).json(response);
    }

    async deleteRule(req, res) {
        const { id } = req.params;
        const response = await AdminService.deleteRule(id);
        return res.status(response.code).json(response);
    }

    async setRaceRoundStatus(req, res) {
        const { id } = req.params;
        const { status } = req.body;
        const io = req.app.get('io');
        const response = await AdminService.setRaceRoundStatus(id, status, io);
        return res.status(response.code).json(response);
    }

    async getImportantEvents(req, res) {
        const response = await AdminService.getImportantEvents();
        return res.status(response.code).json(response);
    }

    async getTournamentDetail(req, res) {
        const response = await AdminService.getTournamentDetail(req.params.id);
        return res.status(response.code).json(response);
    }

    async getTournamentRanking(req, res) {
        const response = await AdminService.getTournamentRanking(req.params.id);
        return res.status(response.code).json(response);
    }

    async getAllViolations(req, res) {
        const page  = parseInt(req.query.page)  || 1;
        const limit = parseInt(req.query.limit) || 10;
        const { status, severity, raceRoundId, sortBy = 'createdAt', order = 'desc' } = req.query;
        const response = await AdminService.getAllViolations(page, limit, { status, severity, raceRoundId, sortBy, order });
        return res.status(response.code).json(response);
    }

    async getAllViolationTypes(req, res) {
        const page  = parseInt(req.query.page)  || 1;
        const limit = parseInt(req.query.limit) || 10;
        const { search, type, category, sortBy = 'createdAt', order = 'desc' } = req.query;
        const response = await AdminService.getAllViolationTypes(page, limit, { search, type, category, sortBy, order });
        return res.status(response.code).json(response);
    }

    async createViolationType(req, res) {
        const response = await AdminService.createViolationType(req.body);
        return res.status(response.code).json(response);
    }

    async updateViolationType(req, res) {
        const response = await AdminService.updateViolationType(req.params.id, req.body);
        return res.status(response.code).json(response);
    }

    async toggleViolationTypeActive(req, res) {
        const { isActive } = req.body;
        const response = await AdminService.toggleViolationTypeActive(req.params.id, isActive);
        return res.status(response.code).json(response);
    }

    async createStream(req, res) {
        const response = await AdminService.createStreamForRace(req.params.id);
        return res.status(response.code).json(response);
    }

    async getStreamInfo(req, res) {
        const response = await AdminService.getStreamInfo(req.params.id);
        return res.status(response.code).json(response);
    }

    async getVOD(req, res) {
        const response = await AdminService.getVOD(req.params.id);
        return res.status(response.code).json(response);
    }

    // ── Horse Management ────────────────────────────────────────────────────────

    async getAllHorses(req, res) {
        const { page = 1, limit = 10, search, status, sortBy = 'createdAt', order = 'desc' } = req.query;
        const response = await AdminService.getAllHorses(+page, +limit, search, status, sortBy, order);
        return res.status(response.code).json(response);
    }

    async getHorseDetail(req, res) {
        const response = await AdminService.getHorseDetail(req.params.horseId);
        return res.status(response.code).json(response);
    }

    async updateHorseStatus(req, res) {
        const { horseId } = req.params;
        const { status } = req.body;
        const response = await AdminService.updateHorseStatus(horseId, status);
        if (response.code === 200) {
            broadcastAdminEvent(req.app.get('io'), 'system_alert',
                'Horse Status Updated',
                `A horse has been marked as ${status}.`);
        }
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

module.exports = new AdminController();
