import Joi from 'joi';

const askQuestion = {
  body: Joi.object().keys({
    communityId: Joi.string().required(),
    question: Joi.string().required(),
  }),
};

export default {
  askQuestion,
};
