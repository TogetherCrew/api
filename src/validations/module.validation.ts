import Joi, { ObjectSchema } from 'joi';
import { objectId } from './custom.validation';
import { Types } from 'mongoose';
import { Request } from 'express';

const createModule = {
  body: Joi.object().keys({
    name: Joi.string().required().valid('hivemind'),
    community: Joi.string().custom(objectId).required(),
  }),
};

const getModules = {
  query: Joi.object().keys({
    name: Joi.string().valid('hivemind'),
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

// const dynamicModuleUpdate = (req: Request) => {
//   const module = req.module;
//   if (module?.name === 'hivemind') {
//     return {
//       params: Joi.object().keys({
//         moduleId: Joi.required().custom(objectId),
//       }),
//       body: Joi.object()
//         .required()
//         .keys({
//           options: Joi.object()
//             .required()
//             .keys({
//               platforms: Joi.array().items(
//                 Joi.object().keys({
//                   name: Joi.string().required().valid('discord'),
//                   platform: Joi.string().custom(objectId).required(),
//                   metadata: Joi.object()
//                     .required()
//                     .when('name', {
//                       switch: [
//                         {
//                           is: 'discord',
//                           then: Joi.object().keys({
//                             answering: Joi.object().keys({
//                               selectedChannels: Joi.array().items(Joi.string()).required(),
//                             }),
//                             learning: Joi.object().keys({
//                               selectedChannels: Joi.array().items(Joi.string()).required(),
//                               fromDate: Joi.date().required(),
//                             }),
//                           }),
//                         },
//                       ],
//                       otherwise: Joi.any().forbidden(),
//                     }),
//                 }),
//               ),
//             }),
//         }),
//     };
//   } else {
//     req.allowInput = false;
//     return {};
//   }
// };

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
  });
};

const hivemindOptions = () => {
  return Joi.object().keys({
    platforms: Joi.array().items(
      Joi.object().keys({
        name: Joi.string().required().valid('discord'),
        platform: Joi.string().custom(objectId).required(),
        metadata: Joi.when('name', {
          switch: [
            {
              is: 'discord',
              then: hivemindDiscordMetadata(),
            },
          ],
          otherwise: Joi.any().forbidden(),
        }).required(),
      }),
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
  let bodyOption = {};

  switch (moduleName) {
    case 'hivemind':
      bodyOption = {
        body: Joi.object().required().keys({
          options: hivemindOptions(),
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
