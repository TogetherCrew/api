import Joi from 'joi';

const getGuilds = {
  query: Joi.object().keys({
    isDisconnected: Joi.boolean(),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

const getGuild = {
  params: Joi.object().required().keys({
    guildId: Joi.string().required(),
  }),
};

const updateGuild = {
  params: Joi.object().required().keys({
    guildId: Joi.string().required(),
  }),
  body: Joi.object()
    .required()
    .keys({
      selectedChannels: Joi.array().items(
        Joi.object().keys({
          channelId: Joi.string().required(),
          channelName: Joi.string().required(),
        }),
      ),
      period: Joi.date(),
      isDisconnected: Joi.boolean(),
    }),
};

const disconnectGuild = {
  params: Joi.object().required().keys({
    guildId: Joi.string().required(),
  }),
  body: Joi.object()
    .required()
    .keys({
      disconnectType: Joi.string().required().valid('soft', 'hard'),
    }),
};

const getGuildFromDiscordAPI = {
  params: Joi.object().required().keys({
    guildId: Joi.string().required(),
  }),
};

const getRoles = {
  params: Joi.object().required().keys({
    guildId: Joi.string().required(),
  }),
  query: Joi.object().required().keys({
    name: Joi.string(),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

const getChannels = {
  params: Joi.object().required().keys({
    guildId: Joi.string().required(),
  }),
};

const getSelectedChannels = {
  params: Joi.object().required().keys({
    guildId: Joi.string().required(),
  }),
};

export default {
  getSelectedChannels,
  getChannels,
  updateGuild,
  getGuild,
  getGuildFromDiscordAPI,
  getRoles,
  getGuilds,
  disconnectGuild,
};
