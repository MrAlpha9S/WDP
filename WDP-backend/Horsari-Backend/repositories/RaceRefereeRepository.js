const RaceReferee = require('../entities/RaceReferee');

class RaceRefereeRepository {
    async create(data) {
        const rr = new RaceReferee(data);
        return await rr.save();
    }

    async findById(id) {
        return await RaceReferee.findById(id);
    }

    async findByRaceRoundId(raceRoundId) {
        return await RaceReferee.find({ raceRoundId });
    }

    async findByRefereeId(refereeId) {
        return await RaceReferee.find({ refereeId });
    }

    async findAll(limit = 10, page = 1) {
        const skip = (page - 1) * limit;
        return await RaceReferee.find().limit(limit).skip(skip);
    }

    async update(id, updateData) {
        return await RaceReferee.findByIdAndUpdate(id, updateData, { new: true });
    }

    async updateManyByRaceRoundId(raceRoundId, updateData) {
        return await RaceReferee.updateMany({ raceRoundId }, updateData);
    }

    async delete(id) {
        return await RaceReferee.findByIdAndDelete(id);
    }
}

module.exports = new RaceRefereeRepository();
