import { Response } from 'express';
import httpStatus from 'http-status';

import { IAuthRequest } from '../interfaces/Request.interface';
import HivemindTemporalService from '../services/temporal/hivemind.service';
import { catchAsync } from '../utils';

const askQuestion = catchAsync(async function (req: IAuthRequest, res: Response) {
  console.debug('Body', req.body.communityId, req.body.question);
  req.setTimeout(5 * 60 * 1000);
  res.setTimeout(5 * 60 * 1000);
  const awnser = await HivemindTemporalService.triggerWorkflow(req.body.communityId, req.body.question, false);
  res.status(httpStatus.OK).send({ awnser });
});

export default {
  askQuestion,
};
