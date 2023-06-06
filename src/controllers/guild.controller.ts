import { Response, Request } from 'express';
import { guildService, userService, authService } from '../services';
import { IAuthRequest } from '../interfaces/request.interface';
import { catchAsync, ApiError, pick, sort } from "../utils";
import httpStatus from 'http-status';
import config from '../config';
import { scopes, permissions } from '../config/dicord';
import { IDiscordUser, IDiscordOathBotCallback } from '@togethercrew.dev/db';
import querystring from 'querystring';
import { ICustomChannel } from '../interfaces/guild.interface';

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

const getChannels = catchAsync(async function (req: IAuthRequest, res: Response) {
    if (! await guildService.isBotAddedToGuild(req.params.guildId, req.user.discordId)) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Please add the RnDAO bot to your server');
    }
    const channels = await guildService.getChannelsFromDiscordJS(req.params.guildId);
    const sortedChannels = await sort.sortChannels(channels);
    res.send(sortedChannels)
});


const getSelectedChannels = catchAsync(async function (req: IAuthRequest, res: Response) {
    const guild = await guildService.getGuild({ guildId: req.params.guildId, user: req.user.discordId });
    if (!guild) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Please add the RnDAO bot to your server');
    }
    if (guild.selectedChannels && guild.selectedChannels.length > 0) {
        const channels = await guildService.getChannelsFromDiscordJS(req.params.guildId);
        let sortedChannels = await sort.sortChannels(channels);
        sortedChannels = sortedChannels
            .filter(category => {
                const selectedSubChannels = category.subChannels.filter((channel: ICustomChannel) => guild.selectedChannels?.some(selected => selected.channelId === channel.id));
                return selectedSubChannels.length > 0;
            })
            .map(category => {
                return {
                    id: category.id,
                    title: category.title,
                    subChannels: category.subChannels.filter((channel: ICustomChannel) => guild.selectedChannels?.some(selected => selected.channelId === channel.id))
                }
            });
        res.send(sortedChannels)
    } else {
        res.send([]);
    }
});




const connectGuild = catchAsync(async function (req: IAuthRequest, res: Response) {
    res.redirect(`https://discord.com/api/oauth2/authorize?client_id=${config.discord.clientId}&redirect_uri=${config.discord.callbackURI.connectGuild}&response_type=code&scope=${scopes.connectGuild}&permissions=${permissions.ViewChannels | permissions.readMessageHistory}`);
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
        await guildService.updateGuild({ guildId: req.params.guildId, user: req.user.discordId }, { isDisconnected: true });
    }
    else if (req.body.disconnectType === "hard") {
        await guildService.deleteGuild({ guildId: req.params.guildId, user: req.user.discordId })
    }
    res.status(httpStatus.NO_CONTENT).send();
});

export default {
    getChannels,
    getSelectedChannels,
    getGuild,
    updateGuild,
    getGuildFromDiscordAPI,
    getGuilds,
    disconnectGuild,
    connectGuild,
    connectGuildCallback
}
