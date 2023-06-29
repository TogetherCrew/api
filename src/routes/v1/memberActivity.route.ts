import express from "express";
import { memberActivityController } from "../../controllers";
import { memberActivityValidation } from '../../validations';

import { validate, auth } from '../../middlewares';
const router = express.Router();

// Routes
router.get('/:guildId/active-members-composition-line-graph', auth(), validate(memberActivityValidation.activeMembersCompositionLineGraph), memberActivityController.activeMembersCompositionLineGraph);
router.get('/:guildId/active-members-onboarding-line-graph', auth(), validate(memberActivityValidation.activeMembersOnboardingLineGraph), memberActivityController.activeMembersOnboardingLineGraph);
router.get('/:guildId/disengaged-members-composition-line-graph', auth(), validate(memberActivityValidation.disengagedMembersCompositionLineGraph), memberActivityController.disengagedMembersCompositionLineGraph);
router.get('/:guildId/inactive-members-line-graph', auth(), validate(memberActivityValidation.inactiveMembersLineGraph), memberActivityController.inactiveMembersLineGraph);
router.get('/:guildId/members-interactions-network-graph', auth(), validate(memberActivityValidation.memberInteractionsGraph), memberActivityController.membersInteractionsNetworkGraph)
router.get('/:guildId/active-members-composition-table', auth(), validate(memberActivityValidation.activeMembersCompositionTable), memberActivityController.activeMembersCompositionTable);
router.get('/:guildId/active-members-onboarding-table', auth(), validate(memberActivityValidation.activeMembersOnboardingTable), memberActivityController.activeMembersOnboardingTable);

export default router;

