import parentLogger from '../../config/logger';
import { IAuthAndPlatform } from '../../interfaces';
import categoryService from './category.service';
import { ApiError, pick, sort } from '../../utils';

const logger = parentLogger.child({ module: 'DiscordCoreService' });

/**
 * exchange discord code with access token
 * @param {string} code
   @param {string} redirect_uri
 * @returns {Promise<IDiscordOAuth2EchangeCode>}
 */
async function getPropertyHandler(req: IAuthAndPlatform) {
  const filter = pick(req.query, ['name']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  if (req.query.property === 'category') {
    return await categoryService.getCategoriesByEndPoint({ endPoint: req.platform.metadata?.id, ...filter }, options);
  }
}

export default {
  getPropertyHandler,
};
