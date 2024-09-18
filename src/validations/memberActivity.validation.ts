import Joi from 'joi';
import { objectId } from './custom.validation';

const activeMembersCompositionLineGraph = {
  params: Joi.object()
    .required()
    .keys({
      platformId: Joi.string().custom(objectId),
    }),
  body: Joi.object().required().keys({
    startDate: Joi.date().required(),
    endDate: Joi.date().required(),
  }),
};

const activeMembersOnboardingLineGraph = {
  params: Joi.object()
    .required()
    .keys({
      platformId: Joi.string().custom(objectId),
    }),
  body: Joi.object().required().keys({
    startDate: Joi.date().required(),
    endDate: Joi.date().required(),
  }),
};

const disengagedMembersCompositionLineGraph = {
  params: Joi.object()
    .required()
    .keys({
      platformId: Joi.string().custom(objectId),
    }),
  body: Joi.object().required().keys({
    startDate: Joi.date().required(),
    endDate: Joi.date().required(),
  }),
};

const inactiveMembersLineGraph = {
  params: Joi.object()
    .required()
    .keys({
      platformId: Joi.string().custom(objectId),
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

const decentralisationScore = {
  params: Joi.object()
    .required()
    .keys({
      platformId: Joi.string().custom(objectId),
    }),
};

const fragmentationScore = {
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
  body: Joi.object()
    .required()
    .keys({
      allRoles: Joi.boolean().default(true),
      include: Joi.array().items(Joi.string()).when('allRoles', { is: true, then: Joi.forbidden() }),
      exclude: Joi.array().items(Joi.string()).when('allRoles', { is: true, then: Joi.forbidden() }),
    })
    .nand('include', 'exclude'),
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
      roles: Joi.array().items(Joi.string()).single(),
      ngu: Joi.string(),
      sortBy: Joi.string(),
      limit: Joi.number().integer(),
      page: Joi.number().integer(),
    }),
  body: Joi.object()
    .required()
    .keys({
      allRoles: Joi.boolean().default(true),
      include: Joi.array().items(Joi.string()).when('allRoles', { is: true, then: Joi.forbidden() }),
      exclude: Joi.array().items(Joi.string()).when('allRoles', { is: true, then: Joi.forbidden() }),
    })
    .nand('include', 'exclude'),
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
      roles: Joi.array().items(Joi.string()).single(),
      ngu: Joi.string(),
      sortBy: Joi.string(),
      limit: Joi.number().integer(),
      page: Joi.number().integer(),
    }),
  body: Joi.object()
    .required()
    .keys({
      allRoles: Joi.boolean().default(true),
      include: Joi.array().items(Joi.string()).when('allRoles', { is: true, then: Joi.forbidden() }),
      exclude: Joi.array().items(Joi.string()).when('allRoles', { is: true, then: Joi.forbidden() }),
    })
    .nand('include', 'exclude'),
};

export default {
  activeMembersCompositionLineGraph,
  activeMembersOnboardingLineGraph,
  disengagedMembersCompositionLineGraph,
  inactiveMembersLineGraph,
  membersInteractionsNetworkGraph,
  decentralisationScore,
  fragmentationScore,
  activeMembersCompositionTable,
  activeMembersOnboardingTable,
  disengagedMembersCompositionTable,
};
