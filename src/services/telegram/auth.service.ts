import crypto from 'crypto';
import querystring from 'querystring';

import { PlatformNames } from '@togethercrew.dev/db';

import config from '../../config';
import { TelegramCallbackParams } from '../../interfaces';
import tokenService from '../token.service';
import userService from '../user.service';

const STATUS_CODE_SIGNIN = 1010;
const STATUS_CODE_LOGIN = 1011;

/**
 * Verifies the authorization hash provided by Telegram.
 * @param hash - The hash received from Telegram.
 * @param dataCheckString - The data string used to calculate the hash.
 * @throws Will throw an error if the calculated hash does not match the provided hash.
 */
const checkAuthorization = async (hash: string, dataCheckString: string): Promise<void> => {
  const secretKey = crypto.createHash('sha256').update(config.oAuth2.telegram.botToken).digest();

  const hmac = crypto.createHmac('sha256', secretKey);
  hmac.update(dataCheckString);
  const calculatedHash = hmac.digest('hex');

  if (calculatedHash !== hash) {
    throw new Error('Data is NOT from Telegram');
  }
};

/**
 * Handles the OAuth callback from Telegram.
 * @param params - The callback parameters from Telegram.
 * @returns A URL string to redirect the user to the frontend application.
 */
const handleOAuthCallback = async (params: TelegramCallbackParams): Promise<string> => {
  let statusCode = STATUS_CODE_LOGIN;

  const { hash, ...data } = params;

  const sortedKeys = Object.keys(data).sort();
  const dataCheckString = sortedKeys.map((key) => `${key}=${data[key]}`).join('\n');

  await checkAuthorization(hash, dataCheckString);

  const userId = data.id;
  let user = await userService.getUserByIdentity(PlatformNames.Telegram, userId);

  if (!user) {
    user = await userService.createUserWithIdentity(PlatformNames.Telegram, userId);
    statusCode = STATUS_CODE_SIGNIN;
  }

  const tokens = await tokenService.generateAuthTokens(user);

  const paramsToRedirect = {
    statusCode,
    accessToken: tokens.access.token,
    accessExp: tokens.access.expires.toString(),
    refreshToken: tokens.refresh.token,
    refreshExp: tokens.refresh.expires.toString(),
  };

  const query = querystring.stringify(paramsToRedirect);
  return `${config.frontend.url}/callback?${query}`;
};

export default {
  handleOAuthCallback,
};
