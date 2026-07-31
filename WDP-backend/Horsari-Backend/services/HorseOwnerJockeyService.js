const JockeyRepository = require('../repositories/JockeyRepository');
const Jockey = require('../entities/Jockey');
const User = require('../entities/User');
const Invitation = require('../entities/Invitation');
const Registration = require('../entities/Registration');
const RaceResult = require('../entities/RaceResult');
const Violation = require('../entities/Violation');
const RaceRound = require('../entities/RaceRound');
const Transaction = require('../entities/Transaction');

class JockeyService {
    // Get a single jockey's profile: stats + race history + violations (for horse owner view)
    async getJockeyProfile(jockeyId) {
        try {
            if (!jockeyId) return { code: 400, msg: 'jockeyId is required' };

            const [jockeyDoc, user] = await Promise.all([
                Jockey.findById(jockeyId).lean(),
                User.findById(jockeyId).select('fullName image dateOfBirth address phoneNumber').lean(),
            ]);
            if (!jockeyDoc || !user) return { code: 404, msg: 'Jockey not found' };

            // Accepted + no-show invitations → registration IDs this jockey committed to
            const invitations = await Invitation.find({
                jockeyId,
                invitationStatus: { $in: ['accepted', 'didNotAttend'] },
            }).lean();
            const regIds = invitations.map(inv => inv.registrationId).filter(Boolean);
            const invByRegId = new Map(invitations.map(inv => [String(inv.registrationId), inv]));

            const [registrations, results, violations] = await Promise.all([
                regIds.length > 0
                    ? Registration.find({ _id: { $in: regIds } })
                        .populate('horseId', 'horseName')
                        .lean()
                    : [],
                regIds.length > 0
                    ? RaceResult.find({ registrationId: { $in: regIds } }).lean()
                    : [],
                regIds.length > 0
                    ? Violation.find({ registrationId: { $in: regIds } })
                        .populate('violationTypeId', 'violationName category severity defaultPenalty')
                        .lean()
                    : [],
            ]);

            const raceRoundIds = registrations.map(r => r.raceRoundId).filter(Boolean);
            const raceRounds = raceRoundIds.length > 0
                ? await RaceRound.find({ _id: { $in: raceRoundIds } }).lean()
                : [];

            const raceRoundMap = new Map(raceRounds.map(rr => [String(rr._id), rr]));
            const resultByRegId = new Map(results.map(r => [String(r.registrationId), r]));

            const ordinals = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th'];
            const recentRaces = registrations.map(reg => {
                const result = resultByRegId.get(String(reg._id));
                const raceRound = raceRoundMap.get(String(reg.raceRoundId));
                const pos = result?.finishPosition;
                const inv = invByRegId.get(String(reg._id));
                return {
                    race: raceRound?.roundName ?? 'Unknown Race',
                    position: pos != null ? (ordinals[pos - 1] ?? `${pos}th`) : 'DNF',
                    horse: reg.horseId?.horseName ?? 'Unknown',
                    date: raceRound?.raceDate
                        ? new Date(raceRound.raceDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                        : 'N/A',
                    attendance: inv?.invitationStatus === 'didNotAttend' ? 'no_show' : inv?.isBackup ? 'backup' : 'main',
                    bookingFees: inv?.bookingFees ?? 0,
                };
            }).sort((a, b) => 0); // preserve DB order (most recent first via sort below)

            // Stats (wins/totalRaces/winRate) only count races the jockey actually rode
            // AND that have been officially scored (a recorded finishPosition) — a
            // no-show never raced, and an accepted-but-not-yet-run/confirmed race has
            // no result yet, so neither should inflate "races completed". Both stay in
            // recentRaces for history (shown as 'DNF') but are excluded from these stats.
            const riddenRegIds = new Set(
                registrations.filter(reg => invByRegId.get(String(reg._id))?.invitationStatus !== 'didNotAttend')
                    .map(reg => String(reg._id))
            );
            const officialResults = results.filter(r => r.finishPosition != null && riddenRegIds.has(String(r.registrationId)));
            const completedRegIds = new Set(officialResults.map(r => String(r.registrationId)));
            const wins = officialResults.filter(r => r.finishPosition === 1).length;

            // Actual paid-out amount for this jockey (bookingFee + percentagePayout%
            // of prize, VND-converted) — NOT the race's raw prizeMoney, which ignores
            // the jockey's payout share/currency conversion entirely.
            const mongoose = require('mongoose');
            const totalPrize = (await Transaction.aggregate([
                { $match: { payeeId: new mongoose.Types.ObjectId(String(jockeyId)), payeeRole: 'jockey', paymentType: 'jockey_payout', paymentStatus: 'paid' } },
                { $group: { _id: null, total: { $sum: '$amount' } } },
            ]))[0]?.total || 0;

            // Leaderboard position by win rate (matchesRaced/totalWins counters) —
            // distinct from `stats.winRate` below, which is audited from this
            // jockey's own actual RaceResult/Invitation records (excludes no-shows).
            const { rank, totalJockeys } = await JockeyRepository.getWinRateRank(jockeyId);

            return {
                code: 200,
                data: {
                    jockey: { ...jockeyDoc, ...user, rank, totalJockeys },
                    stats: {
                        totalRaces: completedRegIds.size,
                        wins,
                        winRate: completedRegIds.size > 0 ? Math.round((wins / completedRegIds.size) * 100) : 0,
                        totalPrize,
                    },
                    recentRaces,
                    violations: violations.map(v => ({
                        _id: v._id,
                        raceRound: raceRoundMap.get(String(v.raceRoundId)) ?? { _id: v.raceRoundId },
                        violationType: v.violationTypeId ?? null,
                        description: v.description,
                        severity: v.severity,
                        actualPenalty: v.actualPenalty,
                        stewardAction: v.stewardAction,
                        violationStatus: v.violationStatus,
                    })),
                },
                msg: 'Jockey profile retrieved successfully',
            };
        } catch (error) {
            return { code: 500, msg: error.message };
        }
    }
}

module.exports = new JockeyService();
