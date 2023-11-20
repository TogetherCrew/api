import { Response } from 'express';
import { memberActivityService, discordServices } from '../services';
import { IAuthRequest } from '../interfaces/Request.interface';
import { catchAsync, charts } from "../utils";
import { DatabaseManager } from '@togethercrew.dev/db'
import { pick } from '../utils';
import { activityCompostionsTypes } from '../config/memberBreakDownTables';


const activeMembersCompositionLineGraph = catchAsync(async function (req: IAuthRequest, res: Response) {
    const connection = DatabaseManager.getInstance().getTenantDb(req.platform?.metadata?.id);
    let activeMembersCompositionLineGraph = await memberActivityService.activeMembersCompositionLineGraph(connection, req.body.startDate, req.body.endDate);
    activeMembersCompositionLineGraph = charts.fillActiveMembersCompositionLineGraph(activeMembersCompositionLineGraph, req.body.startDate, req.body.endDate);
    res.send(activeMembersCompositionLineGraph);
});

const activeMembersOnboardingLineGraph = catchAsync(async function (req: IAuthRequest, res: Response) {
    const connection = DatabaseManager.getInstance().getTenantDb(req.platform?.metadata?.id);
    let activeMembersOnboardingLineGraph = await memberActivityService.activeMembersOnboardingLineGraph(connection, req.body.startDate, req.body.endDate);
    activeMembersOnboardingLineGraph = charts.fillActiveMembersOnboardingLineGraph(activeMembersOnboardingLineGraph, req.body.startDate, req.body.endDate);
    res.send(activeMembersOnboardingLineGraph);
});


const disengagedMembersCompositionLineGraph = catchAsync(async function (req: IAuthRequest, res: Response) {
    const connection = DatabaseManager.getInstance().getTenantDb(req.platform?.metadata?.id);
    let disengagedMembersLineGraph = await memberActivityService.disengagedMembersCompositionLineGraph(connection, req.body.startDate, req.body.endDate);
    disengagedMembersLineGraph = charts.fillDisengagedMembersCompositionLineGraph(disengagedMembersLineGraph, req.body.startDate, req.body.endDate);
    res.send(disengagedMembersLineGraph);
});


const inactiveMembersLineGraph = catchAsync(async function (req: IAuthRequest, res: Response) {
    const connection = DatabaseManager.getInstance().getTenantDb(req.platform?.metadata?.id);
    let inactiveMembersLineGraph = await memberActivityService.inactiveMembersLineGraph(connection, req.body.startDate, req.body.endDate);
    inactiveMembersLineGraph = charts.fillInactiveMembersLineGraph(inactiveMembersLineGraph, req.body.startDate, req.body.endDate);
    res.send(inactiveMembersLineGraph);
});

const membersInteractionsNetworkGraph = catchAsync(async function (req: IAuthRequest, res: Response) {
    const connection = DatabaseManager.getInstance().getTenantDb(req.platform?.metadata?.id);
    const networkGraphData = await memberActivityService.getMembersInteractionsNetworkGraph(req.platform?.metadata?.id, connection)
    res.send(networkGraphData)
})

const decentralisationScore = catchAsync(async function (req: IAuthRequest, res: Response) {
    const decentralizationScoreData = await memberActivityService.getDecentralisationScore(req.platform?.metadata?.id)
    res.send(decentralizationScoreData)
})

const fragmentationScore = catchAsync(async function (req: IAuthRequest, res: Response) {
    const fragmentationScoreData = await memberActivityService.getFragmentationScore(req.platform?.metadata?.id)
    res.send(fragmentationScoreData)
})

const activeMembersCompositionTable = catchAsync(async function (req: IAuthRequest, res: Response) {

    const filter = pick({ ...req.query, ...req.body }, ['activityComposition', 'ngu', 'allRoles', 'include', 'exclude']);
    const options = pick(req.query, ['sortBy', 'limit', 'page']);
    const connection = DatabaseManager.getInstance().getTenantDb(req.platform?.metadata?.id);
    const activityCompostionFields = memberActivityService.getActivityCompositionOfActiveMembersComposition()
    const memberActivity = await memberActivityService.getLastDocumentForTablesUsage(connection, activityCompostionFields);
    const guildMembers = await discordServices.guildMemberService.queryGuildMembers(connection, filter, options, memberActivity, activityCompostionsTypes.activeMembersComposition);

    const roles = await discordServices.roleService.getRoles(connection, {});
    if (guildMembers) {
        guildMembers.results.forEach((guildMember) => {
            guildMember.roles = discordServices.roleService.getRolesForGuildMember(guildMember, roles);
            guildMember.ngu = discordServices.guildMemberService.getNgu(guildMember);
            guildMember.activityComposition = memberActivityService.getActivityComposition(guildMember, memberActivity, filter.activityComposition);
            guildMember.username = discordServices.guildMemberService.getUsername(guildMember);
        });
    }
    res.send(guildMembers);
});

const activeMembersOnboardingTable = catchAsync(async function (req: IAuthRequest, res: Response) {
    const filter = pick({ ...req.query, ...req.body }, ['activityComposition', 'ngu', 'allRoles', 'include', 'exclude']);
    const options = pick(req.query, ['sortBy', 'limit', 'page']);
    const connection = DatabaseManager.getInstance().getTenantDb(req.platform?.metadata?.id);
    const activityCompostionFields = memberActivityService.getActivityCompositionOfActiveMembersOnboarding();
    const memberActivity = await memberActivityService.getLastDocumentForTablesUsage(connection, activityCompostionFields);
    const guildMembers = await discordServices.guildMemberService.queryGuildMembers(connection, filter, options, memberActivity, activityCompostionsTypes.activeMembersOnboarding);
    const roles = await discordServices.roleService.getRoles(connection, {});
    if (guildMembers) {
        guildMembers.results.forEach((guildMember) => {
            guildMember.roles = discordServices.roleService.getRolesForGuildMember(guildMember, roles);
            guildMember.ngu = discordServices.guildMemberService.getNgu(guildMember);
            guildMember.activityComposition = memberActivityService.getActivityComposition(guildMember, memberActivity, filter.activityComposition);
            guildMember.username = discordServices.guildMemberService.getUsername(guildMember);
        });
    }
    res.send(guildMembers);
});

const disengagedMembersCompositionTable = catchAsync(async function (req: IAuthRequest, res: Response) {
    const filter = pick({ ...req.query, ...req.body }, ['activityComposition', 'ngu', 'allRoles', 'include', 'exclude']);
    const options = pick(req.query, ['sortBy', 'limit', 'page']);
    const connection = DatabaseManager.getInstance().getTenantDb(req.platform?.metadata?.id);
    const activityCompostionFields = memberActivityService.getActivityCompositionOfDisengagedComposition();
    const memberActivity = await memberActivityService.getLastDocumentForTablesUsage(connection, activityCompostionFields);
    const guildMembers = await discordServices.guildMemberService.queryGuildMembers(connection, filter, options, memberActivity, activityCompostionsTypes.disengagedMembersCompostion);
    const roles = await discordServices.roleService.getRoles(connection, {});
    if (guildMembers) {
        guildMembers.results.forEach((guildMember) => {
            guildMember.roles = discordServices.roleService.getRolesForGuildMember(guildMember, roles);
            guildMember.ngu = discordServices.guildMemberService.getNgu(guildMember);
            guildMember.activityComposition = memberActivityService.getActivityComposition(guildMember, memberActivity, filter.activityComposition);
            guildMember.username = discordServices.guildMemberService.getUsername(guildMember);
        });
    }
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
