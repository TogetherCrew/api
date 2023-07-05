import express from "express";
import { memberActivityController } from "../../controllers";
import { memberActivityValidation } from '../../validations';

import { validate, auth } from '../../middlewares';
const router = express.Router();

// Routes
router.post('/:guildId/active-members-composition-line-graph', auth(), validate(memberActivityValidation.activeMembersCompositionLineGraph), memberActivityController.activeMembersCompositionLineGraph);
router.post('/:guildId/active-members-onboarding-line-graph', auth(), validate(memberActivityValidation.activeMembersOnboardingLineGraph), memberActivityController.activeMembersOnboardingLineGraph);
router.post('/:guildId/disengaged-members-composition-line-graph', auth(), validate(memberActivityValidation.disengagedMembersCompositionLineGraph), memberActivityController.disengagedMembersCompositionLineGraph);
router.post('/:guildId/inactive-members-line-graph', auth(), validate(memberActivityValidation.inactiveMembersLineGraph), memberActivityController.inactiveMembersLineGraph);
router.post('/:guildId/members-interactions-network-graph', auth(), validate(memberActivityValidation.memberInteractionsGraph), memberActivityController.membersInteractionsNetworkGraph)
router.get('/:guildId/decentralisation-score', auth(), validate(memberActivityValidation.decentralisationScore), memberActivityController.decentralisationScore);
router.get('/:guildId/fragmentation-score', auth(), validate(memberActivityValidation.fragmentationScore), memberActivityController.fragmentationScore)
router.get('/:guildId/active-members-composition-table', auth(), validate(memberActivityValidation.activeMembersCompositionTable), memberActivityController.activeMembersCompositionTable);
router.get('/:guildId/active-members-onboarding-table', auth(), validate(memberActivityValidation.activeMembersOnboardingTable), memberActivityController.activeMembersOnboardingTable);
router.get('/:guildId/disengaged-members-composition-table', auth(), validate(memberActivityValidation.disengagedMembersCompositionTable), memberActivityController.disengagedMembersCompositionTable);

export default router;

