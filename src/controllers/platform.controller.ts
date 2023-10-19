import { Response } from 'express';
import { platformService, authService, twitterService, communityService } from '../services';
import { IAuthRequest } from '../interfaces/Request.interface';
import { catchAsync, pick, ApiError } from "../utils";
import { generateState, generateCodeVerifier, generateCodeChallenge, twitter } from '../config/oAtuh2';
import { ISessionRequest } from '../interfaces';
import config from '../config';
import { discord } from '../config/oAtuh2'
import httpStatus from 'http-status';
import querystring from 'querystring';

const createPlatform = catchAsync(async function (req: IAuthRequest, res: Response) {
    const community = await communityService.getCommunityByFilter({ _id: req.body.community, users: req.user.id });
    if (!community) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Community not found');
    }
    const platform = await platformService.createPlatform(req.body);
    await communityService.addPlatformToCommunityById(platform.community, platform.id);
    res.status(httpStatus.CREATED).send(platform);
});

const connectPlatform = catchAsync(async function (req: ISessionRequest, res: Response) {
    const platform = req.params.platform;
    const state = generateState();
    req.session.state = state;
    if (platform === 'discord') {
        res.redirect(`https://discord.com/api/oauth2/authorize?client_id=${config.discord.clientId}&redirect_uri=${config.discord.callbackURI.connect}&response_type=code&scope=${discord.scopes.connectGuild}&permissions=${discord.permissions.ViewChannels | discord.permissions.readMessageHistory}&state=${state}`);
    } else if (platform === 'twitter') {
        const codeVerifier = generateCodeVerifier();
        const codeChallenge = generateCodeChallenge(codeVerifier);
        req.session.codeVerifier = codeVerifier;
        res.redirect(`https://twitter.com/i/oauth2/authorize?response_type=code&client_id=${config.twitter.clientId}&redirect_uri=${config.twitter.callbackURI.connect}&scope=${twitter.scopes.connectAccount}&state=${state}&code_challenge=${codeChallenge}&code_challenge_method=S256`);
    }
});

const connectDiscordCallback = catchAsync(async function (req: ISessionRequest, res: Response) {
    const STATUS_CODE_SUCCESS = 1004;
    const STATUS_CODE_FAILURE = 1005;
    const code = req.query.code as string;
    const returnedState = req.query.state as string;
    const storedState = req.session.state;
    try {
        if (!code || !returnedState || (returnedState !== storedState)) {
            throw new Error("Invalid code or state mismatch");
        }

        const discordOathCallback = await authService.exchangeCode(code, config.discord.callbackURI.connect);
        const params = {
            statusCode: STATUS_CODE_SUCCESS,
            platform: 'discord',
            id: discordOathCallback.guild.id,
        };
        const query = querystring.stringify(params);
        res.redirect(`${config.frontend.url}/callback?` + query);

    } catch (err) {
        const params = {
            statusCode: STATUS_CODE_FAILURE
        };
        const query = querystring.stringify(params);
        res.redirect(`${config.frontend.url}/callback?` + query);
    }
});

const connectTwitterCallback = catchAsync(async function (req: ISessionRequest, res: Response) {
    const STATUS_CODE_SUCCESS = 1004;
    const STATUS_CODE_FAILURE = 1005;
    const code = req.query.code as string;
    const returnedState = req.query.state as string;
    const storedState = req.session.state;
    const storedCodeVerifier = req.session.codeVerifier;
    try {
        if (!code || !returnedState || (returnedState !== storedState)) {
            throw new Error("Invalid code or state mismatch");
        }
        const twitterOAuthCallback = await twitterService.exchangeTwitterCode(code, config.twitter.callbackURI.connect, storedCodeVerifier);
        const twitterUser = await twitterService.getUserFromTwitterAPI(twitterOAuthCallback.access_token);
        const params = {
            statusCode: STATUS_CODE_SUCCESS,
            platform: 'twitter',
            id: twitterUser.id,
            username: twitterUser.username,
            profileImageUrl: twitterUser.profile_image_url
        };
        const query = querystring.stringify(params);
        res.redirect(`${config.frontend.url}/callback?` + query);

    } catch (err) {
        const params = {
            statusCode: STATUS_CODE_FAILURE
        };
        const query = querystring.stringify(params);
        res.redirect(`${config.frontend.url}/callback?` + query);
    }
});

const getPlatforms = catchAsync(async function (req: IAuthRequest, res: Response) {
    const filter = pick(req.query, ['name']);
    const options = pick(req.query, ['sortBy', 'limit', 'page']);
    const result = await platformService.queryPlatforms({ ...filter, community: { $in: req.user.communities } }, options);
    res.send(result);
});

const getPlatform = catchAsync(async function (req: IAuthRequest, res: Response) {
    const platform = await platformService.getPlatformByFilter({ _id: req.params.platformId, community: { $in: req.user.communities } });
    if (!platform) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Platform not found');
    }
    const community = await communityService.getCommunityByFilter({ _id: platform.community, users: req.user.id });
    if (!community) {
        throw new ApiError(httpStatus.FORBIDDEN, 'Access denied');
    }
    res.send(platform);
});
const updatePlatform = catchAsync(async function (req: IAuthRequest, res: Response) {
    const platform = await platformService.updatePlatformByFilter({ _id: req.params.platformId, community: { $in: req.user.communities } }, req.body);
    res.send(platform);
});
const deletePlatform = catchAsync(async function (req: IAuthRequest, res: Response) {
    await platformService.deletePlatformById({ _id: req.params.platformId, community: { $in: req.user.communities } });
    res.status(httpStatus.NO_CONTENT).send();
});

export default {
    createPlatform,
    connectPlatform,
    connectTwitterCallback,
    connectDiscordCallback,
    getPlatforms,
    getPlatform,
    updatePlatform,
    deletePlatform
}

