import express from "express";
import { memberActivityController } from "../../controllers";
import { memberActivityValidation } from '../../validations';

import { validate, auth, platform } from '../../middlewares';
const router = express.Router();

// Routes
router.post('/:platformId/active-members-composition-line-graph', auth(), platform(), validate(memberActivityValidation.activeMembersCompositionLineGraph), memberActivityController.activeMembersCompositionLineGraph);
router.post('/:platformId/active-members-onboarding-line-graph', auth(), platform(), validate(memberActivityValidation.activeMembersOnboardingLineGraph), memberActivityController.activeMembersOnboardingLineGraph);
router.post('/:platformId/disengaged-members-composition-line-graph', auth(), platform(), validate(memberActivityValidation.disengagedMembersCompositionLineGraph), memberActivityController.disengagedMembersCompositionLineGraph);
router.post('/:platformId/inactive-members-line-graph', auth(), platform(), validate(memberActivityValidation.inactiveMembersLineGraph), memberActivityController.inactiveMembersLineGraph);
router.post('/:platformId/members-interactions-network-graph', auth(), platform(), validate(memberActivityValidation.memberInteractionsGraph), memberActivityController.membersInteractionsNetworkGraph)
router.get('/:platformId/decentralisation-score', auth(), platform(), validate(memberActivityValidation.decentralisationScore), memberActivityController.decentralisationScore);
router.get('/:platformId/fragmentation-score', auth(), platform(), validate(memberActivityValidation.fragmentationScore), memberActivityController.fragmentationScore)
router.post('/:platformId/active-members-composition-table', auth(), platform(), validate(memberActivityValidation.activeMembersCompositionTable), memberActivityController.activeMembersCompositionTable);
router.post('/:platformId/active-members-onboarding-table', auth(), platform(), validate(memberActivityValidation.activeMembersOnboardingTable), memberActivityController.activeMembersOnboardingTable);
router.post('/:platformId/disengaged-members-composition-table', auth(), platform(), validate(memberActivityValidation.disengagedMembersCompositionTable), memberActivityController.disengagedMembersCompositionTable);

export default router;

