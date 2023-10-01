import express from "express";
import { twitterController } from "../../controllers";

import { auth } from '../../middlewares';
const router = express.Router();

// Router
router.post('/disconnect', auth(), twitterController.disconnectTwitter);
router.post('/metrics/refresh', auth(), twitterController.refreshTwitter);
router.get('/metrics/activity', auth(), twitterController.activityMetrics);
router.get('/:twitterId/metrics/audience', auth(), twitterController.audienceMetrics);
router.get('/:twitterId/metrics/engagement',  auth(), twitterController.engagementMetrics);


export default router;

