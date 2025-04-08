import { Types } from 'mongoose';

import parentLogger from '../../config/logger';
import { ApiError } from '../../utils';
import temporalWebsite from '../temporal/website.service';

const logger = parentLogger.child({ module: 'WebsiteCoreService' });

async function createWebsiteSchedule(platformId: Types.ObjectId): Promise<string> {
  try {
    const schedule = await temporalWebsite.createSchedule(platformId);
    logger.info(`Started schedule '${schedule.scheduleId}'`);
    await schedule.trigger();
    return schedule.scheduleId;
  } catch (error) {
    logger.error(error, 'Failed to trigger website schedule.');
    throw new ApiError(590, 'Failed to create website schedule.');
  }
}

async function deleteWebsiteSchedule(scheduleId: string): Promise<void> {
  try {
    await temporalWebsite.deleteSchedule(scheduleId);
  } catch (error) {
    logger.error(error, 'Failed to delete website schedule.');
    throw new ApiError(590, 'Failed to delete website schedule.');
  }
}

async function terminateWebsiteWorkflow(communityId: string): Promise<void> {
  try {
    await temporalWebsite.terminateWorkflow(`website:ingestor:${communityId}`);
  } catch (error) {
    logger.error(error, 'Failed to terminate website workflow.');
    throw new ApiError(590, 'Failed to terminate website workflow.');
  }
}

export default {
  createWebsiteSchedule,
  deleteWebsiteSchedule,
  terminateWebsiteWorkflow,
};
