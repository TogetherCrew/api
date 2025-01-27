import { Request, Response } from 'express';
import httpStatus from 'http-status';
import querystring from 'querystring';

import { PlatformNames } from '@togethercrew.dev/db';

import config from '../config';
import logger from '../config/logger';
import { discord, generateState } from '../config/oAtuh2';
import { ISessionRequest } from '../interfaces';
import { authService, discordServices, tokenService } from '../services';
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
    const provider = PlatformNames.Discord;

    const redirectUrl = await discordServices.authService.handleOAuthCallback(provider, {
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

const telegramAuthorizeCallback = catchAsync(async function (req: Request, res: Response) {
  console.log(req.body, req.query, req.params);
  res.send('Hi');
});
export default {
  discordAuthorize,
  discordAuthorizeCallback,
  telegramAuthorizeCallback,
  refreshTokens,
  logout,
  generateToken,
};
