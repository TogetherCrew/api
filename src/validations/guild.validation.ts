import Joi from "joi";


const getGuildChannels = {
    params: Joi.object().required().keys({
        guildId: Joi.string().required()
    })
};


const updateGuild = {
    params: Joi.object().required().keys({
        guildId: Joi.string().required()
    }),
    body: Joi.object().required().keys({
        selectedChannels: Joi.array().items(Joi.object().keys({
            channelId: Joi.string().required(),
            channelName: Joi.string().required()
        })),
        period: Joi.date()

    }),
};


export default {
    getGuildChannels,
    updateGuild
}