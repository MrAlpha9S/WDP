const Prediction = require('../entities/Prediction');
const PredictionMethod = require('../entities/PredictionMethod');
const RaceResult = require('../entities/RaceResult');
const Registration = require('../entities/Registration');
const SpectatorRepository = require('../repositories/SpectatorRepository');
const TransactionRepository = require('../repositories/TransactionRepository');

// Takeout rates by bet type (PDF reference: Win/Place/Show 17%, multi-race 22%)
const TAKEOUT = {
    win:      0.17,
    place:    0.17,
    show:     0.17,
    exacta:   0.20,
    champion: 0.22,
    default:  0.17,
};

class PayoutService {

    // ─────────────────────────────────────────────────────────────────────────
    // CORE PARIMUTUEL FORMULAS (pure — no DB)
    //
    // Schema:
    //   Prediction.amount        = S (stake placed at bet time, never changes)
    //   Prediction.rewardPoints  = payout written at settlement (0 for losers)
    //
    // Variables follow the PDF exactly:
    //   P  = total gross pool = sum of all stakes for the race + method
    //   T  = takeout rate
    //   N  = net pool = P × (1 - T)
    //   Bᵢ = sum of stakes placed on horse i
    //   S  = individual bettor's stake (= prediction.amount)
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

    // Formula 6 — Profit only: S × Oᵢ = S × (N - Bᵢ) / Bᵢ
    profit(stake, netPool, stakeOnHorse) {
        return stake * this.oddsForHorse(netPool, stakeOnHorse);
    }

    // Formula 7 — Standard $2 display payout (toteboards): 2 × (N / Bᵢ)
    displayPayout(netPool, stakeOnHorse) {
        return 2 * this.payoutPerUnit(netPool, stakeOnHorse);
    }

    // Scale a $2 display payout to any stake S: displayPayout × (S / 2)
    scalePayout(displayPayout, stake) {
        return displayPayout * (stake / 2);
    }

    // Full combined formula: S × P × (1 - T) / Bᵢ
    collectFull(stake, grossPool, takeoutRate, stakeOnHorse) {
        if (!stakeOnHorse || stakeOnHorse <= 0) return 0;
        return stake * (grossPool * (1 - takeoutRate)) / stakeOnHorse;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // LIVE POOL SNAPSHOT — real-time odds for a race round
    // Only includes predictions on verified registrations (eligible entrants).
    // Bᵢ = sum(prediction.amount) for that horse while status='pending'.
    // ─────────────────────────────────────────────────────────────────────────

    async getPoolSnapshot(raceRoundId, methodType = 'win', customTakeout = null) {
        try {
            const method = await PredictionMethod.findOne({ methodType, isActive: true }).lean();
            if (!method) return { code: 404, msg: `Prediction method '${methodType}' not found` };

            const T = customTakeout ?? TAKEOUT[methodType] ?? TAKEOUT.default;

            // Only verified registrations — eligibility has been confirmed by admin
            const verifiedRegs = await Registration.find({
                raceRoundId,
                registrationStatus: 'verified',
            }).select('_id').lean();
            const verifiedRegIds = verifiedRegs.map(r => r._id);

            const predictions = await Prediction.find({
                registrationId:    { $in: verifiedRegIds },
                predictionMethodId: method._id,
                predictionStatus:  'pending',
            }).lean();

            // Sum stake (amount) per registrationId → Bᵢ
            const stakeByReg = {};
            for (const p of predictions) {
                const rid = p.registrationId.toString();
                stakeByReg[rid] = (stakeByReg[rid] || 0) + (p.amount || 0);
            }

            const P = this.grossPool(Object.values(stakeByReg));
            const N = this.netPool(P, T);

            const perHorse = Object.entries(stakeByReg).map(([registrationId, Bi]) => ({
                registrationId,
                totalStake:   Bi,
                poolShare:    P > 0 ? parseFloat((Bi / P * 100).toFixed(2)) : 0,
                odds:         parseFloat(this.oddsForHorse(N, Bi).toFixed(4)),
                displayPayout: parseFloat(this.displayPayout(N, Bi).toFixed(2)),
            }));

            return {
                code: 200,
                data: {
                    raceRoundId,
                    methodType,
                    takeoutRate:  T,
                    grossPool:    P,
                    netPool:      parseFloat(N.toFixed(2)),
                    totalBettors: predictions.length,
                    perHorse,
                },
            };
        } catch (err) {
            return { code: 500, msg: err.message };
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // SETTLE RACE PREDICTIONS — called from SimulationService after race_finished
    //
    // win:    correct if horse finishes 1st
    // place:  correct if horse finishes 1st or 2nd
    // show:   correct if horse finishes 1st, 2nd, or 3rd
    // exacta: correct if registrationId finishes 1st AND secondRegistrationId finishes 2nd
    //
    // Pool per method is independent (PDF: each bet type has its own pool).
    // S = pred.amount (stake saved at prediction time)
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

            const raceMethods = await PredictionMethod.find({
                methodType: { $in: ['win', 'place', 'show', 'exacta'] },
                isActive: true,
            }).lean();

            const methodIds = raceMethods.map(m => m._id);
            const methodMap = {};
            for (const m of raceMethods) methodMap[m._id.toString()] = m;

            const regIds = results.map(r => r.registrationId);

            const predictions = await Prediction.find({
                registrationId:     { $in: regIds },
                predictionMethodId: { $in: methodIds },
                predictionStatus:   'pending',
            }).lean();

            if (!predictions.length) {
                return { code: 200, data: { settled: 0 }, msg: 'No pending predictions to settle' };
            }

            // Determine win condition per prediction and method type
            const isCorrectBet = (pred, methodType) => {
                const pos1 = posMap[pred.registrationId?.toString()];
                if (pos1 === undefined) return false;
                if (methodType === 'win')   return pos1 === 1;
                if (methodType === 'place') return pos1 <= 2;
                if (methodType === 'show')  return pos1 <= 3;
                if (methodType === 'exacta') {
                    const pos2 = pred.secondRegistrationId
                        ? posMap[pred.secondRegistrationId.toString()]
                        : undefined;
                    return pos1 === 1 && pos2 === 2;
                }
                return false;
            };

            // Group by method; sum amount (= stake) per horse to build each pool
            const byMethod = {};
            for (const p of predictions) {
                const mid = p.predictionMethodId.toString();
                if (!byMethod[mid]) byMethod[mid] = { stakes: {}, preds: [] };
                const rid = p.registrationId.toString();
                byMethod[mid].stakes[rid] = (byMethod[mid].stakes[rid] || 0) + (p.amount || 0);
                byMethod[mid].preds.push(p);
            }

            const settled = [];

            for (const [methodId, { stakes, preds }] of Object.entries(byMethod)) {
                const method = methodMap[methodId];
                if (!method) continue;
                const T = TAKEOUT[method.methodType] ?? TAKEOUT.default;
                const P = this.grossPool(Object.values(stakes));
                const N = this.netPool(P, T);

                // For exacta: winning pool is staked on the exact 1st-horse registration
                // For win/place/show: winning pool is stakes on qualifying horses
                const winningStakeByRid = {};
                for (const pred of preds) {
                    if (isCorrectBet(pred, method.methodType)) {
                        const rid = pred.registrationId.toString();
                        winningStakeByRid[rid] = (winningStakeByRid[rid] || 0) + (pred.amount || 0);
                    }
                }
                const Bwin = Object.values(winningStakeByRid).reduce((s, v) => s + v, 0);

                for (const pred of preds) {
                    const S         = pred.amount || 0;
                    const isCorrect = isCorrectBet(pred, method.methodType);
                    const rid       = pred.registrationId.toString();
                    const Bi        = winningStakeByRid[rid] || 0;

                    const earn = isCorrect && Bwin > 0 && S > 0
                        ? parseFloat(this.totalCollect(S, N, Bwin).toFixed(2))
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
    // "champion": correct if predictedHorseId === champion
    // Pool = sum of all stakes (amount) on ALL predicted horses for this tournament.
    // Bᵢ = sum of stakes on the actual champion horse.
    // ─────────────────────────────────────────────────────────────────────────

    async distributeTournamentPayouts(tournamentId, championHorseId) {
        try {
            const method = await PredictionMethod.findOne({ methodType: 'champion', isActive: true }).lean();
            if (!method) return { code: 404, msg: 'champion method not found' };

            const T = TAKEOUT.champion;

            const predictions = await Prediction.find({
                tournamentId,
                predictionMethodId: method._id,
                predictionStatus:   'pending',
            }).lean();

            if (!predictions.length) {
                return { code: 200, data: { settled: 0 }, msg: 'No pending tournament predictions' };
            }

            // Sum stakes (amount) per predicted horse
            const stakeByHorse = {};
            for (const p of predictions) {
                const hid = p.predictedHorseId?.toString();
                if (!hid) continue;
                stakeByHorse[hid] = (stakeByHorse[hid] || 0) + (p.amount || 0);
            }

            const P  = this.grossPool(Object.values(stakeByHorse));
            const N  = this.netPool(P, T);
            const Bi = stakeByHorse[championHorseId.toString()] || 0;

            const settled = [];

            for (const pred of predictions) {
                const isCorrect = pred.predictedHorseId?.toString() === championHorseId.toString();
                const S         = pred.amount || 0;
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
                const stake = pred.amount || 0;
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
                const stake = pred.amount || 0;
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
