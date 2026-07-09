const Prediction = require('../entities/Prediction');
const PredictionMethod = require('../entities/PredictionMethod');
const RaceResult = require('../entities/RaceResult');
const Registration = require('../entities/Registration');
const SpectatorRepository = require('../repositories/SpectatorRepository');
const TransactionRepository = require('../repositories/TransactionRepository');
const AdminRepository = require('../repositories/AdminRepository');

// Takeout rates by bet type (PDF reference: Win/Place/Show 17%, multi-race 22%)
const TAKEOUT = {
    race_winner:         0.17,  // "Exacta"  — Win bet
    race_rank:           0.17,  // "Ranking" — Place / Show
    tournament_champion: 0.22,  // "Champion" — multi-race wager
    default:             0.17,
};

class PayoutService {

    // ─────────────────────────────────────────────────────────────────────────
    // CORE PARIMUTUEL FORMULAS (pure — no DB)
    //
    // rewardPoints-as-stake model (no schema change):
    //   Prediction.rewardPoints while pending  = S (stake wagered by the spectator)
    //   Prediction.rewardPoints after settling = actual payout (0 for losers)
    //
    // Variables follow the PDF exactly:
    //   P  = total gross pool = sum of all stakes for the race + method
    //   T  = takeout rate
    //   N  = net pool = P × (1 - T)
    //   Bᵢ = sum of stakes placed on horse i
    //   S  = individual bettor's stake (= their prediction.rewardPoints while pending)
    // ─────────────────────────────────────────────────────────────────────────

    // Formula 1 — Total Gross Pool: P = B₁ + B₂ + … + Bₙ
    grossPool(stakes) {
        return stakes.reduce((sum, s) => sum + s, 0);
    }

    // Formula 2 — Net Pool after takeout: N = P × (1 - T)
    netPool(grossPool, takeoutRate = TAKEOUT.default) {
        return grossPool * (1 - takeoutRate);
    }

    // Formula 3 — Odds for horse i: Oᵢ = (N - Bᵢ) / Bᵢ
    oddsForHorse(netPool, stakeOnHorse) {
        if (!stakeOnHorse || stakeOnHorse <= 0) return 0;
        return (netPool - stakeOnHorse) / stakeOnHorse;
    }

    // Formula 4 — Payout per $1 bet (return including stake): N / Bᵢ
    payoutPerUnit(netPool, stakeOnHorse) {
        if (!stakeOnHorse || stakeOnHorse <= 0) return 0;
        return netPool / stakeOnHorse;
    }

    // Formula 5 — Total collect for stake S: S × (N / Bᵢ)
    totalCollect(stake, netPool, stakeOnHorse) {
        return stake * this.payoutPerUnit(netPool, stakeOnHorse);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // SETTLE RACE PREDICTIONS — called from SimulationService after race_finished
    //
    // "Exacta" (race_winner): correct if horse finishes 1st
    // "Ranking" (race_rank):  correct if horse finishes at exactly predictedRank
    //
    // Pool per method is independent (PDF: each bet type has its own pool).
    // S = pred.rewardPoints (stake saved at prediction time)
    // ─────────────────────────────────────────────────────────────────────────

    async distributeRacePayouts(raceRoundId) {
        try {
            const results = await RaceResult.find({
                raceRoundId,
                resultStatus: 'official',
            }).lean();

            if (!results.length) return { code: 400, msg: 'No results for this race round' };

            // registrationId → finishPosition
            const posMap = {};
            for (const r of results) posMap[r.registrationId.toString()] = r.finishPosition;

            const [winnerMethod, rankMethod] = await Promise.all([
                PredictionMethod.findOne({ methodType: 'race_winner', isActive: true }).lean(),
                PredictionMethod.findOne({ methodType: 'race_rank',   isActive: true }).lean(),
            ]);

            const methodIds = [winnerMethod?._id, rankMethod?._id].filter(Boolean);
            const regIds    = results.map(r => r.registrationId);

            const predictions = await Prediction.find({
                registrationId:    { $in: regIds },
                predictionMethodId: { $in: methodIds },
                predictionStatus:  'pending',
            }).lean();

            if (!predictions.length) {
                return { code: 200, data: { settled: 0 }, msg: 'No pending predictions to settle' };
            }

            // Group by method; sum rewardPoints (= stake) per horse to build each pool
            const byMethod = {};
            for (const p of predictions) {
                const mid = p.predictionMethodId.toString();
                if (!byMethod[mid]) byMethod[mid] = { stakes: {}, preds: [] };
                const rid = p.registrationId.toString();
                byMethod[mid].stakes[rid] = (byMethod[mid].stakes[rid] || 0) + (p.rewardPoints || 0);
                byMethod[mid].preds.push(p);
            }

            const settled = [];
            let houseTake = 0;

            for (const [methodId, { stakes, preds }] of Object.entries(byMethod)) {
                const isWin = winnerMethod && methodId === winnerMethod._id.toString();
                const T = isWin ? TAKEOUT.race_winner : TAKEOUT.race_rank;
                const P = this.grossPool(Object.values(stakes));
                const N = this.netPool(P, T);
                houseTake += (P - N);

                for (const pred of preds) {
                    const rid       = pred.registrationId.toString();
                    const actualPos = posMap[rid];
                    const S         = pred.rewardPoints || 0; // stake

                    const isCorrect = isWin
                        ? actualPos === 1
                        : (pred.predictedRank != null && actualPos === pred.predictedRank);

                    const Bi   = stakes[rid] || 0;
                    const earn = isCorrect && Bi > 0 && S > 0
                        ? parseFloat(this.totalCollect(S, N, Bi).toFixed(2))
                        : 0;

                    await Prediction.findByIdAndUpdate(pred._id, {
                        predictionStatus: isCorrect ? 'correct' : 'incorrect',
                        rewardPoints: earn,
                    });

                    if (isCorrect && earn > 0) {
                        await SpectatorRepository.addRewardPoints(pred.spectatorId, earn);
                        await TransactionRepository.create({
                            userId:          pred.spectatorId,
                            transactionType: 'reward',
                            amount:          earn,
                            status:          'completed',
                            description:     `Parimutuel payout — race ${raceRoundId}`,
                            referenceId:     pred._id.toString(),
                            referenceType:   'prediction',
                        });
                    }

                    settled.push({ predictionId: pred._id, isCorrect, earn });
                }
            }

            if (houseTake > 0) {
                await AdminRepository.incrementMainAdminWallet(parseFloat(houseTake.toFixed(2)));
            }

            return {
                code: 200,
                data: { settled: settled.length, breakdown: settled },
                msg: `${settled.length} predictions settled`,
            };
        } catch (err) {
            return { code: 500, msg: err.message };
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // SETTLE TOURNAMENT CHAMPION PREDICTIONS — called after championHorseId is set
    //
    // "Champion" (tournament_champion): correct if predictedHorseId === champion
    // Pool = sum of all stakes on ALL predicted horses for this tournament.
    // Bᵢ = sum of stakes on the actual champion horse.
    // ─────────────────────────────────────────────────────────────────────────

    async distributeTournamentPayouts(tournamentId, championHorseId) {
        try {
            const method = await PredictionMethod.findOne({ methodType: 'tournament_champion', isActive: true }).lean();
            if (!method) return { code: 404, msg: 'tournament_champion method not found' };

            const T = TAKEOUT.tournament_champion;

            const predictions = await Prediction.find({
                tournamentId,
                predictionMethodId: method._id,
                predictionStatus:   'pending',
            }).lean();

            if (!predictions.length) {
                return { code: 200, data: { settled: 0 }, msg: 'No pending tournament predictions' };
            }

            // Sum stakes per predicted horse
            const stakeByHorse = {};
            for (const p of predictions) {
                const hid = p.predictedHorseId?.toString();
                if (!hid) continue;
                stakeByHorse[hid] = (stakeByHorse[hid] || 0) + (p.rewardPoints || 0);
            }

            const P  = this.grossPool(Object.values(stakeByHorse));
            const N  = this.netPool(P, T);
            const Bi = stakeByHorse[championHorseId.toString()] || 0;
            const houseTake = P - N;

            const settled = [];

            for (const pred of predictions) {
                const isCorrect = pred.predictedHorseId?.toString() === championHorseId.toString();
                const S         = pred.rewardPoints || 0;
                const earn      = isCorrect && Bi > 0 && S > 0
                    ? parseFloat(this.totalCollect(S, N, Bi).toFixed(2))
                    : 0;

                await Prediction.findByIdAndUpdate(pred._id, {
                    predictionStatus: isCorrect ? 'correct' : 'incorrect',
                    rewardPoints: earn,
                });

                if (isCorrect && earn > 0) {
                    await SpectatorRepository.addRewardPoints(pred.spectatorId, earn);
                    await TransactionRepository.create({
                        userId:          pred.spectatorId,
                        transactionType: 'reward',
                        amount:          earn,
                        status:          'completed',
                        description:     `Parimutuel payout — tournament champion ${tournamentId}`,
                        referenceId:     pred._id.toString(),
                        referenceType:   'prediction',
                    });
                }

                settled.push({ predictionId: pred._id, isCorrect, earn });
            }

            if (houseTake > 0) {
                await AdminRepository.incrementMainAdminWallet(parseFloat(houseTake.toFixed(2)));
            }

            return {
                code: 200,
                data: { settled: settled.length, breakdown: settled },
                msg: `${settled.length} tournament predictions settled`,
            };
        } catch (err) {
            return { code: 500, msg: err.message };
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // REFUND — Race cancelled
    // Returns each spectator's stake (rewardPoints) when a race round is cancelled.
    // Sets predictionStatus → 'refunded', rewardPoints → 0.
    // ─────────────────────────────────────────────────────────────────────────

    async refundRacePredictions(raceRoundId) {
        try {
            const regs = await Registration.find({ raceRoundId }).select('_id').lean();
            if (!regs.length) return;

            const predictions = await Prediction.find({
                registrationId: { $in: regs.map(r => r._id) },
                predictionStatus: 'pending',
            }).lean();

            for (const pred of predictions) {
                const stake = pred.rewardPoints || 0;
                await Prediction.findByIdAndUpdate(pred._id, {
                    predictionStatus: 'refunded',
                    rewardPoints: 0,
                });
                if (stake > 0) {
                    await SpectatorRepository.addRewardPoints(pred.spectatorId, stake);
                    await TransactionRepository.create({
                        userId:          pred.spectatorId,
                        transactionType: 'refund',
                        amount:          stake,
                        status:          'completed',
                        description:     `Race cancelled — refund`,
                        referenceId:     pred._id.toString(),
                        referenceType:   'prediction',
                    });
                }
            }
        } catch (err) {
            console.error('[PayoutService] refundRacePredictions error:', err);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // REFUND — Horse failed verification
    // Returns the stake when a single registration is marked 'failed'.
    // ─────────────────────────────────────────────────────────────────────────

    async refundRegistrationPredictions(registrationId) {
        try {
            const predictions = await Prediction.find({
                registrationId,
                predictionStatus: 'pending',
            }).lean();

            for (const pred of predictions) {
                const stake = pred.rewardPoints || 0;
                await Prediction.findByIdAndUpdate(pred._id, {
                    predictionStatus: 'refunded',
                    rewardPoints: 0,
                });
                if (stake > 0) {
                    await SpectatorRepository.addRewardPoints(pred.spectatorId, stake);
                    await TransactionRepository.create({
                        userId:          pred.spectatorId,
                        transactionType: 'refund',
                        amount:          stake,
                        status:          'completed',
                        description:     `Horse failed verification — refund`,
                        referenceId:     pred._id.toString(),
                        referenceType:   'prediction',
                    });
                }
            }
        } catch (err) {
            console.error('[PayoutService] refundRegistrationPredictions error:', err);
        }
    }
}

module.exports = new PayoutService();
