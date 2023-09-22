import express from "express";
import { twitterController } from "../../controllers";
import twitterValidation from '../../validations/twitter.validation';

import { validate, auth } from '../../middlewares';
const router = express.Router();

// Router
router.post('/disconnect', auth(), twitterController.disconnectTwitter);
router.post('/metrics/refresh', auth(), validate(twitterValidation.refreshTweet), twitterController.refreshTwitter);
router.get('/:twitterId/metrics/activity', auth(), twitterController.activityMetrics);
router.get('/:twitterId/metrics/audience', auth(), twitterController.audienceMetrics);
router.get('/:twitterId/metrics/engagement',  auth(), twitterController.engagementMetrics);


export default router;

