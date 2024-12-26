import express from 'express';
import { telegramController } from '../../controllers';
import { telegramValidation } from '../../validations';

import { auth, validate } from '../../middlewares';
const router = express.Router();

// Routes
router.post(
  '/heatmaps/:platformId/heatmap-chart',
  auth('admin', 'view'),
  validate(telegramValidation.heatmapChart),
  telegramController.heatmapChart,
);
router.post(
  '/heatmaps/:platformId/line-graph',
  auth('admin', 'view'),
  validate(telegramValidation.lineGraph),
  telegramController.lineGraph,
);

router.post(
  '/member-activity/:platformId/members-interactions-network-graph',
  auth('admin', 'view'),
  validate(telegramValidation.membersInteractionsNetworkGraph),
  telegramController.membersInteractionsNetworkGraph,
);

router.post(
  '/member-activity/:platformId/active-members-composition-table',
  auth('admin', 'view'),
  validate(telegramValidation.activeMembersCompositionTable),
  telegramController.activeMembersCompositionTable,
);
router.post(
  '/member-activity/:platformId/active-members-onboarding-table',
  auth('admin', 'view'),
  validate(telegramValidation.activeMembersOnboardingTable),
  telegramController.activeMembersOnboardingTable,
);
router.post(
  '/member-activity/:platformId/disengaged-members-composition-table',
  auth('admin', 'view'),
  validate(telegramValidation.disengagedMembersCompositionTable),
  telegramController.disengagedMembersCompositionTable,
);

export default router;
