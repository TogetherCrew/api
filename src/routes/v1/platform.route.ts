import express from 'express';
import { platformController } from '../../controllers';
import { platformValidation } from '../../validations';

import { auth, validate } from '../../middlewares';
const router = express.Router();

// Routes
router.get('/connect', validate(platformValidation.connectPlatform), platformController.connectPlatform);
router.get(
  '/request-access/:platform/:module/:id',
  validate(platformValidation.dynamicRequestAccess),
  platformController.requestAccess,
);

router.get('/twitter/callback', platformController.connectTwitterCallback);
router.get('/discord/callback', platformController.connectDiscordCallback);
router.get('/google/callback', platformController.connectGoogleCallback);
router.get('/github/callback', platformController.connectGithubCallback);
router.get('/notion/callback', platformController.connectNotionCallback);

router.get('/discord/request-access/callback', platformController.requestAccessCallback);

router
  .route('/')
  .post(auth('admin'), validate(platformValidation.createPlatform), platformController.createPlatform)
  .get(auth('admin', 'view'), validate(platformValidation.getPlatforms), platformController.getPlatforms);

router.post(
  '/:platformId/properties',
  auth('admin', 'view'),
  validate(platformValidation.dynamicPlatformProperty),
  platformController.getProperties,
);

router
  .route('/:platformId')
  .get(auth('admin', 'view'), validate(platformValidation.getPlatform), platformController.getPlatform)
  .patch(auth('admin'), validate(platformValidation.dynamicUpdatePlatform), platformController.updatePlatform)
  .delete(auth('admin'), validate(platformValidation.deletePlatform), platformController.deletePlatform);

export default router;
