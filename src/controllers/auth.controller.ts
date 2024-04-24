import httpStatus from 'http-status';
import { Request, Response } from 'express';
import config from '../config';
import { discord } from '../config/oAtuh2';
import { userService, authService, tokenService, discordServices } from '../services';
import { catchAsync } from '../utils';
import querystring from 'querystring';
import { generateState } from '../config/oAtuh2';
import { ISessionRequest } from '../interfaces';
import logger from '../config/logger';

const discordAuthorize = catchAsync(async function (req: ISessionRequest, res: Response) {
  const state = generateState();
  req.session.state = state;
  res.redirect(
    `https://discord.com/api/oauth2/authorize?client_id=${config.oAuth2.discord.clientId}&redirect_uri=${config.oAuth2.discord.callbackURI.authorize}&response_type=code&scope=${discord.scopes.authorize}&state=${state}`,
  );
});

const discordAuthorizeCallback = catchAsync(async function (req: ISessionRequest, res: Response) {
  const STATUS_CODE_SINGIN = 1001;
  const STATUS_CODE_LOGIN = 1002;
  const STATUS_CODE_ERROR = 1003;
  const code = req.query.code as string;
  const returnedState = req.query.state as string;
  const storedState = req.session.state;
  let statusCode = STATUS_CODE_LOGIN;
  try {
    if (!code || !returnedState || returnedState !== storedState) {
      throw new Error('Invalid code or state mismatch');
    }
    const discordOathCallback = await authService.exchangeCode(code, config.oAuth2.discord.callbackURI.authorize);
    const discordUser = await discordServices.coreService.getUserFromDiscordAPI(discordOathCallback.access_token);
    let user = await userService.getUserByFilter({ discordId: discordUser.id });

    if (!user) {
      user = await userService.createUser({ discordId: discordUser.id });
      statusCode = STATUS_CODE_SINGIN;
    }
    tokenService.saveDiscordOAuth2Tokens(user.id, discordOathCallback);
    const tokens = await tokenService.generateAuthTokens(user);
    const params = {
      statusCode: statusCode,
      accessToken: tokens.access.token,
      accessExp: tokens.access.expires.toString(),
      refreshToken: tokens.refresh.token,
      refreshExp: tokens.refresh.expires.toString(),
    };
    const query = querystring.stringify(params);
    res.redirect(`${config.frontend.url}/callback?` + query);
  } catch (err) {
    logger.error({ err }, 'Failed to authorize discord account');
    const params = {
      statusCode: STATUS_CODE_ERROR,
    };
    const query = querystring.stringify(params);
    res.redirect(`${config.frontend.url}/callback?` + query);
  }
});

const logout = catchAsync(async function (req: Request, res: Response) {
  const { refreshToken } = req.body;
  await authService.logout(refreshToken);
  res.status(httpStatus.NO_CONTENT).send();
});

const refreshTokens = catchAsync(async function (req: Request, res: Response) {
  const tokens = await authService.refreshAuth(req.body.refreshToken);
  res.send({ ...tokens });
});

export default {
  discordAuthorize,
  discordAuthorizeCallback,
  refreshTokens,
  logout,
};
