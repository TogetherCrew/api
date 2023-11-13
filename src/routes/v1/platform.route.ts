import express from "express";
import { platformController } from "../../controllers";
import { platformValidation } from '../../validations';

import { auth, validate, platform } from '../../middlewares';
const router = express.Router();

// Routes
router.get('/connect/:platform', validate(platformValidation.connectPlatform), platformController.connectPlatform);
router.get('/twitter/callback', platformController.connectTwitterCallback);
router.get('/discord/callback', platformController.connectDiscordCallback);

router.route('/')
    .post(auth(), validate(platformValidation.createPlatform), platformController.createPlatform)
    .get(auth(), validate(platformValidation.getPlatforms), platformController.getPlatforms);

router.post('/:platformId/properties', auth(), platform(), validate(platformValidation.dynamicPlatformValidation), platformController.getProperties);

router.route('/:platformId')
    .get(auth(), validate(platformValidation.getPlatform), platformController.getPlatform)
    .patch(auth(), validate(platformValidation.updatePlatform), platformController.updatePlatform)
    .delete(auth(), validate(platformValidation.deletePlatform), platformController.deletePlatform);




export default router;

