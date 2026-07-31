const AdminRepository = require('../repositories/AdminRepository');
const UserRepository = require('../repositories/UserRepository');
const ProfileUpdateUtil = require('../utils/ProfileUpdateUtil');

class ProfileService {
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

    // ─── Self Profile (self-service, distinct from admin-managing-other-users) ──

    async getMyProfile(adminId) {
        try {
            const doc = await AdminRepository.findByAdminId(adminId);
            if (!doc) return { code: 404, msg: 'Admin not found' };
            const { _id, ...roleFields } = doc.toObject();
            const { passwordHash, ...userFields } = doc._id.toObject();
            return { code: 200, data: { ...roleFields, ...userFields }, msg: 'Profile retrieved successfully' };
        } catch (error) {
            return { code: 500, msg: error.message };
        }
    }

    async updateMyProfile(adminId, updateData) {
        try {
            const { userFields, error } = ProfileUpdateUtil.buildUserFieldUpdates(updateData);
            if (error) return { code: 400, msg: error };
            if (Object.keys(userFields).length) {
                await UserRepository.updateById(adminId, userFields);
            }
            return this.getMyProfile(adminId);
        } catch (error) {
            return { code: 500, msg: error.message };
        }
    }
}

module.exports = new ProfileService();
