import { Request, Response } from 'express';
import httpStatus from 'http-status';
import querystring from 'querystring';

import config from '../config';
import logger from '../config/logger';
import { discord, generateState } from '../config/oAtuh2';
import { ISessionRequest, TelegramCallbackParams } from '../interfaces';
import { authService, discordServices, telegramService, tokenService } from '../services';
import { catchAsync } from '../utils';

const discordAuthorize = catchAsync(async function (req: ISessionRequest, res: Response) {
  const state = generateState();
  req.session.state = state;
  res.redirect(
    `https://discord.com/api/oauth2/authorize?client_id=${config.oAuth2.discord.clientId}&redirect_uri=${config.oAuth2.discord.callbackURI.authorize}&response_type=code&scope=${discord.scopes.authorize}&state=${state}`,
  );
});

const discordAuthorizeCallback = catchAsync(async function (req: ISessionRequest, res: Response) {
  try {
    const code = req.query.code as string;
    const returnedState = req.query.state as string;
    const storedState = req.session.state;
    const redirectUrl = await discordServices.authService.handleOAuthCallback({
      code,
      state: returnedState,
      storedState,
    });

    res.redirect(redirectUrl);
  } catch (err) {
    logger.error({ err }, 'Failed to authorize Discord account');
    const params = {
      statusCode: 1003,
    };
    const query = querystring.stringify(params);
    res.redirect(`${config.frontend.url}/callback?${query}`);
  }
});

const telegramAuthorizeCallback = catchAsync(async function (req: Request, res: Response) {
  try {
    const params: TelegramCallbackParams = req.query as unknown as TelegramCallbackParams;

    const redirectUrl = await telegramService.authService.handleOAuthCallback(params);
    res.redirect(redirectUrl);
  } catch (err) {
    logger.error({ err }, 'Failed to authorize Telegram account');

    const params = {
      statusCode: 1003,
    };
    const query = querystring.stringify(params);
    res.redirect(`${config.frontend.url}/callback?${query}`);
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

const generateToken = catchAsync(async function (req: Request, res: Response) {
  const token = await tokenService.generateTelegramVerificationToken(req.user.id, req.body.communityId);
  res.send(token);
});

export default {
  discordAuthorize,
  discordAuthorizeCallback,
  telegramAuthorizeCallback,
  refreshTokens,
  logout,
  generateToken,
};
