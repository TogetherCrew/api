import parentLogger from '../../config/logger';
import { IAuthAndPlatform } from '../../interfaces';
import categoryService from './category.service';
import { ApiError, pick, sort } from '../../utils';

const logger = parentLogger.child({ module: 'DiscourseCoreService' });

async function getPropertyHandler(req: IAuthAndPlatform) {
  const filter = pick(req.query, ['name']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  if (req.query.property === 'category') {
    return await categoryService.getCategoriesByEndPoint({ endPoint: req.platform.metadata?.id, ...filter }, options);
  }
}

/**
 * create discourse forum
 * @param {String} endpoint
 * @returns {Promise<IDiscordUser>}
 */
async function createDiscourseForum(endpoint: string): Promise<void> {
  try {
    const data = {
      endpoint,
    };
    console.log(data);
    const response = await fetch('http://discourse/forums', {
      method: 'POST',
      body: new URLSearchParams(data),
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    if (response.ok) {
      console.log(await response.json());
      return;
    } else {
      const errorResponse = await response.text();
      logger.error({ error: errorResponse });
    }
  } catch (error) {
    logger.error(error, 'Failed to create discourse forum');
    throw new ApiError(590, 'Failed to create discourse forum');
  }
}

export default {
  getPropertyHandler,
  createDiscourseForum,
};
