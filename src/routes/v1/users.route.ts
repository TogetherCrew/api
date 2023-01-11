import express from "express";
import { userController } from "../../controllers";
import { auth, validate } from '../../middlewares';
import { userValidation } from '../../validations';

const router = express.Router();

// Routes
router.get('/@me/guilds-with-admin-role', auth(), userController.getGuildsWithAdminRole);
router.patch('/@me', auth(), validate(userValidation.updateUser), userController.updateUser);


export default router;