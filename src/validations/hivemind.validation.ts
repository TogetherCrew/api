import Joi from 'joi';

const askQuestion = {
  body: Joi.object().keys({
    communityId: Joi.string().required(),
    question: Joi.string().required(),
    chatId: Joi.string().optional(),
  }),
};

export default {
  askQuestion,
};
