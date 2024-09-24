import Joi from 'joi';
import { objectId } from './custom.validation';

const heatmapChart = {
  params: Joi.object()
    .required()
    .keys({
      platformId: Joi.string().custom(objectId).required(),
    }),
  body: Joi.object()
    .required()
    .keys({
      startDate: Joi.date().required(),
      endDate: Joi.date().required(),
      timeZone: Joi.string().required(),
      allCategories: Joi.boolean().default(true),
      include: Joi.array().items(Joi.number()).when('allCategories', { is: true, then: Joi.forbidden() }),
      exclude: Joi.array().items(Joi.number()).when('allCategories', { is: true, then: Joi.forbidden() }),
    }),
};

const lineGraph = {
  params: Joi.object()
    .required()
    .keys({
      platformId: Joi.string().custom(objectId).required(),
    }),
  body: Joi.object().required().keys({
    startDate: Joi.date().required(),
    endDate: Joi.date().required(),
  }),
};

const membersInteractionsNetworkGraph = {
  params: Joi.object()
    .required()
    .keys({
      platformId: Joi.string().custom(objectId),
    }),
};

const activeMembersCompositionTable = {
  params: Joi.object()
    .required()
    .keys({
      platformId: Joi.string().custom(objectId),
    }),
  query: Joi.object()
    .required()
    .keys({
      activityComposition: Joi.array()
        .items(
          Joi.string().valid(
            'all_active',
            'all_new_active',
            'all_consistent',
            'all_vital',
            'all_new_disengaged',
            'others',
          ),
        )
        .single(),
      ngu: Joi.string(),
      sortBy: Joi.string(),
      limit: Joi.number().integer(),
      page: Joi.number().integer(),
    }),
};

const activeMembersOnboardingTable = {
  params: Joi.object()
    .required()
    .keys({
      platformId: Joi.string().custom(objectId),
    }),
  query: Joi.object()
    .required()
    .keys({
      activityComposition: Joi.array()
        .items(Joi.string().valid('all_joined', 'all_new_active', 'all_still_active', 'all_dropped', 'others'))
        .single(),
      ngu: Joi.string(),
      sortBy: Joi.string(),
      limit: Joi.number().integer(),
      page: Joi.number().integer(),
    }),
};

const disengagedMembersCompositionTable = {
  params: Joi.object()
    .required()
    .keys({
      platformId: Joi.string().custom(objectId),
    }),
  query: Joi.object()
    .required()
    .keys({
      activityComposition: Joi.array()
        .items(
          Joi.string().valid(
            'all_new_disengaged',
            'all_disengaged_were_newly_active',
            'all_disengaged_were_consistently_active',
            'all_disengaged_were_vital',
            'others',
          ),
        )
        .single(),
      ngu: Joi.string(),
      sortBy: Joi.string(),
      limit: Joi.number().integer(),
      page: Joi.number().integer(),
    }),
};

export default {
  heatmapChart,
  lineGraph,
  membersInteractionsNetworkGraph,
  activeMembersCompositionTable,
  activeMembersOnboardingTable,
  disengagedMembersCompositionTable,
};
