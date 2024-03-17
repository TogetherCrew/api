import Joi from 'joi';
import { objectId } from './custom.validation';

const createCommunity = {
  body: Joi.object().keys({
    name: Joi.string().required().max(100),
    avatarURL: Joi.string(),
    tcaAt: Joi.date(),
  }),
};

const getCommunities = {
  query: Joi.object().keys({
    name: Joi.string(),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

const getCommunity = {
  params: Joi.object().keys({
    communityId: Joi.string().custom(objectId),
  }),
};

const updateCommunity = {
  params: Joi.object().keys({
    communityId: Joi.required().custom(objectId),
  }),
  body: Joi.object()
    .keys({
      name: Joi.string(),
      avatarURL: Joi.string(),
      tcaAt: Joi.date(),
      roles: Joi.array().items(Joi.object().keys({
        roleType: Joi.string().valid('view', 'admin').required(),
        source: Joi.object().required().keys({
          platform: Joi.string().valid('discord').required(),
          identifierType: Joi.string().valid('member', 'role').required(),
          identifierValues: Joi.array().items(Joi.string().required()).required(),
          platformId: Joi.required().custom(objectId),
        }).max(4)
      })),
    })
    .min(1),
};

const deleteCommunity = {
  params: Joi.object().keys({
    communityId: Joi.string().custom(objectId),
  }),
};

export default {
  createCommunity,
  getCommunities,
  getCommunity,
  updateCommunity,
  deleteCommunity,
};
