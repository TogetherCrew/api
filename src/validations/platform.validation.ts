import Joi from "joi";
import { Request } from 'express';
import { objectId } from './custom.validation';
import { IAuthAndPlatform } from "src/interfaces";

const createPlatform = {
    body: Joi.object().keys({
        name: Joi.string().required().valid('twitter', 'discord'),
        community: Joi.string().custom(objectId),
        metadata: Joi.when('name', {
            switch: [
                {
                    is: 'discord', then: Joi.object().keys({
                        id: Joi.string().required(),
                        name: Joi.string().required(),
                        icon: Joi.string().required().allow(''),
                    })
                },
                {
                    is: 'twitter', then: Joi.object().keys({
                        id: Joi.string().required(),
                        username: Joi.string().required(),
                        profileImageUrl: Joi.string().required(),
                    })
                }
            ]
        }).required()
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

const deletePlatform = {
    params: Joi.object().keys({
        platformId: Joi.string().custom(objectId),
    }),
    body: Joi.object().required().keys({
        deleteType: Joi.string().required().valid('soft', 'hard')
    }),
};


const dynamicUpdatePlatform = (req: Request) => {
    const authReq = req as IAuthAndPlatform;
    const { platform } = authReq;
    if (platform.name === 'discord') {
        return {
            params: Joi.object().keys({
                platformId: Joi.required().custom(objectId),
            }),
            body: Joi.object().required().keys({
                metadata: Joi.object().required().keys({
                    selectedChannels: Joi.array().items(Joi.string()),
                    period: Joi.date(),
                    analyzerStartedAt: Joi.date()
                })
            }),
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

const dynamicPlatformProperty = (req: Request) => {
    const authReq = req as IAuthAndPlatform;
    const { property } = authReq.query;
    const { platform } = authReq;
    if (platform.name === 'discord' && property === 'channel') {
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
    else if (platform?.name === 'discord' && property === 'guildMember') {
        return {
            params: Joi.object().keys({
                platformId: Joi.required().custom(objectId),
            }),
            query: Joi.object().required().keys({
                property: Joi.string().valid('guildMember'),
                ngu: Joi.string(),
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

const dynamicRequestAccess = (req: Request) => {
    const platform = req.params.platform;
    if (platform === 'discord') {
        return {
            params: Joi.object().keys({
                platform: Joi.string().valid('discord').required(),
                module: Joi.string().valid('Announcement').required(),
                id: Joi.string().required()
            }),
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
    deletePlatform,
    connectPlatform,
    dynamicUpdatePlatform,
    dynamicPlatformProperty,
    dynamicRequestAccess
}