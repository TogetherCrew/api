import express from 'express';
import { heatmapController } from '../../controllers';
import { heatmapValidation } from '../../validations';

import { auth, validate, platform } from '../../middlewares';
const router = express.Router();

// Routes
router.post(
  '/:platformId/heatmap-chart',
  auth(),
  platform('discord'),
  validate(heatmapValidation.heatmapChart),
  heatmapController.heatmapChart,
);
router.post(
  '/:platformId/line-graph',
  auth(),
  platform('discord'),
  validate(heatmapValidation.lineGraph),
  heatmapController.lineGraph,
);

export default router;
