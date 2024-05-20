import Joi from 'joi';
import { Request } from 'express';
import { objectId } from './custom.validation';
import { IAuthAndPlatform } from '../interfaces';
import { Types } from 'mongoose';
import { PlatformNames } from '@togethercrew.dev/db';

const discordCreateMetadata = () => {
  return Joi.object().keys({
    id: Joi.string().required(),
    name: Joi.string().required(),
    icon: Joi.string().required().allow(''),
  });
};

const discordUpdateMetadata = () => {
  return Joi.object().keys({
    selectedChannels: Joi.array().items(Joi.string()),
    period: Joi.date(),
    analyzerStartedAt: Joi.date(),
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
    id: Joi.string().required(),
    name: Joi.string().required(),
    picture: Joi.string().required(),
  });
};
const githubMetadata = () => {
  return Joi.object().keys({
    installationId: Joi.string().required(),
    account: Joi.object().keys({
      login: Joi.string().required(),
      id: Joi.string().required(),
      avatarUrl: Joi.string().required(),
    }),
  });
};

const notionMetadata = () => {
  return Joi.object().keys({
    userId: Joi.string().custom(objectId).required(),
    workspace_id: Joi.string().required(),
    workspace_name: Joi.string().required(),
    workspace_icon: Joi.string().required(),
    bot_id: Joi.string().required(),
    request_id: Joi.string().required(),
    owner: Joi.object().keys({
      type: Joi.string().required(),
      user: Joi.object().keys({
        type: Joi.string().required(),
        object: Joi.string().required(),
        id: Joi.string().required(),
        name: Joi.string().required(),
        avatar_url: Joi.string().required(),
      }),
    }),
  });
};

const mediaWikiMetadata = () => {
  return Joi.object().keys({
    baseURL: Joi.string().required(),
  });
};

const createPlatform = {
  body: Joi.object().keys({
    name: Joi.string()
      .required()
      .valid(...Object.values(PlatformNames)),
    community: Joi.string().custom(objectId).required(),
    metadata: Joi.when('name', {
      switch: [
        {
          is: PlatformNames.Discord,
          then: discordCreateMetadata(),
        },
        {
          is: PlatformNames.Twitter,
          then: twitterMetadata(),
        },
        {
          is: PlatformNames.Google,
          then: googleMetadata(),
        },
        {
          is: PlatformNames.GitHub,
          then: githubMetadata(),
        },
        {
          is: PlatformNames.Notion,
          then: notionMetadata(),
        },
        {
          is: PlatformNames.MediaWiki,
          then: mediaWikiMetadata(),
        },
      ],
    }).required(),
  }),
};

const connectPlatform = {
  query: Joi.object().keys({
    platform: Joi.string().valid(...Object.values(PlatformNames)),
    userId: Joi.string()
      .custom(objectId)
      .when('platform', {
        is: Joi.string().valid(PlatformNames.Google, PlatformNames.Notion),
        then: Joi.required(),
        otherwise: Joi.forbidden(),
      }),
    scopes: Joi.array().items(Joi.string().valid('googleDrive')).when('platform', {
      is: PlatformNames.Google,
      then: Joi.required(),
      otherwise: Joi.forbidden(),
    }),
  }),
};

const getPlatforms = {
  query: Joi.object().keys({
    name: Joi.string().valid(...Object.values(PlatformNames)),
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
    case PlatformNames.Discord: {
      return {
        params: Joi.object().keys({
          platformId: Joi.required().custom(objectId),
        }),
        body: Joi.object().required().keys({
          metadata: discordUpdateMetadata(),
        }),
      };
    }
    default:
      req.allowInput = false;
      return {};
  }
};

const discordProperties = (req: Request, property: string) => {
  switch (property) {
    case 'channel': {
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
    }
    case 'role': {
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
    }
    case 'guildMember': {
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
    }
    default:
      req.allowInput = false;
      return {};
  }
};

const dynamicPlatformProperty = (req: Request) => {
  const platformName = req.platform?.name;
  const property = req.query.property as string;
  switch (platformName) {
    case PlatformNames.Discord: {
      return discordProperties(req, property);
    }
    default:
      req.allowInput = false;
      return {};
  }
};

const dynamicRequestAccess = (req: Request) => {
  const platform = req.params.platform;
  if (platform === PlatformNames.Discord) {
    return {
      params: Joi.object().keys({
        platform: Joi.string().valid(PlatformNames.Discord).required(),
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
