import express from "express";
import { userController } from "../../controllers";
import { auth } from '../../middlewares';
const router = express.Router();

// Routes
router.get('/@me/guilds-with-admin-role', auth(), userController.getGuildsWithAdminRole);


export default router;