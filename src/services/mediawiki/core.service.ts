import { Types } from 'mongoose';

import parentLogger from '../../config/logger';
import { ApiError } from '../../utils';
import temporalMediaWiki from '../temporal/mediawiki.service';

const logger = parentLogger.child({ module: 'MediaWikiCoreService' });

async function createMediaWikiSchedule(platformId: Types.ObjectId): Promise<string> {
  try {
    const schedule = await temporalMediaWiki.createSchedule(platformId);
    logger.info(`Started schedule '${schedule.scheduleId}'`);
    await schedule.trigger();
    return schedule.scheduleId;
  } catch (error) {
    logger.error(error, 'Failed to trigger mediawiki schedule.');
    throw new ApiError(590, 'Failed to create mediawiki schedule.');
  }
}

async function deleteMediaWikiSchedule(scheduleId: string): Promise<void> {
  try {
    await temporalMediaWiki.deleteSchedule(scheduleId);
  } catch (error) {
    logger.error(error, 'Failed to delete mediawiki schedule.');
    throw new ApiError(590, 'Failed to delete mediawiki schedule.');
  }
}

async function terminateMediaWikiWorkflow(communityId: string): Promise<void> {
  try {
    await temporalMediaWiki.terminateWorkflow(`api:mediawiki:${communityId}`);
  } catch (error) {
    logger.error(error, 'Failed to terminate mediawiki workflow.');
    throw new ApiError(590, 'Failed to terminate mediawiki workflow.');
  }
}

export default {
  createMediaWikiSchedule,
  deleteMediaWikiSchedule,
  terminateMediaWikiWorkflow,
};
