import { Response, Request } from 'express';
import { guildService, userService, authService } from '../services';
import { IAuthRequest } from '../interfaces/request.interface';
import { catchAsync, ApiError, pick, sort } from "../utils";
import httpStatus from 'http-status';
import config from '../config';
import { scopes, permissions } from '../config/dicord';
import { IDiscordUser, IDiscordOathBotCallback } from 'tc_dbcomm';
import querystring from 'querystring';

const getGuilds = catchAsync(async function (req: IAuthRequest, res: Response) {
    const filter = pick(req.query, ['isDisconnected', 'isInProgress']);
    filter.user = req.user.discordId;
    const options = pick(req.query, ['sortBy', 'limit', 'page']);
    const result = await guildService.queryGuilds(filter, options);
    res.send(result);
});

const getGuild = catchAsync(async function (req: IAuthRequest, res: Response) {
    const guild = await guildService.getGuild({ guildId: req.params.guildId, user: req.user.discordId });
    if (!guild) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Guild not found');
    }
    res.send(guild);
});

const updateGuild = catchAsync(async function (req: IAuthRequest, res: Response) {
    const guild = await guildService.updateGuild({ guildId: req.params.guildId, user: req.user.discordId }, req.body);
    res.send(guild);
});

const getGuildFromDiscordAPI = catchAsync(async function (req: IAuthRequest, res: Response) {
    if (! await guildService.isBotAddedToGuild(req.params.guildId, req.user.discordId)) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Please add the RnDAO bot to your server');
    }
    const guild = await guildService.getGuildFromDiscordAPI(req.params.guildId);
    res.send(guild)
});

const getGuildChannels = catchAsync(async function (req: IAuthRequest, res: Response) {
    if (! await guildService.isBotAddedToGuild(req.params.guildId, req.user.discordId)) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Please add the RnDAO bot to your server');
    }
    const channels = await guildService.getGuildChannelsFromDiscordAPI(req.params.guildId);
    // console.log(channels)
    const botUser = await userService.getBotFromDiscordAPI();
    const botMember = await guildService.getGuildMemberFromDiscordAPI(req.params.guildId, botUser.id);

    const botRoles = botMember.roles;

    // console.log(channels, botMember)
    for (let i = 0; i < channels.length; i++) {
        let botPermissions = 0;
        const permissionOverwrites = channels[i]?.permission_overwrites ?? [];
        for (let j = 0; j < permissionOverwrites.length; j++) {
            // if (botRoles.includes(permissionOverwrites[j].id) || permissionOverwrites[j].id === req.params.guildId) {
            //     botPerms |= permissionOverwrites[j].allow;
            //     botPerms &= permissionOverwrites[j].deny;
            // }


            if (botRoles.includes(permissionOverwrites[j].id)) {
                // console.log(1)
                // console.log(permissionOverwrites[j].allow & 66560)

                // botPermissions  |= permissionOverwrites[j].allow;
                // console.log(botPermissions )
                // botPerms |= permissionOverwrites[j].allow;
                // console.log(botPermissions )

                botPermissions = permissionOverwrites[j].allow;
                console.log(botPermissions)
                console.log(botPermissions & 65536)
                if (botPermissions & 4096) {
                    console.log(true)
                }
            }



        }

        const canReadMessageHistory = (botPermissions & (1 << 22)) !== 0; // Check if the bot has READ_MESSAGE_HISTORY permission

        console.log(`${channels[i].name}: ${canReadMessageHistory ? 'Can Read Message History' : 'Cannot Read Message History'}`);
    }

    // for (const channel of channels) {
    //     if (channel.type === 0) { // Check if the channel is a text channel
    //         let botPerms = 0;

    //         for (const overwrite of channel.permission_overwrites) {
    //             if (botRoles.includes(overwrite.id) || overwrite.id === guildId) {
    //                 botPerms |= overwrite.allow;
    //                 botPerms &= ~overwrite.deny;
    //             }
    //         }

    //         const canReadMessageHistory = (botPerms & (1 << 22)) !== 0; // Check if the bot has READ_MESSAGE_HISTORY permission

    //         console.log(`${channel.name}: ${canReadMessageHistory ? 'Can Read Message History' : 'Cannot Read Message History'}`);
    //     }
    // }
    // const sortedChannels = await sort.sortChannels(channels);
    res.send(channels)
});



const connectGuild = catchAsync(async function (req: IAuthRequest, res: Response) {
    res.redirect(`https://discord.com/api/oauth2/authorize?client_id=${config.discord.clientId}&redirect_uri=${config.discord.callbackURI.connectGuild}&response_type=code&scope=${scopes.connectGuild}&permissions=${permissions.ViewChannels}`);
});

const connectGuildCallback = catchAsync(async function (req: Request, res: Response) {
    const code = req.query.code as string;
    let statusCode = 701;
    try {
        if (!code) {
            throw new Error();
        }
        const discordOathCallback: IDiscordOathBotCallback = await authService.exchangeCode(code, config.discord.callbackURI.connectGuild);
        const discordUser: IDiscordUser = await userService.getUserFromDiscordAPI(discordOathCallback.access_token);
        const user = await userService.getUserByDiscordId(discordUser.id);
        if (user) {
            if (await guildService.getGuild({ user: user.discordId, guildId: { $ne: discordOathCallback.guild.id }, isDisconnected: false })) {
                throw new Error();
            }
            let guild = await guildService.getGuildByGuildId(discordOathCallback.guild.id);
            if (guild) {
                statusCode = 702;
                await guildService.updateGuild({ guildId: discordOathCallback.guild.id, user: discordUser.id }, { isDisconnected: false })
            }
            else {
                statusCode = 701;
                guild = await guildService.createGuild(discordOathCallback.guild, user.discordId);
            }
            const query = querystring.stringify({ "statusCode": statusCode, "guildId": guild.guildId, "guildName": guild.name, });
            res.redirect(`${config.frontend.url}/callback?` + query);
        }
        else {
            throw new Error();
        }
    } catch (err) {
        const query = querystring.stringify({
            "statusCode": 491
        });
        res.redirect(`${config.frontend.url}/callback?` + query);
    }
});

const disconnectGuild = catchAsync(async function (req: IAuthRequest, res: Response) {
    if (req.body.disconnectType === "soft") {
        await guildService.updateGuild({ guildId: req.params.guildId, user: req.user.discordId }, { isDisconnected: true })
    }
    else if (req.body.disconnectType === "hard") {
        await guildService.deleteGuild({ guildId: req.params.guildId, user: req.user.discordId })
    }
    res.status(httpStatus.NO_CONTENT).send();
});

export default {
    getGuildChannels,
    getGuild,
    updateGuild,
    getGuildFromDiscordAPI,
    getGuilds,
    disconnectGuild,
    connectGuild,
    connectGuildCallback
}
