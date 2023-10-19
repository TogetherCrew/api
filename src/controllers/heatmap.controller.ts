import { Response } from 'express';
import { heatmapService } from '../services';
import { IAuthRequest } from '../interfaces/request.interface';
import { catchAsync, ApiError, date, charts } from "../utils";
import { databaseService } from '@togethercrew.dev/db'
import httpStatus from 'http-status';
import config from '../config';
import moment from 'moment-timezone';
import { closeConnection } from '../database/connection';

const heatmapChart = catchAsync(async function (req: IAuthRequest, res: Response) {
    // if (!await guildService.getGuild({ guildId: req.params.guildId, user: req.user.discordId })) {
    //     throw new ApiError(httpStatus.NOT_FOUND, 'Guild not found');
    // }
    if (req.body.channelIds.length === 0) {
        return res.send(charts.fillHeatmapChart([]))
    }
    const connection = databaseService.connectionFactory(req.params.guildId, config.mongoose.botURL);
    let heatmaps = await heatmapService.getHeatmapChart(connection, req.body);
    const timeZoneOffset = parseInt(moment().tz(req.body.timeZone).format('Z'));

    if (timeZoneOffset !== 0) {
        heatmaps = date.shiftHeatmapsHours(heatmaps, timeZoneOffset);
    }
    heatmaps = charts.fillHeatmapChart(heatmaps);
    await closeConnection(connection)
    res.send(heatmaps);
});

const lineGraph = catchAsync(async function (req: IAuthRequest, res: Response) {
    // if (!await guildService.getGuild({ guildId: req.params.guildId, user: req.user.discordId })) {
    //     throw new ApiError(httpStatus.NOT_FOUND, 'Guild not found');
    // }
    const connection = databaseService.connectionFactory(req.params.guildId, config.mongoose.botURL);
    let lineGraph = await heatmapService.lineGraph(connection, req.body.startDate, req.body.endDate);
    lineGraph = charts.fillHeatmapLineGraph(lineGraph, req.body.startDate, req.body.endDate);
    await closeConnection(connection)
    res.send(lineGraph);
});


export default {
    heatmapChart,
    lineGraph
}

