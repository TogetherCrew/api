import httpStatus from "http-status";
import fetch from 'node-fetch';
import { ApiError } from "../utils";
import { Response, NextFunction } from "express";
import { Snowflake } from "discord.js";
import config from '../config';
import { guildService } from '../services'

// /**
//  * check bot is in the guild or not 
//  * @param {Snowflake} guildId
//  * @returns {Promise<boolean>}
//  */
async function isBotInGuild(guildId: Snowflake) {
    try {
        const response = await fetch(`https://discord.com/api/guilds/${guildId}`, {
            method: 'GET',
            headers: { 'Authorization': `Bot ${config.discord.botToken}` }
        });
        return response.status === 200 ? true : false;
    } catch (err) {
        return false;
    }
}


// TODO: FIX any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const botStatus = () => async (req: any, res: Response, next: NextFunction) => {
    const guild = await guildService.getGuild({ guildId: req.params.guildId, user: req.user.discordId });
    if (!guild) {
        return next(new ApiError(httpStatus.NOT_FOUND, 'Guild not found'))
    }

    if (!await isBotInGuild(req.params.guildId)) {
        await guildService.updateGuild({ guildId: req.params.guildId, user: req.user.discordId }, { isDisconnected: true });
        return next(new ApiError(httpStatus.BAD_REQUEST, 'Bot is disconnected from guild'));
    }
    return next();
};

export default botStatus;