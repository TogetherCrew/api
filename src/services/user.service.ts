import fetch from 'node-fetch';
import { Snowflake } from 'discord.js';
import { IDiscordUser, IUser, User } from 'tc-dbcomm';
import { ApiError } from '../utils';
import httpStatus = require('http-status');
import { IUserUpdateBody } from '../interfaces/user.interface';

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
    try {
        const response = await fetch('https://discord.com/api/users/@me', {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        const json = await response.json();
        // Note: {message: '401: Unauthorized', code:0} means that we have not access to user
        if (json.message) {
            throw new Error();
        }
        return json;
    } catch (err) {
        throw new ApiError(590, 'Can not fetch from discord API');
    }
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
    try {
        const response = await fetch('https://discord.com/api/users/@me/guilds', {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        const json = await response.json();
        // Note: {message: '401: Unauthorized', code:0} means that we have not access to guild
        if (json.message) {
            throw new Error();
        }
        return json;
    } catch (err) {
        throw new ApiError(590, 'Can not fetch from discord API');
    }
}


/**
 * update user by discordId
 * @param {Snowflake} discordId
 * @param {IGuildUpdateBody} updateBody
 * @returns {Promise<IGuild>}
 */
async function updateUserByDiscordId(discordId: Snowflake, updateBody: IUserUpdateBody) {
    const user = await User.findOne({ discordId });
    if (!user) {
        throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
    }
    if (updateBody.email && (await User.findOne({ email: updateBody.email, discordId: { $ne: discordId } }))) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken');
    }


    Object.assign(user, updateBody);
    await user.save();
    return user;
}



export default {
    createUser,
    getUserFromDiscordAPI,
    getUserByDiscordId,
    getCurrentUserGuilds,
    updateUserByDiscordId
}