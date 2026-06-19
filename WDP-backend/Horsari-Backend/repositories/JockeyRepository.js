const Jockey = require("../entities/Jockey");

class JockeyRepository {
  // Create
  async create(jockeyData) {
    const jockey = new Jockey(jockeyData);
    return await jockey.save();
  }

  // Read
  async findById(id) {
    return await Jockey.findById(id).populate("_id");
  }

  async findByJockeyId(jockeyId) {
    return await Jockey.findById(jockeyId).populate("_id");
  }

  async findAll(limit = 10, skip = 0) {
    return await Jockey.find().populate("_id").limit(limit).skip(skip);
  }

  async findByStatus(status) {
    return await Jockey.find({ status }).populate("_id");
  }

  async findByRanking(minRanking, maxRanking) {
    return await Jockey.find({
      ranking: { $gte: minRanking, $lte: maxRanking },
    }).populate("_id");
  }

  async findTopJockeys(limit = 10) {
    return await Jockey.find()
      .populate("_id")
      .sort({ ranking: 1 })
      .limit(limit);
  }

  // Update
  async updateById(id, updateData) {
    return await Jockey.findByIdAndUpdate(id, updateData, {
      new: true,
    }).populate("_id");
  }

  async updateByJockeyId(jockeyId, updateData) {
    return await Jockey.findByIdAndUpdate(jockeyId, updateData, {
      new: true,
    }).populate("_id");
  }

  // Delete
  async deleteById(id) {
    return await Jockey.findByIdAndDelete(id);
  }

  async deleteByJockeyId(jockeyId) {
    return await Jockey.findByIdAndDelete(jockeyId);
  }

  // Count
  async count() {
    return await Jockey.countDocuments();
  }

  async countByLicenseStatus(status) {
    return await Jockey.countDocuments({ licenseStatus: status });
  }

  // Stats
  async getStats() {
    return await Jockey.aggregate([
      {
        $group: {
          _id: null,
          totalJockeys: { $sum: 1 },
          totalWins: { $sum: "$totalWins" },
          avgMatches: { $avg: "$matchesRaced" },
        },
      },
    ]);
  }
}

module.exports = new JockeyRepository();
