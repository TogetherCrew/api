import Joi from 'joi';
import { objectId } from './custom.validation';

const createAnnouncement = {
  params: Joi.object()
    .required()
    .keys({
      platformId: Joi.string().custom(objectId),
    }),
  body: Joi.object().keys({
    title: Joi.string(),
    communityId: Joi.string().custom(objectId).required(),
    scheduledAt: Joi.date().greater('now').iso().required().description('ISO date string. UTC time zone'),
    draft: Joi.boolean().required(),
    data: Joi.array()
      .items(
        Joi.object({
          platformId: Joi.string().custom(objectId).required(),
          template: Joi.string().required(),
          options: Joi.object({
            channelIds: Joi.array().items(Joi.string()),
            userIds: Joi.array().items(Joi.string()),
            roleIds: Joi.array().items(Joi.string()),
            engagementCategories: Joi.array().items(Joi.string()),
            safetyMessageChannelId: Joi.string().optional(),
          }).required(),
        }),
      )
      .required()
      .min(1),
  }),
};

const updateAnnouncement = {
  params: Joi.object()
    .required()
    .keys({
      platformId: Joi.string().custom(objectId),
      announcementId: Joi.string().custom(objectId),
    }),
  body: Joi.object().keys({
    title: Joi.string(),
    scheduledAt: Joi.date().greater('now').iso().description('ISO date string. UTC time zone'),
    draft: Joi.boolean(),
    data: Joi.array().items(
      Joi.object({
        platformId: Joi.string().custom(objectId).required(),
        template: Joi.string().required(),
        options: Joi.object({
          channelIds: Joi.array().items(Joi.string()),
          userIds: Joi.array().items(Joi.string()),
          roleIds: Joi.array().items(Joi.string()),
          engagementCategories: Joi.array().items(Joi.string()),
          safetyMessageChannelId: Joi.string().optional(),
        }).required(),
      }),
    ),
  }),
};

const getAnnouncements = {
  params: Joi.object()
    .required()
    .keys({
      platformId: Joi.string().custom(objectId),
    }),
  query: Joi.object().keys({
    communityId: Joi.string().custom(objectId).required(),
    sortBy: Joi.string(),
    limit: Joi.number().integer().max(100).default(10),
    page: Joi.number().integer().min(1).default(1),
    startDate: Joi.date().iso().description('ISO date string. UTC time zone'),
    endDate: Joi.date()
      .iso()
      .when('startDate', {
        is: Joi.exist(),
        then: Joi.date().greater(Joi.ref('startDate')),
        otherwise: Joi.optional(),
      })
      .description('ISO date string. UTC time zone'),
    timeZone: Joi.string().default('UTC'),
  }),
};

const getOneAnnouncement = {
  params: Joi.object()
    .required()
    .keys({
      platformId: Joi.string().custom(objectId),
      announcementId: Joi.string().custom(objectId),
    }),
};

const deleteAnnouncement = {
  params: Joi.object()
    .required()
    .keys({
      platformId: Joi.string().custom(objectId),
      announcementId: Joi.string().custom(objectId),
    }),
};

export default {
  createAnnouncement,
  updateAnnouncement,
  getAnnouncements,
  getOneAnnouncement,
  deleteAnnouncement,
};
