import Joi from "joi";
import { objectId } from './custom.validation';

const createAnnouncement = {
    body: Joi.object().keys({
        title: Joi.string(),
        communityId: Joi.string().custom(objectId).required(),
        scheduledAt: Joi.date().greater('now').iso().required().description('ISO date string. UTC time zone'),
        draft: Joi.boolean().required(),
        data: Joi.array().items(
            Joi.object({
                platformId: Joi.string().custom(objectId).required(),
                template: Joi.string().required(),
                options: Joi.object({
                    channelIds: Joi.array().items(Joi.string()).min(1),
                    userIds: Joi.array().items(Joi.string()),
                    roleIds: Joi.array().items(Joi.string())
                }).required()
            })
        ).required().min(1)
    })
}

const updateAnnouncement = {
    body: Joi.object().keys({
        title: Joi.string(),
        scheduledAt: Joi.date().greater('now').iso().description('ISO date string. UTC time zone'),
        draft: Joi.boolean(),
        data: Joi.array().items(
            Joi.object({
                platformId: Joi.string().custom(objectId).required(),
                template: Joi.string().required(),
                options: Joi.object({
                    channelIds: Joi.array().items(Joi.string()).min(1),
                    userIds: Joi.array().items(Joi.string()),
                    roleIds: Joi.array().items(Joi.string())
                }).required()
            })
        )
    })
}

const getAnnouncements = {
    query: Joi.object().keys({
        communityId: Joi.string().custom(objectId).required(),
        sortBy: Joi.string(),
        limit: Joi.number().integer().max(100).default(10),
        page: Joi.number().integer().min(1).default(1),
        startDate: Joi.date().iso().description('ISO date string. UTC time zone'),
        endDate: Joi.date().iso().when('startDate', {
            is: Joi.exist(),
            then: Joi.date().greater(Joi.ref('startDate')),
            otherwise: Joi.optional()
        }).description('ISO date string. UTC time zone'),
        timeZone: Joi.string().default('UTC'),
    }),
}

export default {
    createAnnouncement,
    updateAnnouncement,
    getAnnouncements
}