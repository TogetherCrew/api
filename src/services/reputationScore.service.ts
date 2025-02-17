import { HydratedDocument, ObjectId } from 'mongoose';

import { IPlatform } from '@togethercrew.dev/db';

import parentLogger from '../config/logger';
import { NEO4J_PLATFORM_INFO } from '../constants/neo4j.constant';
import * as Neo4j from '../neo4j';
import { SupportedNeo4jPlatforms } from '../types/neo4j.type';

const logger = parentLogger.child({ module: 'ReputationScoreService' });

async function calculateReputationScoreForUser(
  platform: HydratedDocument<IPlatform>,
  userId: ObjectId,
): Promise<number> {
  const platformName = platform.name as SupportedNeo4jPlatforms;
  const memberLabel = NEO4J_PLATFORM_INFO[platformName].member;
  const platformId = platform.id;

  const reputationScoreQuery = buildReputationScoreQuery(userId, platformId, memberLabel);
  const neo4jData = await Neo4j.read(reputationScoreQuery);

  return extractReputationScoreFromNeo4jData(neo4jData);
}

function buildReputationScoreQuery(userId: ObjectId, platformId: string, memberLabel: string): string {
  return `
    MATCH (:${memberLabel} {id: "${userId}"})-[r:HAVE_METRICS {platformId: "${platformId}"}]->(a)
    WITH r.date as metrics_date, r.closenessCentrality as memberScore
    ORDER BY metrics_date DESC
    LIMIT 1
    MATCH (user:${memberLabel})-[user_r:HAVE_METRICS {platformId: "${platformId}", date: metrics_date}]->(user)
    WITH memberScore, MAX(user_r.closenessCentrality) as maxScore
    RETURN memberScore / maxScore AS reputation_score
  `;
}

function extractReputationScoreFromNeo4jData(neo4jData: any): number {
  const { records } = neo4jData;
  logger.debug(`Neo4j Records: ${JSON.stringify(records)}`);

  if (records.length === 0) {
    return 0;
  }

  const reputationScoreResponse = records[0];
  const reputationScore = reputationScoreResponse.get('reputation_score');

  return reputationScore || 0;
}

export default {
  calculateReputationScoreForUser,
};
