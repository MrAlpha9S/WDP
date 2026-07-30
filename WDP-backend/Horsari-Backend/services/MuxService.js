// @mux/mux-node v8+ exports a default class; handle both CJS and ESM interop
const MuxModule = require('@mux/mux-node');
const Mux = MuxModule.default ?? MuxModule;

// Lazy singleton — instantiated on first use so missing env vars fail loudly at runtime
let _client = null;
function client() {
    if (!_client) {
        const tokenId     = process.env.MUX_TOKEN_ID;
        const tokenSecret = process.env.MUX_TOKEN_SECRET;
        if (!tokenId || !tokenSecret) {
            throw new Error('MUX_TOKEN_ID and MUX_TOKEN_SECRET must be set in .env');
        }
        _client = new Mux({ tokenId, tokenSecret });
    }
    return _client;
}

// In-memory cache: raceRoundId (string) → StreamInfo
// { liveStreamId, streamKey, livePlaybackId, vodPlaybackId }
const cache = new Map();

// TEMP: Mux Live Streams require a paid plan. Until upgraded, "creating a
// stream" just points the race round at this fixed pre-uploaded playback
// instead of provisioning a real live stream. Every race will show the same
// video. Revert to the commented-out block below once Live Streams are available.
const FIXED_PLAYBACK_ID = 'QPyH01vERrIoRJtH3z3n883GQqQ5t01x2fef9CpkfBllw';

// ── Create a Mux live stream and persist the IDs to the race round ─────────────
async function createLiveStream(raceRoundId) {
    // const mux = client();
    //
    // const liveStream = await mux.video.liveStreams.create({
    //     playback_policy: ['public'],
    //     new_asset_settings: {
    //         playback_policy: ['public'],
    //         mp4_support: 'capped-1080p',
    //     },
    //     reconnect_window: 60,
    // });
    //
    // const liveStreamId   = liveStream.id;
    // const streamKey      = liveStream.stream_key;
    // const livePlaybackId = liveStream.playback_ids?.[0]?.id ?? null;

    const liveStreamId   = FIXED_PLAYBACK_ID;
    const streamKey      = null;
    const livePlaybackId = FIXED_PLAYBACK_ID;

    const info = { liveStreamId, streamKey, livePlaybackId, vodPlaybackId: null };
    cache.set(raceRoundId, info);

    // Persist to the DB so the IDs survive a server restart
    const RaceRound = require('../entities/RaceRound');
    await RaceRound.findByIdAndUpdate(raceRoundId, {
        muxLiveStreamId: liveStreamId,
        muxStreamKey:    streamKey,
        muxPlaybackId:   livePlaybackId,
    });

    console.log(`[Mux] Live stream created for race ${raceRoundId} — playbackId: ${livePlaybackId}`);
    return info;
}

// ── Return live stream info for OBS setup (RTMP URL + stream key) ─────────────
async function getStreamInfo(raceRoundId) {
    // Try cache first
    let info = cache.get(raceRoundId);

    if (!info) {
        // Reconstruct from DB (e.g. after server restart)
        const RaceRound = require('../entities/RaceRound');
        const rr = await RaceRound.findById(raceRoundId).lean();
        if (!rr?.muxLiveStreamId) return null;
        info = {
            liveStreamId:   rr.muxLiveStreamId,
            streamKey:      rr.muxStreamKey,
            livePlaybackId: rr.muxPlaybackId,
            vodPlaybackId:  null,
        };
        cache.set(raceRoundId, info);
    }

    return {
        rtmpUrl:       'rtmps://global-live.mux.com:443/app',
        streamKey:     info.streamKey,
        livePlaybackId: info.livePlaybackId,
        playerUrl:     info.livePlaybackId
            ? `https://stream.mux.com/${info.livePlaybackId}.m3u8`
            : null,
    };
}

// ── Retrieve the VOD recording created by Mux after the stream ends ───────────
async function getVOD(raceRoundId) {
    const cached = cache.get(raceRoundId);

    // Return cached VOD if already resolved
    if (cached?.vodPlaybackId) {
        return { vodPlaybackId: cached.vodPlaybackId };
    }

    // Resolve liveStreamId from cache or DB
    let liveStreamId = cached?.liveStreamId;
    if (!liveStreamId) {
        const RaceRound = require('../entities/RaceRound');
        const rr = await RaceRound.findById(raceRoundId).lean();
        liveStreamId = rr?.muxLiveStreamId;
    }
    if (!liveStreamId) return null;

    // TEMP: while Live Streams are faked (see createLiveStream), liveStreamId
    // is actually the pre-uploaded FIXED_PLAYBACK_ID, not a real Mux Live
    // Stream ID — calling liveStreams.retrieve() with it 400s. Just reuse it
    // as the VOD playback ID directly. Revert once real Live Streams are back.
    if (liveStreamId === FIXED_PLAYBACK_ID) {
        const vodPlaybackId = FIXED_PLAYBACK_ID;
        if (cached) cached.vodPlaybackId = vodPlaybackId;
        const RaceRound = require('../entities/RaceRound');
        await RaceRound.findByIdAndUpdate(raceRoundId, { muxVodPlaybackId: vodPlaybackId });
        return { vodPlaybackId };
    }

    const mux        = client();
    const liveStream = await mux.video.liveStreams.retrieve(liveStreamId);
    const assetId    = liveStream.recent_asset_ids?.[0];
    if (!assetId) return null;

    const asset          = await mux.video.assets.retrieve(assetId);
    const vodPlaybackId  = asset.playback_ids?.[0]?.id ?? null;
    if (!vodPlaybackId) return null;

    // Update cache and DB
    if (cached) cached.vodPlaybackId = vodPlaybackId;
    const RaceRound = require('../entities/RaceRound');
    await RaceRound.findByIdAndUpdate(raceRoundId, { muxVodPlaybackId: vodPlaybackId });

    console.log(`[Mux] VOD resolved for race ${raceRoundId} — vodPlaybackId: ${vodPlaybackId}`);
    return { vodPlaybackId };
}

module.exports = { createLiveStream, getStreamInfo, getVOD };
