const Prediction = require('../entities/Prediction');
const PredictionMethod = require('../entities/PredictionMethod');
const RaceResult = require('../entities/RaceResult');
const Registration = require('../entities/Registration');
const RaceRound = require('../entities/RaceRound');
const SpectatorRepository = require('../repositories/SpectatorRepository');
const TransactionRepository = require('../repositories/TransactionRepository');
const AdminRepository = require('../repositories/AdminRepository');

// Takeout rates by bet type (PDF reference: Win/Place/Show 17%, multi-race 22%)
const TAKEOUT = {
    race_winner: 0.17,  // "Exacta"  — Win bet
    race_rank: 0.17,  // "Ranking" — Place / Show
    tournament_champion: 0.22,  // "Champion" — multi-race wager
    default: 0.17,
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

    // Formula 4 — Payout per 1vnd bet (return including stake): N / Bᵢ
    payoutPerUnit(netPool, stakeOnHorse) {
        if (!stakeOnHorse || stakeOnHorse <= 0) return 0;
        return netPool / stakeOnHorse;
    }

    // Formula 5 — Total collect for stake S: S × (N / Bᵢ)
    totalCollect(stake, netPool, stakeOnHorse) {
        return stake * this.payoutPerUnit(netPool, stakeOnHorse);
    }

    // Single source of truth for the race-level takeout rate: a RaceRound's own
    // housingFeePercentage override, else the platform default for that method type.
    // Only applies to race_winner/race_rank — tournament_champion is never
    // overridden by a RaceRound field (it's tournament-wide, not race-specific).
    getRaceTakeoutRate(raceRound, methodType) {
        if (raceRound?.housingFeePercentage != null) return raceRound.housingFeePercentage;
        return TAKEOUT[methodType] ?? TAKEOUT.default;
    }

    // Credits a spectator's reward balance and logs the matching transaction.
    // Shared by every reward/refund path below so the transaction shape stays consistent.
    async _creditSpectator(pred, amount, transactionType, description) {
        await SpectatorRepository.addRewardPoints(pred.spectatorId, amount);
        await TransactionRepository.create({
            userId: pred.spectatorId,
            transactionType,
            amount,
            status: 'completed',
            description,
            referenceId: pred._id.toString(),
            referenceType: 'prediction',
        });
    }

    // Credits the platform's house take into the main admin wallet and logs the transaction.
    async _creditHouseTake(amount, description, referenceId) {
        const updatedAdmin = await AdminRepository.incrementMainAdminWallet(amount);
        await TransactionRepository.create({
            userId: updatedAdmin._id,
            transactionType: 'deposit',
            amount,
            status: 'completed',
            description,
            referenceId: String(referenceId),
            referenceType: 'payment',
        });
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
            const raceRound = await RaceRound.findById(raceRoundId).select('housingFeePercentage').lean();

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
                PredictionMethod.findOne({ methodType: 'race_rank', isActive: true }).lean(),
            ]);

            const methodIds = [winnerMethod?._id, rankMethod?._id].filter(Boolean);
            const regIds = results.map(r => r.registrationId);

            const predictions = await Prediction.find({
                registrationId: { $in: regIds },
                predictionMethodId: { $in: methodIds },
                predictionStatus: 'pending',
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
                const T = this.getRaceTakeoutRate(raceRound, isWin ? 'race_winner' : 'race_rank');
                const P = this.grossPool(Object.values(stakes));
                const N = this.netPool(P, T);
                houseTake += (P - N);

                // Evaluate correctness once per prediction — reused for both the
                // anyCorrect check and the per-prediction settlement below.
                const evaluated = preds.map(pred => {
                    const rid = pred.registrationId.toString();
                    const actualPos = posMap[rid];
                    const isCorrect = isWin
                        ? actualPos === 1
                        : (pred.predictedRank != null && actualPos === pred.predictedRank);
                    return { pred, rid, isCorrect };
                });
                const anyCorrect = evaluated.some(e => e.isCorrect);

                if (!anyCorrect) {
                    // Nobody won this pool — refund each stake minus the house's
                    // cut instead of letting the net pool go unaccounted for.
                    for (const { pred } of evaluated) {
                        const S = pred.rewardPoints || 0;
                        const refundAmount = parseFloat((S * (1 - T)).toFixed(2));

                        await Prediction.findByIdAndUpdate(pred._id, {
                            predictionStatus: 'refunded',
                            rewardPoints: refundAmount,
                        });

                        if (refundAmount > 0) {
                            await this._creditSpectator(pred, refundAmount, 'refund',
                                `No winning prediction — refund minus ${(T * 100).toFixed(0)}% house fee`);
                        }

                        settled.push({ predictionId: pred._id, isCorrect: false, earn: refundAmount });
                    }
                    continue;
                }

                for (const { pred, rid, isCorrect } of evaluated) {
                    const S = pred.rewardPoints || 0; // stake

                    const Bi = stakes[rid] || 0;
                    const earn = isCorrect && Bi > 0 && S > 0
                        ? parseFloat(this.totalCollect(S, N, Bi).toFixed(2))
                        : 0;

                    await Prediction.findByIdAndUpdate(pred._id, {
                        predictionStatus: isCorrect ? 'correct' : 'incorrect',
                        rewardPoints: earn,
                    });

                    if (isCorrect && earn > 0) {
                        await this._creditSpectator(pred, earn, 'reward', `Parimutuel payout — race ${raceRoundId}`);
                    }

                    settled.push({ predictionId: pred._id, isCorrect, earn });
                }
            }

            if (houseTake > 0) {
                const roundedTake = parseFloat(houseTake.toFixed(2));
                await this._creditHouseTake(roundedTake, `Parimutuel house take — race ${raceRoundId}`, raceRoundId);
            }

            return {
                code: 200,
                data: { settled: settled.length, breakdown: settled },
                msg: `${settled.length} predictions settled`,
            };
        } catch (err) {
            console.error('[PayoutService] distributeRacePayouts error:', err);
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
                predictionStatus: 'pending',
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

            const P = this.grossPool(Object.values(stakeByHorse));
            const N = this.netPool(P, T);
            const Bi = stakeByHorse[championHorseId.toString()] || 0;
            const houseTake = P - N;

            const settled = [];

            if (Bi === 0) {
                // Nobody predicted the actual champion — refund each stake minus
                // the house's cut instead of letting the net pool go unaccounted for.
                for (const pred of predictions) {
                    const S = pred.rewardPoints || 0;
                    const refundAmount = parseFloat((S * (1 - T)).toFixed(2));

                    await Prediction.findByIdAndUpdate(pred._id, {
                        predictionStatus: 'refunded',
                        rewardPoints: refundAmount,
                    });

                    if (refundAmount > 0) {
                        await this._creditSpectator(pred, refundAmount, 'refund',
                            `No correct champion prediction — refund minus ${(T * 100).toFixed(0)}% house fee`);
                    }

                    settled.push({ predictionId: pred._id, isCorrect: false, earn: refundAmount });
                }
            } else {
                for (const pred of predictions) {
                    const isCorrect = pred.predictedHorseId?.toString() === championHorseId.toString();
                    const S = pred.rewardPoints || 0;
                    const earn = isCorrect && S > 0
                        ? parseFloat(this.totalCollect(S, N, Bi).toFixed(2))
                        : 0;

                    await Prediction.findByIdAndUpdate(pred._id, {
                        predictionStatus: isCorrect ? 'correct' : 'incorrect',
                        rewardPoints: earn,
                    });

                    if (isCorrect && earn > 0) {
                        await this._creditSpectator(pred, earn, 'reward', `Parimutuel payout — tournament champion ${tournamentId}`);
                    }

                    settled.push({ predictionId: pred._id, isCorrect, earn });
                }
            }

            if (houseTake > 0) {
                const roundedTake = parseFloat(houseTake.toFixed(2));
                await this._creditHouseTake(roundedTake, `Parimutuel house take — tournament champion ${tournamentId}`, tournamentId);
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
                    await this._creditSpectator(pred, stake, 'refund', `Race cancelled — refund`);
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
                    await this._creditSpectator(pred, stake, 'refund', `Horse failed verification — refund`);
                }
            }
        } catch (err) {
            console.error('[PayoutService] refundRegistrationPredictions error:', err);
        }
    }
}

module.exports = new PayoutService();
