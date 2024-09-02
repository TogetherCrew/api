import fetch from 'node-fetch';
import config from '../../config';
import { ApiError } from '../../utils';
import parentLogger from '../../config/logger';
import httpStatus from 'http-status';

const logger = parentLogger.child({ module: 'NotionCoreService' });

/**
 * exchange code with access token
 * @param {string} code
 */
async function exchangeCode(code: string) {
  try {
    const data = {
      grant_type: 'authorization_code',
      redirect_uri: config.oAuth2.notion.callbackURI.connect,
      code,
    };

    const encoded = Buffer.from(`${config.oAuth2.notion.clientId}:${config.oAuth2.notion.clientSecret}`).toString(
      'base64',
    );

    const response = await fetch('https://api.notion.com/v1/oauth/token', {
      method: 'POST',
      body: JSON.stringify(data),
      headers: { Accept: 'application/json', 'Content-Type': 'application/json', Authorization: `Basic ${encoded}` },
    });
    if (response.ok) {
      return await response.json();
    } else {
      const errorResponse = await response.text();
      throw new Error(errorResponse);
    }
  } catch (error) {
    logger.error(error, 'Failed to exchange notion code');
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to exchange notion code');
  }
}

export default {
  exchangeCode,
};
