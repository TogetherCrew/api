import Joi from "joi";

const activeMembersLineGraph = {
    params: Joi.object().required().keys({
        guildId: Joi.string().required()
    }),
    body: Joi.object().required().keys({
        startDate: Joi.date().required(),
        endDate: Joi.date().required(),
    }),
};

export default {
    activeMembersLineGraph,

}