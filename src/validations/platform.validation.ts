import Joi from 'joi';
import { query, Request } from 'express';
import { objectId } from './custom.validation';
import { IAuthAndPlatform } from '../interfaces';
import { Types } from 'mongoose';

const discordCreateMetadata = () => {
  return Joi.object().keys({
    id: Joi.string().required(),
    name: Joi.string().required(),
    icon: Joi.string().required().allow(''),
  });
};

const discordUpdateMetadata = () => {
  return Joi.object().keys({
    id: Joi.string().required(),
    name: Joi.string().required(),
    icon: Joi.string().required().allow(''),
  });
};
const twitterMetadata = () => {
  return Joi.object().keys({
    id: Joi.string().required(),
    name: Joi.string().required(),
    icon: Joi.string().required().allow(''),
  });
};
const googleMetadata = () => {
  return Joi.object().keys({
    userId: Joi.string().custom(objectId).required(),
  });
};
const createPlatform = {
  body: Joi.object().keys({
    name: Joi.string().required().valid('twitter', 'discord', 'google'),
    community: Joi.string().custom(objectId).required(),
    metadata: Joi.when('name', {
      switch: [
        {
          is: 'discord',
          then: discordCreateMetadata(),
        },
        {
          is: 'twitter',
          then: twitterMetadata(),
        },
        {
          is: 'google',
          then: googleMetadata(),
        },
      ],
    }).required(),
  }),
};

const connectPlatform = {
  query: Joi.object().keys({
    platform: Joi.string().valid('discord', 'google', 'twitter'),
    userId: Joi.string().custom(objectId).when('platform', {
      is: 'google',
      then: Joi.required(),
      otherwise: Joi.forbidden(),
    }),
    scopes: Joi.array().items(Joi.string().valid('googleDrive')).when('platform', {
      is: 'google',
      then: Joi.required(),
      otherwise: Joi.forbidden(),
    }),
  }),
};

const getPlatforms = {
  query: Joi.object().keys({
    name: Joi.string().valid('twitter', 'discord', 'google'),
    community: Joi.string().custom(objectId).required(),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

const getPlatform = {
  params: Joi.object().keys({
    platformId: Joi.string().custom(objectId),
  }),
};

const deletePlatform = {
  params: Joi.object().keys({
    platformId: Joi.string().custom(objectId),
  }),
  body: Joi.object()
    .required()
    .keys({
      deleteType: Joi.string().required().valid('soft', 'hard'),
    }),
};

const dynamicUpdatePlatform = (req: Request) => {
  const platformName = req.platform?.name;
  switch (platformName) {
    case 'discord': {
      return {
        params: Joi.object().keys({
          platformId: Joi.required().custom(objectId),
        }),
        body: Joi.object().required().keys({
          metadata: discordUpdateMetadata,
        }),
      };
    }
    default:
      req.allowInput = false;
      return {};
  }
};

const dynamicPlatformProperty = (req: Request) => {
  if (Types.ObjectId.isValid(req.params.platformId)) {
    const authReq = req as IAuthAndPlatform;
    const { property } = authReq.query;
    if (property === 'channel') {
      return {
        params: Joi.object().keys({
          platformId: Joi.required().custom(objectId),
        }),
        query: Joi.object()
          .required()
          .keys({
            property: Joi.string().valid('channel'),
          }),
        body: Joi.object()
          .required()
          .keys({
            channelIds: Joi.array().items(Joi.string()),
          }),
      };
    } else if (property === 'role') {
      return {
        params: Joi.object().keys({
          platformId: Joi.required().custom(objectId),
        }),
        query: Joi.object()
          .required()
          .keys({
            property: Joi.string().valid('role'),
            name: Joi.string(),
            sortBy: Joi.string(),
            limit: Joi.number().integer(),
            page: Joi.number().integer(),
          }),
      };
    } else if (property === 'guildMember') {
      return {
        params: Joi.object().keys({
          platformId: Joi.required().custom(objectId),
        }),
        query: Joi.object()
          .required()
          .keys({
            property: Joi.string().valid('guildMember'),
            ngu: Joi.string(),
            sortBy: Joi.string(),
            limit: Joi.number().integer(),
            page: Joi.number().integer(),
          }),
      };
    } else {
      req.allowInput = false;
      return {};
    }
  } else {
    req.allowInput = false;
    return {};
  }
};

const dynamicRequestAccess = (req: Request) => {
  const platform = req.params.platform;
  if (platform === 'discord') {
    return {
      params: Joi.object().keys({
        platform: Joi.string().valid('discord').required(),
        module: Joi.string().valid('Announcement').required(),
        id: Joi.string().required(),
      }),
    };
  } else {
    req.allowInput = false;
    return {};
  }
};

export default {
  createPlatform,
  getPlatforms,
  getPlatform,
  deletePlatform,
  connectPlatform,
  dynamicUpdatePlatform,
  dynamicPlatformProperty,
  dynamicRequestAccess,
};
