import { Response, Request } from 'express';
import { guildService, channelService, userService, authService, tokenService } from '../services';
import { IAuthRequest } from '../interfaces/request.interface';
import { catchAsync, ApiError, pick } from "../utils";
import httpStatus from 'http-status';
import config from '../config';
import { scopes, permissions } from '../config/dicord';
import { IDiscordUser, IDiscordOathBotCallback } from 'tc-dbcomm';
import querystring from 'querystring';

const getGuild = catchAsync(async function (req: IAuthRequest, res: Response) {
    const guild = await guildService.getGuild({ guildId: req.params.guildId, user: req.user.discordId });
    if (!guild) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Guild not found');
    }
    res.send(guild);
});

const updateGuild = catchAsync(async function (req: IAuthRequest, res: Response) {
    const guild = await guildService.updateGuildByGuildId(req.params.guildId, req.user.discordId, req.body);


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
    const channels = await guildService.getGuildChannels(req.params.guildId);
    const sortedChannels = await channelService.sortChannels(channels);
    res.send(sortedChannels)
});

const getGuilds = catchAsync(async function (req: IAuthRequest, res: Response) {
    const filter = pick(req.query, ['isDisconnected', 'isInProgress']);
    filter.user = req.user.discordId;
    const options = pick(req.query, ['sortBy', 'limit', 'page']);
    const result = await guildService.queryGuilds(filter, options);
    res.send(result);
});

const connectGuild = catchAsync(async function (req: IAuthRequest, res: Response) {
    if (await guildService.getGuild({ user: req.user.discordId, isDisconnected: false })) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'You have already connected guild. please disconnect your guild to be able to add another one');
    }
    res.redirect(`https://discord.com/api/oauth2/authorize?client_id=${config.discord.clientId}&redirect_uri=${config.discord.connectGuildCallbackURI}&response_type=code&scope=${scopes.connectGuild}&permissions=${permissions.ViewChannels}`);
});

const connectGuildCallback = catchAsync(async function (req: Request, res: Response) {
    const code = req.query.code as string;
    try {
        if (!code) {
            throw new Error();
        }
        const discordOathCallback: IDiscordOathBotCallback = await authService.exchangeCode(code);
        const discordUser: IDiscordUser = await userService.getUserFromDiscordAPI(discordOathCallback.access_token);
        const user = await userService.getUserByDiscordId(discordUser.id);
        if (user) {
            let guild = await guildService.getGuildByGuildId(discordOathCallback.guild.id);
            if (guild) {
                await guildService.updateGuildByGuildId(discordOathCallback.guild.id, discordUser.id, { isDisconnected: false })
            }
            else {
                guild = await guildService.createGuild(discordOathCallback.guild, user.discordId);
            }
            const query = querystring.stringify({
                "isSuccessful": true,
                "guildId": guild.guildId,
                "guildName": guild.name
            });
            res.redirect(`${config.frontend.url}/login?` + query);
        }
        else {
            throw new Error();
        }
    } catch (err) {
        const query = querystring.stringify({
            "isSuccessful": false
        });
        res.redirect(`${config.frontend.url}/login?` + query);
    }
});


const disconnectGuild = catchAsync(async function (req: IAuthRequest, res: Response) {
    if (req.body.disconnectType === "soft") {
        await guildService.updateGuildByGuildId(req.params.guildId, req.user.discordId, { isDisconnected: true })
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

