import { Response } from 'express';
import { guildService } from '../services';
import { IAuthRequest } from '../interfaces/request.interface';
import { catchAsync } from "../utils";

const getGuildChannels = catchAsync(async function (req: IAuthRequest, res: Response) {
    const channels = await guildService.getGuildChannels(req.params.guildId);
    console.log(channels);
    res.send(channels)
});



export default {
    getGuildChannels,

}

