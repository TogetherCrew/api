import express from 'express';
import { platformController } from '../../controllers';
import { platformValidation } from '../../validations';

import { auth, validate } from '../../middlewares';
const router = express.Router();

// Routes
router.get('/connect/:platform', validate(platformValidation.connectPlatform), platformController.connectPlatform);
router.get(
  '/request-access/:platform/:module/:id',
  validate(platformValidation.dynamicRequestAccess),
  platformController.requestAccess,
);

router.get('/twitter/callback', platformController.connectTwitterCallback);
router.get('/discord/callback', platformController.connectDiscordCallback);
router.get('/discord/request-access/callback', platformController.requestAccessCallback);

router
  .route('/')
  .post(validate(platformValidation.createPlatform), auth('admin'), platformController.createPlatform)
  .get(validate(platformValidation.getPlatforms), auth('admin', 'view'), platformController.getPlatforms);

router.post(
  '/:platformId/properties',
  validate(platformValidation.dynamicPlatformProperty),
  auth('admin', 'view'),
  platformController.getProperties,
);

router
  .route('/:platformId')
  .get(validate(platformValidation.getPlatform), auth('admin', 'view'), platformController.getPlatform)
  .patch(validate(platformValidation.dynamicUpdatePlatform), auth('admin'), platformController.updatePlatform)
  .delete(validate(platformValidation.deletePlatform), auth('admin'), platformController.deletePlatform);

export default router;
