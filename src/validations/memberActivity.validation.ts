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

const disengagedMembersCompositionLineGraph = {
    params: Joi.object().required().keys({
        guildId: Joi.string().required()
    }),
    body: Joi.object().required().keys({
        startDate: Joi.date().required(),
        endDate: Joi.date().required(),
    }),
};

const inactiveMembersLineGraph = {
    params: Joi.object().required().keys({
        guildId: Joi.string().required()
    }),
    body: Joi.object().required().keys({
        startDate: Joi.date().required(),
        endDate: Joi.date().required(),
    }),
};

const activeMembersCompositionTable = {
    params: Joi.object().required().keys({
        guildId: Joi.string().required()
    }),
    query: Joi.object().required().keys({
        activityComposition: Joi.array().items(Joi.string().valid('all_active', 'all_new_active', 'all_consistent', 'all_vital', 'all_new_disengaged')),
        roles: Joi.string(),
        username: Joi.string(),
        sortBy: Joi.string(),
        limit: Joi.number().integer(),
        page: Joi.number().integer(),
    }),
};

export default {
    activeMembersCompositionLineGraph,
    activeMembersOnboardingLineGraph,
    disengagedMembersCompositionLineGraph,
    inactiveMembersLineGraph,
    activeMembersCompositionTable
}

