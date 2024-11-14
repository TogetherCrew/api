import express from 'express';
import { nftController } from '../../controllers';
import { nftValidation } from '../../validations';
import { validate } from '../../middlewares';
const router = express.Router();

// Routes
router.post(
  '/:tokenId/:address/reputation-score',
  validate(nftValidation.getReputationScore),
  nftController.getReputationScore,
);

export default router;
