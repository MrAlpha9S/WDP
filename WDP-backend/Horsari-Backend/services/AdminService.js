const AdminRepository = require('../repositories/AdminRepository');
const UserRepository = require('../repositories/UserRepository');

class AdminService {
    // Create admin profile only (expects existing user id)
    async createAdmin(adminId, data) {
        try {
            if (!adminId) {
                return {
                    code: 400,
                    msg: 'adminId is required',
                };
            }

            // Verify the user exists before creating admin profile
            const user = await UserRepository.findById(adminId);
            if (!user) {
                return {
                    code: 404,
                    msg: 'User not found',
                };
            }

            // Create admin profile using AdminRepository only
            const adminProfile = await AdminRepository.create({
                adminId,
            });

            return {
                code: 201,
                data: adminProfile,
                msg: 'Admin profile created successfully',
            };
        } catch (error) {
            return { code: 500, msg: error.message };
        }
    }

    // Get admin profile
    async getAdminProfile(adminId) {
        try {
            const admin = await AdminRepository.findByAdminId(adminId);
            if (!admin) {
                return {
                    code: 404,
                    msg: 'Admin profile not found',
                };
            }
            return {
                code: 200,
                data: admin,
                msg: 'Admin profile retrieved successfully',
            };
        } catch (error) {
            return {
                code: 500,
                msg: error.message,
            };
        }
    }

    // Get all users (admin only)
    async getAllUsers(limit = 10, skip = 0) {
        try {
            const users = await UserRepository.findAll(limit, skip);
            const count = await UserRepository.count();
            return {
                code: 200,
                data: { users, count },
                msg: 'Users retrieved successfully',
            };
        } catch (error) {
            return {
                code: 500,
                msg: error.message,
            };
        }
    }

    // Get users by role
    async getUsersByRole(role) {
        try {
            if (!['horseowner', 'jockey', 'referee', 'spectator', 'admin'].includes(role)) {
                return {
                    code: 400,
                    msg: 'Invalid role',
                };
            }
            const users = await UserRepository.findByRole(role);
            return {
                code: 200,
                data: { users, count: users.length },
                msg: `Users with role ${role} retrieved successfully`,
            };
        } catch (error) {
            return {
                code: 500,
                msg: error.message,
            };
        }
    }

    // Update user status
    async updateUserStatus(userId, status) {
        try {
            if (!['active', 'inactive', 'suspended'].includes(status)) {
                return {
                    code: 400,
                    msg: 'Invalid status',
                };
            }
            const user = await UserRepository.findById(userId);
            if (!user) {
                return {
                    code: 404,
                    msg: 'User not found',
                };
            }
            const updatedUser = await UserRepository.updateById(userId, { status });
            return {
                code: 200,
                data: updatedUser,
                msg: 'User status updated successfully',
            };
        } catch (error) {
            return {
                code: 500,
                msg: error.message,
            };
        }
    }

    // (adminLevel removed) — endpoints for admin levels are no longer supported

    // Delete user (admin only)
    async deleteUser(userId) {
        try {
            const user = await UserRepository.findById(userId);
            if (!user) {
                return {
                    code: 404,
                    msg: 'User not found',
                };
            }
            await UserRepository.deleteById(userId);
            return {
                code: 200,
                msg: 'User deleted successfully',
            };
        } catch (error) {
            return {
                code: 500,
                msg: error.message,
            };
        }
    }
}

module.exports = new AdminService();
