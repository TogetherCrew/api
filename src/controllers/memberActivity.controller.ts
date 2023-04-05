import { Response } from 'express';
import { guildService, memberActivityService } from '../services';
import { IAuthRequest } from '../interfaces/request.interface';
import { catchAsync, ApiError, charts } from "../utils";
import { databaseService } from 'tc_dbcomm'
import httpStatus from 'http-status';
import config from '../config';



const activeMembersCompositionLineGraph = catchAsync(async function (req: IAuthRequest, res: Response) {
    if (!await guildService.getGuild({ guildId: req.params.guildId, user: req.user.discordId })) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Guild not found');
    }
    const connection = databaseService.connectionFactory(req.params.guildId, config.mongoose.botURL);
    let activeMembersLineGraph = await memberActivityService.activeMembersCompositionLineGraph(connection, req.body.startDate, req.body.endDate);
    activeMembersLineGraph = charts.fillActiveMembersCompositionLineGraph(activeMembersLineGraph, req.body.startDate, req.body.endDate);
    res.send(activeMembersLineGraph);
});

const activeMembersOnboardingLineGraph = catchAsync(async function (req: IAuthRequest, res: Response) {
    const mockData = {
        categories: ['21 Jan', '22 Jan', '23 Jan', '24 Jan', '25 Jan', '26 Jan', '27 Jan'],
        series: [
            { name: 'joined', data: [2, 4, 6, 8, 10, 2, 4] },
            { name: 'newlyActive', data: [2, 4, 6, 8, 10, 2, 4] },
            { name: 'stillActive', data: [2, 4, 6, 8, 10, 2, 4] },
            { name: 'dropped', data: [2, 4, 6, 8, 10, 2, 4] }
        ],
        joined: 36,
        newlyActive: 36,
        stillActive: 36,
        dropped: 36,
        joinedPercentageChange: 100,
        newlyActivePercentageChange: 100,
        stillActivePercentageChange: 100,
        droppedPercentageChange: 100,
    }
    res.send(mockData);
});

export default {
    activeMembersCompositionLineGraph,
    activeMembersOnboardingLineGraph
}

