import { Response } from 'express';
import httpStatus from 'http-status';

import { IAuthRequest } from '../interfaces/Request.interface';
import HivemindTemporalService from '../services/temporal/hivemind.service';
import { catchAsync } from '../utils';

const askQuestion = catchAsync(async function (req: IAuthRequest, res: Response) {
  req.setTimeout(6 * 60 * 1000);
  res.setTimeout(6 * 60 * 1000);
  const answer = await HivemindTemporalService.triggerWorkflow(
    req.body.communityId,
    req.body.question,
    false,
    req.body.chatId,
  );
  res.status(httpStatus.OK).send({ answer });
});

export default {
  askQuestion,
};
