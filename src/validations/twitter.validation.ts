import Joi from "joi";

const refreshTweet = {
    params: Joi.object().required().keys({
        twitter_username: Joi.string().required()
    }),
};

export default {
    refreshTweet,
}