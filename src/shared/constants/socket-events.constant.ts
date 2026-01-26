// src/shared/constants/socket-events.constant.ts
export const SOCKET_EVENTS = {
    SYSTEM: {
        USER_STATUS_CHANGED: 'system:user-status-changed',
        ONLINE_STATS_UPDATED: 'system:online-stats-updated',
    },

    NOTIFICATION: {
        NEW: 'notification:new',
        READ: 'notification:read',
        DELETED: 'notification:deleted',
        STATS_UPDATED: 'notification:stats-updated',
    },
} as const
