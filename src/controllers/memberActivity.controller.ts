import { Response } from 'express';
import { guildService, memberActivityService, guildMemberService, roleService } from '../services';
import { IAuthRequest } from '../interfaces/request.interface';
import { catchAsync, ApiError, charts } from "../utils";
import { databaseService } from '@togethercrew.dev/db'
import httpStatus from 'http-status';
import config from '../config';
import { pick } from '../utils';
import { closeConnection } from '../database/connection';
import { activityCompostionsTypes } from '../config/memberBreakDownTables';


const activeMembersCompositionLineGraph = catchAsync(async function (req: IAuthRequest, res: Response) {
    if (!await guildService.getGuild({ guildId: req.params.guildId, user: req.user.discordId })) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Guild not found');
    }
    const connection = databaseService.connectionFactory(req.params.guildId, config.mongoose.botURL);
    let activeMembersCompositionLineGraph = await memberActivityService.activeMembersCompositionLineGraph(connection, req.body.startDate, req.body.endDate);
    activeMembersCompositionLineGraph = charts.fillActiveMembersCompositionLineGraph(activeMembersCompositionLineGraph, req.body.startDate, req.body.endDate);
    await closeConnection(connection)
    res.send(activeMembersCompositionLineGraph);
});

const activeMembersOnboardingLineGraph = catchAsync(async function (req: IAuthRequest, res: Response) {
    if (!await guildService.getGuild({ guildId: req.params.guildId, user: req.user.discordId })) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Guild not found');
    }
    const connection = databaseService.connectionFactory(req.params.guildId, config.mongoose.botURL);
    let activeMembersOnboardingLineGraph = await memberActivityService.activeMembersOnboardingLineGraph(connection, req.body.startDate, req.body.endDate);
    activeMembersOnboardingLineGraph = charts.fillActiveMembersOnboardingLineGraph(activeMembersOnboardingLineGraph, req.body.startDate, req.body.endDate);
    await closeConnection(connection)
    res.send(activeMembersOnboardingLineGraph);
});


const disengagedMembersCompositionLineGraph = catchAsync(async function (req: IAuthRequest, res: Response) {
    if (!await guildService.getGuild({ guildId: req.params.guildId, user: req.user.discordId })) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Guild not found');
    }
    const connection = databaseService.connectionFactory(req.params.guildId, config.mongoose.botURL);
    let disengagedMembersLineGraph = await memberActivityService.disengagedMembersCompositionLineGraph(connection, req.body.startDate, req.body.endDate);
    disengagedMembersLineGraph = charts.fillDisengagedMembersCompositionLineGraph(disengagedMembersLineGraph, req.body.startDate, req.body.endDate);
    await closeConnection(connection)
    res.send(disengagedMembersLineGraph);
});


const inactiveMembersLineGraph = catchAsync(async function (req: IAuthRequest, res: Response) {
    if (!await guildService.getGuild({ guildId: req.params.guildId, user: req.user.discordId })) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Guild not found');
    }
    const connection = databaseService.connectionFactory(req.params.guildId, config.mongoose.botURL);
    let inactiveMembersLineGraph = await memberActivityService.inactiveMembersLineGraph(connection, req.body.startDate, req.body.endDate);
    inactiveMembersLineGraph = charts.fillInactiveMembersLineGraph(inactiveMembersLineGraph, req.body.startDate, req.body.endDate);
    await closeConnection(connection)
    res.send(inactiveMembersLineGraph);
});

const membersInteractionsNetworkGraph = catchAsync(async function (req: IAuthRequest, res: Response) {
    if (!await guildService.getGuild({ guildId: req.params.guildId, user: req.user.discordId })) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Guild not found');
    }
    const guildId = req.params.guildId
    const connection = databaseService.connectionFactory(guildId, config.mongoose.botURL);

    const networkGraphData = await memberActivityService.getMembersInteractionsNetworkGraph(guildId, connection)
    await closeConnection(connection)
    res.send(networkGraphData)
})

const decentralisationScore = catchAsync(async function (req: IAuthRequest, res: Response) {
    if (!await guildService.getGuild({ guildId: req.params.guildId, user: req.user.discordId })) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Guild not found');
    }
    const guildId = req.params.guildId

    const decentralizationScoreData = await memberActivityService.getDecentralisationScore(guildId)
    res.send(decentralizationScoreData)
})

const fragmentationScore = catchAsync(async function (req: IAuthRequest, res: Response) {
    if (!await guildService.getGuild({ guildId: req.params.guildId, user: req.user.discordId })) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Guild not found');
    }
    const guildId = req.params.guildId

    const fragmentationScoreData = await memberActivityService.getFragmentationScore(guildId)
    res.send(fragmentationScoreData)
})

const activeMembersCompositionTable = catchAsync(async function (req: IAuthRequest, res: Response) {
    if (!await guildService.getGuild({ guildId: req.params.guildId, user: req.user.discordId })) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Guild not found');
    }
    const filter = pick(req.query, ['activityComposition', 'roles', 'ngu']);
    const options = pick(req.query, ['sortBy', 'limit', 'page']);
    const connection = databaseService.connectionFactory(req.params.guildId, config.mongoose.botURL);
    const activityCompostionFields = memberActivityService.getActivityCompositionOfActiveMembersComposition()
    const memberActivity = await memberActivityService.getLastDocumentForTablesUsage(connection, activityCompostionFields);
    const guildMembers = await guildMemberService.queryGuildMembers(connection, filter, options, memberActivity, activityCompostionsTypes.activeMembersComposition);
    const roles = await roleService.getRoles(connection, {});
    if (guildMembers) {
        guildMembers.results.forEach((guildMember) => {
            guildMember.roles = roleService.getRolesForGuildMember(guildMember, roles);
            guildMember.ngu = guildMemberService.getNgu(guildMember);
            guildMember.activityComposition = memberActivityService.getActivityComposition(guildMember, memberActivity, filter.activityComposition);
            guildMember.username = guildMemberService.getUsername(guildMember);
        });
    }
    await closeConnection(connection)
    res.send(guildMembers);
});

const activeMembersOnboardingTable = catchAsync(async function (req: IAuthRequest, res: Response) {
    if (!await guildService.getGuild({ guildId: req.params.guildId, user: req.user.discordId })) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Guild not found');
    }
    const filter = pick(req.query, ['activityComposition', 'roles', 'ngu']);
    const options = pick(req.query, ['sortBy', 'limit', 'page']);
    const connection = databaseService.connectionFactory(req.params.guildId, config.mongoose.botURL);
    const activityCompostionFields = memberActivityService.getActivityCompositionOfActiveMembersOnboarding();
    const memberActivity = await memberActivityService.getLastDocumentForTablesUsage(connection, activityCompostionFields);
    const guildMembers = await guildMemberService.queryGuildMembers(connection, filter, options, memberActivity, activityCompostionsTypes.activeMembersOnboarding);
    const roles = await roleService.getRoles(connection, {});
    if (guildMembers) {
        guildMembers.results.forEach((guildMember) => {
            guildMember.roles = roleService.getRolesForGuildMember(guildMember, roles);
            guildMember.ngu = guildMemberService.getNgu(guildMember);
            guildMember.activityComposition = memberActivityService.getActivityComposition(guildMember, memberActivity, filter.activityComposition);
            guildMember.username = guildMemberService.getUsername(guildMember);
        });
    }
    await closeConnection(connection)
    res.send(guildMembers);
});

const disengagedMembersCompositionTable = catchAsync(async function (req: IAuthRequest, res: Response) {
    if (!await guildService.getGuild({ guildId: req.params.guildId, user: req.user.discordId })) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Guild not found');
    }
    const filter = pick(req.query, ['activityComposition', 'roles', 'ngu']);
    const options = pick(req.query, ['sortBy', 'limit', 'page']);
    const connection = databaseService.connectionFactory(req.params.guildId, config.mongoose.botURL);
    const activityCompostionFields = memberActivityService.getActivityCompositionOfDisengagedComposition();
    const memberActivity = await memberActivityService.getLastDocumentForTablesUsage(connection, activityCompostionFields);
    const guildMembers = await guildMemberService.queryGuildMembers(connection, filter, options, memberActivity, activityCompostionsTypes.disengagedMembersCompostion);
    const roles = await roleService.getRoles(connection, {});
    if (guildMembers) {
        guildMembers.results.forEach((guildMember) => {
            guildMember.roles = roleService.getRolesForGuildMember(guildMember, roles);
            guildMember.ngu = guildMemberService.getNgu(guildMember);
            guildMember.activityComposition = memberActivityService.getActivityComposition(guildMember, memberActivity, filter.activityComposition);
            guildMember.username = guildMemberService.getUsername(guildMember);
        });
    }
    await closeConnection(connection)
    res.send(guildMembers);
});

export default {
    activeMembersCompositionLineGraph,
    activeMembersOnboardingLineGraph,
    disengagedMembersCompositionLineGraph,
    inactiveMembersLineGraph,
    membersInteractionsNetworkGraph,
    decentralisationScore,
    fragmentationScore,
    activeMembersCompositionTable,
    activeMembersOnboardingTable,
    disengagedMembersCompositionTable
}
