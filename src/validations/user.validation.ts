import Joi from 'joi';
import { objectId } from './custom.validation';

const updateUser = {
  body: Joi.object()
    .keys({
      email: Joi.string().email(),
      tcaAt: Joi.date(),
      unverifiedTelegramUsername: Joi.string(),
    })
    .min(1),
};

const getUserRolesInCommunity = {
  params: Joi.object().keys({
    communityId: Joi.string().custom(objectId),
  }),
};

export default {
  updateUser,
  getUserRolesInCommunity,
};
