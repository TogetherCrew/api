import { Response } from 'express';
import { guildService } from '../services';
import { IAuthRequest } from '../interfaces/request.interface';
import { catchAsync, ApiError } from "../utils";
import httpStatus from 'http-status';

const getGuildChannels = catchAsync(async function (req: IAuthRequest, res: Response) {
    if (! await guildService.isBotAddedToGuild(req.params.guildId, req.user.discordId)) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Please add the RnDAO bot to your server');
    }
    const channels = await guildService.getGuildChannels(req.params.guildId);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sortedChanneles: Array<any> = [];
    for (let i = 0; i < channels.length; i++) {
        if (channels[i].parent_id === null) {
            sortedChanneles.push({ id: channels[i].id, title: channels[i].name, subChannels: [] })
        }
    }
    for (let i = 0; i < sortedChanneles.length; i++) {
        for (let j = 0; j < channels.length; j++) {
            if (sortedChanneles[i].id === channels[j].parent_id) {
                sortedChanneles[i].subChannels.push(channels[j]);
            }
        }
    }
    res.send(sortedChanneles)
});

const updateGuild = catchAsync(async function (req: IAuthRequest, res: Response) {
    const guild = await guildService.updateGuildByGuildId(req.params.guildId, req.user.discordId, req.body);
    res.send(guild);
});



export default {
    getGuildChannels,
    updateGuild
}

