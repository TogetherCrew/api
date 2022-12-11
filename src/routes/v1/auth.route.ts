import express from "express";
import { authController } from "../../controllers";
import { authValidation } from '../../validations';
import { validate } from '../../middlewares';
const router = express.Router();

// Routes
router.get('/login', authController.login);
router.get('/callback', authController.callback);
router.post('/logout', validate(authValidation.logout), authController.logout);
router.post('/refresh-tokens', validate(authValidation.refreshTokens), authController.refreshTokens);

export default router;