/* eslint-disable @typescript-eslint/no-explicit-any */
import fetch from 'node-fetch';
import { Snowflake } from 'discord.js';
import config from '../config';
import { Guild, IDiscordGuild, IDiscordGuildMember, IDiscordChannel } from 'tc_dbcomm';
import { IGuildUpdateBody } from '../interfaces/guild.interface'
import { ApiError } from '../utils';
import httpStatus = require('http-status');
import userService from './user.service';

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
        name: data.name,
        icon: data.icon
    });
}

/**
 * Get guild by guildId
 * @param {Snowflake} guildId
 * @returns {Promise<IGuild | null>}
 */
async function getGuildByGuildId(guildId: Snowflake) {
    return Guild.findOne({ guildId })
}

/**
 * get guild by query 
 * @param {Object} filter
 * @returns {Promise<IGuild | null>}
 */
async function getGuild(filter: object) {
    return Guild.findOne(filter);
}

/**
 * update guild by guildId
 * @param {Object} filter
 * @param {IGuildUpdateBody} updateBody
 * @returns {Promise<IGuild>}
 */
async function updateGuild(filter: object, updateBody: IGuildUpdateBody) {
    const guild = await Guild.findOne(filter);
    if (!guild) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Guild not found');
    }
    Object.assign(guild, updateBody);
    await guild.save();
    return guild;
}


/**
 * delete guild
 * @param {Object} filter
 */
async function deleteGuild(filter: object) {
    await Guild.deleteOne(filter)
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


/**
 * Get guild from discord API
 * @param {Snowflake} guildId
 * @returns {Promise<IDiscordGuild>}
 */
async function getGuildFromDiscordAPI(guildId: Snowflake) {
    try {
        const response = await fetch(`https://discord.com/api/guilds/${guildId}`, {
            method: 'GET',
            headers: { 'Authorization': `Bot ${config.discord.botToken}` }
        });
        if (response.ok) {
            return await response.json();
        }
        else {
            throw new Error();
        }
    } catch (err) {
        throw new ApiError(590, 'Can not fetch from discord API');
    }
}

/**
 * Get visible guild channels
 * @param {Snowflake} guildId
 * @returns {Promise<Array<IDiscordGuild>>}
 */
async function getGuildChannels(guildId: Snowflake) {
    try {
        const response = await fetch(`https://discord.com/api/guilds/${guildId}/channels?`, {
            method: 'GET',
            headers: { 'Authorization': `Bot ${config.discord.botToken}` }
        });
        const channels = await response.json();
        // Note: {message: '401: Unauthorized', code:0} means that we have not access to guild channels
        if (channels.message) {
            throw new Error();
        }
        return channels;
    } catch (err) {
        throw new ApiError(590, 'Can not fetch from discord API');
    }
}


/**
 * query guilds
 * @param {Object} filter 
 * @param {Object} options 
 * @returns {Promise<Array<IGuild>>}
 */
async function queryGuilds(filter: object, options: object) {
    return Guild.paginate(filter, options);
}


/**
 * get guild member by guildId and discordId
 * @param {Snowflake} guildId
 * @returns {Promise<IDiscordGuildMember>}
 */
async function getGuildMemberFromDiscordAPI(guildId: Snowflake, discordId: Snowflake): Promise<IDiscordGuildMember> {
    try {
        const response = await fetch(`https://discord.com/api/guilds/${guildId}/members/${discordId}`, {
            method: 'GET',
            headers: { 'Authorization': `Bot ${config.discord.botToken}` }
        });

        if (response.ok) {
            return await response.json();
        }
        else {
            throw new Error();
        }
    } catch (err) {
        throw new ApiError(590, 'Can not fetch from discord API');
    }
}

export default {
    createGuild,
    getGuildByGuildId,
    getGuildChannels,
    updateGuild,
    isBotAddedToGuild,
    getGuild,
    getGuildFromDiscordAPI,
    queryGuilds,
    deleteGuild,
    getGuildMemberFromDiscordAPI
}

