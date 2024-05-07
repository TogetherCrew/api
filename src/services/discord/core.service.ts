import fetch from 'node-fetch';
import { Client, GatewayIntentBits, Snowflake, Guild } from 'discord.js';
import config from '../../config';
import { DatabaseManager } from '@togethercrew.dev/db';
import { ApiError, pick, sort } from '../../utils';
import parentLogger from '../../config/logger';
import { IAuthAndPlatform, IDiscordOAuth2EchangeCode, IDiscordUser } from '../../interfaces';
import channelService from './channel.service';
import roleService from './role.service';
import guildMemberService from './guildMember.service';
import { discord } from '../../config/oAtuh2';
const logger = parentLogger.child({ module: 'DiscordCoreService' });

/**
 * exchange discord code with access token
 * @param {string} code
   @param {string} redirect_uri
 * @returns {Promise<IDiscordOAuth2EchangeCode>}
 */
async function getPropertyHandler(req: IAuthAndPlatform) {
  const connection = await DatabaseManager.getInstance().getTenantDb(req.platform?.metadata?.id);

  if (req.query.property === 'role') {
    const filter = pick(req.query, ['name']);
    if (filter.name) {
      filter.name = {
        $regex: filter.name,
        $options: 'i',
      };
    }
    filter.deletedAt = null;
    const options = pick(req.query, ['sortBy', 'limit', 'page']);

    return await roleService.queryRoles(connection, filter, options);
  } else if (req.query.property === 'channel') {
    const filter = pick(req.query, ['name']);
    if (filter.name) {
      filter.name = {
        $regex: filter.name,
        $options: 'i',
      };
    }
    filter.deletedAt = null;
    if (req.body.channelIds) {
      filter.channelId = { $in: req.body.channelIds };
    }
    const channels: any = await channelService.getChannels(connection, filter);
    for (let i = 0; i < channels.length; i++) {
      const canReadMessageHistoryAndViewChannel = await channelService.checkBotPermissions(
        req.platform?.metadata?.id,
        channels[i],
        [discord.permissions.ReadData.ViewChannel, discord.permissions.ReadData.ReadMessageHistory],
      );
      let announcementAccess: boolean;
      if (channels[i].type === 0 || channels[i].type === 4) {
        announcementAccess = await channelService.checkBotPermissions(req.platform?.metadata?.id, channels[i], [
          discord.permissions.Announcement.ViewChannel,
          discord.permissions.Announcement.SendMessages,
          discord.permissions.Announcement.SendMessagesInThreads,
          discord.permissions.Announcement.CreatePrivateThreads,
          discord.permissions.Announcement.CreatePublicThreads,
          discord.permissions.Announcement.EmbedLinks,
          discord.permissions.Announcement.AttachFiles,
          discord.permissions.Announcement.MentionEveryone,
        ]);
      } else {
        announcementAccess = await channelService.checkBotPermissions(req.platform?.metadata?.id, channels[i], [
          discord.permissions.Announcement.ViewChannel,
          discord.permissions.Announcement.SendMessages,
          discord.permissions.Announcement.SendMessagesInThreads,
          discord.permissions.Announcement.CreatePrivateThreads,
          discord.permissions.Announcement.CreatePublicThreads,
          discord.permissions.Announcement.EmbedLinks,
          discord.permissions.Announcement.AttachFiles,
          discord.permissions.Announcement.MentionEveryone,
          discord.permissions.Announcement.Connect,
        ]);
      }
      channels[i] = {
        channelId: channels[i].channelId,
        name: channels[i].name,
        parentId: channels[i].parentId,
        canReadMessageHistoryAndViewChannel,
        announcementAccess,
        type: channels[i].type,
      };
    }
    return await sort.sortChannels(channels);
  } else if (req.query.property === 'guildMember') {
    const filter = pick(req.query, ['ngu']);
    filter.deletedAt = null;
    const options = pick(req.query, ['sortBy', 'limit', 'page']);
    const guildMembers = await guildMemberService.queryGuildMembers(connection, filter, options);
    guildMembers.results.forEach((guildMember: any) => {
      guildMember.ngu = guildMemberService.getNgu(guildMember);
      guildMember.username = guildMemberService.getUsername(guildMember);
    });
    return guildMembers;
  }
}

/**
 * get guild from discord js
 * @param {Snowflake} guildId
 * @returns {Promise<IDiscordOAuth2EchangeCode>}
 */
async function getGuildFromDiscordJS(guildId: Snowflake): Promise<Guild | null> {
  const client = await DiscordBotManager.getClient();
  try {
    return await client.guilds.fetch(guildId);
  } catch (error) {
    logger.error({ error }, 'Failed to get guild from discordJS');
    return null;
  }
}

/**
 * leave bot from guild
 * @param {Snowflake} guildId
 * @returns {Promise<IDiscordOAuth2EchangeCode>}
 */
async function leaveBotFromGuild(guildId: Snowflake) {
  const guild = await getGuildFromDiscordJS(guildId);
  if (guild) {
    guild.leave();
  }
}

/**
 * exchange discord code with access token
 * @param {string} code
   @param {string} redirect_uri
 * @returns {Promise<IDiscordOAuth2EchangeCode>}
 */
async function exchangeCode(code: string, redirect_uri: string): Promise<IDiscordOAuth2EchangeCode> {
  try {
    const data = {
      client_id: config.oAuth2.discord.clientId,
      client_secret: config.oAuth2.discord.clientSecret,
      grant_type: 'authorization_code',
      redirect_uri,
      code,
    };

    const response = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      body: new URLSearchParams(data),
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    if (response.ok) {
      return await response.json();
    } else {
      const errorResponse = await response.text();
      logger.error({ error: errorResponse }, 'Failed to exchange discord code');
      throw new Error(`Failed to exchange discord code: ${errorResponse}`);
    }
  } catch (error) {
    logger.error({ redirect_uri, error }, 'Failed to exchange discord code');
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
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (response.ok) {
      return await response.json();
    } else {
      const errorResponse = await response.text();
      logger.error({ error: errorResponse }, 'Failed to get user from Discord API');
      throw new Error(`Failed to get user from Discord API: ${errorResponse}`);
    }
  } catch (error) {
    logger.error({ error }, 'Failed to get user from Discord API');
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
      headers: { Authorization: `Bot ${config.oAuth2.discord.botToken}` },
    });
    if (response.ok) {
      return await response.json();
    } else {
      const errorResponse = await response.text();
      logger.error({ error: errorResponse }, 'Failed to get bot from Discord API');
      throw new Error(`Failed to get bot from Discord API: ${errorResponse}`);
    }
  } catch (error) {
    logger.error({ error }, 'Failed to get bot from Discord API');
    throw new ApiError(590, 'Can not fetch from discord API');
  }
}

/**
 * get list of permissions that bot has in a specific guild
 * @param {Snowflake} guildId
 * @returns {Promise<IDiscordUser>}
 */
async function getBotPermissions(guildId: Snowflake): Promise<Array<string>> {
  try {
    const client = await DiscordBotManager.getClient();
    const guild = await client.guilds.fetch(guildId);
    const member = await guild.members.fetch(config.oAuth2.discord.clientId);
    return member.permissions.toArray();
  } catch (error) {
    logger.error({ error }, 'Failed to get list of permissions that bot has in a specific guild');
    throw new ApiError(590, 'Failed to get list of permissions that bot has in a specific guild');
  }
}

/**
 * get list of permissions that bot needs for a specific module
 * @param {string} module
 * @returns {Promise<IDiscordUser>}
 */
type module = keyof typeof discord.permissions;
function getRequirePermissionsForModule(module: module): Array<string> {
  if (!discord.permissions[module]) {
    return [];
  }

  const permissions = discord.permissions[module];
  const permissionList = [];

  for (const key in permissions) {
    permissionList.push(key);
  }

  return permissionList;
}

/**
 * get permissions value
 * @param {Array<string>} permissionsArray
 * @returns {Promise<IDiscordUser>}
 */
function getCombinedPermissionsValue(permissionsArray: Array<string>) {
  let combinedValue = BigInt(0);
  for (const moduleName in discord.permissions) {
    if (Object.prototype.hasOwnProperty.call(discord.permissions, moduleName)) {
      const modulePermissions = discord.permissions[moduleName as keyof typeof discord.permissions];
      for (const permission of permissionsArray) {
        if (Object.prototype.hasOwnProperty.call(modulePermissions, permission)) {
          combinedValue |= BigInt(modulePermissions[permission as keyof typeof modulePermissions]);
        }
      }
    }
  }

  return combinedValue;
}

/**
 * Retrieves the status of specified permissions within the Discord permissions structure.
 * The function iterates through each category of permissions (like ReadData, Announcement) in the
 * discord object and checks if the given permissions are present in each category.
 * If a permission is present, it is marked as true, otherwise false.
 *
 * @param {string[]} permissionsToCheck - An array of permission names to check against the discord permissions.
 * @returns {any} An object with each category of permissions containing key-value pairs of permission names and their boolean status (true if present in the array, false otherwise).
 */
type PermissionCategory = keyof typeof discord.permissions;
export function getPermissionsStatus(permissionsToCheck: string[]): any {
  const result: any = {};

  for (const category in discord.permissions) {
    if (category as PermissionCategory) {
      result[category] = {};
      const permissions = discord.permissions[category as PermissionCategory];
      for (const permission in permissions) {
        result[category][permission] = permissionsToCheck.includes(permission);
      }
    }
  }

  return result;
}

class DiscordBotManager {
  public static client: Client;
  public static async getClient(): Promise<Client> {
    if (!DiscordBotManager.client) {
      DiscordBotManager.client = new Client({
        intents: [
          GatewayIntentBits.Guilds,
          GatewayIntentBits.GuildMembers,
          GatewayIntentBits.GuildMessages,
          GatewayIntentBits.GuildPresences,
          GatewayIntentBits.DirectMessages,
        ],
      });
      await DiscordBotManager.client.login(config.oAuth2.discord.botToken);
    }
    return DiscordBotManager.client;
  }
}

export default {
  exchangeCode,
  getUserFromDiscordAPI,
  getBotFromDiscordAPI,
  getPropertyHandler,
  leaveBotFromGuild,
  DiscordBotManager,
  getBotPermissions,
  getRequirePermissionsForModule,
  getCombinedPermissionsValue,
  getPermissionsStatus,
};
