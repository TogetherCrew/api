import fetch from 'node-fetch';
import httpStatus from 'http-status';
import config from '../config';
import { ApiError } from '../utils';
import { Snowflake } from 'discord.js';

/**
 * call the analyser API when the selected channel changed
 * @param {Snowflake} guildId
 */
async function notifyTheAnalyzerWhenSelectedChannelsChanged(guildId: Snowflake) {
    const response = await fetch(`${config.analyzerAppURI}/recompute_analytics?guildId=${guildId}`, {
        method: 'GET',
    });
    if (!response.ok) {
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Can not access to the analyser api');
    }
}


export default {
    notifyTheAnalyzerWhenSelectedChannelsChanged,
}