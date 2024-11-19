import parentLogger from '../../config/logger';
import { IAuthAndPlatform } from '../../interfaces';
import categoryService from './category.service';
import { ApiError, pick } from '../../utils';
import temporalDiscourse from '../temporal/discourse.service';
const logger = parentLogger.child({ module: 'DiscourseCoreService' });

async function getPropertyHandler(req: IAuthAndPlatform) {
  const filter = pick(req.query, ['name']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  if (req.query.property === 'category') {
    return await categoryService.getCategoriesByEndPoint({ endPoint: req.platform.metadata?.id, ...filter }, options);
  }
}

/**
 * run discourse extraction
 * @param {String} platformId
 * @returns {Promise<Void>}
 */
async function createDiscourseSchedule(platformId: string, endpoint: string): Promise<string> {
  try {
    const schedule = await temporalDiscourse.createSchedule(platformId, endpoint);
    logger.info(`Started schedule '${schedule.scheduleId}'`);
    await schedule.trigger();
    return schedule.scheduleId;
  } catch (error) {
    logger.error(error, 'Failed to create discourse schedule');
    throw new ApiError(590, 'Failed to create discourse schedule');
  }
}

export default {
  getPropertyHandler,
  createDiscourseSchedule,
};
