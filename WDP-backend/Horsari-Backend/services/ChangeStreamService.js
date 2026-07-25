const RETRY_DELAY_MS = 5000;

// Generic version of RaceRoundChangeStreamService's pattern — watches any
// Mongoose model's collection directly so ANY mutation, from any service,
// reaches connected clients under `eventName`, instead of relying on every
// call site remembering to emit a targeted socket event.
function startCollectionChangeStream(io, Model, eventName, extractPayload) {
    const changeStream = Model.watch([], { fullDocument: 'updateLookup' });

    changeStream.on('change', (change) => {
        const docId = change.documentKey?._id;
        if (!docId) return;

        const payload = {
            id: String(docId),
            operationType: change.operationType,
            timestamp: new Date(),
            ...(extractPayload ? extractPayload(change) : {}),
        };
        io.emit(eventName, payload);
    });

    changeStream.on('error', (err) => {
        console.error(`[ChangeStream:${eventName}] error, restarting in 5s:`, err.message);
        setTimeout(() => startCollectionChangeStream(io, Model, eventName, extractPayload), RETRY_DELAY_MS);
    });

    return changeStream;
}

module.exports = { startCollectionChangeStream };
