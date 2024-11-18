import { Request, Response } from 'express';
import { catchAsync } from '../utils';
import parentLogger from '../config/logger';
import { nftService } from '../services';

const logger = parentLogger.child({ module: 'NftController' });

const getReputationScore = catchAsync(async function (req: Request, res: Response) {
  const { tokenId, address } = req.params;
  logger.debug(tokenId, address);
  const reputationScore = await nftService.getReputationScore(tokenId, address);
  res.send(reputationScore);
});

export default {
  getReputationScore,
};
