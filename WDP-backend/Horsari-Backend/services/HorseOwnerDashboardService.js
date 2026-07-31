const HorseRepository = require('../repositories/HorseRepository');
const Registration = require('../entities/Registration');
const RaceRound = require('../entities/RaceRound');
const Invitation = require('../entities/Invitation');
const RaceResult = require('../entities/RaceResult');
const Violation = require('../entities/Violation');
const CurrencyConverter = require('./CurrencyConverter');

class DashboardService {
    // Dashboard summary: counts + recent activity feed
    async getDashboardSummary(ownerId) {
        try {
            if (!ownerId) return { code: 400, msg: 'ownerId is required' };

            const horses = await HorseRepository.findByOwnerId(ownerId);
            const totalHorses = horses.length;
            const horseIds = horses.map(h => h._id);

            // Owner's registrations
            const ownerRegs = await Registration.find({ horseOwnerId: ownerId }).select('_id raceRoundId horseId createdAt').lean();
            const regIds = ownerRegs.map(r => r._id);
            const regRaceRoundIds = ownerRegs.map(r => r.raceRoundId).filter(Boolean);

            // Count upcoming/live race rounds the owner is in
            const activeRaceRounds = regRaceRoundIds.length > 0
                ? await RaceRound.find({
                    _id: { $in: regRaceRoundIds },
                    status: { $in: ['scheduled', 'prepared', 'awaitingConfirmation', 'running'] },
                }).select('_id').lean()
                : [];
            const upcomingRacesCount = activeRaceRounds.length;

            // Count pending jockey invitations sent by this owner
            const activeInvitationsCount = regIds.length > 0
                ? await Invitation.countDocuments({ registrationId: { $in: regIds }, invitationStatus: 'pending' })
                : 0;

            // Recent activity feed (last 14 days, max 10)
            const since = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

            const [recentRegs, recentResults, recentInvitations, recentViolations] = await Promise.all([
                Registration.find({ horseOwnerId: ownerId, createdAt: { $gte: since } })
                    .populate('horseId', 'horseName')
                    .populate({ path: 'raceRoundId', select: 'roundName' })
                    .sort({ createdAt: -1 })
                    .limit(5)
                    .lean(),
                regIds.length > 0
                    ? RaceResult.find({ registrationId: { $in: regIds }, createdAt: { $gte: since } })
                        .populate({ path: 'registrationId', populate: [{ path: 'horseId', select: 'horseName' }, { path: 'raceRoundId', select: 'roundName' }] })
                        .sort({ createdAt: -1 })
                        .limit(5)
                        .lean()
                    : [],
                regIds.length > 0
                    ? Invitation.find({ registrationId: { $in: regIds }, updatedAt: { $gte: since }, invitationStatus: { $in: ['accepted', 'declined'] } })
                        .populate({ path: 'jockeyId', model: 'User', select: 'fullName' })
                        .sort({ updatedAt: -1 })
                        .limit(5)
                        .lean()
                    : [],
                regIds.length > 0
                    ? Violation.find({ registrationId: { $in: regIds }, createdAt: { $gte: since } })
                        .populate('violationTypeId', 'violationName')
                        .populate({ path: 'registrationId', populate: { path: 'horseId', select: 'horseName' } })
                        .sort({ createdAt: -1 })
                        .limit(5)
                        .lean()
                    : [],
            ]);

            const relativeTime = (date) => {
                const diff = Date.now() - new Date(date).getTime();
                const mins = Math.floor(diff / 60000);
                if (mins < 1) return 'Just now';
                if (mins < 60) return `${mins}m ago`;
                const hrs = Math.floor(mins / 60);
                if (hrs < 24) return `${hrs}h ago`;
                return `${Math.floor(hrs / 24)}d ago`;
            };

            const activity = [
                ...recentRegs.map(r => ({
                    type: 'registration',
                    icon: 'check',
                    time: relativeTime(r.createdAt),
                    text: `${r.horseId?.horseName ?? 'Your horse'} registered for `,
                    highlight: r.raceRoundId?.roundName ?? 'a race',
                    date: r.createdAt,
                })),
                ...recentResults.map(r => {
                    const pos = r.finishPosition;
                    const ordinals = ['1st', '2nd', '3rd'];
                    const label = pos != null ? (ordinals[pos - 1] ?? `${pos}th`) : 'DNF';
                    return {
                        type: 'result',
                        icon: pos === 1 ? 'check' : 'user',
                        time: relativeTime(r.createdAt),
                        text: `${r.registrationId?.horseId?.horseName ?? 'Your horse'} finished ${label} in `,
                        highlight: r.registrationId?.raceRoundId?.roundName ?? 'a race',
                        date: r.createdAt,
                    };
                }),
                ...recentInvitations.map(inv => ({
                    type: 'invitation',
                    icon: inv.invitationStatus === 'accepted' ? 'check' : 'alert',
                    time: relativeTime(inv.updatedAt),
                    text: `${inv.jockeyId?.fullName ?? 'A jockey'} ${inv.invitationStatus} your hire request for `,
                    highlight: 'an upcoming race',
                    date: inv.updatedAt,
                })),
                ...recentViolations.map(v => ({
                    type: 'violation',
                    icon: 'alert',
                    time: relativeTime(v.createdAt),
                    text: `Violation issued on `,
                    highlight: `${v.registrationId?.horseId?.horseName ?? 'your horse'}: ${v.violationTypeId?.violationName ?? 'Unknown'}`,
                    date: v.createdAt,
                })),
            ]
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .slice(0, 10)
                .map(({ date, ...rest }) => rest);

            return {
                code: 200,
                data: { totalHorses, upcomingRacesCount, activeInvitationsCount, recentActivity: activity },
                msg: 'Dashboard summary retrieved successfully',
            };
        } catch (error) {
            return { code: 500, msg: error.message };
        }
    }

    // Top performing horses by win rate
    async getTopPerformers(ownerId, limit = 5) {
        try {
            if (!ownerId) return { code: 400, msg: 'ownerId is required' };

            const horses = await HorseRepository.findByOwnerId(ownerId);
            if (horses.length === 0) return { code: 200, data: [], msg: 'No horses found' };

            const allRegs = await Registration.find({ horseOwnerId: ownerId })
                .select('_id horseId raceRoundId')
                .populate('raceRoundId', 'currencyType')
                .lean();
            const regIds = allRegs.map(r => r._id);
            const regMap = new Map(allRegs.map(r => [String(r._id), r]));

            const results = regIds.length > 0
                ? await RaceResult.find({ registrationId: { $in: regIds }, finishPosition: { $ne: null }, resultStatus: 'official' }).lean()
                : [];

            // Aggregate stats per horse
            const statsMap = new Map();
            for (const r of results) {
                const reg = regMap.get(String(r.registrationId));
                if (!reg) continue;
                const horseId = String(reg.horseId);

                if (!statsMap.has(horseId)) statsMap.set(horseId, { totalRaces: 0, wins: 0, prizeMoney: 0 });
                const s = statsMap.get(horseId);
                s.totalRaces++;
                if (r.finishPosition === 1) s.wins++;

                const currency = reg.raceRoundId?.currencyType || 'VND';
                s.prizeMoney += CurrencyConverter.convertToVnd(r.prizeMoney || 0, currency);
            }

            const performers = horses
                .map(h => {
                    const s = statsMap.get(String(h._id)) ?? { totalRaces: 0, wins: 0, prizeMoney: 0 };
                    return {
                        id: h._id,
                        name: h.horseName,
                        img: h.img ?? null,
                        winRate: s.totalRaces > 0 ? Math.round((s.wins / s.totalRaces) * 100) : 0,
                        wins: s.wins,
                        totalRaces: s.totalRaces,
                        prizeMoney: s.prizeMoney
                    };
                })
                .sort((a, b) => b.prizeMoney - a.prizeMoney || b.wins - a.wins)
                .slice(0, limit);

            return { code: 200, data: performers, msg: 'Top performers retrieved successfully' };
        } catch (error) {
            return { code: 500, msg: error.message };
        }
    }
}

module.exports = new DashboardService();
