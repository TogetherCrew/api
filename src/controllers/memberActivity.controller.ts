import { Response } from 'express';
import { guildService, memberActivityService, guildMemberService } from '../services';
import { IAuthRequest } from '../interfaces/request.interface';
import { catchAsync, ApiError, charts } from "../utils";
import { databaseService } from '@togethercrew.dev/db'
import httpStatus from 'http-status';
import config from '../config';
import { pick } from '../utils';



const activeMembersCompositionLineGraph = catchAsync(async function (req: IAuthRequest, res: Response) {
    if (!await guildService.getGuild({ guildId: req.params.guildId, user: req.user.discordId })) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Guild not found');
    }
    const connection = databaseService.connectionFactory(req.params.guildId, config.mongoose.botURL);
    let activeMembersCompositionLineGraph = await memberActivityService.activeMembersCompositionLineGraph(connection, req.body.startDate, req.body.endDate);
    activeMembersCompositionLineGraph = charts.fillActiveMembersCompositionLineGraph(activeMembersCompositionLineGraph, req.body.startDate, req.body.endDate);
    res.send(activeMembersCompositionLineGraph);
});

const activeMembersOnboardingLineGraph = catchAsync(async function (req: IAuthRequest, res: Response) {
    if (!await guildService.getGuild({ guildId: req.params.guildId, user: req.user.discordId })) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Guild not found');
    }
    const connection = databaseService.connectionFactory(req.params.guildId, config.mongoose.botURL);
    let activeMembersOnboardingLineGraph = await memberActivityService.activeMembersOnboardingLineGraph(connection, req.body.startDate, req.body.endDate);
    activeMembersOnboardingLineGraph = charts.fillActiveMembersOnboardingLineGraph(activeMembersOnboardingLineGraph, req.body.startDate, req.body.endDate);
    res.send(activeMembersOnboardingLineGraph);
});


const disengagedMembersCompositionLineGraph = catchAsync(async function (req: IAuthRequest, res: Response) {
    if (!await guildService.getGuild({ guildId: req.params.guildId, user: req.user.discordId })) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Guild not found');
    }
    const connection = databaseService.connectionFactory(req.params.guildId, config.mongoose.botURL);
    let disengagedMembersLineGraph = await memberActivityService.disengagedMembersCompositionLineGraph(connection, req.body.startDate, req.body.endDate);
    disengagedMembersLineGraph = charts.fillDisengagedMembersCompositionLineGraph(disengagedMembersLineGraph, req.body.startDate, req.body.endDate);
    res.send(disengagedMembersLineGraph);
});


const inactiveMembersLineGraph = catchAsync(async function (req: IAuthRequest, res: Response) {
    if (!await guildService.getGuild({ guildId: req.params.guildId, user: req.user.discordId })) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Guild not found');
    }
    const connection = databaseService.connectionFactory(req.params.guildId, config.mongoose.botURL);
    let inactiveMembersLineGraph = await memberActivityService.inactiveMembersLineGraph(connection, req.body.startDate, req.body.endDate);
    inactiveMembersLineGraph = charts.fillInactiveMembersLineGraph(inactiveMembersLineGraph, req.body.startDate, req.body.endDate);
    res.send(inactiveMembersLineGraph);
});

const membersInteractionsNetworkGraph = catchAsync(async function (req: IAuthRequest, res: Response) {
    if (!await guildService.getGuild({ guildId: req.params.guildId, user: req.user.discordId })) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Guild not found');
    }
    const guildId = req.params.guildId 
    const connection = databaseService.connectionFactory(guildId, config.mongoose.botURL);

    const networkGraphData = await memberActivityService.getMembersInteractionsNetworkGraph(guildId, connection)
    
    res.send(networkGraphData)
})

const activeMembersCompositionTable = catchAsync(async function (req: IAuthRequest, res: Response) {
    if (!await guildService.getGuild({ guildId: req.params.guildId, user: req.user.discordId })) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Guild not found');
    }
    const filter = pick(req.query, ['activityComposition', 'roles', 'username']);
    const options = pick(req.query, ['sortBy', 'limit', 'page']);
    const connection = databaseService.connectionFactory(req.params.guildId, config.mongoose.botURL);
    const memberActivity = await memberActivityService.getLastDocumentForActiveMembersCompositionTable(connection, filter.activityComposition);
    const guildMembers = await guildMemberService.queryGuildMembers(connection, filter, options, memberActivity);
    const roles = await guildService.getGuildRolesFromDiscordAPI(req.params.guildId);
    if (guildMembers) {
        guildMemberService.addNeededDataForTable(guildMembers.results, roles, memberActivity);
    }
    res.send(guildMembers);
});

export default {
    activeMembersCompositionLineGraph,
    activeMembersOnboardingLineGraph,
    disengagedMembersCompositionLineGraph,
    inactiveMembersLineGraph,
    membersInteractionsNetworkGraph,
    activeMembersCompositionTable
}
