const RaceRefereeRepository = require('../repositories/RaceRefereeRepository');

class RaceRefereeService {
    async assignReferee(data) {
        const created = await RaceRefereeRepository.create(data);
        return { code: 201, message: 'Referee assigned successfully', data: created };
    }

    async getById(id) {
        const item = await RaceRefereeRepository.findById(id);
        if (!item) return { code: 404, message: 'RaceReferee not found' };
        return { code: 200, message: 'RaceReferee retrieved', data: item };
    }

    async getByRaceRoundId(raceRoundId) {
        const items = await RaceRefereeRepository.findByRaceRoundId(raceRoundId);
        return { code: 200, message: 'RaceReferees retrieved', data: items };
    }

    async getByRefereeId(refereeId) {
        const items = await RaceRefereeRepository.findByRefereeId(refereeId);
        return { code: 200, message: 'RaceReferees retrieved', data: items };
    }

    async getAll(page = 1, limit = 10) {
        const items = await RaceRefereeRepository.findAll(limit, page);
        return { code: 200, message: 'RaceReferees retrieved', data: items };
    }

    async update(id, updateData) {
        const updated = await RaceRefereeRepository.update(id, updateData);
        if (!updated) return { code: 404, message: 'RaceReferee not found' };
        return { code: 200, message: 'RaceReferee updated', data: updated };
    }

    async remove(id) {
        const deleted = await RaceRefereeRepository.delete(id);
        if (!deleted) return { code: 404, message: 'RaceReferee not found' };
        return { code: 200, message: 'RaceReferee removed', data: deleted };
    }
}

module.exports = new RaceRefereeService();
