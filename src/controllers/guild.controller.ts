import { Response } from 'express';
import { guildService, channelService } from '../services';
import { IAuthRequest } from '../interfaces/request.interface';
import { catchAsync, ApiError } from "../utils";
import httpStatus from 'http-status';
import { Guild } from 'tc-dbcomm';
import config from '../config';

const getGuildChannels = catchAsync(async function (req: IAuthRequest, res: Response) {
    if (! await guildService.isBotAddedToGuild(req.params.guildId, req.user.discordId)) {
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


const getGuildFromDiscordAPI = catchAsync(async function (req: IAuthRequest, res: Response) {
    if (!await Guild.findOne({ guildId: req.params.guildId, user: req.user.discordId })) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Guild not found');
    }
    try {
        const response = await fetch(`https://discord.com/api/guilds/${req.params.guildId}`, {
            method: 'GET',
            headers: { 'Authorization': `Bot ${config.discord.botToken}` }
        });
        const json = await response.json();
        // Note: {message: '401: Unauthorized', code:0} means that we have not access to guild channels
        if (json.message) {
            throw new Error();
        }
        res.send(json)
    } catch (err) {
        throw new ApiError(590, 'Can not fetch from discord API');
    }
});


export default {
    getGuildChannels,
    getGuild,
    updateGuild,
    getGuildFromDiscordAPI
}

