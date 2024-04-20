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
    DISCORD_CLIENT_ID: Joi.string().required().description('Discord clinet id'),
    DISCORD_CLIENT_SECRET: Joi.string().required().description('Discord clinet secret'),
    DISCORD_BOT_TOKEN: Joi.string().required().description('Discord bot token'),
    DISCORD_AUTHORIZE_CALLBACK_URI: Joi.string().required().description('Discord authorize callback uri'),
    DISCORD_CONNECT_CALLBACK_URI: Joi.string().required().description('Discord connect callback uri'),
    DISCORD_REQUEST_ACCESS_CALLBACK_URI: Joi.string().required().description('Discord request access callback uri'),
    TWITTER_CONNECT_CALLBACK_URI: Joi.string().required().description('Twitter connect callback uri'),
    TWITTER_CLIENT_ID: Joi.string().required().description('Twitter clinet id'),
    TWITTER_CLIENT_SECRET: Joi.string().required().description('Twitter clinet secret'),
    GOOGLE_CONNECT_CALLBACK_URI: Joi.string().required().description('Google connect callback uri'),
    GOOGLE_CLIENT_SECRET: Joi.string().required().description('Google clinet id'),
    GOOGLE_CLIENT_ID: Joi.string().required().description('Google clinet secret'),
    JWT_SECRET: Joi.string().required().description('JWT secret key'),
    JWT_ACCESS_EXPIRATION_MINUTES: Joi.number().default(30).description('minutes after which access tokens expire'),
    JWT_REFRESH_EXPIRATION_DAYS: Joi.number().default(30).description('days after which refresh tokens expire'),
    JWT_DISCORD_REFRESH_EXPIRATION_DAYS: Joi.number()
      .default(30)
      .description('days after which discord refresh tokens expire'),
    FRONTEND_URL: Joi.string().required().description('frontend URL'),
    NOTION_API_KEY: Joi.string().required().description('notion api key'),
    NOTION_DATABASE_ID: Joi.string().required().description('notion database id'),
    SENTRY_DSN: Joi.string().required().description('sentry dsn'),
    SENTRY_ENV: Joi.string().valid('production', 'development', 'test').required(),
    NEO4J_PROTOCOL: Joi.string().valid('http', 'https', 'bolt').description('NEO4j port'),
    NEO4J_HOST: Joi.string().required().description('NEO4J url'),
    NEO4J_PORT: Joi.string().required().description('NEO4J port'),
    NEO4J_USER: Joi.string().required().description('NEO4J username'),
    NEO4J_PASSWORD: Joi.string().required().description('NEO4J password'),
    NEO4J_DB: Joi.string().required().description('NEO4J DB name'),
    LOG_LEVEL: Joi.string().required().description('Min allowed log level'),
    SESSION_SECRET: Joi.string().required().description('Session secret'),
    REDIS_HOST: Joi.string().required().description('Redis host'),
    REDIS_PORT: Joi.string().required().description('Redis port'),
    REDIS_PASSWORD: Joi.string().required().description('Reids password').allow(''),
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
    serverURL: `mongodb://${envVars.DB_USER}:${envVars.DB_PASSWORD}@${envVars.DB_HOST}:${envVars.DB_PORT}/${envVars.DB_NAME}?authSource=admin`,
    botURL: `mongodb://${envVars.DB_USER}:${envVars.DB_PASSWORD}@${envVars.DB_HOST}:${envVars.DB_PORT}?authSource=admin`,
    dbURL: `mongodb://${envVars.DB_USER}:${envVars.DB_PASSWORD}@${envVars.DB_HOST}:${envVars.DB_PORT}?authSource=admin`,
  },
  redis: {
    host: envVars.REDIS_HOST,
    port: envVars.REDIS_PORT,
    password: envVars.REDIS_PASSWORD,
  },
  rabbitMQ: {
    url: `amqp://${envVars.RABBIT_USER}:${envVars.RABBIT_PASSWORD}@${envVars.RABBIT_HOST}:${envVars.RABBIT_PORT}`,
  },
  neo4j: {
    url: `${envVars.NEO4J_PROTOCOL}://${envVars.NEO4J_HOST}:${envVars.NEO4J_PORT}`,
    user: envVars.NEO4J_USER,
    password: envVars.NEO4J_PASSWORD,
    database: envVars.NEO4J_DB,
  },
  oAuth2: {
    discord: {
      clientId: envVars.DISCORD_CLIENT_ID,
      clientSecret: envVars.DISCORD_CLIENT_SECRET,
      botToken: envVars.DISCORD_BOT_TOKEN,
      callbackURI: {
        authorize: envVars.DISCORD_AUTHORIZE_CALLBACK_URI,
        connect: envVars.DISCORD_CONNECT_CALLBACK_URI,
        requestAccess: envVars.DISCORD_REQUEST_ACCESS_CALLBACK_URI,
      },
    },
    twitter: {
      clientId: envVars.TWITTER_CLIENT_ID,
      clientSecret: envVars.TWITTER_CLIENT_SECRET,
      callbackURI: {
        connect: envVars.TWITTER_CONNECT_CALLBACK_URI,
      },
    },
    google: {
      clientId: envVars.GOOGLE_CLIENT_ID,
      clientSecret: envVars.GOOGLE_CLIENT_SECRET,
      callbackURI: {
        connect: envVars.GOOGLE_CONNECT_CALLBACK_URI,
      },
    }
  },
  jwt: {
    secret: envVars.JWT_SECRET,
    accessExpirationMinutes: envVars.JWT_ACCESS_EXPIRATION_MINUTES,
    refreshExpirationDays: envVars.JWT_REFRESH_EXPIRATION_DAYS,
    discordRefreshExpirationDays: envVars.JWT_DISCORD_REFRESH_EXPIRATION_DAYS,
  },
  frontend: {
    url: envVars.FRONTEND_URL,
  },
  notion: {
    apiKey: envVars.NOTION_API_KEY,
    databaseId: envVars.NOTION_DATABASE_ID,
  },
  sentry: {
    dsn: envVars.SENTRY_DSN,
    env: envVars.SENTRY_ENV,
  },
  logger: {
    level: envVars.LOG_LEVEL,
  },
  session: {
    secret: envVars.SESSION_SECRET,
  },
};
