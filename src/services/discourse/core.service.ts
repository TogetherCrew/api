import parentLogger from '../../config/logger';
import { IAuthAndPlatform } from '../../interfaces';
import categoryService from './category.service';
import { ApiError, pick, sort } from '../../utils';
import { Types } from 'mongoose';
import config from '../../config';
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
async function runDiscourseExtraction(platformId: string): Promise<void> {
  try {
    const data = {
      platform_id: platformId,
    };
    console.log(data);
    const response = await fetch(config.discourse.extractionURL, {
      method: 'POST',
      body: JSON.stringify(data),
      headers: { 'Content-Type': 'application/json' },
    });
    if (response.ok) {
      console.log(await response.json());
      return;
    } else {
      const errorResponse = await response.text();
      logger.error({ error: errorResponse });
    }
  } catch (error) {
    logger.error(error, 'Failed to run discourse extraction discourse');
    throw new ApiError(590, 'Failed to run discourse extraction discourse');
  }
}

export default {
  getPropertyHandler,
  runDiscourseExtraction,
};
