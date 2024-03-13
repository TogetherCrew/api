import fetch from 'node-fetch';
import { Types } from 'mongoose';
import httpStatus from 'http-status';
import config from '../config';
import tokenService from './token.service';
import userService from './user.service';
import { tokenTypes } from '../config/tokens';
import { ApiError } from '../utils';
import { Token } from '@togethercrew.dev/db';
import { IDiscordOAuth2EchangeCode } from '../interfaces';
import parentLogger from '../config/logger';

const logger = parentLogger.child({ module: 'AuthService' });

/**
 * exchange discord code with access token
 * @param {string} code
   @param {string} redirect_uri
 * @returns {Promise<IDiscordOAuth2EchangeCode>}
 */
async function exchangeCode(code: string, redirect_uri: string): Promise<IDiscordOAuth2EchangeCode> {
  try {
    const data = {
      client_id: config.discord.clientId,
      client_secret: config.discord.clientSecret,
      grant_type: 'authorization_code',
      redirect_uri,
      code,
    };

    const response = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      body: new URLSearchParams(data),
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    if (response.ok) {
      return await response.json();
    } else {
      throw new Error(await response.json());
    }
  } catch (error) {
    logger.error({ code, redirect_uri, error }, 'Failed to exchange discord code');
    throw new ApiError(590, 'Can not fetch from discord API');
  }
}

/**
 * refresh token
 * @param {string} refreshToken
 * @returns {Promise<IDiscordOAuth2EchangeCode>}
 */
async function refreshDiscordAuth(refreshToken: string): Promise<IDiscordOAuth2EchangeCode> {
  try {
    const data = {
      client_id: config.discord.clientId,
      client_secret: config.discord.clientSecret,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    };

    const response = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      body: new URLSearchParams(data),
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    if (response.ok) {
      return await response.json();
    } else {
      throw new Error();
    }
  } catch (error) {
    logger.error({ refreshToken, error }, 'Failed to refresh discord auth');
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Can not fetch from discord API');
  }
}

// /**
//  * exchange twitter code with access token
//  * @param {string} code
//    @param {string} redirect_uri
//  * @returns {Promise<ITwitterAuthTokens>}
//  */
// async function exchangeTwitterCode(code: string, redirect_uri: string, code_verifier: string): Promise<ITwitterAuthTokens> {
//     try {
//         const credentials = `${config.twitter.clientId}:${config.twitter.clientSecret}`;
//         const encodedCredentials = Buffer.from(credentials).toString('base64');

//         const data = {
//             code_verifier,
//             grant_type: 'authorization_code',
//             redirect_uri,
//             code
//         };
//         const response = await fetch('https://api.twitter.com/2/oauth2/token', {
//             method: 'POST',
//             body: new URLSearchParams(data),
//             headers: {
//                 'Content-Type': 'application/x-www-form-urlencoded',
//                 'Authorization': `Basic ${encodedCredentials}`
//             }
//         })
//         if (response.ok) {
//             return await response.json();
//         }
//         else {
//             throw new Error();
//         }
//     } catch (error) {
//         logger.error({ error }, 'Failed to exchange twitter code');
//         throw new ApiError(590, 'Can not fetch from discord API');
//     }
// }

// /**
//  * refresh twitter token
//  * @param {string} refreshToken
//  * @returns {Promise<ITwitterAuthTokens>}
//  */
// async function refreshTwitterAuth(refreshToken: string): Promise<ITwitterAuthTokens> {
//     try {
//         const data = {
//             client_id: config.twitter.clientId,
//             client_secret: config.twitter.clientSecret,
//             grant_type: 'refresh_token',
//             refresh_token: refreshToken
//         };

//         const response = await fetch('https://api.twitter.com/2/oauth2/token', {
//             method: 'POST',
//             body: new URLSearchParams(data),
//             headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
//         })
//         if (response.ok) {
//             return await response.json();
//         }
//         else {
//             throw new Error();
//         }
//     } catch (error) {
//         logger.error({ refreshToken, error }, 'Failed to refresh twitter auth');
//         throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Can not fetch from twitter API');
//     }
// }

/**
 * Logout
 * @param {string} refreshToken
 * @returns {Promise}
 */

async function logout(refreshToken: string) {
  const refreshTokenDoc = await Token.findOne({ token: refreshToken, type: tokenTypes.REFRESH, blacklisted: false });
  if (!refreshTokenDoc) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Refresh token did not find');
  }
  await refreshTokenDoc.remove();
}

/**
 * Refresh auth tokens
 * @param {string} refreshToken
 * @returns {Promise<Object>}
 */
async function refreshAuth(refreshToken: string) {
  try {
    const refreshTokenDoc = await tokenService.verifyToken(refreshToken, tokenTypes.REFRESH);
    const user = await userService.getUserById(new Types.ObjectId(refreshTokenDoc.user));
    if (!user) {
      throw new Error();
    }
    await refreshTokenDoc.remove();
    return tokenService.generateAuthTokens(user);
  } catch (error) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate');
  }
}

export default {
  exchangeCode,
  refreshDiscordAuth,
  logout,
  refreshAuth,
};
