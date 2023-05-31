import express from "express";
import { guildController } from "../../controllers";
import { guildValidation } from '../../validations';

import { auth, validate } from '../../middlewares';
import RabbitMQ, { Event } from "@togethercrew.dev/tc-messagebroker";
const router = express.Router();

// Routes
router.get('/', auth(), validate(guildValidation.getGuilds), guildController.getGuilds);

// TODO: ADD auth for connect
router.get('/connect', guildController.connectGuild);
router.get('/connect/callback', guildController.connectGuildCallback);

router.get('/:guildId/channels', auth(), validate(guildValidation.getChannels), guildController.getChannels);
router.get('/:guildId/selected-channels', auth(), validate(guildValidation.getSelectedChannels), guildController.getSelectedChannels);

router.post('/:guildId/disconnect', auth(), validate(guildValidation.disconnectGuild), guildController.disconnectGuild);

router.route('/:guildId')
    .get(auth(), validate(guildValidation.getGuild), guildController.getGuild)
    .patch(auth(), validate(guildValidation.updateGuild), guildController.updateGuild);


// Events
RabbitMQ.onEvent(Event.SERVER_API.UPDATE_GUILD, (msg) => {
    console.log(`Received a message on event ${Event.SERVER_API.UPDATE_GUILD} : `, msg)
})

export default router;

