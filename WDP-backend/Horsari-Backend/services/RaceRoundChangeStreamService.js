const RaceRound = require('../entities/RaceRound');

const RETRY_DELAY_MS = 5000;

// Watches the raceRound collection directly so ANY mutation — from any
// service, present or future — reaches connected clients, instead of relying
// on every call site remembering to emit a targeted socket event.
function startRaceRoundChangeStream(io) {
    const changeStream = RaceRound.watch([], { fullDocument: 'updateLookup' });

    changeStream.on('change', (change) => {
        const raceRoundId = change.documentKey?._id;
        if (!raceRoundId) return;

        io.emit('raceround_updated', {
            raceRoundId: String(raceRoundId),
            status: change.fullDocument?.status ?? null,
            operationType: change.operationType,
            timestamp: new Date(),
        });
    });

    changeStream.on('error', (err) => {
        console.error('[RaceRoundChangeStream] error, restarting in 5s:', err.message);
        setTimeout(() => startRaceRoundChangeStream(io), RETRY_DELAY_MS);
    });

    return changeStream;
}

module.exports = { startRaceRoundChangeStream };
