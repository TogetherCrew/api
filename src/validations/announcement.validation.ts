import Joi from "joi";
import { objectId } from './custom.validation';

const createAnnouncement = {
    body: Joi.object().keys({
        community: Joi.string().custom(objectId).required(),
        scheduledAt: Joi.date().required(),
        draft: Joi.boolean().required(),
        data: Joi.array().items(
            Joi.object({
                platformId: Joi.string().custom(objectId).required(),
                template: Joi.string().required(),
                options: Joi.object({
                    channelIds: Joi.array().items(Joi.string()),
                    userIds: Joi.array().items(Joi.string()),
                    roleIds: Joi.array().items(Joi.string())
                  }).xor('channelIds', 'userIds', 'roleIds').required()
            })
        ).required().min(1)       
    })
}

export default {
    createAnnouncement
}