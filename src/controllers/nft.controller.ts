import { Request, Response } from 'express';
import { catchAsync } from '../utils';
import parentLogger from '../config/logger';
import { moduleService, platformService, ociService } from '../services';
import { ApiError } from '../utils';
import { IModule, IPlatform } from '@togethercrew.dev/db';
import { HydratedDocument } from 'mongoose';
import * as Neo4j from '../neo4j';
import { NEO4J_PLATFORM_INFO } from '../constants/neo4j.constant';
import { SupportedNeo4jPlatforms } from '../types/neo4j.type';

const logger = parentLogger.child({ module: 'NftController' });

const getReputationScore = catchAsync(async function (req: Request, res: Response) {
  const { tokenId, address } = req.params;
  const supportedPlatforms = ['discord', 'discourse'];

  let repuationScore;
  logger.debug(tokenId, address);
  const profiles: Array<any> = await getProfilesOnAllSupportedChains(address);
  logger.debug(profiles);
  const dynamicNftModule = await moduleService.getModuleByFilter({ 'options.platforms.0.metadata.tokenId': tokenId });
  logger.debug(dynamicNftModule);

  for (let i = 0; i < supportedPlatforms.length; i++) {
    const platform = await platformService.getPlatformByFilter({
      name: supportedPlatforms[i],
      community: dynamicNftModule?.community,
    });
    logger.debug({ i, platform, supportedPlatforms: supportedPlatforms[i] });
    // shouldPlatformExist(platform);
    for (let j = 0; j < profiles.length; j++) {
      const profile = profiles[j];
      logger.debug({ i, j, profile, supportedPlatforms: supportedPlatforms[i] });
      if (profile.profile.provider === supportedPlatforms[i]) {
        const reputationScoreQuery = `
        MATCH (:${NEO4J_PLATFORM_INFO[platform?.name as SupportedNeo4jPlatforms].member} {id: "${profile.profile.id}"})-[r:HAVE_METRICS {platformId: "${platform?.id}"}]->(a)
        WITH r.date as metrics_date, r.closenessCentrality as memberScore
        ORDER BY metrics_date DESC
        LIMIT 1
        MATCH (user:${NEO4J_PLATFORM_INFO[platform?.name as SupportedNeo4jPlatforms].member})-[user_r:HAVE_METRICS {platformId: "${platform?.id}", date: metrics_date}]->(user)
        WITH memberScore, MAX(user_r.closenessCentrality) as maxScore
        RETURN memberScore / maxScore AS reputation_score
        `;

        const neo4jData = await Neo4j.read(reputationScoreQuery);
        const { records } = neo4jData;
        logger.debug(records);

        const reputationScoreResponse = records[0];

        logger.debug(reputationScoreResponse);

        const { _fieldLookup, _fields } = reputationScoreResponse as unknown as {
          _fieldLookup: Record<string, number>;
          _fields: number[];
        };

        repuationScore = _fields[_fieldLookup['reputation_score']];
        logger.debug(repuationScore);
      }
    }
  }
  return repuationScore;
});

async function getProfilesOnAllSupportedChains(address: string) {
  let profiles: Array<any> = [];
  const supportedChainIds = [11155111];
  for (let i = 0; i < supportedChainIds.length; i++) {
    const chainProfiles = await ociService.getProfiles(address, supportedChainIds[i]);
    profiles = profiles.concat(chainProfiles);
  }
  return profiles;
}

function shouldProfilesExist(profiles: Array<any>) {
  if (profiles.length < 0) {
    throw new ApiError(400, 'User has no any onchain profiles');
  }
}

function shouldDynamicNftModuleExist(dynamicNftModule: HydratedDocument<IModule> | null) {
  if (!dynamicNftModule) {
    throw new ApiError(400, "There's not any assoicated dynamic nft module to the token Id");
  }
}

function shouldPlatformExist(platform: HydratedDocument<IPlatform> | null) {
  if (!platform) {
    throw new ApiError(400, "There's not any platform connected for requested platform");
  }
}

function shouldProfileExist(profile: any) {
  if (!profile) {
    throw new ApiError(400, "There's not any user oncahin profile for requested platform");
  }
}
export default {
  getReputationScore,
};

// const platform = await platformService.getPlatformByFilter({
//   name: platforms[i],
//   community: dynamicNftModule?.community,
// });
// const profile = profiles.find((p: any) => p.profile.provider === platform);
// // Do the Cypher || N/A ?? || drop-down for platforms
