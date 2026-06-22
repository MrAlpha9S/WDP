const AdminService = require('./AdminService');

/**
 * Emit an admin_notification + refreshed counts to every socket in the 'admin' room.
 * @param {import('socket.io').Server} io
 * @param {string} type   - NotificationEventType value
 * @param {string} title
 * @param {string} message
 * @param {object} [opts] - { actionLabel, actionPayload }
 */
async function broadcastAdminEvent(io, type, title, message, opts = {}) {
    if (!io) return;

    io.to('admin').emit('admin_notification', {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        type,
        title,
        message,
        timestamp: new Date(),
        read: false,
        ...(opts.actionLabel ? { actionLabel: opts.actionLabel, actionPayload: opts.actionPayload ?? {} } : {}),
    });

    try {
        const result = await AdminService.getImportantEvents();
        if (result.code === 200) {
            const d = result.data;
            io.to('admin').emit('admin:events_update', {
                pendingCertifications: (d.pendingCertifications ?? []).length,
                racesReadyToStart:     (d.racesReadyToStart     ?? []).length,
                activeTournaments:     (d.activeTournaments     ?? []).length,
                pendingRegistrations:  (d.pendingRegistrations  ?? []).length,
            });
        }
    } catch (_) { /* non-fatal */ }
}

module.exports = { broadcastAdminEvent };
