import fetch from 'node-fetch';
import httpStatus from 'http-status';
import config from '../config';
import tokenService from './token.service';
import userService from './user.service';
import { tokenTypes } from '../config/tokens';
import { ApiError } from '../utils';
import { Token, IDiscordOathBotCallback } from 'tc-dbcomm';
/**
 * exchange code with access token
 * @param {string} code
 * @returns {Promise<IDiscordOathBotCallback>}
 */
async function exchangeCode(code: string): Promise<IDiscordOathBotCallback> {
    try {
        const data = {
            client_id: config.discord.clientId,
            client_secret: config.discord.clientSecret,
            grant_type: 'authorization_code',
            redirect_uri: config.discord.callbackURI,
            code
        };

        const response = await fetch('https://discord.com/api/oauth2/token', {
            method: 'POST',
            body: new URLSearchParams(data),
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        })
        const json = await response.json();
        // Note: {message: '401: Unauthorized', code:0} means that we have not discord auth tokens
        if (json.message) {
            throw new Error();
        }
        return json;
    } catch (err) {
        console.log(err)
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
        const json = await response.json();
        // Note: {message: '401: Unauthorized', code:0} means that we have not discord auth tokens
        if (json.message) {
            throw new Error();
        }
        return json;
    } catch (err) {
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Can not fetch from discord API');
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
    logout,
    refreshAuth
}