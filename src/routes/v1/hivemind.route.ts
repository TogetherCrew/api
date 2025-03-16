import express from 'express';

import { hivemindController } from '../../controllers';
import { validate } from '../../middlewares';
import { hivemindValidation } from '../../validations';

const router = express.Router();

// Routes
router.post('/ask', validate(hivemindValidation.askQuestion), hivemindController.askQuestion);

export default router;
