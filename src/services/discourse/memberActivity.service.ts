import { Connection } from 'mongoose';
import NodeStats from '../../utils/enums/nodeStats.enum';
import * as Neo4j from '../../neo4j';
import parentLogger from '../../config/logger';
import { NEO4J_PLATFORM_INFO } from '../../constants/neo4j.constant';
import { SupportedNeo4jPlatforms } from '../../types/neo4j.type';
import { DatabaseManager } from '@togethercrew.dev/db';
import { ApiError } from '../../utils';
import httpStatus from 'http-status';

const logger = parentLogger.child({ module: 'DiscourseMemberActivityService' });

function getNgu(user: any): string {
  if (user.options.name !== '') {
    return user.options.name;
  } else {
    return user.options.username;
  }
}

type networkGraphUserInformationType = {
  username: string;
  avatar: string | null | undefined;
  joinedAt: Date | null;
  roles: [];
  ngu: string;
};

function getUserInformationForNetworkGraph(user: any): networkGraphUserInformationType {
  return {
    username: user.options.username,
    avatar: user.options.avatar,
    joinedAt: user.joined_at,
    roles: [],
    ngu: getNgu(user),
  };
}

type memberInteractionType = { id: string; radius: number; stats: NodeStats } & networkGraphUserInformationType;
type memberInteractionsGraphResponseType = { width: number; from: memberInteractionType; to: memberInteractionType }[];
async function getMembersInteractionsNetworkGraph(
  platformId: string,
  platformName: SupportedNeo4jPlatforms,
): Promise<memberInteractionsGraphResponseType> {
  try {
    const platformConnection = await DatabaseManager.getInstance().getPlatformDb(platformId);
    const usersInNetworkGraph: string[] = [];
    // userInteraction
    const usersInteractionsQuery = `
    MATCH () -[r:INTERACTED_WITH {platformId: "${platformId}"}]-()
    WITH max(r.date) as latest_date
    MATCH (a:${NEO4J_PLATFORM_INFO[platformName].member})-[r:INTERACTED_WITH {platformId: "${platformId}", date: latest_date}]->(b:${NEO4J_PLATFORM_INFO[platformName].member})
    RETURN a, r, b`;

    const neo4jUsersInteractionsData = await Neo4j.read(usersInteractionsQuery);
    const { records: neo4jUsersInteractions } = neo4jUsersInteractionsData;
    const usersInteractions = neo4jUsersInteractions.map((usersInteraction) => {
      // @ts-ignore
      const { _fieldLookup, _fields } = usersInteraction;
      const a = _fields[_fieldLookup['a']];
      const r = _fields[_fieldLookup['r']];
      const b = _fields[_fieldLookup['b']];

      const aUserId = a?.properties?.id as string;
      const rWeeklyInteraction = r?.properties?.weight as number;
      const bUserId = b?.properties?.id as string;

      usersInNetworkGraph.push(aUserId);
      usersInNetworkGraph.push(bUserId);
      const interaction = {
        aUserId,
        bUserId,
        rWeeklyInteraction,
      };

      return interaction;
    });

    // userRadius
    const userRadiusQuery = `
    MATCH () -[r:INTERACTED_WITH {platformId: "${platformId}"}]-()
    WITH max(r.date) as latest_date
    MATCH (a:${NEO4J_PLATFORM_INFO[platformName].member}) -[r:INTERACTED_WITH {date: latest_date, platformId :"${platformId}"}]-(:${NEO4J_PLATFORM_INFO[platformName].member})
    WITH a, r 
    RETURN a.id as userId, SUM(r.weight) as radius`;
    const neo4jUserRadiusData = await Neo4j.read(userRadiusQuery);
    const { records: neo4jUserRadius } = neo4jUserRadiusData;
    const userRadius = neo4jUserRadius.map((userRadius) => {
      // @ts-ignore
      const { _fieldLookup, _fields } = userRadius;
      const userId = _fields[_fieldLookup['userId']] as string;
      const radius = _fields[_fieldLookup['radius']] as number;

      return { userId, radius };
    });
    // userStatus
    const userStatusQuery = `
    MATCH () -[r:INTERACTED_IN]-(g:${NEO4J_PLATFORM_INFO[platformName].platform} {id: "${platformId}"})
    WITH max(r.date) as latest_date
    MATCH (a:${NEO4J_PLATFORM_INFO[platformName].member})-[r:INTERACTED_IN {date: latest_date}]->(g:${NEO4J_PLATFORM_INFO[platformName].platform} {id: "${platformId}"})
    RETURN a.id as userId, r.status as status`;
    const neo4jUserStatusData = await Neo4j.read(userStatusQuery);
    const { records: neo4jUserStatus } = neo4jUserStatusData;
    const userStatus = neo4jUserStatus.map((userStatus) => {
      // @ts-ignore
      const { _fieldLookup, _fields } = userStatus;
      const userId = _fields[_fieldLookup['userId']] as string;
      const status = _fields[_fieldLookup['status']] as number;
      const stats =
        status == 0 ? NodeStats.SENDER : status == 1 ? NodeStats.RECEIVER : status == 2 ? NodeStats.BALANCED : null;

      return { userId, stats };
    });

    const usersInfo = await platformConnection.db
      .collection('rawmembers')
      .find({ id: { $in: usersInNetworkGraph } })
      .toArray();

    // prepare data
    const response = usersInteractions.flatMap((interaction) => {
      const { aUserId, bUserId, rWeeklyInteraction } = interaction;
      // Radius
      const aUserRadiusObj = userRadius.find((userRadius) => userRadius.userId == aUserId);
      const aUserRadius = aUserRadiusObj?.radius as number;
      const bUserRadiusObj = userRadius.find((userRadius) => userRadius.userId == bUserId);
      const bUserRadius = bUserRadiusObj?.radius as number;
      // Status
      const aUserStatsObj = userStatus.find((userStatus) => userStatus.userId == aUserId);
      const aUserStats = aUserStatsObj?.stats;
      const bUserStatsObj = userStatus.find((userStatus) => userStatus.userId == bUserId);
      const bUserStats = bUserStatsObj?.stats;

      // userInfo
      const aUser = usersInfo.find((user) => user.id === aUserId);
      const bUser = usersInfo.find((user) => user.id === bUserId);
      if (!aUser || !bUser) return [];

      const aInfo = getUserInformationForNetworkGraph(aUser);
      const bInfo = getUserInformationForNetworkGraph(bUser);

      if (!aUserStats || !bUserStats) {
        return [];
      }

      return {
        from: { id: aUserId, radius: aUserRadius, stats: aUserStats, ...aInfo },
        to: { id: bUserId, radius: bUserRadius, stats: bUserStats, ...bInfo },
        width: rWeeklyInteraction,
      };
    });

    return response;
  } catch (error) {
    logger.error(error, 'Failed to get discourse members interaction network graph');
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to get discourse members interaction network graph');
  }
}
/**
 * Constructs a projection stage object for MongoDB aggregation pipeline based on the provided activity composition fields.
 *
 * @param {Array<string>} fields - The activity composition fields to include in the projection. Each field corresponds to a property in the database documents.
 * @returns {Stage} The projection stage object. It includes a '_id' field set to '0', an 'all' field with an empty '$setUnion', and additional fields based on the 'fields' parameter. Each additional field is prefixed with a '$'.
 */
function buildProjectStageBasedOnActivityComposition(fields: Array<string>) {
  const initialStage: {
    _id: string;
    all: { $setUnion: Array<string> };
    [key: string]: string | { $setUnion: Array<string> };
  } = {
    _id: '0',
    all: { $setUnion: [] },
  };

  const finalStage = fields.reduce((stage, field) => {
    stage[field] = `$${field}`;
    stage.all.$setUnion.push(`$${field}`);
    return stage;
  }, initialStage);

  return finalStage;
}

/**
 * get activity composition fileds of active member onboarding table
 * @returns {Object}
 */
function getActivityCompositionOfActiveMembersComposition() {
  return ['all_active', 'all_new_active', 'all_consistent', 'all_vital', 'all_new_disengaged'];
}

/**
 * get activity composition fileds of active member compostion table
 * @returns {Object}
 */
function getActivityCompositionOfActiveMembersOnboarding() {
  return ['all_joined', 'all_new_active', 'all_still_active', 'all_dropped'];
}

/**
 * get activity composition fileds of disengaged member compostion table
 * @returns {Object}
 */
function getActivityCompositionOfDisengagedComposition() {
  return [
    'all_new_disengaged',
    'all_disengaged_were_newly_active',
    'all_disengaged_were_consistently_active',
    'all_disengaged_were_vital',
  ];
}

/**
 * get last member activity document for usage of member activity table
 * @param {Connection} platformConnection
 * @param {Any} activityComposition
 * @returns {Object}
 */
async function getLastDocumentForTablesUsage(platformConnection: Connection, activityComposition: Array<string>) {
  const projectStage = buildProjectStageBasedOnActivityComposition(activityComposition);
  const lastDocument = await platformConnection.models.MemberActivity.aggregate([
    { $sort: { date: -1 } },
    { $limit: 1 },
    { $project: projectStage },
  ]);
  return lastDocument[0];
}

function getActivityComposition(discourseMember: any, memberActivity: any, activityComposition: Array<string>) {
  const activityTypes = [
    { key: 'all_new_active', message: 'Newly active' },
    { key: 'all_new_disengaged', message: 'Became disengaged' },
    { key: 'all_active', message: 'Active members' },
    { key: 'all_consistent', message: 'Consistently active' },
    { key: 'all_vital', message: 'Vital member' },
    { key: 'all_joined', message: 'Joined' },
    { key: 'all_dropped', message: 'Dropped' },
    { key: 'all_still_active', message: 'Still active' },
    { key: 'all_disengaged_were_newly_active', message: 'Were newly active' },
    { key: 'all_disengaged_were_consistently_active', message: 'Were consistenly active' },
    { key: 'all_disengaged_were_vital', message: 'Were vital members' },
  ];

  const activityCompositions = [];

  activityTypes.forEach((activityType) => {
    if (
      memberActivity[activityType.key] &&
      memberActivity[activityType.key].includes(discourseMember.id) &&
      (!activityComposition || activityComposition.length === 0 || activityComposition.includes(activityType.key))
    ) {
      activityCompositions.push(activityType.message);
    }
  });

  if (activityCompositions.length === 0) {
    activityCompositions.push('Others');
  }

  return activityCompositions;
}

export default {
  getMembersInteractionsNetworkGraph,
  getLastDocumentForTablesUsage,
  getActivityComposition,
  getActivityCompositionOfActiveMembersComposition,
  getActivityCompositionOfActiveMembersOnboarding,
  getActivityCompositionOfDisengagedComposition,
};
