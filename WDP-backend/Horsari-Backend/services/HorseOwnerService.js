const HorseOwnerRepository = require('../repositories/HorseOwnerRepository');
const HorseRepository = require('../repositories/HorseRepository');
const UserRepository = require('../repositories/UserRepository');

class HorseOwnerService {
    // Create horse owner profile for existing user (public)
    async createHorseOwner(ownerId, data) {
        try {
            const { licenseLink } = data || {};

            if (!ownerId) {
                return { code: 400, msg: 'ownerId is required' };
            }

            const user = await UserRepository.findById(ownerId);
            if (!user) {
                return { code: 404, msg: 'User not found' };
            }

            const existing = await HorseOwnerRepository.findByOwnerId(ownerId);
            if (existing) {
                return { code: 409, msg: 'Horse owner profile already exists' };
            }

            const ownerProfile = await HorseOwnerRepository.create({
                _id: ownerId,
                licenseLink: licenseLink || null,
            });

            return { code: 201, data: ownerProfile, msg: 'Horse owner profile created successfully' };
        } catch (error) {
            return { code: 500, msg: error.message };
        }
    }



    // Get horse owner profile
    async getHorseOwnerProfile(ownerId) {
        try {
            const horseOwner = await HorseOwnerRepository.findByOwnerId(ownerId);
            if (!horseOwner) {
                return {
                    code: 404,
                    msg: 'Horse owner profile not found',
                };
            }
            return {
                code: 200,
                data: horseOwner,
                msg: 'Horse owner profile retrieved successfully',
            };
        } catch (error) {
            return {
                code: 500,
                msg: error.message,
            };
        }
    }

    // Update horse owner profile
    async updateHorseOwnerProfile(ownerId, updateData) {
        try {
            const horseOwner = await HorseOwnerRepository.findByOwnerId(ownerId);
            if (!horseOwner) {
                return {
                    code: 404,
                    msg: 'Horse owner not found',
                };
            }
            const updatedOwner = await HorseOwnerRepository.updateById(horseOwner._id, updateData);
            return {
                code: 200,
                data: updatedOwner,
                msg: 'Horse owner profile updated successfully',
            };
        } catch (error) {
            return {
                code: 500,
                msg: error.message,
            };
        }
    }

    // Get all horses owned
    async getOwnedHorses(ownerId, limit = 10, skip = 0) {
        try {
            const horses = await HorseRepository.findByOwnerId(ownerId);
            return {
                code: 200,
                data: {
                    horses: horses.slice(skip, skip + limit),
                    count: horses.length,
                    limit,
                    skip,
                },
                msg: 'Owned horses retrieved successfully',
            };
        } catch (error) {
            return {
                code: 500,
                msg: error.message,
            };
        }
    }

    // Get horse statistics for owner
    async getOwnedHorsesStats(ownerId) {
        try {
            const horses = await HorseRepository.findByOwnerId(ownerId);
            if (horses.length === 0) {
                return {
                    code: 200,
                    data: {
                        totalHorses: 0,
                        healthyHorses: 0,
                        injuredHorses: 0,
                        activeHorses: 0,
                        inactiveHorses: 0,
                    },
                    msg: 'No horses found for this owner',
                };
            }

            const healthyCount = horses.filter(h => h.healthStatus === 'healthy').length;
            const injuredCount = horses.filter(h => h.healthStatus === 'injured').length;
            const activeCount = horses.filter(h => h.status === 'active').length;
            const inactiveCount = horses.filter(h => h.status === 'inactive').length;

            return {
                code: 200,
                data: {
                    totalHorses: horses.length,
                    healthyHorses: healthyCount,
                    injuredHorses: injuredCount,
                    activeHorses: activeCount,
                    inactiveHorses: inactiveCount,
                },
                msg: 'Horse statistics retrieved successfully',
            };
        } catch (error) {
            return {
                code: 500,
                msg: error.message,
            };
        }
    }

    // Get horses by health status
    async getHorsesByHealthStatus(ownerId, healthStatus) {
        try {
            if (!['healthy', 'injured', 'sick'].includes(healthStatus)) {
                return {
                    code: 400,
                    msg: 'Invalid health status',
                };
            }
            const horses = await HorseRepository.findByOwnerId(ownerId);
            const filtered = horses.filter(h => h.healthStatus === healthStatus);
            return {
                code: 200,
                data: { horses: filtered, count: filtered.length },
                msg: `Horses with health status ${healthStatus} retrieved successfully`,
            };
        } catch (error) {
            return {
                code: 500,
                msg: error.message,
            };
        }
    }

    // Get all horse owners
    async getAllHorseOwners(limit = 10, skip = 0) {
        try {
            const owners = await HorseOwnerRepository.findAll(limit, skip);
            const count = await HorseOwnerRepository.count();
            return {
                code: 200,
                data: { owners, count },
                msg: 'Horse owners retrieved successfully',
            };
        } catch (error) {
            return {
                code: 500,
                msg: error.message,
            };
        }
    }

    // Get horse owner by license number - DEPRECATED (licenseLink is now used)
    async getHorseOwnerByLicense(licenseNumber) {
        try {
            return {
                code: 400,
                msg: 'This endpoint is deprecated. License information is now stored as licenseLink.',
            };
        } catch (error) {
            return {
                code: 500,
                msg: error.message,
            };
        }
    }
}

module.exports = new HorseOwnerService();
