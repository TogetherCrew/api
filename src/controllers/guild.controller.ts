import { Response } from 'express';
import { guildService, channelService } from '../services';
import { IAuthRequest } from '../interfaces/request.interface';
import { catchAsync, ApiError, pick } from "../utils";
import httpStatus from 'http-status';

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
    disconnectGuild
}

