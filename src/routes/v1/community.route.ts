import express from 'express';
import { communityController } from '../../controllers';
import { communityValidation } from '../../validations';

import { auth, validate } from '../../middlewares';
const router = express.Router();

// Routes
router
  .route('/')
  .post(auth(), validate(communityValidation.createCommunity), communityController.createCommunity)
  .get(auth(), validate(communityValidation.getCommunities), communityController.getCommunities);

router
  .route('/:communityId')
  .get(auth('admin', 'view'), validate(communityValidation.getCommunity), communityController.getCommunity)
  .patch(auth('admin'), validate(communityValidation.updateCommunity), communityController.updateCommunity)
  .delete(auth('admin'), validate(communityValidation.deleteCommunity), communityController.deleteCommunity);

export default router;
