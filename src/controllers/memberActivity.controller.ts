import { Response } from 'express';
import { guildService, memberActivityService } from '../services';
import { IAuthRequest } from '../interfaces/request.interface';
import { catchAsync, ApiError, charts } from "../utils";
import { databaseService } from 'tc_dbcomm'
import httpStatus from 'http-status';
import config from '../config';



const activeMembersLineGraph = catchAsync(async function (req: IAuthRequest, res: Response) {
    // if (!await guildService.getGuild({ guildId: req.params.guildId, user: req.user.discordId })) {
    //     throw new ApiError(httpStatus.NOT_FOUND, 'Guild not found');
    // }
    const connection = databaseService.connectionFactory(req.params.guildId, config.mongoose.botURL);
    const activeMembersLineGraph = await memberActivityService.activeMembersLineGraph(connection, req.body.startDate, req.body.endDate);
    // activeMembersLineGraph = charts.fillLineGraph(activeMembersLineGraph, req.body.startDate, req.body.endDate);
    res.send(activeMembersLineGraph);
});


export default {
    activeMembersLineGraph
}

