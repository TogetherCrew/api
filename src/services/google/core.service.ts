import fetch from 'node-fetch';
import config from '../../config';
import { ApiError } from '../../utils';
import parentLogger from '../../config/logger';
import { google, Common } from 'googleapis';
import httpStatus from 'http-status';

const logger = parentLogger.child({ module: 'GoogleCoreService' });

class GoogleClientManager {
  public static client: Common.OAuth2Client;
  public static scopes: {
    googleDrive: [
      'https://www.googleapis.com/auth/drive.readonly',
      'https://www.googleapis.com/auth/drive.metadata.readonly',
    ];
  };
  public static async getClient(): Promise<Common.OAuth2Client> {
    if (!GoogleClientManager.client) {
      GoogleClientManager.client = new google.auth.OAuth2(
        config.oAuth2.google.clientId,
        config.oAuth2.google.clientSecret,
        config.oAuth2.google.callbackURI.connect,
      );
      // TODO:
      // GoogleClientManager.client.on('tokens', (tokens) => {
      //     if (tokens.refresh_token) {
      //         // store the refresh_token in my database!
      //     }
      // });
    }
    return GoogleClientManager.client;
  }
  public static async generateAuthUrl(
    accessType: 'online' | 'offline',
    scopes: string | string[],
    state: string,
  ): Promise<string> {
    const client = await GoogleClientManager.getClient();
    return client.generateAuthUrl({
      access_type: accessType,
      scope: scopes,
      state,
    });
  }

  public static async getTokens(code: string) {
    const client = await GoogleClientManager.getClient();
    return await client.getToken(code);
  }

  public static async setCredentials(tokens: object) {
    const client = await GoogleClientManager.getClient();
    client.setCredentials(tokens);
  }
}

/**
 * get user profile
 * @param {string} accessToken
 */
async function getUserProfile(accessToken: string) {
  try {
    const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      method: 'GET',
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (response.ok) {
      return await response.json();
    } else {
      const errorResponse = await response.text();
      throw new Error(errorResponse);
    }
  } catch (error) {
    logger.error(error, 'Failed to get user profile');
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to get user profile');
  }
}

export default {
  GoogleClientManager,
  getUserProfile,
};
