import express from 'express';
import { moduleController } from '../../controllers';
import { moduleValidation } from '../../validations';

import { auth, validate } from '../../middlewares';
const router = express.Router();

// Routes
router
    .route('/')
    .post(auth('admin'), validate(moduleValidation.createModule), moduleController.createModule)
//   .get(auth('admin', 'view'), validate(platformValidation.getPlatforms), platformController.getPlatforms);

// router
//   .route('/:platformId')
//   .get(auth('admin', 'view'), validate(platformValidation.getPlatform), platformController.getPlatform)
//   .patch(auth('admin'), validate(platformValidation.dynamicUpdatePlatform), platformController.updatePlatform)
//   .delete(auth('admin'), validate(platformValidation.deletePlatform), platformController.deletePlatform);

export default router;
