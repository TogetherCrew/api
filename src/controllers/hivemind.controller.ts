import { Response } from 'express';
import httpStatus from 'http-status';

import { IAuthRequest } from '../interfaces/Request.interface';
import HivemindTemporalService from '../services/temporal/hivemind.service';
import { catchAsync } from '../utils';

const askQuestion = catchAsync(async function (req: IAuthRequest, res: Response) {
  console.debug('Body', req.body.communityId, req.body.question);
  const workflowId = await HivemindTemporalService.triggerWorkflow(req.body.communityId, req.body.question, false);
  console.log('Workflow triggered with id:', workflowId);
  res.status(httpStatus.OK).send({ awnser: 'ok' });
});

export default {
  askQuestion,
};
