import Joi from "joi";

const updateUser = {
    body: Joi.object().required().keys({

        email: Joi.string().email()

    }),
};

export default {
    updateUser
}