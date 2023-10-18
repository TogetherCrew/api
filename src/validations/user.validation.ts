import Joi from "joi";

const updateUser = {
    body: Joi.object()
        .keys({
            email: Joi.string().required().email(),
        })
        .min(1),
};



export default {
    updateUser,
}