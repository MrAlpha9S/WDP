const HorseRepository = require('../repositories/HorseRepository');

class HorseService {
    // Create horse
    async createHorse(horseData) {
        try {
            const { ownerId, horseName, breed, age, gender, color, healthStatus, registrationDate, status, dateOfBirth } = horseData;

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
                dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
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

}

module.exports = new HorseService();
