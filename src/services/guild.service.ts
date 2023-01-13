import fetch from 'node-fetch';
import { Snowflake } from 'discord.js';
import config from '../config';
import { Guild, IDiscordGuild } from 'tc-dbcomm';
import { IGuildUpdateBody } from '../interfaces/guild.interface'
import { ApiError } from '../utils';
import httpStatus = require('http-status');

/**
 * Create guild base on discord guild
 * @param {IGuild} data
 * @param {Snowflake} discordId
 * @returns {Promise<IGuild>}
 */
async function createGuild(data: IDiscordGuild, discordId: Snowflake) {
    return Guild.create({
        guildId: data.id,
        user: discordId,
        name: data.name
    });
}

/**
 * Get guild by guildId
 * @param {Snowflake} guildId
 * @returns {Promise<IGuild | null>}
 */
async function getGuildByGuildId(guildId: Snowflake) {
    const user = await Guild.findOne({ guildId });
    return user;
}

/**
 * Get guild channels
 * @param {Snowflake} guildId
 * @returns {Promise<Array<IDiscordGuild>>}
 */
async function getGuildChannels(guildId: string) {
    try {
        const response = await fetch(`https://discord.com/api/guilds/${guildId}/channels`, {
            method: 'GET',
            headers: { 'Authorization': `Bot ${config.discord.botToken}` }
        });
        const json = await response.json();
        // Note: {message: '401: Unauthorized', code:0} means that we have not access to guild channels
        if (json.message) {
            throw new Error();
        }
        return json;
    } catch (err) {
        throw new ApiError(590, 'Can not fetch from discord API');
    }
}

/**
 * update guild by guildId
 * @param {Snowflake} guildId
 * @param {Snowflake} userDiscordId
 * @param {IGuildUpdateBody} updateBody
 * @returns {Promise<IGuild>}
 */
async function updateGuildByGuildId(guildId: Snowflake, userDiscordId: Snowflake, updateBody: IGuildUpdateBody) {
    const guild = await Guild.findOne({ guildId, user: userDiscordId });
    if (!guild) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Guild not found');
    }
    Object.assign(guild, updateBody);
    await guild.save();
    return guild;
}

/**
 * check if our bot is added to guild
 * @param {Snowflake} guildId
 * @param {Snowflake} userDiscordId
 * @returns {Boolean}
 */
async function isBotAddedToGuild(guildId: Snowflake, userDiscordId: Snowflake) {
    const guild = await Guild.findOne({ guildId, user: userDiscordId });
    return guild ? true : false
}



export default {
    createGuild,
    getGuildByGuildId,
    getGuildChannels,
    updateGuildByGuildId,
    isBotAddedToGuild
}