import express from 'express';
import { userController } from '../../controllers';
import { auth, validate } from '../../middlewares';
import { userValidation } from '../../validations';

const router = express.Router();

router
  .route('/@me')
  .get(auth(), userController.getUser)
  .patch(auth(), validate(userValidation.updateUser), userController.updateUser);

router
  .route('/@me/:communityId/roles')
  .get(auth(), validate(userValidation.getUserRolesInCommunity), userController.getUserRolesInCommunity);
export default router;
