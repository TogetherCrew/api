import Joi from "joi";
import { objectId } from './custom.validation';

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
        community: Joi.string(),
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
};



export default {
    createPlatform,
    getPlatforms,
    getPlatform,
    updatePlatform,
    deletePlatform,
    connectPlatform
}