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
}

module.exports = new AdminController();
