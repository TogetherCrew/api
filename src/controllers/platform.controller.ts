import { Response } from 'express';
import { platformService, authService, twitterService, communityService, discordServices } from '../services';
import { IAuthRequest } from '../interfaces/Request.interface';
import { catchAsync, pick, ApiError } from '../utils';
import { generateState, generateCodeVerifier, generateCodeChallenge, twitter } from '../config/oAtuh2';
import { ISessionRequest, IAuthAndPlatform } from '../interfaces';
import config from '../config';
import { discord } from '../config/oAtuh2';
import httpStatus from 'http-status';
import querystring from 'querystring';

const createPlatform = catchAsync(async function (req: IAuthRequest, res: Response) {
  const community = req.community;
  await platformService.checkPlatformAlreadyConnected(community?.id, req.body);
  await platformService.checkSinglePlatformConnection(community?.id, req.body);
  const platform = await platformService.reconnectOrAddNewPlatform(community?.id, req.body);
  res.status(httpStatus.CREATED).send(platform);
});

const connectPlatform = catchAsync(async function (req: ISessionRequest, res: Response) {
  const platform = req.params.platform;
  const state = generateState();
  req.session.state = state;
  if (platform === 'discord') {
    const permissions = discord.permissions.ReadData.ViewChannel | discord.permissions.ReadData.ReadMessageHistory;
    const discordUrl = discord.generateDiscordAuthUrl(
      config.discord.callbackURI.connect,
      discord.scopes.connectGuild,
      permissions,
      state,
      '',
      false,
    );
    res.redirect(discordUrl);
  } else if (platform === 'twitter') {
    const codeVerifier = generateCodeVerifier();
    req.session.codeVerifier = codeVerifier;
    const twitterUrl = twitter.generateTwitterAuthUrl(state, generateCodeChallenge(codeVerifier));
    res.redirect(twitterUrl);
  }
});

const connectDiscordCallback = catchAsync(async function (req: ISessionRequest, res: Response) {
  const STATUS_CODE_SUCCESS = 1004;
  const STATUS_CODE_ERROR = 1005;
  const code = req.query.code as string;
  const returnedState = req.query.state as string;
  const storedState = req.session.state;
  try {
    if (!code || !returnedState || returnedState !== storedState) {
      throw new Error('Invalid code or state mismatch');
    }

    const discordOathCallback = await authService.exchangeCode(code, config.discord.callbackURI.connect);
    const params = {
      statusCode: STATUS_CODE_SUCCESS,
      platform: 'discord',
      id: discordOathCallback.guild.id,
      name: discordOathCallback.guild.name,
      icon: discordOathCallback.guild.icon,
    };
    const query = querystring.stringify(params);
    res.redirect(`${config.frontend.url}/callback?` + query);
  } catch (err) {
    const params = {
      statusCode: STATUS_CODE_ERROR,
    };
    const query = querystring.stringify(params);
    res.redirect(`${config.frontend.url}/callback?` + query);
  }
});

const connectTwitterCallback = catchAsync(async function (req: ISessionRequest, res: Response) {
  const STATUS_CODE_SUCCESS = 1006;
  const STATUS_CODE_FAILURE = 1007;
  const code = req.query.code as string;
  const returnedState = req.query.state as string;
  const storedState = req.session.state;
  const storedCodeVerifier = req.session.codeVerifier;
  try {
    if (!code || !returnedState || returnedState !== storedState) {
      throw new Error('Invalid code or state mismatch');
    }
    const twitterOAuthCallback = await twitterService.exchangeTwitterCode(
      code,
      config.twitter.callbackURI.connect,
      storedCodeVerifier,
    );
    const twitterUser = await twitterService.getUserFromTwitterAPI(twitterOAuthCallback.access_token);
    const params = {
      statusCode: STATUS_CODE_SUCCESS,
      platform: 'twitter',
      id: twitterUser.id,
      username: twitterUser.username,
      profileImageUrl: twitterUser.profile_image_url,
    };
    const query = querystring.stringify(params);
    res.redirect(`${config.frontend.url}/callback?` + query);
  } catch (err) {
    const params = {
      statusCode: STATUS_CODE_FAILURE,
    };
    const query = querystring.stringify(params);
    res.redirect(`${config.frontend.url}/callback?` + query);
  }
});

const requestAccessCallback = catchAsync(async function (req: ISessionRequest, res: Response) {
  const STATUS_CODE_SUCCESS = 1008;
  const STATUS_CODE_ERROR = 1009;
  const code = req.query.code as string;
  const returnedState = req.query.state as string;
  const storedState = req.session.state;
  try {
    if (!code || !returnedState || returnedState !== storedState) {
      throw new Error('Invalid code or state mismatch');
    }
    const params = {
      statusCode: STATUS_CODE_SUCCESS,
    };
    const query = querystring.stringify(params);
    res.redirect(`${config.frontend.url}/callback?` + query);
  } catch (err) {
    const params = {
      statusCode: STATUS_CODE_ERROR,
    };
    const query = querystring.stringify(params);
    res.redirect(`${config.frontend.url}/callback?` + query);
  }
});

const getPlatforms = catchAsync(async function (req: IAuthRequest, res: Response) {
  const filter = pick(req.query, ['name', 'community']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  if (filter.name) {
    filter.name = {
      $regex: filter.name,
      $options: 'i',
    };
  }
  // if (!filter.community) {
  //   filter.community = { $in: req.user.communities };
  // }
  filter.disconnectedAt = null;
  const result = await platformService.queryPlatforms(filter, options);
  res.send(result);
});

const getPlatform = catchAsync(async function (req: IAuthRequest, res: Response) {
  const platform = req.platform;
  if (platform?.metadata && platform.name === 'discord') {
    const BotPermissions = await discordServices.coreService.getBotPermissions(platform.metadata?.id);
    platform.metadata.permissions = discordServices.coreService.getPermissionsStatus(BotPermissions);
  }
  res.send(platform);
});
const updatePlatform = catchAsync(async function (req: IAuthAndPlatform, res: Response) {
  if (
    req.platform.name === 'discord' &&
    req.platform.metadata?.isInProgress &&
    (req.body.metadata.selectedChannels || req.body.metadata.period)
  ) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'Updating channels or date period is not allowed during server analysis.',
    );
  }
  const platform = await platformService.updatePlatform(req.platform, req.body, req.user.discordId);
  res.send(platform);
});
const deletePlatform = catchAsync(async function (req: IAuthAndPlatform, res: Response) {
  if (req.body.deleteType === 'soft') {
    await platformService.updatePlatform(req.platform, { disconnectedAt: new Date() });
  } else if (req.body.deleteType === 'hard') {
    await platformService.deletePlatform(req.platform);
    await discordServices.coreService.leaveBotFromGuild(req.platform.metadata?.id);
  }
  res.status(httpStatus.NO_CONTENT).send();
});

const getProperties = catchAsync(async function (req: IAuthAndPlatform, res: Response) {
  const platform = req.platform;
  let result;
  if (platform?.name === 'discord') {
    result = await discordServices.coreService.getPropertyHandler(req);
  }
  res.status(httpStatus.OK).send(result);
});

type module = keyof typeof discord.permissions;
const requestAccess = catchAsync(async function (req: ISessionRequest, res: Response) {
  const { platform, id } = req.params;
  const module = req.params.module as module;
  const state = generateState();
  req.session.state = state;
  if (platform === 'discord') {
    const currentBotPermissions = await discordServices.coreService.getBotPermissions(id);
    const requireBotPermissions = discordServices.coreService.getRequirePermissionsForModule(module);
    const combinedArray = currentBotPermissions.concat(requireBotPermissions);
    const permissionsValue = discordServices.coreService.getCombinedPermissionsValue(combinedArray);
    const permissionsValueNumber = Number(permissionsValue);
    const discordUrl = discord.generateDiscordAuthUrl(
      config.discord.callbackURI.requestAccess,
      discord.scopes.connectGuild,
      permissionsValueNumber,
      state,
      id,
      true,
    );
    res.redirect(discordUrl);
  }
});

export default {
  createPlatform,
  connectPlatform,
  connectTwitterCallback,
  connectDiscordCallback,
  getPlatforms,
  getPlatform,
  updatePlatform,
  deletePlatform,
  getProperties,
  requestAccess,
  requestAccessCallback,
};
