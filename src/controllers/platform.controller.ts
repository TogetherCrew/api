import { Response } from 'express';
import httpStatus from 'http-status';
import querystring from 'querystring';

import { DatabaseManager, PlatformNames } from '@togethercrew.dev/db';

import config from '../config';
import parentLogger from '../config/logger';
import { discord, generateCodeChallenge, generateCodeVerifier, generateState, google, twitter } from '../config/oAtuh2';
import { IAuthAndPlatform, ISessionRequest } from '../interfaces';
import { IAuthRequest } from '../interfaces/Request.interface';
import {
  discordServices,
  discourseService,
  githubService,
  googleService,
  notionService,
  platformService,
  tokenService,
  twitterService,
  userService,
} from '../services';
import { catchAsync, pick } from '../utils';

const logger = parentLogger.child({ module: 'PlatformController' });

const createPlatform = catchAsync(async function (req: IAuthRequest, res: Response) {
  const community = req.community;
  const platform = await platformService.managePlatformConnection(community?.id, req.body);
  platformService.callExtractionApp(platform);
  res.status(httpStatus.CREATED).send(platform);
});

const connectPlatform = catchAsync(async function (req: ISessionRequest, res: Response) {
  const { platform } = req.query;
  const state = generateState();
  req.session.state = state;
  if (platform === PlatformNames.Discord) {
    const permissions = discord.permissions.ReadData.ViewChannel | discord.permissions.ReadData.ReadMessageHistory;
    const discordUrl = discord.generateDiscordAuthUrl(
      config.oAuth2.discord.callbackURI.connect,
      discord.scopes.connectGuild,
      permissions,
      state,
      '',
      false,
    );
    res.redirect(discordUrl);
  } else if (platform === PlatformNames.Twitter) {
    const codeVerifier = generateCodeVerifier();
    req.session.codeVerifier = codeVerifier;
    const twitterUrl = twitter.generateTwitterAuthUrl(state, generateCodeChallenge(codeVerifier));
    res.redirect(twitterUrl);
  } else if (platform === PlatformNames.Google) {
    req.session.userId = req.query.userId;
    let requestedScopes = req.query.scopes as string[];
    let aggregatedScopes: string[] = [];
    requestedScopes.forEach((scope) => {
      if (google.scopes[scope]) {
        aggregatedScopes = [...aggregatedScopes, ...google.scopes[scope]];
      }
    });

    aggregatedScopes = [...new Set(aggregatedScopes)];
    const authUrl = await googleService.coreService.GoogleClientManager.generateAuthUrl(
      'offline',
      aggregatedScopes,
      state,
    );
    res.redirect(authUrl);
  } else if (platform === PlatformNames.GitHub) {
    const link = `${config.oAuth2.github.publickLink}/installations/select_target`;
    res.redirect(link);
  } else if (platform === PlatformNames.Notion) {
    req.session.userId = req.query.userId;
    const link = `https://api.notion.com/v1/oauth/authorize?client_id=${config.oAuth2.notion.clientId}&response_type=code&owner=user&redirect_uri=${config.oAuth2.notion.callbackURI.connect}&state=${state}`;
    res.redirect(link);
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

    const discordOathCallback = await discordServices.coreService.exchangeCode(
      code,
      config.oAuth2.discord.callbackURI.connect,
    );
    const params = {
      statusCode: STATUS_CODE_SUCCESS,
      platform: PlatformNames.Discord,
      id: discordOathCallback.guild.id,
      name: discordOathCallback.guild.name,
      icon: discordOathCallback.guild.icon,
    };
    const query = querystring.stringify(params);
    res.redirect(`${config.frontend.url}/callback?` + query);
  } catch (err) {
    logger.error({ err }, `Failed in ${PlatformNames.Discord} connect callback`);
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
      config.oAuth2.twitter.callbackURI.connect,
      storedCodeVerifier,
    );
    const twitterUser = await twitterService.getUserFromTwitterAPI(twitterOAuthCallback.access_token);
    const params = {
      statusCode: STATUS_CODE_SUCCESS,
      platform: PlatformNames.Twitter,
      id: twitterUser.id,
      username: twitterUser.username,
      profileImageUrl: twitterUser.profile_image_url,
    };
    const query = querystring.stringify(params);
    res.redirect(`${config.frontend.url}/callback?` + query);
  } catch (err) {
    logger.error({ err }, `Failed in ${PlatformNames.Twitter} connect callback`);
    const params = {
      statusCode: STATUS_CODE_FAILURE,
    };
    const query = querystring.stringify(params);
    res.redirect(`${config.frontend.url}/callback?` + query);
  }
});

const connectGoogleCallback = catchAsync(async function (req: ISessionRequest, res: Response) {
  const STATUS_CODE_SUCCESS = 1010;
  const STATUS_CODE_ERROR = 1011;
  const code = req.query.code as string;
  const returnedState = req.query.state as string;
  const storedState = req.session.state;
  const userId = req.session.userId;
  let statusCode: number;
  try {
    if (!code || !returnedState || returnedState !== storedState || !userId) {
      throw new Error('Invalid code or state mismatch');
    }
    const { tokens } = await googleService.coreService.GoogleClientManager.getTokens(code);
    let user = await userService.getUserById(userId);

    if (tokens.access_token) {
      const userProifle = await googleService.coreService.getUserProfile(tokens.access_token);
      if (!user) {
        statusCode = STATUS_CODE_ERROR;
      } else {
        statusCode = STATUS_CODE_SUCCESS;
        await tokenService.saveGoogleOAuth2Tokens(user.id, tokens);
      }
      const params = {
        statusCode,
        platform: PlatformNames.Google,
        userId,
        id: userProifle.id,
        name: userProifle.name,
        picture: userProifle.picture,
      };
      const query = querystring.stringify(params);
      res.redirect(`${config.frontend.url}/callback?` + query);
    } else {
      throw new Error('Missing Access Token');
    }
  } catch (err) {
    logger.error({ err }, `Failed in ${PlatformNames.Google} connect callback`);
    const params = {
      statusCode: STATUS_CODE_ERROR,
    };
    const query = querystring.stringify(params);
    res.redirect(`${config.frontend.url}/callback?` + query);
  }
});

const connectGithubCallback = catchAsync(async function (req: ISessionRequest, res: Response) {
  const STATUS_CODE_SUCCESS = 1012;
  const STATUS_CODE_ERROR = 1013;
  const code = req.query.code as string;
  const installationId = req.query.installation_id as string;

  try {
    if (!code || !installationId) {
      throw new Error('Invalid code or installationId');
    }
    const appAccessToken = await githubService.coreService.generateAppAccessToken();
    const { token } = await githubService.coreService.getInstallationAccessToken(appAccessToken, installationId);
    const installation = await await githubService.coreService.getInstallationDetails(appAccessToken, installationId);
    const params = {
      statusCode: STATUS_CODE_SUCCESS,
      platform: PlatformNames.GitHub,
      installationId: installation.id,
      account_login: installation.account.login,
      account_id: installation.account.id,
      account_avatar_url: installation.account.avatar_url,
    };
    const query = querystring.stringify(params);
    res.redirect(`${config.frontend.url}/callback?` + query);
  } catch (err) {
    logger.error({ err }, `Failed in ${PlatformNames.GitHub} connect callback`);
    const params = {
      statusCode: STATUS_CODE_ERROR,
    };
    const query = querystring.stringify(params);
    res.redirect(`${config.frontend.url}/callback?` + query);
  }
});

const connectNotionCallback = catchAsync(async function (req: ISessionRequest, res: Response) {
  const STATUS_CODE_SUCCESS = 1014;
  const STATUS_CODE_ERROR = 1015;
  const code = req.query.code as string;
  const returnedState = req.query.state as string;
  const storedState = req.session.state;
  const userId = req.session.userId;
  let statusCode: number;
  try {
    if (!code || !returnedState || returnedState !== storedState || !userId) {
      throw new Error('Invalid code or state mismatch');
    }
    const data = await notionService.coreService.exchangeCode(code);
    let user = await userService.getUserById(userId);
    if (!user) {
      statusCode = STATUS_CODE_ERROR;
    } else {
      statusCode = STATUS_CODE_SUCCESS;
      await tokenService.saveNotionAccessToken(user.id, data.access_token);
    }
    const params = {
      statusCode: STATUS_CODE_SUCCESS,
      userId,
      platform: PlatformNames.Notion,
      bot_id: data.bot_id,
      workspace_name: data.workspace_name,
      workspace_icon: data.workspace_icon,
      workspace_id: data.workspace_id,
      request_id: data.request_id,
      owner_type: data.owner.type,
      owner_user_object: data.owner.user.object,
      owner_user_id: data.owner.user.id,
      owner_user_name: data.owner.user.name,
      owner_user_avatar_url: data.owner.user.avatar_url,
      owner_user_type: data.owner.user.type,
    };
    const query = querystring.stringify(params);
    res.redirect(`${config.frontend.url}/callback?` + query);
  } catch (err) {
    logger.error({ err }, `Failed in ${PlatformNames.Notion} connect callback`);
    const params = {
      statusCode: STATUS_CODE_ERROR,
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

  filter.disconnectedAt = null;
  const result = await platformService.queryPlatforms(filter, options);
  res.send(result);
});

const getPlatform = catchAsync(async function (req: IAuthRequest, res: Response) {
  const platform = req.platform;
  if (platform?.metadata && platform.name === PlatformNames.Discord) {
    const BotPermissions = await discordServices.coreService.getBotPermissions(platform.metadata?.id);
    platform.metadata.permissions = discordServices.coreService.getPermissionsStatus(BotPermissions);
  }
  res.send(platform);
});
const updatePlatform = catchAsync(async function (req: IAuthAndPlatform, res: Response) {
  platformService.validatePlatformUpdate(req.platform, req.body);
  if (req.platform.name === PlatformNames.Discord) {
    const discordIdentity = userService.getIdentityByProvider(req.user.identities, PlatformNames.Discord);
    if (discordIdentity) {
      await platformService.notifyDiscordUserImportComplete(req.platform.id, discordIdentity.id);
    }
  }
  const platform = await platformService.updatePlatform(req.platform, req.body);
  res.send(platform);
});
const deletePlatform = catchAsync(async function (req: IAuthAndPlatform, res: Response) {
  if (req.body.deleteType === 'soft') {
    // TODO: FIX any
    const platform: any = req.platform;
    platform.softDelete();
  } else if (req.body.deleteType === 'hard') {
    await platformService.deletePlatform(req.platform);
    if (req.platform.name === PlatformNames.Discord) {
      const dbManager = DatabaseManager.getInstance();
      const platformConnection = await dbManager.getPlatformDb(req.platform?.id);
      await dbManager.deleteDatabase(platformConnection);
      await discordServices.coreService.leaveBotFromGuild(req.platform.metadata?.id);
    }
  }
  res.status(httpStatus.NO_CONTENT).send();
});

const getProperties = catchAsync(async function (req: IAuthAndPlatform, res: Response) {
  const platform = req.platform;
  let result;
  if (platform?.name === PlatformNames.Discord) {
    result = await discordServices.coreService.getPropertyHandler(req);
  } else if (platform?.name === PlatformNames.Discourse) {
    result = await discourseService.coreService.getPropertyHandler(req);
  }
  res.status(httpStatus.OK).send(result);
});

type module = keyof typeof discord.permissions;
const requestAccess = catchAsync(async function (req: ISessionRequest, res: Response) {
  const { platform, id } = req.params;
  const module = req.params.module as module;
  const state = generateState();
  req.session.state = state;
  if (platform === PlatformNames.Discord) {
    const currentBotPermissions = await discordServices.coreService.getBotPermissions(id);
    const requireBotPermissions = discordServices.coreService.getRequirePermissionsForModule(module);
    const combinedArray = currentBotPermissions.concat(requireBotPermissions);
    const permissionsValue = discordServices.coreService.getCombinedPermissionsValue(combinedArray);
    const permissionsValueNumber = Number(permissionsValue);
    const discordUrl = discord.generateDiscordAuthUrl(
      config.oAuth2.discord.callbackURI.requestAccess,
      discord.scopes.connectGuild,
      permissionsValueNumber,
      state,
      id,
      true,
    );
    res.redirect(discordUrl);
  }
});

const getReputationScore = catchAsync(async function (req: IAuthAndPlatform, res: Response) {
  const reputationScore = await platformService.getReputationScore(req.platform, req.user.id);
  res.send(reputationScore);
});

export default {
  createPlatform,
  connectPlatform,
  connectTwitterCallback,
  connectDiscordCallback,
  connectGoogleCallback,
  connectGithubCallback,
  connectNotionCallback,
  getPlatforms,
  getPlatform,
  updatePlatform,
  deletePlatform,
  getProperties,
  requestAccess,
  requestAccessCallback,
  getReputationScore,
};
