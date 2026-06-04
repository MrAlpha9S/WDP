const Tournament = require('../entities/Tournament');

class TournamentRepository {
    async createTournament(tournamentData) {
        const tournament = new Tournament(tournamentData);
        return await tournament.save();
    }
    async getTournaments(keywords, page = 1, limit = 10) {
        return await Tournament.find({
            $or: [
                { name: { $regex: keywords, $options: 'i' } },
                { description: { $regex: keywords, $options: 'i' } }
            ],
        }).skip((page - 1) * limit).limit(limit);
    }
    async getTournamentById(id) {
        return await Tournament.findById(id);
    }
    async updateTournament(id, updateData) {
        return await Tournament.findByIdAndUpdate(id, updateData, { new: true });
    }
    async deleteTournament(id) {
        return await Tournament.findByIdAndDelete(id);
    }

    // Count
    async count() {
        return await Tournament.countDocuments();
    }

    async countByStatus(status) {
        return await Tournament.countDocuments({ status });
    }
}

module.exports = new TournamentRepository();