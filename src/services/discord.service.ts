import fetch from 'node-fetch';
import config from '../config';
import { ApiError } from '../utils';
import parentLogger from '../config/logger';
import { IDiscordUser } from 'src/interfaces';

const logger = parentLogger.child({ module: 'DiscordService' });

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
    getUserFromDiscordAPI,
    getBotFromDiscordAPI,
}