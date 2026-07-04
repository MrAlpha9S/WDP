const cron = require('node-cron');
const Tournament = require('../entities/Tournament');
const { broadcastAdminEvent } = require('./AdminEventBroadcaster');

/**
 * Starts a daily cron job (00:01 server time) that auto-transitions
 * tournaments from 'scheduled' ? 'ongoing' when their startDate is today.
 *
 * @param {import('socket.io').Server} io
 */
function startTournamentScheduler(io) {
    // Runs at 00:01 every day (server local time).
    // If the server runs in UTC and your tournaments use UTC+7 dates,
    // change the expression to '1 17 * * *' to fire at 00:01 UTC+7.
    cron.schedule('1 0 * * *', async () => {
        console.log('[TournamentScheduler] Running daily start-date check...');

        try {
            const now = new Date();
            // Build a [start-of-day, end-of-day] window in UTC
            const todayStart = new Date(now);
            todayStart.setUTCHours(0, 0, 0, 0);
            const todayEnd = new Date(now);
            todayEnd.setUTCHours(23, 59, 59, 999);

            // Find all 'scheduled' tournaments whose startDate falls today
            const tournaments = await Tournament.find({
                status: 'scheduled',
                startDate: { $gte: todayStart, $lte: todayEnd },
            }).lean();

            if (tournaments.length === 0) {
                console.log('[TournamentScheduler] No tournaments to activate today.');
                return;
            }

            for (const t of tournaments) {
                await Tournament.findByIdAndUpdate(t._id, { status: 'ongoing' });
                console.log('[TournamentScheduler] Tournament "' + t.tournamentName + '" (' + t._id + ') -> ongoing');

                // Broadcast to ALL connected clients so every dashboard updates
                if (io) {
                    io.emit('tournament:status_changed', {
                        tournamentId: String(t._id),
                        status: 'ongoing',
                    });

                    // Admin-specific notification via existing helper
                    await broadcastAdminEvent(
                        io,
                        'system_alert',
                        'Tournament Started',
                        '"' + t.tournamentName + '" has automatically moved to Ongoing.'
                    );
                }
            }

            console.log('[TournamentScheduler] Activated ' + tournaments.length + ' tournament(s).');
        } catch (err) {
            console.error('[TournamentScheduler] Error during scheduled check:', err);
        }
    });

    console.log('[TournamentScheduler] Daily tournament activation scheduler started.');
}

module.exports = { startTournamentScheduler };
