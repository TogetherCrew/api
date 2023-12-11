// /* eslint-disable @typescript-eslint/no-explicit-any */
// import fetch from 'node-fetch';
// import { Snowflake } from 'discord.js';
// import config from '../config';
// import { Guild, IDiscordGuild, IDiscordGuildMember } from '@togethercrew.dev/db';
// import { IGuildUpdateBody } from '../interfaces/guild.interface'
// import { ApiError } from '../utils';
// import sagaService from './saga.service';
// import parentLogger from '../config/logger';

// const logger = parentLogger.child({ module: 'GuildService' });
// /**
//  * Create guild base on discord guild
//  * @param {IGuild} data
//  * @param {Snowflake} discordId
//  * @returns {Promise<IGuild>}
//  */
// async function createGuild(data: IDiscordGuild, discordId: Snowflake) {
//     const guild = await Guild.create({
//         guildId: data.id,
//         user: discordId,
//         name: data.name,
//         icon: data.icon
//     });

//     await sagaService.createAndStartFetchMemberSaga(guild.guildId)
//     return guild
// }

// /**
//  * Get guild by guildId
//  * @param {Snowflake} guildId
//  * @returns {Promise<IGuild | null>}
//  */
// async function getGuildByGuildId(guildId: Snowflake) {
//     return Guild.findOne({ guildId })
// }

// /**
//  * get guild by query
//  * @param {Object} filter
//  * @returns {Promise<IGuild | null>}
//  */
// async function getGuild(filter: object) {
//     return Guild.findOne(filter);
// }
// /**
//  * update guild by guildId
//  * @param {Object} filter
//  * @param {IGuildUpdateBody} updateBody
//  * @returns {Promise<IGuild>}
//  */
// async function updateGuild(filter: object, updateBody: IGuildUpdateBody) {
//     const guild = await Guild.findOne(filter);
//     if (!guild) {
//         throw new ApiError(440, 'Oops, something went wrong! Could you please try logging in');
//     }
//     Object.assign(guild, updateBody);
//     await guild.save();

//     // fire an event for bot only if `period` or `selectedChannels` is changed
//     if (updateBody.period || updateBody.selectedChannels) {
//         await sagaService.createAndStartGuildSaga(guild.guildId, {
//             created: false,
//             discordId: guild.user,
//             message: "Your data import into TogetherCrew is complete! See your insights on your dashboard https://app.togethercrew.com/",
//             useFallback: true
//         })
//     }
//     return guild;
// }


// /**
//  * delete guild
//  * @param {Object} filter
//  */
// async function deleteGuild(filter: object) {
//     await Guild.deleteOne(filter)
// }

// /**
//  * Get guild from discord API
//  * @param {Snowflake} guildId
//  * @returns {Promise<IDiscordGuild>}
//  */
// async function getGuildFromDiscordAPI(guildId: Snowflake) {
//     try {
//         const response = await fetch(`https://discord.com/api/guilds/${guildId}`, {
//             method: 'GET',
//             headers: { 'Authorization': `Bot ${config.discord.botToken}` }
//         });
//         if (response.ok) {
//             return await response.json();
//         }
//         else {
//             throw new Error();
//         }
//     } catch (error) {
//         logger.error({ guild_id: guildId, bot_token: config.discord.botToken, error }, 'Failed to get guild from discord API');
//         throw new ApiError(590, 'Can not fetch from discord API');
//     }
// }

// /**
//  * Get guild roles from discord API
//  * @param {Snowflake} guildId
//  * @returns {Promise<IDiscordGuild>}
//  */
// async function getGuildRolesFromDiscordAPI(guildId: Snowflake) {
//     try {
//         const response = await fetch(`https://discord.com/api/guilds/${guildId}/roles`, {
//             method: 'GET',
//             headers: { 'Authorization': `Bot ${config.discord.botToken}` }
//         });
//         if (response.ok) {
//             return await response.json();
//         }
//         else {
//             throw new Error();
//         }
//     } catch (error) {
//         logger.error({ guild_id: guildId, bot_token: config.discord.botToken, error }, 'Failed to get roles from discrod API');
//         throw new ApiError(590, 'Can not fetch from discord API');
//     }
// }

// /**
//  * Get visible guild channels
//  * @param {Snowflake} guildId
//  * @returns {Promise<Array<IDiscordGuild>>}
//  */
// async function getChannels(guildId: Snowflake) {
//     try {
//         const response = await fetch(`https://discord.com/api/guilds/${guildId}/channels?`, {
//             method: 'GET',
//             headers: { 'Authorization': `Bot ${config.discord.botToken}` }
//         });
//         if (response.ok) {
//             return await response.json();
//         }
//         else {
//             throw new Error();
//         }
//     } catch (error) {
//         logger.error({ guild_id: guildId, bot_token: config.discord.botToken, error }, 'Failed to get channels from discrod API');
//         throw new ApiError(590, 'Can not fetch from discord API');
//     }
// }

// /**
//  * query guilds
//  * @param {Object} filter
//  * @param {Object} options
//  * @returns {Promise<Array<IGuild>>}
//  */
// async function queryGuilds(filter: object, options: object) {
//     return Guild.paginate(filter, options);
// }


// /**
//  * get guild member by guildId and discordId
//  * @param {Snowflake} guildId
//  * @returns {Promise<IDiscordGuildMember>}
//  */
// async function getGuildMemberFromDiscordAPI(guildId: Snowflake, discordId: Snowflake): Promise<IDiscordGuildMember> {
//     try {
//         const response = await fetch(`https://discord.com/api/guilds/${guildId}/members/${discordId}`, {
//             method: 'GET',
//             headers: { 'Authorization': `Bot ${config.discord.botToken}` }
//         });

//         if (response.ok) {
//             return await response.json();
//         }
//         else {
//             throw new Error();
//         }
//     } catch (error) {
//         logger.error({ guild_id: guildId, bot_token: config.discord.botToken, guild_member_id: discordId, error }, 'Failed to get guild member from discrod API');
//         throw new ApiError(590, 'Can not fetch from discord API');
//     }
// }

// export default {
//     createGuild,
//     getGuildByGuildId,
//     getChannels,
//     updateGuild,
//     getGuild,
//     getGuildFromDiscordAPI,
//     queryGuilds,
//     deleteGuild,
//     getGuildMemberFromDiscordAPI,
//     getGuildRolesFromDiscordAPI,
// }
