import express from "express";
import { guildController } from "../../controllers";
import { guildValidation } from '../../validations';

import { auth, validate } from '../../middlewares';
const router = express.Router();

// Routes
router.get('/:guildId/channels', auth(), validate(guildValidation.getGuildChannels), guildController.getGuildChannels);
router.patch('/:guildId', auth(), validate(guildValidation.updateGuild), guildController.updateGuild);


export default router;

