import { Response } from 'express';
import { guildService } from '../services';
import { IAuthRequest } from '../interfaces/request.interface';
import { catchAsync } from "../utils";

const getGuildChannels = catchAsync(async function (req: IAuthRequest, res: Response) {
    const channels = await guildService.getGuildChannels(req.params.guildId);
    res.send(channels)
});

const updateGuild = catchAsync(async function (req: IAuthRequest, res: Response) {
    const guild = await guildService.updateGuildByGuildId(req.params.guildId, req.user.discordId, req.body);
    res.send(guild);
});



export default {
    getGuildChannels,
    updateGuild
}

