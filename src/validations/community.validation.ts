import Joi from "joi";
import { objectId } from './custom.validation';

const createCommunity = {
    body: Joi.object().keys({
        name: Joi.string().required().max(100),
        avatarURL: Joi.string(),
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
    deleteCommunity
}