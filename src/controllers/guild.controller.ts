import { Response } from 'express';
import { guildService, channelService } from '../services';
import { IAuthRequest } from '../interfaces/request.interface';
import { catchAsync, ApiError } from "../utils";
import httpStatus from 'http-status';

const getGuildChannels = catchAsync(async function (req: IAuthRequest, res: Response) {
    if (! await guildService.isBotAddedToGuild(req.params.guildId, req.user.discordId)) {
        console.log(1)
        throw new ApiError(httpStatus.BAD_REQUEST, 'Please add the RnDAO bot to your server');
    }
    const channels = await guildService.getGuildChannels(req.params.guildId);
    const sortedChannels = await channelService.sortChannels(channels);
    res.send(sortedChannels)
});



const getGuild = catchAsync(async function (req: IAuthRequest, res: Response) {
    const guild = await guildService.getGuildByQuery({ guildId: req.params.guildId, user: req.user.discordId });
    if (!guild) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Guild not found');
    }
    res.send(guild);
});

const updateGuild = catchAsync(async function (req: IAuthRequest, res: Response) {
    const guild = await guildService.updateGuildByGuildId(req.params.guildId, req.user.discordId, req.body);
    res.send(guild);
});

export default {
    getGuildChannels,
    getGuild,
    updateGuild,
}

