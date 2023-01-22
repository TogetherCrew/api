import { Response } from 'express';
import { heatmapService } from '../services';
import { IAuthRequest } from '../interfaces/request.interface';
import { catchAsync, ApiError } from "../utils";
import { databaseService, Guild } from 'tc-dbcomm'
import httpStatus from 'http-status';

const getHeatmaps = catchAsync(async function (req: IAuthRequest, res: Response) {
    if (!await Guild.findOne({ guildId: req.params.guildId, user: req.user.discordId })) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Guild not found');
    }
    const connection = databaseService.connectionFactory(req.params.guildId, 'mongodb://127.0.0.1:27017');
    const heatmaps = await heatmapService.getHeatmaps(connection, req.body.startDate);
    res.send(heatmaps);
});



export default {
    getHeatmaps
}

