const RefereeRepository = require('../repositories/RefereeRepository');
const UserRepository = require('../repositories/UserRepository');
const ProfileUpdateUtil = require('../utils/ProfileUpdateUtil');

class ProfileService {
    // ─── Self Profile ────────────────────────────────────────────────────────

    async getMyProfile(refereeId) {
        try {
            const doc = await RefereeRepository.findByRefereeId(refereeId);
            if (!doc) return { code: 404, msg: 'Referee not found' };
            const { _id, ...roleFields } = doc.toObject();
            const { passwordHash, ...userFields } = doc._id.toObject();
            return { code: 200, data: { ...roleFields, ...userFields }, msg: 'Profile retrieved successfully' };
        } catch (error) {
            return { code: 500, msg: error.message };
        }
    }

    async updateMyProfile(refereeId, updateData) {
        try {
            const { userFields, error } = ProfileUpdateUtil.buildUserFieldUpdates(updateData);
            if (error) return { code: 400, msg: error };
            if (Object.keys(userFields).length) {
                await UserRepository.updateById(refereeId, userFields);
            }
            return this.getMyProfile(refereeId);
        } catch (error) {
            return { code: 500, msg: error.message };
        }
    }

    // Re-uploading a license requires re-verification, so licenseStatus
    // always resets to 'pending' regardless of its previous value.
    async updateMyLicense(refereeId, fileBuffer, fileName) {
        try {
            if (!fileBuffer) return { code: 400, msg: 'License PDF is required' };
            const { licenseLink, licenseStatus } = await ProfileUpdateUtil.reuploadLicense(fileBuffer, fileName, 'licenses/referee');
            await RefereeRepository.updateByRefereeId(refereeId, { licenseLink, licenseStatus });
            return this.getMyProfile(refereeId);
        } catch (error) {
            return { code: 500, msg: error.message };
        }
    }
}

module.exports = new ProfileService();
