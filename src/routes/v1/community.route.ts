import express from 'express';
import { communityController } from '../../controllers';
import { communityValidation } from '../../validations';

import { auth, validate } from '../../middlewares';
const router = express.Router();

// Routes
router
  .route('/')
  .post(validate(communityValidation.createCommunity), auth(), communityController.createCommunity)
  .get(validate(communityValidation.getCommunities), auth(), communityController.getCommunities);

router
  .route('/:communityId')
  .get(validate(communityValidation.getCommunity), auth('admin', 'view'), communityController.getCommunity)
  .patch(validate(communityValidation.updateCommunity), auth('admin'), communityController.updateCommunity)
  .delete(validate(communityValidation.deleteCommunity), auth('admin'), communityController.deleteCommunity);

export default router;
