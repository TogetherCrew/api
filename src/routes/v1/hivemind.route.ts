import express from 'express';

import { hivemindController } from '../../controllers';
import { timeout, validate } from '../../middlewares';
import { hivemindValidation } from '../../validations';

const router = express.Router();

// Routes
router.post(
  '/ask-question',
  timeout(6 * 60 * 1000),
  validate(hivemindValidation.askQuestion),
  hivemindController.askQuestion,
);

export default router;
