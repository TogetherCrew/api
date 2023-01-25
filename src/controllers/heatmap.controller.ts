import { Response } from 'express';
import { heatmapService } from '../services';
import { IAuthRequest } from '../interfaces/request.interface';
import { catchAsync, ApiError, timezone, sort } from "../utils";
import { databaseService, Guild } from 'tc-dbcomm'
import httpStatus from 'http-status';
import config from '../config';
import moment from 'moment-timezone';

const getHeatmaps = catchAsync(async function (req: IAuthRequest, res: Response) {
    if (!await Guild.findOne({ guildId: req.params.guildId, user: req.user.discordId })) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Guild not found');
    }
    const connection = databaseService.connectionFactory(req.params.guildId, config.mongoose.botURL);
    let heatmaps = await heatmapService.getHeatmaps(connection, req.body.startDate, req.body.endDate);
    const timeZoneOffset = parseInt(moment().tz(req.body.timeZone).format('Z'));
    heatmaps = timezone.shiftHeatMapsHours(heatmaps, timeZoneOffset);
    heatmaps.sort(sort.sortHeatmap)
    res.send(heatmaps);
});



export default {
    getHeatmaps
}

