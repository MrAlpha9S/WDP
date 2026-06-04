const RefereeRepository = require('../repositories/RefereeRepository');
const UserRepository = require('../repositories/UserRepository');

class RefereeService {
    // Create referee profile for existing user (public)
    async createReferee(refereeId, data) {
        try {
            const { license_link } = data || {};

            if (!refereeId) {
                return { code: 400, msg: 'refereeId is required' };
            }

            const user = await UserRepository.findById(refereeId);
            if (!user) {
                return { code: 404, msg: 'User not found' };
            }

            const existing = await RefereeRepository.findByRefereeId(refereeId);
            if (existing) {
                return { code: 409, msg: 'Referee profile already exists' };
            }

            const refereeProfile = await RefereeRepository.create({
                _id: refereeId,
                license_link: license_link || null,
            });

            return { code: 201, data: refereeProfile, msg: 'Referee profile created successfully' };
        } catch (error) {
            return { code: 500, msg: error.message };
        }
    }



    // Get referee profile
    async getRefereeProfile(refereeId) {
        try {
            const referee = await RefereeRepository.findByRefereeId(refereeId);
            if (!referee) {
                return {
                    code: 404,
                    msg: 'Referee profile not found',
                };
            }
            return {
                code: 200,
                data: referee,
                msg: 'Referee profile retrieved successfully',
            };
        } catch (error) {
            return {
                code: 500,
                msg: error.message,
            };
        }
    }

    // Get all referees
    async getAllReferees(limit = 10, skip = 0) {
        try {
            const referees = await RefereeRepository.findAll(limit, skip);
            const count = await RefereeRepository.count();
            return {
                code: 200,
                data: { referees, count },
                msg: 'Referees retrieved successfully',
            };
        } catch (error) {
            return {
                code: 500,
                msg: error.message,
            };
        }
    }

    // Update referee profile
    async updateRefereeProfile(refereeId, updateData) {
        try {
            const referee = await RefereeRepository.findByRefereeId(refereeId);
            if (!referee) {
                return {
                    code: 404,
                    msg: 'Referee not found',
                };
            }
            const updatedReferee = await RefereeRepository.updateById(referee._id, updateData);
            return {
                code: 200,
                data: updatedReferee,
                msg: 'Referee profile updated successfully',
            };
        } catch (error) {
            return {
                code: 500,
                msg: error.message,
            };
        }
    }

    // Get referee by certification number - DEPRECATED
    async getRefereeByCredentials(certificationNumber) {
        try {
            return {
                code: 400,
                msg: 'This endpoint is deprecated. Certification information is now stored as license_link.',
            };
        } catch (error) {
            return {
                code: 500,
                msg: error.message,
            };
        }
    }

    // Verify referee credentials - DEPRECATED
    async verifyRefereeCredentials(refereeId, certificationNumber) {
        try {
            return {
                code: 400,
                msg: 'This endpoint is deprecated. Certification information is now stored as license_link.',
            };
        } catch (error) {
            return {
                code: 500,
                msg: error.message,
            };
        }
    }

    // Renew certification - DEPRECATED
    async renewCertification(refereeId, newCertificationNumber) {
        try {
            return {
                code: 400,
                msg: 'This endpoint is deprecated. Use update profile to change license_link.',
            };
        } catch (error) {
            return {
                code: 500,
                msg: error.message,
            };
        }
    }

    // Get referee by license number - DEPRECATED
    async getRefereeByLicense(licenseNumber) {
        try {
            return {
                code: 400,
                msg: 'This endpoint is deprecated. License information is now stored as license_link.',
            };
        } catch (error) {
            return {
                code: 500,
                msg: error.message,
            };
        }
    }
}

module.exports = new RefereeService();
