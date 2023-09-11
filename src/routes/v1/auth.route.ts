import express from "express";
import { authController } from "../../controllers";
import { authValidation } from '../../validations';
import { validate } from '../../middlewares';
const router = express.Router();

// Routes
router.get('/try-now', authController.tryNow);
router.get('/try-now/callback', authController.tryNowCallback);
router.get('/login', authController.login);
router.get('/login/callback', authController.loginCallback);
router.post('/logout', validate(authValidation.logout), authController.logout);
router.post('/refresh-tokens', validate(authValidation.refreshTokens), authController.refreshTokens);
router.get('/twitter/login', authController.twitterLogin);
router.get('/twitter/login/callback', authController.twitterLoginCallback);

export default router;