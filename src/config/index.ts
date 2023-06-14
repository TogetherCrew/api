import Joi from 'joi';

const envVarsSchema = Joi.object()
    .keys({
        NODE_ENV: Joi.string().valid('production', 'development', 'test').required(),
        PORT: Joi.number().default(3000),
        DB_HOST: Joi.string().required().description('Mongo DB url'),
        DB_PORT: Joi.string().required().description('Mongo DB port'),
        DB_USER: Joi.string().required().description('Mongo DB username'),
        DB_PASSWORD: Joi.string().required().description('Mongo DB password'),
        DB_NAME: Joi.string().required().description('Mongo DB name'),
        RABBIT_HOST: Joi.string().required().description('RabbitMQ url'),
        RABBIT_PORT: Joi.string().required().description('RabbitMQ port'),
        RABBIT_USER: Joi.string().required().description('RabbitMQ username'),
        RABBIT_PASSWORD: Joi.string().required().description('RabbitMQ password'),
        DISCROD_CLIENT_ID: Joi.string().required().description('Discord clinet id'),
        DISCORD_CLIENT_SECRET: Joi.string().required().description('Discord clinet secret'),
        DISCORD_BOT_TOKEN: Joi.string().required().description('Discord bot token'),
        DISCORD_TRY_NOW_CALLBACK_URI: Joi.string().required().description('Discord try now callback uri'),
        DISCORD_LOGIN_CALLBACK_URI: Joi.string().required().description('Discord login callback uri'),
        DISCORD_CONNECT_GUILD_CALLBACK_URI: Joi.string().required().description('Discord connect guild callback uri'),
        JWT_SECRET: Joi.string().required().description('JWT secret key'),
        JWT_ACCESS_EXPIRATION_MINUTES: Joi.number().default(30).description('minutes after which access tokens expire'),
        JWT_REFRESH_EXPIRATION_DAYS: Joi.number().default(30).description('days after which refresh tokens expire'),
        JWT_DISCORD_REFRESH_EXPIRATION_DAYS: Joi.number().default(30).description('days after which discord refresh tokens expire'),
        FRONTEND_URL: Joi.string().required().description('frontend URL'),
        NOTION_API_KEY: Joi.string().required().description('notion api key'),
        NOTION_DATABASE_ID: Joi.string().required().description('notion database id'),
        SENTRY_DSN: Joi.string().required().description('sentry dsn'),
        SENTRY_ENV: Joi.string().valid('production', 'development', 'test').required(),
    })
    .unknown();

const { value: envVars, error } = envVarsSchema.prefs({ errors: { label: 'key' } }).validate(process.env);

if (error) {
    throw new Error(`Config validation error: ${error.message}`);
}

export default {
    env: envVars.NODE_ENV,
    port: envVars.PORT,
    mongoose: {
        // serverURL: `mongodb://${envVars.DB_USER}:${envVars.DB_PASSWORD}@${envVars.DB_HOST}:${envVars.DB_PORT}/${envVars.DB_NAME}`,
        // botURL: `mongodb://${envVars.DB_USER}:${envVars.DB_PASSWORD}@${envVars.DB_HOST}:${envVars.DB_PORT}`,
        // dbURL: `mongodb://${envVars.DB_USER}:${envVars.DB_PASSWORD}@${envVars.DB_HOST}:${envVars.DB_PORT}`,
        serverURL: `mongodb://127.0.0.1:27017/RnDAO-local`,
        botURL: "mongodb://127.0.0.1:27017",
        dbURL: "mongodb://127.0.0.1:27017"

    },
    rabbitMQ: {
        url: `amqp://${envVars.RABBIT_USER}:${envVars.RABBIT_PASSWORD}@${envVars.RABBIT_HOST}:${envVars.RABBIT_PORT}`,
    },
    discord: {
        clientId: envVars.DISCROD_CLIENT_ID,
        clientSecret: envVars.DISCORD_CLIENT_SECRET,
        botToken: envVars.DISCORD_BOT_TOKEN,
        callbackURI: {
            tryNow: envVars.DISCORD_TRY_NOW_CALLBACK_URI,
            login: envVars.DISCORD_LOGIN_CALLBACK_URI,
            connectGuild: envVars.DISCORD_CONNECT_GUILD_CALLBACK_URI
        },
    },
    jwt: {
        secret: envVars.JWT_SECRET,
        accessExpirationMinutes: envVars.JWT_ACCESS_EXPIRATION_MINUTES,
        refreshExpirationDays: envVars.JWT_REFRESH_EXPIRATION_DAYS,
        discordRefreshExpirationDays: envVars.JWT_DISCORD_REFRESH_EXPIRATION_DAYS,

    },
    frontend: {
        url: envVars.FRONTEND_URL
    },
    notion: {
        apiKey: envVars.NOTION_API_KEY,
        databaseId: envVars.NOTION_DATABASE_ID
    },
    sentry: {
        dsn: envVars.SENTRY_DSN,
        env: envVars.SENTRY_ENV
    },
}