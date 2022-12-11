import { Snowflake } from 'discord.js';
import { Guild } from '../models';
import { IDiscordGuild } from '../interfaces/Discord.interface';

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


export default {
    createGuild,
    getGuildByGuildId
}