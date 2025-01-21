import express from 'express';

import { authController } from '../../controllers';
import { auth, validate } from '../../middlewares';
import { authValidation } from '../../validations';

const router = express.Router();

// Routes
router.get('/discord/authorize', authController.discordAuthorize);
router.get('/discord/authorize/callback', authController.discordAuthorizeCallback);
router.get('/telegram/authorize/callback', authController.discordAuthorizeCallback);

router.post('/generate-token', auth(), validate(authValidation.generateToken), authController.generateToken);
router.post('/logout', validate(authValidation.logout), authController.logout);
router.post('/refresh-tokens', validate(authValidation.refreshTokens), authController.refreshTokens);

export default router;
