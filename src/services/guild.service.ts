import { Snowflake } from 'discord.js';
import config from '../config';
import { Guild, IDiscordGuild } from 'tc-dbcomm';

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
    const response = await fetch(`https://discord.com/api/guilds/${guildId}/channels`, {
        method: 'GET',
        headers: { 'Authorization': `Bot ${config.discord.botToken}` }
    });
    return response.json();
}

export default {
    createGuild,
    getGuildByGuildId,
    getGuildChannels
}