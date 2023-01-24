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
        DISCROD_CLIENT_ID: Joi.string().required().description('Discord clinet id'),
        DISCORD_CLIENT_SECRET: Joi.string().required().description('Discord clinet secret'),
        DISCORD_CALLBACK_URI: Joi.string().required().description('Discord callback uri'),
        DISCORD_BOT_TOKEN: Joi.string().required().description('Discord bot token'),
        JWT_SECRET: Joi.string().required().description('JWT secret key'),
        JWT_ACCESS_EXPIRATION_MINUTES: Joi.number().default(30).description('minutes after which access tokens expire'),
        JWT_REFRESH_EXPIRATION_DAYS: Joi.number().default(30).description('days after which refresh tokens expire'),
        JWT_DISCORD_REFRESH_EXPIRATION_DAYS: Joi.number().default(30).description('days after which discord refresh tokens expire'),

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
        serverURL: "mongodb://127.0.0.1:27017/dev",
        botURL: "mongodb://127.0.0.1:27017"
    },
    discord: {
        clientId: envVars.DISCROD_CLIENT_ID,
        clientSecret: envVars.DISCORD_CLIENT_SECRET,
        callbackURI: envVars.DISCORD_CALLBACK_URI,
        botToken: envVars.DISCORD_BOT_TOKEN
    },
    jwt: {
        secret: envVars.JWT_SECRET,
        accessExpirationMinutes: envVars.JWT_ACCESS_EXPIRATION_MINUTES,
        refreshExpirationDays: envVars.JWT_REFRESH_EXPIRATION_DAYS,
        discordRefreshExpirationDays: envVars.JWT_DISCORD_REFRESH_EXPIRATION_DAYS,

    },
}