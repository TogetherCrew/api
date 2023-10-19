import fetch from 'node-fetch';
import config from '../config';
import { ApiError } from '../utils';
import parentLogger from '../config/logger';
import { IDiscordOAuth2EchangeCode, IDiscordUser } from '../interfaces';

const logger = parentLogger.child({ module: 'DiscordService' });

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
 * get user data from discord api by access token
 * @param {String} accessToken
 * @returns {Promise<IDiscordUser>}
 */
async function getUserFromDiscordAPI(accessToken: string): Promise<IDiscordUser> {
    try {
        const response = await fetch('https://discord.com/api/users/@me', {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        if (response.ok) {
            return await response.json();
        }
        else {
            throw new Error(await response.json());
        }
    } catch (error) {
        logger.error({ accessToken, error }, 'Failed to get user from Discord API');
        throw new ApiError(590, 'Can not fetch from discord API');
    }
}

/**
 * get user data from discord api by access token
 * @param {String} accessToken
 * @returns {Promise<IDiscordUser>}
 */
async function getBotFromDiscordAPI(): Promise<IDiscordUser> {
    try {
        const response = await fetch('https://discord.com/api/users/@me', {
            method: 'GET',
            headers: { 'Authorization': `Bot ${config.discord.botToken}` }
        });
        if (response.ok) {
            return await response.json();
        }
        else {
            throw new Error(await response.json());
        }
    } catch (error) {
        logger.error({ bot_token: config.discord.botToken, error }, 'Failed to get bot from Discord API');
        throw new ApiError(590, 'Can not fetch from discord API');
    }
}


export default {
    exchangeCode,
    getUserFromDiscordAPI,
    getBotFromDiscordAPI,
}