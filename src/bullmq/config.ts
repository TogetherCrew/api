
export const REDIS_CONNECTOR = {
    host: 'localhost',
    port: 6379,
} as const;

export const DEFAULT_REMOVE_CONFIG = {
	removeOnComplete: {
		age: 3600,
	},
	removeOnFail: {
		age: 24 * 3600,
	},
} as const;

export const announcementQueueName = 'announcement-queue' as const;
