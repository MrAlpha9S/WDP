const RaceRound = require('../entities/RaceRound');
class RaceRoundRepository {
    async create(raceRoundData) {
        const raceRound = new RaceRound(raceRoundData);
        return await raceRound.save();
    }
    async findById(id) {
        return await RaceRound.findById(id);
    }
    async findByTournamentId(tournamentId) {
        return await RaceRound.find({ tournamentId });
    }
    async findAll(limit = 10, page = 1) {
        const skip = (page - 1) * limit;
        return await RaceRound.find().limit(limit).skip(skip);
    }
    async findByStatus(status) {
        return await RaceRound.find({ status });
    }
    async update(id, updateData) {
        return await RaceRound.findByIdAndUpdate(id, updateData, { new: true });
    }
    async delete(id) {
        return await RaceRound.findByIdAndDelete(id);
    }

}
module.exports = new RaceRoundRepository();