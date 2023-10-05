import httpStatus from 'http-status';
import { Request, Response } from 'express';
import config from '../config';
import { scopes, permissions } from '../config/dicord';
import { twitterScopes } from '../config/twitter';
import { userService, authService, tokenService, guildService } from '../services';
import { IDiscordUser, IDiscordOathBotCallback } from '@togethercrew.dev/db';
import { catchAsync } from '../utils';
import { IAuthTokens } from '../interfaces/token.interface';
import querystring from 'querystring';
import { generateState, generateCodeChallenge, generateCodeVerifier } from '../config/oauth2';
import { ISessionRequest, IAuthAndSessionRequest } from '../interfaces/request.interface';
import logger from '../config/logger';

const tryNow = catchAsync(async function (req: Request, res: Response) {
  res.redirect(
    `https://discord.com/api/oauth2/authorize?client_id=${config.discord.clientId}&redirect_uri=${
      config.discord.callbackURI.tryNow
    }&response_type=code&scope=${scopes.tryNow}&permissions=${
      permissions.ViewChannels | permissions.readMessageHistory
    }`,
  );
});

const tryNowCallback = catchAsync(async function (req: Request, res: Response) {
  const code = req.query.code as string;
  let statusCode = 501,
    guildName,
    guildId,
    connectedGuild;
  try {
    if (!code) {
      throw new Error();
    }
    const discordOathCallback: IDiscordOathBotCallback = await authService.exchangeCode(
      code,
      config.discord.callbackURI.tryNow,
    );
    const discordUser: IDiscordUser = await userService.getUserFromDiscordAPI(discordOathCallback.access_token);
    let user = await userService.getUserByDiscordId(discordUser.id);
    let guild = await guildService.getGuildByGuildId(discordOathCallback.guild.id);
    if (!user) {
      user = await userService.createUser(discordUser);
    }
    connectedGuild = await guildService.getGuild({
      user: user.discordId,
      guildId: { $ne: discordOathCallback.guild.id },
      isDisconnected: false,
    });
    if (connectedGuild) {
      guildName = connectedGuild.name;
      guildId = connectedGuild.guildId;
      statusCode = 502;
    } else {
      if (!guild) {
        guild = await guildService.createGuild(discordOathCallback.guild, user.discordId);
      } else {
        if (guild.isDisconnected) {
          statusCode = 504;
          await guildService.updateGuild(
            { guildId: discordOathCallback.guild.id, user: user.discordId },
            { isDisconnected: false },
          );
        } else {
          statusCode = 503;
        }
      }
      guildName = guild.name;
      guildId = guild.guildId;
    }
    tokenService.saveDiscordAuth(user.discordId, discordOathCallback);
    const tokens: IAuthTokens = await tokenService.generateAuthTokens(user.discordId);
    const query = querystring.stringify({
      statusCode: statusCode,
      guildId: guildId,
      guildName: guildName,
      accessToken: tokens.access.token,
      accessExp: tokens.access.expires.toString(),
      refreshToken: tokens.refresh.token,
      refreshExp: tokens.refresh.expires.toString(),
    });
    res.redirect(`${config.frontend.url}/callback?` + query);
  } catch (err) {
    const query = querystring.stringify({
      statusCode: 490,
    });
    res.redirect(`${config.frontend.url}/callback?` + query);
  }
});

const login = catchAsync(async function (req: Request, res: Response) {
  res.redirect(
    `https://discord.com/api/oauth2/authorize?client_id=${config.discord.clientId}&redirect_uri=${config.discord.callbackURI.login}&response_type=code&scope=${scopes.login}`,
  );
});

const loginCallback = catchAsync(async function (req: Request, res: Response) {
  const code = req.query.code as string;
  let statusCode = 601;
  try {
    if (!code) {
      throw new Error();
    }
    const discordOathCallback: IDiscordOathBotCallback = await authService.exchangeCode(
      code,
      config.discord.callbackURI.login,
    );
    const discordUser: IDiscordUser = await userService.getUserFromDiscordAPI(discordOathCallback.access_token);
    const user = await userService.getUserByDiscordId(discordUser.id);
    if (!user) {
      statusCode = 602;
      const query = querystring.stringify({ statusCode: statusCode });
      res.redirect(`${config.frontend.url}/callback?` + query);
    } else {
      const guild = await guildService.getGuild({ user: user.discordId, isDisconnected: false });
      if (!guild) {
        statusCode = 603;
      }
      tokenService.saveDiscordAuth(user.discordId, discordOathCallback);
      const tokens: IAuthTokens = await tokenService.generateAuthTokens(user.discordId);
      const query = querystring.stringify({
        statusCode: statusCode,
        guildId: guild?.guildId,
        guildName: guild?.name,
        accessToken: tokens.access.token,
        accessExp: tokens.access.expires.toString(),
        refreshToken: tokens.refresh.token,
        refreshExp: tokens.refresh.expires.toString(),
      });
      res.redirect(`${config.frontend.url}/callback?` + query);
    }
  } catch (error) {
    const query = querystring.stringify({
      statusCode: 490,
    });
    res.redirect(`${config.frontend.url}/callback?` + query);
  }
});

const twitterLogin = catchAsync(async function (req: IAuthAndSessionRequest, res: Response) {
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = generateCodeChallenge(codeVerifier);
  const state = generateState();
  req.session.codeVerifier = codeVerifier;
  req.session.state = state;
  req.session.discordId = req.params.discordId;
  res.redirect(
    `https://twitter.com/i/oauth2/authorize?response_type=code&client_id=${config.twitter.clientId}&redirect_uri=${config.twitter.callbackURI.login}&scope=${twitterScopes.login}&state=${state}&code_challenge=${codeChallenge}&code_challenge_method=S256`,
  );
});

const twitterLoginCallback = catchAsync(async function (req: ISessionRequest, res: Response) {
  const code = req.query.code as string;
  const returnedState = req.query.state as string;
  const storedState = req.session.state;
  const storedCodeVerifier = req.session.codeVerifier;
  const discordId = req.session.discordId;
  const statusCode = 801;
  try {
    if (!code || !returnedState || returnedState !== storedState) {
      throw new Error();
    }
    const twitterOAuthCallback = await authService.exchangeTwitterCode(
      code,
      config.twitter.callbackURI.login,
      storedCodeVerifier,
    );
    const twitterUser = await userService.getUserFromTwitterAPI(twitterOAuthCallback.access_token);
    const user = await userService.updateUserByDiscordId(discordId, {
      twitterId: twitterUser.id,
      twitterUsername: twitterUser.username,
      twitterProfileImageUrl: twitterUser.profile_image_url,
      twitterConnectedAt: new Date(),
      twitterIsInProgress: true,
    });
    tokenService.saveTwitterAuth(user.discordId, twitterOAuthCallback);
    const query = querystring.stringify({
      statusCode: statusCode,
      twitterId: twitterUser.id,
      twitterUsername: twitterUser.username,
    });
    res.redirect(`${config.frontend.url}/callback?` + query);
  } catch (error) {
    logger.error(error);
    const query = querystring.stringify({
      statusCode: 890,
    });
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
  tryNow,
  tryNowCallback,
  login,
  loginCallback,
  refreshTokens,
  logout,
  twitterLogin,
  twitterLoginCallback,
};
