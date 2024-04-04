import express from 'express';
import { memberActivityController } from '../../controllers';
import { memberActivityValidation } from '../../validations';

import { validate, auth, platform } from '../../middlewares';
const router = express.Router();

// Routes
router.post(
  '/:platformId/active-members-composition-line-graph',
  auth('admin', 'view'),
  validate(memberActivityValidation.activeMembersCompositionLineGraph),
  memberActivityController.activeMembersCompositionLineGraph,
);
router.post(
  '/:platformId/active-members-onboarding-line-graph',
  auth('admin', 'view'),
  validate(memberActivityValidation.activeMembersOnboardingLineGraph),
  memberActivityController.activeMembersOnboardingLineGraph,
);
router.post(
  '/:platformId/disengaged-members-composition-line-graph',
  auth('admin', 'view'),
  validate(memberActivityValidation.disengagedMembersCompositionLineGraph),
  memberActivityController.disengagedMembersCompositionLineGraph,
);
router.post(
  '/:platformId/inactive-members-line-graph',
  auth('admin', 'view'),
  validate(memberActivityValidation.inactiveMembersLineGraph),
  memberActivityController.inactiveMembersLineGraph,
);
router.post(
  '/:platformId/members-interactions-network-graph',
  auth('admin', 'view'),
  validate(memberActivityValidation.memberInteractionsGraph),
  memberActivityController.membersInteractionsNetworkGraph,
);
router.get(
  '/:platformId/decentralisation-score',
  auth('admin', 'view'),
  validate(memberActivityValidation.decentralisationScore),
  memberActivityController.decentralisationScore,
);
router.get(
  '/:platformId/fragmentation-score',
  auth('admin', 'view'),
  validate(memberActivityValidation.fragmentationScore),
  memberActivityController.fragmentationScore,
);
router.post(
  '/:platformId/active-members-composition-table',
  auth('admin', 'view'),
  validate(memberActivityValidation.activeMembersCompositionTable),
  memberActivityController.activeMembersCompositionTable,
);
router.post(
  '/:platformId/active-members-onboarding-table',
  auth('admin', 'view'),
  validate(memberActivityValidation.activeMembersOnboardingTable),
  memberActivityController.activeMembersOnboardingTable,
);
router.post(
  '/:platformId/disengaged-members-composition-table',
  auth('admin', 'view'),
  validate(memberActivityValidation.disengagedMembersCompositionTable),
  memberActivityController.disengagedMembersCompositionTable,
);

export default router;
