import express from "express";
import { memberActivityController } from "../../controllers";
import { memberActivityValidation } from '../../validations';

import { auth, validate } from '../../middlewares';
const router = express.Router();

// Routes
router.post('/:guildId/active-members-line-graph', validate(memberActivityValidation.activeMembersLineGraph), memberActivityController.activeMembersLineGraph);

export default router;

