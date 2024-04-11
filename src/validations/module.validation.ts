import Joi from 'joi';
import { objectId } from './custom.validation';
import { Types } from 'mongoose';

const createModule = {
    body: Joi.object().keys({
        name: Joi.string().required().valid('hivemind'),
        community: Joi.string().custom(objectId),
    }),
};

export default {
    createModule
};
