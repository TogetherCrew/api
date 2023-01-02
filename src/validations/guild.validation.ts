import Joi from "joi";


const getGuildChannels = {
    params: Joi.object().required().keys({
        guildId: Joi.string().required()
    })
};





export default {
    getGuildChannels
}