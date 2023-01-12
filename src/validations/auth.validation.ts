import Joi from "joi";


const logout = {
    body: Joi.object().required().keys({
        refreshToken: Joi.string().required()
    })
};

const refreshTokens = {
    body: Joi.object().required().keys({
        refreshToken: Joi.string().required()
    })
};

export default {
    logout,
    refreshTokens
}