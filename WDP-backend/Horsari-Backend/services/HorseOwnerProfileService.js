const HorseOwnerRepository = require('../repositories/HorseOwnerRepository');
const UserRepository = require('../repositories/UserRepository');
const ProfileUpdateUtil = require('../utils/ProfileUpdateUtil');

class ProfileService {
    // ─── Self Profile (the owner's own profile — distinct from getJockeyProfile,
    // which is this owner viewing a JOCKEY's profile) ──────────────────────────

    async getMyProfile(ownerId) {
        try {
            const doc = await HorseOwnerRepository.findByOwnerId(ownerId);
            if (!doc) return { code: 404, msg: 'Horse owner not found' };
            const { _id, ...roleFields } = doc.toObject();
            const { passwordHash, ...userFields } = doc._id.toObject();
            return { code: 200, data: { ...roleFields, ...userFields }, msg: 'Profile retrieved successfully' };
        } catch (error) {
            return { code: 500, msg: error.message };
        }
    }

    async updateMyProfile(ownerId, updateData) {
        try {
            const { userFields, error } = ProfileUpdateUtil.buildUserFieldUpdates(updateData);
            if (error) return { code: 400, msg: error };
            if (Object.keys(userFields).length) {
                await UserRepository.updateById(ownerId, userFields);
            }
            return this.getMyProfile(ownerId);
        } catch (error) {
            return { code: 500, msg: error.message };
        }
    }

    // Re-uploading a license requires re-verification, so licenseStatus
    // always resets to 'pending' regardless of its previous value.
    async updateMyLicense(ownerId, fileBuffer, fileName) {
        try {
            if (!fileBuffer) return { code: 400, msg: 'License PDF is required' };
            const { licenseLink, licenseStatus } = await ProfileUpdateUtil.reuploadLicense(fileBuffer, fileName, 'licenses/horseowner');
            await HorseOwnerRepository.updateByOwnerId(ownerId, { licenseLink, licenseStatus });
            return this.getMyProfile(ownerId);
        } catch (error) {
            return { code: 500, msg: error.message };
        }
    }
}

module.exports = new ProfileService();
