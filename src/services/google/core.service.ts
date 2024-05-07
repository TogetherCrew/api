import fetch from 'node-fetch';
import { Client, GatewayIntentBits, Snowflake, Guild } from 'discord.js';
import config from '../../config';
import { DatabaseManager } from '@togethercrew.dev/db';
import { ApiError, pick, sort } from '../../utils';
import parentLogger from '../../config/logger';
import { discord } from '../../config/oAtuh2';
import { google, drive_v3, Auth, Common } from 'googleapis';

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
  public static async generateAuthUrl(accessType: 'online' | 'offline', scopes: string | string[]): Promise<string> {
    const client = await GoogleClientManager.getClient();
    return client.generateAuthUrl({
      access_type: accessType,
      scope: scopes,
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

export default {
  GoogleClientManager,
};
