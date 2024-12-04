import { HydratedDocument, Types } from 'mongoose';
import httpStatus from 'http-status';
import { IPlatform, IModule, PlatformNames, ICommunity } from '@togethercrew.dev/db';
import ApiError from '../utils/ApiError';
import * as Neo4j from '../neo4j';
import { NEO4J_PLATFORM_INFO } from '../constants/neo4j.constant';
import { SupportedNeo4jPlatforms } from '../types/neo4j.type';
import parentLogger from '../config/logger';
import moduleService from './module.service';
import platformService from './platform.service';
import ociService from './oci.service';
import communityService from './community.service';
import { MAINNET_CHAIN_IDS, TESTNET_CHAIN_IDS } from '../constants/chains.constant';
import config from '../config';

const logger = parentLogger.child({ module: 'NftService' });

const supportedPlatforms = [PlatformNames.Discord, PlatformNames.Discourse];

/**
 * get reputation score
 * @param {IPlatform} PlatformBody
 * @returns {Promise<HydratedDocument<IPlatform>>}
 */
const getReputationScore = async (tokenId: string, address: string) => {
  const dynamicNftModule = await moduleService.getModuleByFilter({ 'options.platforms.0.metadata.tokenId': tokenId });
  logger.debug(dynamicNftModule);
  throwErrorIfDynamicNftModuleDoesNotExist(dynamicNftModule);

  const community = await communityService.getCommunityByFilter({ _id: dynamicNftModule?.community });
  logger.debug(community);
  throwErrorIfCommunityDoesNotExist(community);

  const profiles: Array<any> = await getProfiles(address);
  logger.debug(profiles);
  throwErrorIfUserHasNoOnChainProfiles(profiles);

  let reputationScore = 0;
  for (const profile of profiles) {
    if (supportedPlatforms.includes(profile.profile.provider)) {
      const platform = await platformService.getPlatformByFilter({
        name: profile.profile.provider,
        community: dynamicNftModule?.community,
      });
      if (platform) {
        reputationScore = (await calculateReputationScoreForProfile(profile, platform)) + reputationScore;
        logger.debug(`Reputation Score: ${reputationScore}`);
      }
    }
  }
  return {
    reputationScore: reputationScore * 100,
    communityName: community?.name,
  };
};

async function getProfiles(address: string) {
  let profiles: Array<any> = [];
  const supportedChainIds = config.blockchainNetworkMode === 'mainnet' ? MAINNET_CHAIN_IDS : TESTNET_CHAIN_IDS;
  for (const chainId of supportedChainIds) {
    const chainProfiles = await ociService.getProfiles(address, chainId);
    profiles = profiles.concat(chainProfiles);
  }
  return profiles;
}

async function calculateReputationScoreForProfile(profile: any, platform: any): Promise<number> {
  const platformName = platform.name as SupportedNeo4jPlatforms;
  const memberLabel = NEO4J_PLATFORM_INFO[platformName].member;
  const platformId = platform.id;
  const profileId = profile.profile.id;

  const reputationScoreQuery = buildReputationScoreQuery(profileId, platformId, memberLabel);
  const neo4jData = await Neo4j.read(reputationScoreQuery);

  return extractReputationScoreFromNeo4jData(neo4jData);
}

function buildReputationScoreQuery(profileId: string, platformId: string, memberLabel: string): string {
  return `
    MATCH (:${memberLabel} {id: "${profileId}"})-[r:HAVE_METRICS {platformId: "${platformId}"}]->(a)
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

function throwErrorIfUserHasNoOnChainProfiles(profiles: Array<any>) {
  if (profiles.length === 0) {
    throw new ApiError(400, 'User does not have any on-chain profiles.');
  }
}

function throwErrorIfDynamicNftModuleDoesNotExist(dynamicNftModule: HydratedDocument<IModule> | null) {
  if (!dynamicNftModule) {
    throw new ApiError(400, 'There is no associated dynamic NFT module for the provided token ID.');
  }
}

function throwErrorIfCommunityDoesNotExist(community: HydratedDocument<ICommunity> | null) {
  if (!community) {
    throw new ApiError(400, 'There is no associated community for the dynamic NFT module.');
  }
}
export default {
  getReputationScore,
};
