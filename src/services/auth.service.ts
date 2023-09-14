import fetch from 'node-fetch';
import httpStatus from 'http-status';
import config from '../config';
import tokenService from './token.service';
import userService from './user.service';
import { tokenTypes } from '../config/tokens';
import { ApiError } from '../utils';
import { Token, IDiscordOathBotCallback } from '@togethercrew.dev/db';
import { twitterAuthTokens } from '../interfaces/token.interface';
import parentLogger from '../config/logger';

const logger = parentLogger.child({ module: 'AuthService' });

/**
 * exchange discord code with access token
 * @param {string} code
   @param {string} redirect_uri
 * @returns {Promise<IDiscordOathBotCallback>}
 */
async function exchangeCode(code: string, redirect_uri: string): Promise<IDiscordOathBotCallback> {
    try {
        const data = {
            client_id: config.discord.clientId,
            client_secret: config.discord.clientSecret,
            grant_type: 'authorization_code',
            redirect_uri,
            code
        };

        const response = await fetch('https://discord.com/api/oauth2/token', {
            method: 'POST',
            body: new URLSearchParams(data),
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        })
        if (response.ok) {
            return await response.json();
        }
        else {
            throw new Error();
        }
    } catch (error) {
        logger.error({ code, redirect_uri, error }, 'Failed to exchange discord code');
        throw new ApiError(590, 'Can not fetch from discord API');
    }
}

/**
 * refresh token
 * @param {string} refreshToken
 * @returns {Promise<IDiscordOathBotCallback>}
 */
async function refreshDiscordAuth(refreshToken: string): Promise<IDiscordOathBotCallback> {
    try {
        const data = {
            client_id: config.discord.clientId,
            client_secret: config.discord.clientSecret,
            grant_type: 'refresh_token',
            refresh_token: refreshToken
        };

        const response = await fetch('https://discord.com/api/oauth2/token', {
            method: 'POST',
            body: new URLSearchParams(data),
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        })
        if (response.ok) {
            return await response.json();
        }
        else {
            throw new Error();
        }
    } catch (error) {
        logger.error({ refreshToken, error }, 'Failed to refresh discord auth');
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Can not fetch from discord API');
    }
}


/**
 * exchange twitter code with access token
 * @param {string} code
   @param {string} redirect_uri
 * @returns {Promise<twitterAuthTokens>}
 */
async function exchangeTwitterCode(code: string, redirect_uri: string, code_verifier: string): Promise<twitterAuthTokens> {
    try {
        const credentials = `${config.twitter.clientId}:${config.twitter.clientSecret}`;
        const encodedCredentials = Buffer.from(credentials).toString('base64');

        const data = {
            code_verifier,
            grant_type: 'authorization_code',
            redirect_uri,
            code
        };
        const response = await fetch('https://api.twitter.com/2/oauth2/token', {
            method: 'POST',
            body: new URLSearchParams(data),
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `Basic ${encodedCredentials}`
            }
        })
        if (response.ok) {
            return await response.json();
        }
        else {
            throw new Error();
        }
    } catch (error) {
        logger.error({ error }, 'Failed to exchange twitter code');
        throw new ApiError(590, 'Can not fetch from discord API');
    }
}

/**
 * refresh twitter token
 * @param {string} refreshToken
 * @returns {Promise<twitterAuthTokens>}
 */
async function refreshTwitterAuth(refreshToken: string): Promise<twitterAuthTokens> {
    try {
        const data = {
            client_id: config.twitter.clientId,
            client_secret: config.twitter.clientSecret,
            grant_type: 'refresh_token',
            refresh_token: refreshToken
        };

        const response = await fetch('https://api.twitter.com/2/oauth2/token', {
            method: 'POST',
            body: new URLSearchParams(data),
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        })
        if (response.ok) {
            return await response.json();
        }
        else {
            throw new Error();
        }
    } catch (error) {
        logger.error({ refreshToken, error }, 'Failed to refresh twitter auth');
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Can not fetch from twitter API');
    }
}

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
        const user = await userService.getUserByDiscordId(refreshTokenDoc.user);
        if (!user) {
            throw new Error();
        }
        await refreshTokenDoc.remove();
        return tokenService.generateAuthTokens(user.discordId);
    } catch (error) {
        throw new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate');
    }
}


export default {
    exchangeCode,
    refreshDiscordAuth,
    exchangeTwitterCode,
    refreshTwitterAuth,
    logout,
    refreshAuth
}