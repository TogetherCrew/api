import Joi from 'joi';
import { objectId } from './custom.validation';
import { Types } from 'mongoose';

const createModule = {
    body: Joi.object().keys({
        name: Joi.string().required().valid('hivemind'),
        community: Joi.string().custom(objectId),
    }),
};

const getModules = {
    query: Joi.object().keys({
        name: Joi.string().valid('hivemind'),
        community: Joi.string().required(),
        sortBy: Joi.string(),
        limit: Joi.number().integer(),
        page: Joi.number().integer(),
    }),
};


export default {
    createModule,
    getModules
};
