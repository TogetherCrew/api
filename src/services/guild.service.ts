/* eslint-disable @typescript-eslint/no-explicit-any */
import fetch from 'node-fetch';
import { Snowflake } from 'discord.js';
import config from '../config';
import { Guild, IDiscordGuild, IDiscordGuildMember } from '@togethercrew.dev/db';
import { IGuildUpdateBody } from '../interfaces/guild.interface'
import { ApiError } from '../utils';
import { getDiscordClient } from '../config/dicord';
import { PermissionsBitField } from 'discord.js'
import sagaService from './saga.service';

/**
 * Create guild base on discord guild
 * @param {IGuild} data
 * @param {Snowflake} discordId
 * @returns {Promise<IGuild>}
 */
async function createGuild(data: IDiscordGuild, discordId: Snowflake) {
    const guild = await Guild.create({
        guildId: data.id,
        user: discordId,
        name: data.name,
        icon: data.icon
    });

    await sagaService.createAndStartGuildSaga(guild.guildId, true)
    return guild
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
        throw new ApiError(440, 'Oops, something went wrong! Could you please try logging in');
    }
    Object.assign(guild, updateBody);
    await guild.save();

    // fire an event for bot only if `period` or `selectedChannels` is changed
    if (updateBody.period || updateBody.selectedChannels) {
        await sagaService.createAndStartGuildSaga(guild.guildId, false)
    }
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
 * Get guild roles from discord API
 * @param {Snowflake} guildId
 * @returns {Promise<IDiscordGuild>}
 */
async function getGuildRolesFromDiscordAPI(guildId: Snowflake) {
    try {
        const response = await fetch(`https://discord.com/api/guilds/${guildId}/roles`, {
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
async function getChannels(guildId: Snowflake) {
    try {
        const response = await fetch(`https://discord.com/api/guilds/${guildId}/channels?`, {
            method: 'GET',
            headers: { 'Authorization': `Bot ${config.discord.botToken}` }
        });
        const channels = await response.json();
        if (response.ok) {
            return await response.json();
        }
        else {
            throw new Error();
        }
        return channels;
    } catch (err) {
        throw new ApiError(590, 'Can not fetch from discord API');
    }
}

/**
 * Get guild channels
 * @param {Snowflake} guildId
 * @returns {Promise<Array<IDiscordChannel>>}
 */
async function getChannelsFromDiscordJS(guildId: Snowflake) {
    try {
        const client = await getDiscordClient();
        const guild = await client.guilds.fetch(guildId);
        if (!client.user) {
            throw new Error();
        }
        const botMember = await guild.members.fetch(client.user.id);
        const channels = await guild.channels.fetch();
        const channelData = channels.map((channel) => {
            if (channel) {
                const botPermissions = channel.permissionsFor(botMember);
                const canReadMessageHistoryAndViewChannel = botPermissions.has([PermissionsBitField.Flags.ReadMessageHistory, PermissionsBitField.Flags.ViewChannel]);
                return {
                    id: channel.id,
                    name: channel.name,
                    parent_id: channel.parentId,
                    canReadMessageHistoryAndViewChannel
                };
            }

        });
        return channelData;
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
    getChannels,
    updateGuild,
    getGuild,
    getGuildFromDiscordAPI,
    queryGuilds,
    deleteGuild,
    getGuildMemberFromDiscordAPI,
    getGuildRolesFromDiscordAPI,
    getChannelsFromDiscordJS
}

