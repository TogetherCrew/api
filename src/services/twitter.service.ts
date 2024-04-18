import fetch from 'node-fetch';
import config from '../config';
import { ApiError } from '../utils';
import { ITwitterOAuth2EchangeCode, ITwitterUser } from '../interfaces';
import parentLogger from '../config/logger';

const logger = parentLogger.child({ module: 'TwitterService' });

/**
 * exchange twitter code with access token
 * @param {string} code
   @param {string} redirect_uri
 * @returns {Promise<ITwitterOAuth2EchangeCode>}
 */
async function exchangeTwitterCode(
  code: string,
  redirect_uri: string,
  code_verifier: string,
): Promise<ITwitterOAuth2EchangeCode> {
  try {
    const credentials = `${config.oAuth2.twitter.clientId}:${config.oAuth2.twitter.clientSecret}`;
    const encodedCredentials = Buffer.from(credentials).toString('base64');

    const data = {
      code_verifier,
      grant_type: 'authorization_code',
      redirect_uri,
      code,
    };
    const response = await fetch('https://api.twitter.com/2/oauth2/token', {
      method: 'POST',
      body: new URLSearchParams(data),
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${encodedCredentials}`,
      },
    });
    if (response.ok) {
      return await response.json();
    } else {
      throw new Error();
    }
  } catch (error) {
    logger.error({ error }, 'Failed to exchange twitter code');
    throw new ApiError(590, 'Can not fetch from discord API');
  }
}

/**
 * get user data from twitter api by access token
 * @param {String} accessToken
 * @returns {Promise<ITwitterUser>}
 */
async function getUserFromTwitterAPI(accessToken: string): Promise<ITwitterUser> {
  try {
    const response = await fetch('https://api.twitter.com/2/users/me?user.fields=profile_image_url,name,id', {
      method: 'GET',
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (response.ok) {
      return (await response.json()).data;
    } else {
      throw new Error();
    }
  } catch (error) {
    logger.error({ accessToken, error }, 'Failed to get user from twitter API');
    throw new ApiError(590, 'Can not fetch from twitter API');
  }
}

export default {
  exchangeTwitterCode,
  getUserFromTwitterAPI,
};
