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
      channelIds: Joi.array().items(Joi.string()).required(),
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

export default {
  heatmapChart,
  lineGraph,
};
