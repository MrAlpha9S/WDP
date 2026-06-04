const AdminService = require('../services/AdminService');

class AdminController {
    // Create admin profile (admin only)
    async createAdmin(req, res) {
        const { uid } = req.params;
        const response = await AdminService.createAdmin(uid, req.body);
        return res.status(response.code).json(response);
    }

    // Get admin profile
    async getAdminProfile(req, res) {
        const response = await AdminService.getAdminProfile(req.userId);
        return res.status(response.code).json(response);
    }

    // Get statistics
    async getStatistics(req, res) {
        const response = await AdminService.getStatistics();
        return res.status(response.code).json(response);
    }

    // Get all users
    async getAllUsers(req, res) {
        const limit = parseInt(req.query.limit) || 10;
        const skip = parseInt(req.query.skip) || 0;
        const response = await AdminService.getAllUsers(limit, skip);
        return res.status(response.code).json(response);
    }

    // Get users by role
    async getUsersByRole(req, res) {
        const { role } = req.params;
        const response = await AdminService.getUsersByRole(role);
        return res.status(response.code).json(response);
    }

    // Update user status
    async updateUserStatus(req, res) {
        const { userId } = req.params;
        const { status } = req.body;
        const response = await AdminService.updateUserStatus(userId, status);
        return res.status(response.code).json(response);
    }

    // Get admins by admin level
    // (adminLevel endpoints removed)

    // Delete user
    async deleteUser(req, res) {
        const { userId } = req.params;
        const response = await AdminService.deleteUser(userId);
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
        const tournamentFilter = req.query.tournamentFilter || null;
        const response = await AdminService.getRaceRounds(tournamentFilter);
        return res.status(response.code).json(response);
    }

    // Get metadata for create race modal
    async getCreateRaceMetadata(req, res) {
        const response = await AdminService.getCreateRaceMetadata();
        return res.status(response.code).json(response);
    }
}

module.exports = new AdminController();
