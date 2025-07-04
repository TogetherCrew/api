import Joi from 'joi';

import {
  HivemindPlatformNames,
  ModuleNames,
  PlatformNames,
  ViolationDetectionPlatformNames,
} from '@togethercrew.dev/db';

import { objectId } from './custom.validation';

const createModule = {
  body: Joi.object().keys({
    name: Joi.string()
      .required()
      .valid(...Object.values(ModuleNames)),
    community: Joi.string().custom(objectId).required(),
    activated: Joi.boolean().required(),
  }),
};

const getModules = {
  query: Joi.object().keys({
    name: Joi.string().valid(...Object.values(ModuleNames)),
    community: Joi.string().custom(objectId).required(),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

const getModule = {
  params: Joi.object().keys({
    moduleId: Joi.string().custom(objectId).required(),
  }),
};

const deleteModule = {
  params: Joi.object().keys({
    moduleId: Joi.string().custom(objectId).required(),
  }),
};

const hivemindDiscordMetadata = () => {
  return Joi.object().keys({
    answering: Joi.object().keys({
      selectedChannels: Joi.array().items(Joi.string()).required(),
    }),
    learning: Joi.object().keys({
      selectedChannels: Joi.array().items(Joi.string()).required(),
      fromDate: Joi.date().required(),
    }),
    activated: Joi.boolean(),
  });
};

const hivemindGoogleMetadata = () => {
  return Joi.object().keys({
    driveIds: Joi.array().items(Joi.string()),
    folderIds: Joi.array().items(Joi.string()),
    fileIds: Joi.array().items(Joi.string()),
    activated: Joi.boolean(),
  });
};

const hivemindGithubMetadata = () => {
  return Joi.object().keys({
    activated: Joi.boolean(),
  });
};

const hivemindNotionMetadata = () => {
  return Joi.object().keys({
    pageIds: Joi.array().items(Joi.string()),
    databaseIds: Joi.array().items(Joi.string()),
    activated: Joi.boolean(),
  });
};

const hivemindMediaWikiMetadata = () => {
  return Joi.object().keys({
    namespaces: Joi.array().items(Joi.number()).default([0]),
    activated: Joi.boolean(),
  });
};

const hivemindTelegramMetadata = () => {
  return Joi.object().keys({
    activated: Joi.boolean(),
  });
};

const websiteMediaWikiMetadata = () => {
  return Joi.object().keys({
    activated: Joi.boolean(),
  });
};

const hivemindOptions = () => {
  return Joi.object().keys({
    platforms: Joi.array().items(
      Joi.object().keys({
        name: Joi.string()
          .required()
          .valid(...Object.values(HivemindPlatformNames)),
        platform: Joi.string().custom(objectId).required(),
        metadata: Joi.when('name', {
          switch: [
            {
              is: PlatformNames.Discord,
              then: hivemindDiscordMetadata(),
            },
            {
              is: PlatformNames.Google,
              then: hivemindGoogleMetadata(),
            },
            {
              is: PlatformNames.GitHub,
              then: hivemindGithubMetadata(),
            },
            {
              is: PlatformNames.Notion,
              then: hivemindNotionMetadata(),
            },
            {
              is: PlatformNames.MediaWiki,
              then: hivemindMediaWikiMetadata(),
            },
            {
              is: PlatformNames.Website,
              then: websiteMediaWikiMetadata(),
            },
            {
              is: PlatformNames.Telegram,
              then: hivemindTelegramMetadata(),
            },
          ],
          otherwise: Joi.any().forbidden(),
        }).required(),
      }),
    ),
  });
};

const violationDetectionMetadata = () => {
  return Joi.object().keys({
    selectedEmails: Joi.array().items(Joi.string().email()),
    fromDate: Joi.date(),
    toDate: Joi.date().valid(null),
    selectedResources: Joi.array().items(Joi.number().empty()),
    activated: Joi.boolean(),
  });
};

const violationDetectionOptions = () => {
  return Joi.object().keys({
    platforms: Joi.array().items(
      Joi.object().keys({
        name: Joi.string()
          .required()
          .valid(...Object.values(ViolationDetectionPlatformNames)),
        platform: Joi.string().custom(objectId).required(),
        metadata: Joi.when('name', {
          switch: [
            {
              is: PlatformNames.Discourse,
              then: violationDetectionMetadata(),
            },
          ],
          otherwise: Joi.any().forbidden(),
        }).required(),
      }),
    ),
  });
};

const dynamicNftOptions = () => {
  return Joi.object().keys({
    platforms: Joi.array().items(
      Joi.object()
        .keys({
          // name: Joi.string().default(null),
          // platform: Joi.string().default(null),
          metadata: Joi.object().keys({
            transactionHash: Joi.string().required(),
            chainId: Joi.number().required(),
            activated: Joi.boolean(),
          }),
        })
        .required(),
    ),
  });
};

const dynamicModuleUpdate = (req: any) => {
  const moduleName = req.module?.name;
  const paramsOption = {
    params: Joi.object().keys({
      moduleId: Joi.string().custom(objectId).required(),
    }),
  };
  let bodyOption = {
    body: Joi.object().required().keys({
      activated: Joi.boolean(),
    }),
  };

  switch (moduleName) {
    case ModuleNames.Hivemind:
      bodyOption = {
        body: Joi.object().required().keys({
          options: hivemindOptions(),
          activated: Joi.boolean(),
        }),
      };
      break;
    case ModuleNames.ViolationDetection:
      bodyOption = {
        body: Joi.object().required().keys({
          options: violationDetectionOptions(),
          activated: Joi.boolean(),
        }),
      };
      break;
    case ModuleNames.DynamicNft:
      bodyOption = {
        body: Joi.object().required().keys({
          options: dynamicNftOptions(),
          activated: Joi.boolean(),
        }),
      };
      break;
    case ModuleNames.CommunityInsights:
    case ModuleNames.CommunityHealth:
    case ModuleNames.Announcements:
      bodyOption = {
        body: Joi.object().required().keys({
          activated: Joi.boolean(),
        }),
      };
      break;
    default:
      req.allowInput = false;
      return {};
  }

  return {
    ...paramsOption,
    ...bodyOption,
  };
};

export default {
  createModule,
  getModules,
  getModule,
  deleteModule,
  dynamicModuleUpdate,
};
