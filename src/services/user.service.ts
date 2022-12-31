import fetch from 'node-fetch';
import { Snowflake } from 'discord.js';
import { IDiscordUser, IUser, User } from 'tc-dbcomm';

/**
 * Create user base on discord profile
 * @param {IDiscordUser} data
 * @returns {Promise<IUser>}
 */
async function createUser(data: IDiscordUser): Promise<IUser> {
    return User.create({
        discordId: data.id,
        ...data
    });
}

/**
 * get user data from discord api by access token
 * @param {String} accessToken
 * @returns {Promise<IDiscordUser>}
 */
async function getUserFromDiscordAPI(accessToken: string): Promise<IDiscordUser> {
    const response = await fetch('https://discord.com/api/users/@me', {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    return response.json();
}

/**
 * Get user by discordId
 * @param {Snowflake} discordId
 * @returns {Promise<IUser | null>}
 */
async function getUserByDiscordId(discordId: Snowflake): Promise<IUser | null> {
    const user = await User.findOne({ discordId });
    return user;
}

/**
 * Get user guilds
 * @param {String} accessToken
 * @returns {Promise<Array<IDiscordGuild>>}
 */
async function getCurrentUserGuilds(accessToken: string) {
    const response = await fetch('https://discord.com/api/users/@me/guilds', {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    return response.json();
}



export default {
    createUser,
    getUserFromDiscordAPI,
    getUserByDiscordId,
    getCurrentUserGuilds
}