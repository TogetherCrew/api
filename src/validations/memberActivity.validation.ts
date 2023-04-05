import Joi from "joi";

const activeMembersCompositionLineGraph = {
    params: Joi.object().required().keys({
        guildId: Joi.string().required()
    }),
    body: Joi.object().required().keys({
        startDate: Joi.date().required(),
        endDate: Joi.date().required(),
    }),
};

const activeMembersOnboardingLineGraph = {
    params: Joi.object().required().keys({
        guildId: Joi.string().required()
    }),
    body: Joi.object().required().keys({
        startDate: Joi.date().required(),
        endDate: Joi.date().required(),
    }),
};

export default {
    activeMembersCompositionLineGraph,
    activeMembersOnboardingLineGraph
}