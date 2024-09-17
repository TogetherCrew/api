import express from 'express';
import { discourseController } from '../../controllers';
import { discourseValidation } from '../../validations';

import { auth, validate } from '../../middlewares';
const router = express.Router();

// Routes
router.post(
  '/heatmaps/:platformId/heatmap-chart',
  auth('admin', 'view'),
  validate(discourseValidation.heatmapChart),
  discourseController.heatmapChart,
);
router.post(
  '/heatmaps/:platformId/line-graph',
  auth('admin', 'view'),
  validate(discourseValidation.lineGraph),
  discourseController.lineGraph,
);

router.post(
  '/member-activity/:platformId/members-interactions-network-graph',
  // auth('admin', 'view'),
  validate(discourseValidation.membersInteractionsNetworkGraph),
  discourseController.membersInteractionsNetworkGraph,
);

export default router;
