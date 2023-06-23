import { Response } from 'express';
import { guildService, memberActivityService, guildMemberService } from '../services';
import { IAuthRequest } from '../interfaces/request.interface';
import { catchAsync, ApiError, charts } from "../utils";
import { databaseService } from '@togethercrew.dev/db'
import httpStatus from 'http-status';
import config from '../config';
import * as Neo4j from '../neo4j';
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

const memberInteractionsGraph = catchAsync(async function (req: IAuthRequest, res: Response) {
    if (!await guildService.getGuild({ guildId: req.params.guildId, user: req.user.discordId })) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Guild not found');
    }
    const guildId = req.params.guildId 

    const oneWeekMilliseconds = 7 * 24 * 60 * 60 * 1000; // Number of milliseconds in a week
    const currentDate = new Date();
    const oneWeekAgo = new Date(currentDate.getTime() - oneWeekMilliseconds);
    const oneWeekAgoEpoch = Math.floor(oneWeekAgo.getTime() / 1000); // Convert to seconds

    const memberInteractionQueryOne = `
        MATCH (a:DiscordAccount) -[r:INTERACTED]-(:DiscordAccount)
        WITH r, apoc.coll.zip(r.dates, r.weights) as date_weights
        SET r.weekly_weight = REDUCE(total=0, w in date_weights 
        | CASE WHEN w[0] >= ${oneWeekAgoEpoch} THEN total + w[1] ELSE total END);
        `
    const memberInteractionQueryTwo = `
        MATCH (a:DiscordAccount) -[r:INTERACTED]-> ()
        WITH a, SUM(r.weekly_weight) as interaction_count
        SET a.weekly_interaction = interaction_count;
    `
    const memberInteractionQueryThree = `
        MATCH (a:DiscordAccount) -[r:INTERACTED]->(b:DiscordAccount)
        WITH a,r,b
        WHERE (a)-[:IS_MEMBER]->(:Guild {guildId:"${guildId}"}) 
        AND  (b)-[:IS_MEMBER]->(:Guild {guildId:"${guildId}"})
        RETURN a,r,b
    `
    await Neo4j.write(memberInteractionQueryOne)
    await Neo4j.write(memberInteractionQueryTwo)
    const neo4jData = await Neo4j.read(memberInteractionQueryThree)

    const { records } = neo4jData;
    const userIds: string[] = [] // Our Graph DB does not have the names of users, so we load them all and push them to an array we want to send to front-end 
    let makedUpRecords = records.reduce( (preRecords: any[], record) => {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        const { _fieldLookup, _fields } = record
        const a = _fields[_fieldLookup['a']]
        const r = _fields[_fieldLookup['r']]
        const b = _fields[_fieldLookup['b']]
        
        const aWeeklyInteraction = a?.properties?.weekly_interaction
        const aUserId = a?.properties?.userId

        const rWeeklyInteraction = r?.properties?.weekly_weight

        const bWeeklyInteraction = b?.properties?.weekly_interaction
        const bUserId = b?.properties?.userId


        if( aWeeklyInteraction && rWeeklyInteraction && bWeeklyInteraction){
            const interaction = {
                from: { id: aUserId, radius: aWeeklyInteraction},
                to: { id: bUserId, radius: bWeeklyInteraction },
                width: rWeeklyInteraction
            }
            userIds.push(aUserId)
            userIds.push(bUserId)

            preRecords.push(interaction)
        }

        return preRecords
    }, [])

    const connection = databaseService.connectionFactory(guildId, config.mongoose.botURL);
    const userProjection = { discordId: 1, username: 1 }
    const usersInfo = await connection.models.GuildMember.find({}, { _id: 0, discordId: 1, username: 1 }) as typeof userProjection[]

    // insert username of user to the response object
    makedUpRecords = makedUpRecords.map(record => {
        const fromId = record.from.id
        const toId = record.to.id
        
        const fromUser = usersInfo.find(user => user.discordId === fromId)
        const fromUsername = fromUser?.username
        
        const toUser = usersInfo.find(user => user.discordId === toId)
        const toUsername = toUser?.username

        record.from.username = fromUsername || null
        record.to.username = toUsername || null

        return record
    })

    res.send(makedUpRecords)
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
    memberInteractionsGraph,
    activeMembersCompositionTable
}
