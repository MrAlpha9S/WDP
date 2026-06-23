const Prediction = require('../entities/Prediction');

class PredictionRepository {
    async create(data) {
        return Prediction.create(data);
    }

    async findById(id) {
        return Prediction.findById(id).lean();
    }

    async findOne(filter) {
        return Prediction.findOne(filter).lean();
    }

    async findBySpectatorId(spectatorId, filter = {}, limit = 10, skip = 0, sortObj = {}) {
        return Prediction.find({ spectatorId, ...filter }).sort(sortObj).skip(skip).limit(limit).lean();
    }

    async countBySpectatorId(spectatorId, filter = {}) {
        return Prediction.countDocuments({ spectatorId, ...filter });
    }

    async findBySpectatorAndRegistrations(spectatorId, registrationIds) {
        return Prediction.find({ spectatorId, registrationId: { $in: registrationIds } }).lean();
    }
}

module.exports = new PredictionRepository();
