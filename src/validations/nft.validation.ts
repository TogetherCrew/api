import Joi from 'joi';
import { PlatformNames } from '@togethercrew.dev/db';

const getReputationScore = {
  params: Joi.object().keys({
    tokenId: Joi.string().required(),
    address: Joi.string()
      .regex(/^0x[a-fA-F0-9]{40}$/)
      .required(),
  }),
};

export default {
  getReputationScore,
};
