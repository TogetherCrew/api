import Joi from "joi";
import { Request } from 'express';
import { objectId } from './custom.validation';
import { IAuthRequest } from "src/interfaces";

const createPlatform = {
    body: Joi.object().keys({
        name: Joi.string().required().valid('twitter', 'discord'),
        community: Joi.string().custom(objectId),
        metadata: Joi.alternatives().try(
            Joi.string(),
            Joi.number(),
            Joi.boolean(),
            Joi.array(),
            Joi.object(),
            Joi.valid(null)
        ).required()
    }),
};

const connectPlatform = {
    params: Joi.object().keys({
        platform: Joi.string().valid('twitter', 'discord'),
    }),
};

const getPlatforms = {
    query: Joi.object().keys({
        name: Joi.string().valid('twitter', 'discord'),
        community: Joi.string().required(),
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

const updatePlatform = {
    params: Joi.object().keys({
        platformId: Joi.required().custom(objectId),
    }),
    body: Joi.object()
        .keys({
            name: Joi.string().valid('twitter', 'discord'),
            metadata: Joi.alternatives().try(
                Joi.string(),
                Joi.number(),
                Joi.boolean(),
                Joi.array(),
                Joi.object(),
                Joi.valid(null)
            )
        })
        .min(1),
};

const deletePlatform = {
    params: Joi.object().keys({
        platformId: Joi.string().custom(objectId),
    }),
    body: Joi.object().required().keys({
        deleteType: Joi.string().required().valid('soft', 'hard')
    }),
};



const dynamicPlatformValidation = (req: Request) => {
    const authReq = req as IAuthRequest;
    const { property } = authReq.query;
    const { platform } = authReq;
    if (platform?.name === 'discord' && property === 'channel') {
        return {
            params: Joi.object().keys({
                platformId: Joi.required().custom(objectId),
            }),
            query: Joi.object().required().keys({
                property: Joi.string().valid('channel'),
            }),
            body: Joi.object().required().keys({
                channelIds: Joi.array().items(Joi.string()),
            })
        };
    } else if (platform?.name === 'discord' && property === 'role') {
        return {
            params: Joi.object().keys({
                platformId: Joi.required().custom(objectId),
            }),
            query: Joi.object().required().keys({
                property: Joi.string().valid('role'),
                name: Joi.string(),
                sortBy: Joi.string(),
                limit: Joi.number().integer(),
                page: Joi.number().integer(),
            })
        };
    }
    else {
        return {
            query: Joi.object().required().keys({}),
            params: Joi.object().required().keys({}),
            body: Joi.object().required().keys({}),

        };
    }
};

export default {
    createPlatform,
    getPlatforms,
    getPlatform,
    updatePlatform,
    deletePlatform,
    connectPlatform,
    dynamicPlatformValidation
}