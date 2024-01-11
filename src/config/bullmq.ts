import config from ".";

export const REDIS_CONNECTOR = {
    host: config.redis.host,
    port: config.redis.port,
	password: config.redis.password,
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
