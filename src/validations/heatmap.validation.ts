import Joi from "joi";

const getHeatmaps = {
    params: Joi.object().required().keys({
        guildId: Joi.string().required()
    }),
    body: Joi.object().required().keys({
        startDate: Joi.date().required(),
        endDate: Joi.date().required(),
        timeZone: Joi.string().required()
    }),
};


export default {
    getHeatmaps
}