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

    COMPETITION: {
        ATTEMPT_START: 'competition:attempt:start',
        ATTEMPT_STARTED: 'competition:attempt:started',
        EXAM_GET: 'competition:exam:get',
        EXAM_LOADED: 'competition:exam:loaded',
        ATTEMPT_SUBSCRIBE: 'competition:attempt:subscribe',
        ATTEMPT_SUBSCRIBED: 'competition:attempt:subscribed',
        ANSWER_SAVE: 'competition:attempt:answer:save',
        ANSWER_SAVED: 'competition:attempt:answer:saved',
        TIME_GET: 'competition:attempt:time:get',
        TIME_SYNC: 'competition:attempt:time:sync',
        ATTEMPT_FINISH: 'competition:attempt:finish',
        ATTEMPT_FINISHED: 'competition:attempt:finished',
    },

    TUITION_PAYMENT: {
        INTENT_SUBSCRIBE: 'tuition-payment:intent:subscribe',
        INTENT_SUBSCRIBED: 'tuition-payment:intent:subscribed',
        INTENT_UNSUBSCRIBE: 'tuition-payment:intent:unsubscribe',
        INTENT_UNSUBSCRIBED: 'tuition-payment:intent:unsubscribed',
        INTENT_STATUS: 'tuition-payment:intent:status',
        INTENT_PAID: 'tuition-payment:intent:paid',
    },
} as const
