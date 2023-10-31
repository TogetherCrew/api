import Joi from "joi";

const updateUser = {
    body: Joi.object()
        .keys({
            email: Joi.string().email(),
            tcaAt: Joi.date()
        })
        .min(1),
};



export default {
    updateUser,
}