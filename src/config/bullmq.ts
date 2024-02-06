import config from ".";

export const REDIS_CONNECTOR = {
    host: config.redis.host,
    port: config.redis.port,
	password: config.redis.password,
} as const;

export const DEFAULT_REMOVE_CONFIG = {
	removeOnComplete: {
		age: 3600 * 24 * 4, // 5 days
	},
	removeOnFail: {
		age: 3600 * 24 * 7, // 7 days
	},
} as const;

export const announcementQueueName = 'announcement-queue' as const;
