import Joi from 'joi';
import { objectId } from './custom.validation';
import { TokenTypeNames } from '@togethercrew.dev/db';

const logout = {
  body: Joi.object().required().keys({
    refreshToken: Joi.string().required(),
  }),
};

const refreshTokens = {
  body: Joi.object().required().keys({
    refreshToken: Joi.string().required(),
  }),
};
const generateToken = {
  body: Joi.object().keys({
    type: Joi.string().required().valid(TokenTypeNames.TELEGRAM_VERIFICATION, TokenTypeNames.ACCESS),
    communityId: Joi.string()
      .custom(objectId)
      .when('type', {
        is: Joi.string().valid(TokenTypeNames.TELEGRAM_VERIFICATION),
        then: Joi.required(),
        otherwise: Joi.forbidden(),
      }),
  }),
};

export default {
  logout,
  refreshTokens,
  generateToken,
};
