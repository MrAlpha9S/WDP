const JockeyRepository = require("../repositories/JockeyRepository");
const TransactionRepository = require("../repositories/TransactionRepository");
const Invitation = require("../entities/Invitation");

class StatisticsService {
  // ─── Wallet ──────────────────────────────────────────────────────────────

  async getWalletInfo(jockeyId) {
    try {
      const jockey = await JockeyRepository.findByJockeyId(jockeyId);
      if (!jockey) return { code: 404, msg: 'Jockey not found' };

      const Transaction = require('../entities/Transaction');
      const totalPaymentsReceived = await Transaction.countDocuments({
        payeeId: jockeyId,
        payeeRole: 'jockey',
        paymentStatus: 'paid',
      });

      return {
        code: 200,
        data: {
          jockey: { _id: jockey._id, wallet: jockey.wallet },
          stats: { totalPaymentsReceived },
        },
        msg: 'Wallet info retrieved successfully',
      };
    } catch (error) {
      return { code: 500, msg: error.message };
    }
  }

  // ─── Statistics ────────────────────────────────────────────────────────────

  async getStatistics(jockeyId) {
    try {
      const jockey = await JockeyRepository.findByJockeyId(jockeyId);
      if (!jockey) return { code: 404, msg: 'Jockey not found' };

      const mongoose = require('mongoose');
      const Transaction = require('../entities/Transaction');
      const jockeyObjectId = new mongoose.Types.ObjectId(String(jockeyId));

      const [
        { rank, totalJockeys, winRate },
        totalPayoutsEarned,
        pendingPayoutsAmount,
        invitationAgg,
        roleAgg,
      ] = await Promise.all([
        JockeyRepository.getWinRateRank(jockeyId),
        TransactionRepository.sumAmountByParty(jockeyId, 'jockey', 'payee', { paymentStatus: 'paid' }),
        TransactionRepository.sumAmountByParty(jockeyId, 'jockey', 'payee', { paymentStatus: { $ne: 'paid' } }),
        Invitation.aggregate([
          { $match: { jockeyId: jockeyObjectId } },
          { $group: { _id: '$invitationStatus', count: { $sum: 1 } } },
        ]),
        Transaction.aggregate([
          { $match: { payeeId: jockeyObjectId, payeeRole: 'jockey', paymentType: 'jockey_payout', paymentStatus: 'paid' } },
          { $lookup: { from: 'invitations', localField: 'sourceId', foreignField: '_id', as: 'inv' } },
          { $unwind: '$inv' },
          { $group: { _id: '$inv.isBackup', count: { $sum: 1 }, earnings: { $sum: '$amount' } } },
        ]),
      ]);

      const invitationCounts = Object.fromEntries(invitationAgg.map(r => [r._id, r.count]));
      const invitations = {
        pending: invitationCounts.pending ?? 0,
        accepted: invitationCounts.accepted ?? 0,
        declined: invitationCounts.declined ?? 0,
        cancelled: invitationCounts.cancelled ?? 0,
        noShow: invitationCounts.didNotAttend ?? 0,
      };

      const roleRows = Object.fromEntries(roleAgg.map(r => [r._id ? 'backup' : 'main', { count: r.count, earnings: r.earnings }]));
      const byRole = {
        main: roleRows.main ?? { count: 0, earnings: 0 },
        backup: roleRows.backup ?? { count: 0, earnings: 0 },
      };

      return {
        code: 200,
        data: {
          wallet: jockey.wallet,
          matchesRaced: jockey.matchesRaced,
          totalWins: jockey.totalWins,
          winRate,
          rank,
          totalJockeys,
          totalPayoutsEarned: totalPayoutsEarned || 0,
          pendingPayoutsAmount: pendingPayoutsAmount || 0,
          invitations,
          byRole,
        },
        msg: 'Jockey statistics retrieved successfully',
      };
    } catch (error) {
      return { code: 500, msg: error.message };
    }
  }

  // Payouts earned over time (day/week/month/year), gap-filled so charts
  // always render a contiguous line. Mirrors RefereeService.getFeesEarningsSeries.
  async getEarningsSeries(jockeyId, groupBy = 'day') {
    try {
      const mongoose = require('mongoose');
      const Transaction = require('../entities/Transaction');

      let dateFormat = '%Y-%m-%d';
      if (groupBy === 'week') dateFormat = '%Y-%U';
      else if (groupBy === 'month') dateFormat = '%Y-%m';
      else if (groupBy === 'year') dateFormat = '%Y';

      const series = await Transaction.aggregate([
        {
          $match: {
            payeeId: new mongoose.Types.ObjectId(String(jockeyId)),
            payeeRole: 'jockey',
            paymentType: 'jockey_payout',
            paymentStatus: 'paid',
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: dateFormat, date: '$date' } },
            payoutsEarned: { $sum: '$amount' },
          },
        },
        { $sort: { _id: 1 } },
      ]);

      let result = series.map(row => ({ date: row._id, payoutsEarned: parseFloat(row.payoutsEarned.toFixed(2)) }));

      const getPastPeriods = (type) => {
        const pad = n => n.toString().padStart(2, '0');
        const periods = [];
        const count = type === 'year' ? 3 : type === 'month' ? 6 : type === 'week' ? 4 : 7;
        for (let i = count - 1; i >= 0; i--) {
          const d = new Date();
          if (type === 'year') {
            d.setFullYear(d.getFullYear() - i);
            periods.push(`${d.getFullYear()}`);
          } else if (type === 'month') {
            d.setMonth(d.getMonth() - i);
            periods.push(`${d.getFullYear()}-${pad(d.getMonth() + 1)}`);
          } else if (type === 'week') {
            d.setDate(d.getDate() - (i * 7));
            const startOfYear = new Date(d.getFullYear(), 0, 1);
            const days = Math.floor((d - startOfYear) / (24 * 60 * 60 * 1000));
            const weekNum = Math.floor((days + startOfYear.getDay()) / 7);
            periods.push(`${d.getFullYear()}-${pad(weekNum)}`);
          } else {
            d.setDate(d.getDate() - i);
            periods.push(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`);
          }
        }
        return periods;
      };

      const dbMap = new Map(result.map(r => [r.date, r]));
      for (const date of getPastPeriods(groupBy)) {
        if (!dbMap.has(date)) {
          result.push({ date, payoutsEarned: 0 });
          dbMap.set(date, true);
        }
      }
      result.sort((a, b) => a.date.localeCompare(b.date));

      const totalPayoutsEarned = parseFloat(result.reduce((s, r) => s + r.payoutsEarned, 0).toFixed(2));

      return { code: 200, data: { totalPayoutsEarned, series: result }, msg: 'Payout earnings series retrieved successfully' };
    } catch (error) {
      return { code: 500, msg: error.message };
    }
  }
}

module.exports = new StatisticsService();
