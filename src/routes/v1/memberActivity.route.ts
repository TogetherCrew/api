import express from "express";
import { memberActivityController } from "../../controllers";
import { memberActivityValidation } from '../../validations';

import { validate, auth } from '../../middlewares';
const router = express.Router();

// Routes
router.post('/:guildId/active-members-composition-line-graph', auth(), validate(memberActivityValidation.activeMembersCompositionLineGraph), memberActivityController.activeMembersCompositionLineGraph);
router.post('/:guildId/active-members-onboarding-line-graph', validate(memberActivityValidation.activeMembersOnboardingLineGraph), memberActivityController.activeMembersOnboardingLineGraph);

export default router;

