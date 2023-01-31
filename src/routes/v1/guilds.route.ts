import express from "express";
import { guildController } from "../../controllers";
import { guildValidation } from '../../validations';

import { auth, validate } from '../../middlewares';
const router = express.Router();

// Routes
router.get('/', auth(), validate(guildValidation.getGuilds), guildController.getGuilds);

router.get('/:guildId/channels', auth(), validate(guildValidation.getGuildChannels), guildController.getGuildChannels);

router.route('/:guildId')
    .get(auth(), validate(guildValidation.getGuild), guildController.getGuild)
    .patch(auth(), validate(guildValidation.updateGuild), guildController.updateGuild);

router.get('/discord-api/:guildId', auth(), validate(guildValidation.getGuildFromDiscordAPI), guildController.getGuildFromDiscordAPI);

export default router;

