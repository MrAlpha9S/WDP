const { CloudinaryUtil } = require('./CloudinaryUtil');

// Shared helpers for the per-role self-service "my profile" endpoints
// (Admin/Referee/HorseOwner/Jockey/Spectator). Keeps the same whitelist +
// validation rules everywhere instead of repeating them per role.
class ProfileUpdateUtil {
    // Validates and extracts the shared, self-editable User fields from a
    // profile-update request body. username/email/role/status/passwordHash
    // are never accepted here — those are identity/system-managed fields.
    // Returns { error } on invalid input, otherwise { userFields } containing
    // only the keys that were actually present in the body.
    static buildUserFieldUpdates(body) {
        const { fullName, phoneNumber, address, dateOfBirth } = body;

        let parsedDateOfBirth;
        if (dateOfBirth != null) {
            parsedDateOfBirth = new Date(dateOfBirth);
            if (Number.isNaN(parsedDateOfBirth.getTime()) || parsedDateOfBirth > new Date()) {
                return { error: 'dateOfBirth must be a valid, non-future date' };
            }
        }

        const userFields = {};
        if (fullName != null) userFields.fullName = fullName;
        if (phoneNumber != null) userFields.phoneNumber = phoneNumber;
        if (address != null) userFields.address = address;
        if (parsedDateOfBirth != null) userFields.dateOfBirth = parsedDateOfBirth;

        return { userFields };
    }

    // Re-uploads a license PDF for a licensed role (referee/horseowner/jockey).
    // Any license change requires re-verification, so licenseStatus always
    // resets to 'pending' regardless of its previous value.
    static async reuploadLicense(fileBuffer, fileName, folder) {
        const licenseLink = await CloudinaryUtil.uploadFile(fileBuffer, fileName, folder, 'image');
        return { licenseLink, licenseStatus: 'pending' };
    }
}

module.exports = ProfileUpdateUtil;
