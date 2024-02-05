import config from ".";

export const REDIS_CONNECTOR = {
    host: config.redis.host,
    port: config.redis.port,
	password: config.redis.password,
} as const;

export const DEFAULT_REMOVE_CONFIG = {
	removeOnComplete: false,
	removeOnFail: false,
} as const;

export const announcementQueueName = 'announcement-queue' as const;
