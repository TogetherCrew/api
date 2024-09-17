import NodeStats from '../../utils/enums/nodeStats.enum';
import * as Neo4j from '../../neo4j';
import parentLogger from '../../config/logger';
import { NEO4J_PLATFORM_INFO } from '../../constants/neo4j.constant';
import { SupportedNeo4jPlatforms } from '../../types/neo4j.type';
import { DatabaseManager } from '@togethercrew.dev/db';

const logger = parentLogger.child({ module: 'DiscourseMemberActivityService' });

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
    ngu: user.options.name,
  };
}

type memberInteractionType = { id: string; radius: number; stats: NodeStats } & networkGraphUserInformationType;
type memberInteractionsGraphResponseType = { width: number; from: memberInteractionType; to: memberInteractionType }[];
async function getMembersInteractionsNetworkGraph(
  platformId: string,
  platformName: SupportedNeo4jPlatforms,
): Promise<memberInteractionsGraphResponseType> {
  const platformConnection = await DatabaseManager.getInstance().getPlatformDb(platformId);
  const usersInNetworkGraph: string[] = [];
  console.log(platformId, NEO4J_PLATFORM_INFO[platformName].member, NEO4J_PLATFORM_INFO[platformName].member);
  // userInteraction
  const usersInteractionsQuery = `
    MATCH () -[r:INTERACTED_WITH {platformId: "${platformId}"}]-()
    WITH max(r.date) as latest_date
    MATCH (a:${NEO4J_PLATFORM_INFO[platformName].member})-[r:INTERACTED_WITH {platformId: "${platformId}", date: latest_date}]->(b:${NEO4J_PLATFORM_INFO[platformName].member})
    RETURN a, r, b`;

  console.log(usersInteractionsQuery);
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
  console.log('usersInteractions', usersInteractions);
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

  console.log('usersInNetworkGraph', usersInNetworkGraph);
  // usersInfo
  const usersInfo = await platformConnection.models.rawmembers.find({ id: { $in: usersInNetworkGraph } });
  console.log(usersInfo);

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
    const aUser = usersInfo.find((user) => user.discordId === aUserId);
    const bUser = usersInfo.find((user) => user.discordId === bUserId);
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
}

export default {
  getMembersInteractionsNetworkGraph,
};
