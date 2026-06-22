// ── Notification event types emitted by the backend ───────────────────────────

export type NotificationEventType =
    | 'race_started'       // A race round has gone live
    | 'race_ended'         // A race round has finished
    | 'race_prepared'      // Referee completed pre-race inspection; race ready to start
    | 'race_cancelled'     // Race cancelled — no eligible entries after inspection
    | 'new_registration'   // A new horse/jockey registration submitted
    | 'new_user'           // A new user account created
    | 'new_horse'          // A new horse registered
    | 'new_invitation'     // A horse owner sent a jockey invitation
    | 'objection_filed'    // An objection was filed post-race
    | 'system_alert';      // Generic system message

// ── Single notification payload ───────────────────────────────────────────────

export interface AdminNotification {
    /** Unique ID — used as React key and for targeted dismiss */
    id: string;
    type: NotificationEventType;
    /** Bold headline shown on the card */
    title: string;
    /** Supporting detail / sub-text */
    message: string;
    /** When the event occurred */
    timestamp: Date;
    /** False = unread (drives the badge count) */
    read: boolean;
    /** Label for the action button, e.g. "View Race". Omit to hide the button. */
    actionLabel?: string;
    /** Arbitrary data the action handler can use, e.g. { raceId: '...' } */
    actionPayload?: Record<string, unknown>;
}
