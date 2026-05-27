const HorseRepository = require('../repositories/HorseRepository');

class HorseService {
    // Create horse
    async createHorse(horseData) {
        try {
            const { ownerId, horseName, breed, age, gender, color, healthStatus, registrationDate, status } = horseData;

            // Validate required fields
            if (!ownerId || !horseName) {
                return {
                    code: 400,
                    msg: 'Owner ID and horse name are required',
                };
            }

            const horse = await HorseRepository.create({
                ownerId,
                horseName,
                breed: breed || '',
                age: age || null,
                gender: gender || '',
                color: color || '',
                healthStatus: healthStatus || 'healthy',
                registrationDate: registrationDate || new Date(),
                status: status || 'active',
            });

            return {
                code: 201,
                data: horse,
                msg: 'Horse created successfully',
            };
        } catch (error) {
            return {
                code: 500,
                msg: error.message,
            };
        }
    }

    // Get horse by ID
    async getHorseById(horseId) {
        try {
            if (!horseId) {
                return {
                    code: 400,
                    msg: 'Horse ID is required',
                };
            }

            const horse = await HorseRepository.findById(horseId);
            if (!horse) {
                return {
                    code: 404,
                    msg: 'Horse not found',
                };
            }

            return {
                code: 200,
                data: horse,
                msg: 'Horse retrieved successfully',
            };
        } catch (error) {
            return {
                code: 500,
                msg: error.message,
            };
        }
    }

    // Get all horses
    async getAllHorses(limit = 10, skip = 0) {
        try {
            const horses = await HorseRepository.findAll(limit, skip);
            const count = await HorseRepository.count();

            return {
                code: 200,
                data: {
                    horses,
                    total: count,
                    limit,
                    skip,
                },
                msg: 'Horses retrieved successfully',
            };
        } catch (error) {
            return {
                code: 500,
                msg: error.message,
            };
        }
    }

    // Get horses by owner ID
    async getHorsesByOwnerId(ownerId) {
        try {
            if (!ownerId) {
                return {
                    code: 400,
                    msg: 'Owner ID is required',
                };
            }

            const horses = await HorseRepository.findByOwnerId(ownerId);
            const count = await HorseRepository.countByOwnerId(ownerId);

            return {
                code: 200,
                data: {
                    horses,
                    count,
                },
                msg: 'Horses retrieved successfully',
            };
        } catch (error) {
            return {
                code: 500,
                msg: error.message,
            };
        }
    }

    // Search horses by owner ID with keywords
    async searchHorsesByOwnerWithKeywords(ownerId, keywords) {
        try {
            if (!ownerId) {
                return {
                    code: 400,
                    msg: 'Owner ID is required',
                };
            }

            if (!keywords || keywords.trim() === '') {
                return {
                    code: 400,
                    msg: 'Keywords are required',
                };
            }

            // Get all horses for owner
            const allHorses = await HorseRepository.findByOwnerId(ownerId);

            // Filter by keywords (search in horseName, breed, color, healthStatus)
            const keyword = keywords.toLowerCase();
            const filteredHorses = allHorses.filter(
                (horse) =>
                    horse.horseName.toLowerCase().includes(keyword) ||
                    (horse.breed && horse.breed.toLowerCase().includes(keyword)) ||
                    (horse.color && horse.color.toLowerCase().includes(keyword)) ||
                    (horse.healthStatus && horse.healthStatus.toLowerCase().includes(keyword))
            );

            return {
                code: 200,
                data: {
                    horses: filteredHorses,
                    count: filteredHorses.length,
                    keyword,
                },
                msg: 'Search completed successfully',
            };
        } catch (error) {
            return {
                code: 500,
                msg: error.message,
            };
        }
    }

    // Update horse
    async updateHorse(horseId, updateData) {
        try {
            if (!horseId) {
                return {
                    code: 400,
                    msg: 'Horse ID is required',
                };
            }

            const horse = await HorseRepository.findById(horseId);
            if (!horse) {
                return {
                    code: 404,
                    msg: 'Horse not found',
                };
            }

            const updatedHorse = await HorseRepository.updateById(horseId, updateData);

            return {
                code: 200,
                data: updatedHorse,
                msg: 'Horse updated successfully',
            };
        } catch (error) {
            return {
                code: 500,
                msg: error.message,
            };
        }
    }

    // Delete horse
    async deleteHorse(horseId) {
        try {
            if (!horseId) {
                return {
                    code: 400,
                    msg: 'Horse ID is required',
                };
            }

            const horse = await HorseRepository.findById(horseId);
            if (!horse) {
                return {
                    code: 404,
                    msg: 'Horse not found',
                };
            }

            await HorseRepository.deleteById(horseId);

            return {
                code: 200,
                msg: 'Horse deleted successfully',
            };
        } catch (error) {
            return {
                code: 500,
                msg: error.message,
            };
        }
    }

    // Get horse stats
    async getHorseStats() {
        try {
            const stats = await HorseRepository.getStats();

            return {
                code: 200,
                data: stats[0] || {},
                msg: 'Stats retrieved successfully',
            };
        } catch (error) {
            return {
                code: 500,
                msg: error.message,
            };
        }
    }
}

module.exports = new HorseService();
