import Joi from 'joi';
import { objectId } from './custom.validation';
import { Types } from 'mongoose';

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

const deleteModule = {
    params: Joi.object().keys({
        moduleId: Joi.string().custom(objectId).required(),
    }),
};

export default {
    createModule,
    getModules,
    getModule,
    deleteModule
};
