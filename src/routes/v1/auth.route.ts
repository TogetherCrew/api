import express from "express";
import { authController } from "../../controllers";
import { authValidation } from '../../validations';
import { validate } from '../../middlewares';
const router = express.Router();

// Routes
router.get('/discord/authorize', authController.discordAuthorize);
router.get('/discord/authorize/callback', authController.discordAuthorizeCallback);
router.post('/logout', validate(authValidation.logout), authController.logout);
router.post('/refresh-tokens', validate(authValidation.refreshTokens), authController.refreshTokens);

export default router;