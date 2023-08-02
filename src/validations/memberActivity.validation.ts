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

const memberInteractionsGraph = {
    params: Joi.object().required().keys({
        guildId: Joi.string().required()
    }),
}

const decentralisationScore = {
    params: Joi.object().required().keys({
        guildId: Joi.string().required()
    }),
}

const fragmentationScore = {
    params: Joi.object().required().keys({
        guildId: Joi.string().required()
    }),
}

const activeMembersCompositionTable = {
    params: Joi.object().required().keys({
        guildId: Joi.string().required()
    }),
    query: Joi.object().required().keys({
        activityComposition: Joi.array().items(Joi.string().valid('all_active', 'all_new_active', 'all_consistent', 'all_vital', 'all_new_disengaged', 'others')).single(),
        roles: Joi.array().items(Joi.string()).single(),
        ngu: Joi.string(),
        sortBy: Joi.string(),
        limit: Joi.number().integer(),
        page: Joi.number().integer(),
    }),
};

const activeMembersOnboardingTable = {
    params: Joi.object().required().keys({
        guildId: Joi.string().required()
    }),
    query: Joi.object().required().keys({
        activityComposition: Joi.array().items(Joi.string().valid('all_joined', 'all_new_active', 'all_still_active', 'all_dropped', 'others')).single(),
        roles: Joi.array().items(Joi.string()).single(),
        ngu: Joi.string(),
        sortBy: Joi.string(),
        limit: Joi.number().integer(),
        page: Joi.number().integer(),
    }),
};

const disengagedMembersCompositionTable = {
    params: Joi.object().required().keys({
        guildId: Joi.string().required()
    }),
    query: Joi.object().required().keys({
        activityComposition: Joi.array().items(Joi.string().valid('all_new_disengaged', 'all_disengaged_were_newly_active', 'all_disengaged_were_consistently_active', 'all_disengaged_were_vital', 'others')).single(),
        roles: Joi.array().items(Joi.string()).single(),
        ngu: Joi.string(),
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
    memberInteractionsGraph,
    decentralisationScore,
    fragmentationScore,
    activeMembersCompositionTable,
    activeMembersOnboardingTable,
    disengagedMembersCompositionTable
}

