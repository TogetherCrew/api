import express from "express";
import { heatmapController } from "../../controllers";
import { heatmapValidation } from '../../validations';

import { auth, validate } from '../../middlewares';
const router = express.Router();

// Routes
router.post('/:guildId/heatmap-chart', auth(), validate(heatmapValidation.heatmapChart), heatmapController.heatmapChart);

export default router;

