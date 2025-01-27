import querystring from 'querystring';

import { PlatformNames } from '@togethercrew.dev/db';

import config from '../../config';
import tokenService from '../token.service';
import userService from '../user.service';
import coreService from './core.service';

const STATUS_CODE_SIGNIN = 1001;
const STATUS_CODE_LOGIN = 1002;

interface OAuthCallbackParams {
  code: string;
  state: string;
  storedState: string;
}

const handleOAuthCallback = async (provider: PlatformNames, params: OAuthCallbackParams) => {
  const { code, state: returnedState, storedState } = params;
  let statusCode = STATUS_CODE_LOGIN;

  if (!code || !returnedState || returnedState !== storedState) {
    throw new Error('Invalid code or state mismatch');
  }

  const oauthCallbackData = await coreService.exchangeCode(code, config.oAuth2.discord.callbackURI.authorize);
  const discordUser = await coreService.getUserFromDiscordAPI(oauthCallbackData.access_token);

  const userId = discordUser.id;
  let user = await userService.getUserByIdentity(provider, userId);
  if (!user) {
    user = await userService.createUserWithIdentity(provider, userId);
    statusCode = STATUS_CODE_SIGNIN;
  }
  tokenService.saveDiscordOAuth2Tokens(user.id, oauthCallbackData);
  const tokens = await tokenService.generateAuthTokens(user);
  const paramsToRedirect = {
    statusCode: statusCode,
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
