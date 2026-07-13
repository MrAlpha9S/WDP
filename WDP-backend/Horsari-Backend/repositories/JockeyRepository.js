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

  async findAll(limit = 10, skip = 0, sortObj = {}) {
    return await Jockey.find().populate("_id").sort(sortObj).limit(limit).skip(skip);
  }

  async findByStatus(status) {
    return await Jockey.find({ status }).populate("_id");
  }

  // Win-rate field shared by getWinRateRank/findAllSortedByWinRate —
  // computed live (matchesRaced > 0 ? totalWins/matchesRaced : 0), never stored.
  _addWinRateStage() {
    return {
      $addFields: {
        winRate: {
          $cond: [
            { $gt: ["$matchesRaced", 0] },
            { $divide: ["$totalWins", "$matchesRaced"] },
            0,
          ],
        },
      },
    };
  }

  // This jockey's 1-based leaderboard position among all jockeys, by win rate.
  async getWinRateRank(jockeyId) {
    const leaderboard = await Jockey.aggregate([
      this._addWinRateStage(),
      { $sort: { winRate: -1, totalWins: -1 } },
      { $project: { _id: 1, winRate: 1 } },
    ]);
    const index = leaderboard.findIndex((j) => String(j._id) === String(jockeyId));
    return {
      rank: index === -1 ? null : index + 1,
      totalJockeys: leaderboard.length,
      winRate: index === -1 ? 0 : leaderboard[index].winRate,
    };
  }

  // Paginated jockey list sorted by win rate, flattened to the same
  // Jockey-fields + User-fields shape JockeyService.getAllJockeys already
  // produces for other sort fields (passwordHash excluded, single _id).
  async findAllSortedByWinRate(limit = 10, skip = 0, orderNum = -1) {
    const docs = await Jockey.aggregate([
      this._addWinRateStage(),
      { $sort: { winRate: orderNum, totalWins: orderNum } },
      { $skip: skip },
      { $limit: limit },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "userDoc",
        },
      },
      { $unwind: "$userDoc" },
    ]);
    return docs.map(({ userDoc, ...jockeyFields }) => {
      const { passwordHash, ...userFields } = userDoc;
      return { ...jockeyFields, ...userFields };
    });
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

  async incrementWallet(jockeyId, amount) {
    return await Jockey.findByIdAndUpdate(
      jockeyId,
      { $inc: { wallet: amount } },
      { new: true }
    );
  }

  // Called once per official race result for the jockey who actually raced
  // (never for a no-show) — matchesRaced always +1, totalWins +1 only if won.
  async incrementRaceStats(jockeyId, { won }) {
    return await Jockey.findByIdAndUpdate(
      jockeyId,
      { $inc: { matchesRaced: 1, totalWins: won ? 1 : 0 } },
      { new: true }
    );
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
