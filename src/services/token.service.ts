import jwt from 'jsonwebtoken';
import moment from 'moment';
import { Snowflake } from 'discord.js';
import httpStatus from 'http-status';
import config from '../config';
import { tokenTypes } from '../config/tokens';
import { ApiError } from '../utils';
import authService from './auth.service';
import { IDiscordOathBotCallback, IToken, Token } from '@togethercrew.dev/db';
import { IAuthTokens } from '../interfaces/token.interface';
import { ITwitterAuthTokens } from '../interfaces/token.interface';
/**
 * Generate token
 * @param {Snowflake} discordId
 * @param {Moment} expires
 * @param {string} type
 * @param {string} [secret]
 * @returns {string}
 */
function generateToken(discordId: Snowflake, expires: moment.Moment, type: string, secret = config.jwt.secret) {
  const payload = {
    sub: discordId,
    iat: moment().unix(),
    exp: expires.unix(),
    type,
  };
  return jwt.sign(payload, secret);
}

/**
 * Save a token
 * @param {string} token
 * @param {Snowflake} discordId
 * @param {Moment} expires
 * @param {string} type
 * @param {boolean} [blacklisted]
 * @returns {Promise<IToken>}
 */
async function saveToken(
  token: string,
  discordId: Snowflake,
  expires: moment.Moment,
  type: string,
  blacklisted = false,
): Promise<IToken> {
  const tokenDoc: IToken = await Token.create({
    token,
    user: discordId,
    expires: expires.toDate(),
    type,
    blacklisted,
  });
  return tokenDoc;
}

/**
 * Verify token and return token doc (or throw an error if it is not valid)
 * @param {string} token
 * @param {string} type
 * @returns {Promise<IToken>}
 */
async function verifyToken(token: string, type: string) {
  const payload = jwt.verify(token, config.jwt.secret);
  const tokenDoc = await Token.findOne({ token, type, user: payload.sub, blacklisted: false });
  if (!tokenDoc) {
    throw new Error('Token not found');
  }
  return tokenDoc;
}

/**
 * Generate auth tokens
 * @param {Snowflake} discordId
 * @returns {Promise<IAuthTokens>}
 */
async function generateAuthTokens(discordId: Snowflake): Promise<IAuthTokens> {
  const accessTokenExpires = moment().add(config.jwt.accessExpirationMinutes, 'minutes');
  const accessToken = generateToken(discordId, accessTokenExpires, tokenTypes.ACCESS);

  const refreshTokenExpires = moment().add(config.jwt.refreshExpirationDays, 'days');
  const refreshToken = generateToken(discordId, refreshTokenExpires, tokenTypes.REFRESH);
  await saveToken(refreshToken, discordId, refreshTokenExpires, tokenTypes.REFRESH);

  return {
    access: {
      token: accessToken,
      expires: accessTokenExpires.toDate(),
    },
    refresh: {
      token: refreshToken,
      expires: refreshTokenExpires.toDate(),
    },
  };
}

/**
 * save discord auths (delete old ones)
 * @param {Snowflake} discordId
 * @param {IDiscordOathBotCallback} discordAuth
 * @returns {Promise<Object>}
 */
async function saveDiscordAuth(discordId: Snowflake, discordAuths: IDiscordOathBotCallback) {
  await Token.deleteMany({ user: discordId, type: { $in: [tokenTypes.DISCORD_ACCESS, tokenTypes.DISCORD_REFRESH] } });
  const accessTokenExpires = moment().add(discordAuths.expires_in, 'seconds');
  const refreshTokenExpires = moment().add(config.jwt.discordRefreshExpirationDays, 'days');
  const DiscordAccessTokenDoc: IToken = await saveToken(
    discordAuths.access_token,
    discordId,
    accessTokenExpires,
    tokenTypes.DISCORD_ACCESS,
  );
  const DiscordRefreshTokenDoc: IToken = await saveToken(
    discordAuths.refresh_token,
    discordId,
    refreshTokenExpires,
    tokenTypes.DISCORD_REFRESH,
  );

  return {
    access: {
      token: DiscordAccessTokenDoc.token,
      expires: DiscordAccessTokenDoc.expires,
    },
    refresh: {
      token: DiscordRefreshTokenDoc.token,
      expires: DiscordRefreshTokenDoc.expires,
    },
  };
}

/**
 * get discord Auths by user discordId
 * will request new discord auths if access token is expired
 * @param {Snowflake} discordId
 * @param {IDiscordOathBotCallback} discordAuth
 * @returns {Promise<Object>}
 */
async function getDiscordAuth(discordId: Snowflake) {
  const DiscordAccessTokenDoc = await Token.findOne({ user: discordId, type: tokenTypes.DISCORD_ACCESS });
  const DiscordRefreshTokenDoc = await Token.findOne({ user: discordId, type: tokenTypes.DISCORD_REFRESH });

  if (!DiscordAccessTokenDoc || !DiscordRefreshTokenDoc) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'discord auth tokens missed');
  }
  if (new Date() > DiscordAccessTokenDoc.expires) {
    const discordAuths: IDiscordOathBotCallback = await authService.refreshDiscordAuth(DiscordRefreshTokenDoc.token);
    return saveDiscordAuth(discordId, discordAuths);
  }

  return {
    access: {
      token: DiscordAccessTokenDoc.token,
      expires: DiscordAccessTokenDoc.expires,
    },
    refresh: {
      token: DiscordRefreshTokenDoc.token,
      expires: DiscordRefreshTokenDoc.expires,
    },
  };
}

/**
 * save twitter auths (delete old ones)
 * @param {Snowflake} discordId
 * @param {IDiscordOathBotCallback} discordAuth
 * @returns {Promise<Object>}
 */
async function saveTwitterAuth(discordId: Snowflake, twitterAuths: ITwitterAuthTokens) {
  await Token.deleteMany({ user: discordId, type: { $in: [tokenTypes.TWITTER_ACCESS, tokenTypes.TWITTER_REFRESH] } });
  const accessTokenExpires = moment().add(twitterAuths.expires_in, 'seconds');
  const refreshTokenExpires = moment().add(config.jwt.discordRefreshExpirationDays, 'days');
  const twitterAccessTokenDoc: IToken = await saveToken(
    twitterAuths.access_token,
    discordId,
    accessTokenExpires,
    tokenTypes.TWITTER_ACCESS,
  );
  const twitterRefreshTokenDoc: IToken = await saveToken(
    twitterAuths.refresh_token,
    discordId,
    refreshTokenExpires,
    tokenTypes.TWITTER_REFRESH,
  );

  return {
    access: {
      token: twitterAccessTokenDoc.token,
      expires: twitterAccessTokenDoc.expires,
    },
    refresh: {
      token: twitterRefreshTokenDoc.token,
      expires: twitterRefreshTokenDoc.expires,
    },
  };
}

/**
 * get discord Auths by user discordId
 * will request new discord auths if access token is expired
 * @param {Snowflake} discordId
 * @param {IDiscordOathBotCallback} discordAuth
 * @returns {Promise<Object>}
 */
async function getTwitterAuth(discordId: Snowflake) {
  const twitterAccessTokenDoc = await Token.findOne({ user: discordId, type: tokenTypes.TWITTER_ACCESS });
  const twitterRefreshTokenDoc = await Token.findOne({ user: discordId, type: tokenTypes.TWITTER_REFRESH });

  if (!twitterAccessTokenDoc || !twitterRefreshTokenDoc) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'twitter auth tokens missed');
  }
  if (new Date() > twitterAccessTokenDoc.expires) {
    const twitterAuths: ITwitterAuthTokens = await authService.refreshTwitterAuth(twitterRefreshTokenDoc.token);
    return saveTwitterAuth(discordId, twitterAuths);
  }

  return {
    access: {
      token: twitterAccessTokenDoc.token,
      expires: twitterAccessTokenDoc.expires,
    },
    refresh: {
      token: twitterRefreshTokenDoc.token,
      expires: twitterRefreshTokenDoc.expires,
    },
  };
}

export default {
  generateToken,
  verifyToken,
  generateAuthTokens,
  saveToken,
  saveDiscordAuth,
  getDiscordAuth,
  saveTwitterAuth,
  getTwitterAuth,
};
