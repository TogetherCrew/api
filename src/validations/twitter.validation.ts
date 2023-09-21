import Joi from "joi";

const refreshTweet = {
    body: Joi.object().required().keys({
        twitter_username: Joi.string().required()
    }),
};

export default {
    refreshTweet,
}