import { Response } from 'express';
import { platformService, authService, twitterService, communityService, discordServices } from '../services';
import { IAuthRequest } from '../interfaces/Request.interface';
import { catchAsync, pick, ApiError } from "../utils";
import { generateState, generateCodeVerifier, generateCodeChallenge, twitter } from '../config/oAtuh2';
import { ISessionRequest, IAuthAndPlatform } from '../interfaces';
import config from '../config';
import { discord } from '../config/oAtuh2'
import httpStatus from 'http-status';
import querystring from 'querystring';

// const createPlatform = catchAsync(async function (req: IAuthRequest, res: Response) {
//     const communityDoc = await communityService.getCommunityByFilter({ _id: req.body.community, users: req.user.id });
//     if (!communityDoc) {
//         throw new ApiError(httpStatus.NOT_FOUND, 'Community not found');
//     }

//     let platformDoc = await platformService.getPlatformByFilter({ community: communityDoc.id, 'metadata.id': req.body.metadata.id, disconnectedAt: null });
//     if (platformDoc) {
//         throw new ApiError(httpStatus.BAD_REQUEST, `${req.body.name} is already connected`);
//     }

//     platformDoc = await platformService.getPlatformByFilter({ community: communityDoc.id, disconnectedAt: null, name: req.body.name });
//     if (platformDoc) {
//         if (req.body.name === 'discord')
//             await discordServices.coreService.leaveBotFromGuild(req.body.metadata.id)
//         throw new ApiError(httpStatus.BAD_REQUEST, `Only can connect one ${req.body.name} platform`);
//     }

//     platformDoc = await platformService.getPlatformByFilter({ community: communityDoc.id, 'metadata.id': req.body.metadata.id, disconnectedAt: { $ne: null } });
//     if (platformDoc) {
//         const platform = await platformService.updatePlatform(platformDoc, { disconnectedAt: null });
//         return res.status(httpStatus.CREATED).send(platform);
//     }


//     platformDoc = await platformService.getPlatformByFilter({ 'metadata.id': req.body.metadata.id });
//     if (platformDoc) {
//         throw new ApiError(httpStatus.BAD_REQUEST, `${req.body.name} is already connected to another community`);
//     }

//     const platform = await platformService.createPlatform(req.body);
//     await communityService.addPlatformToCommunityById(platform.community, platform.id);
//     res.status(httpStatus.CREATED).send(platform);
// });


const createPlatform = catchAsync(async function (req: IAuthRequest, res: Response) {
    const community = await communityService.getCommunityByFilter({ _id: req.body.community, users: req.user.id });
    if (!community) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Community not found');
    }

    await platformService.checkPlatformAlreadyConnected(community.id, req.body);
    await platformService.checkSinglePlatformConnection(community.id, req.body);
    const platform = await platformService.reconnectOrAddNewPlatform(community.id, req.body);
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
    const STATUS_CODE_ERROR = 1005;
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
            name: discordOathCallback.guild.name,
            icon: discordOathCallback.guild.icon
        };
        const query = querystring.stringify(params);
        res.redirect(`${config.frontend.url}/callback?` + query);

    } catch (err) {
        const params = {
            statusCode: STATUS_CODE_ERROR
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
    const filter = pick(req.query, ['name', 'community']);
    const options = pick(req.query, ['sortBy', 'limit', 'page']);
    if (filter.name) {
        filter.name = {
            $regex: filter.name,
            $options: 'i'
        };
    }
    if (!filter.community) {
        filter.community = { $in: req.user.communities }
    }
    filter.disconnectedAt = null;
    const result = await platformService.queryPlatforms(filter, options);
    res.send(result);
});

const getPlatform = catchAsync(async function (req: IAuthRequest, res: Response) {
    const platform = await platformService.getPlatformByFilter({ _id: req.params.platformId, community: { $in: req.user.communities }, disconnectedAt: null });
    if (!platform) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Platform not found');
    }
    const community = await communityService.getCommunityByFilter({ _id: platform.community, users: req.user.id });
    if (!community) {
        throw new ApiError(httpStatus.FORBIDDEN, 'Access denied');
    }
    res.send(platform);
});
const updatePlatform = catchAsync(async function (req: IAuthAndPlatform, res: Response) {
    if (req.platform.name === 'discord' && req.platform.metadata?.isInProgress && (req.body.metadata.selectedChannels || req.body.metadata.period)) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Updating channels or date period is not allowed during server analysis.');

    }
    const platform = await platformService.updatePlatform(req.platform, req.body, req.user.discordId);
    res.send(platform);
});
const deletePlatform = catchAsync(async function (req: IAuthAndPlatform, res: Response) {
    if (req.body.deleteType === "soft") {
        await platformService.updatePlatform(req.platform, { disconnectedAt: new Date() });
    }
    else if (req.body.deleteType === "hard") {
        await platformService.deletePlatform(req.platform);
        await discordServices.coreService.leaveBotFromGuild(req.platform.metadata?.id)
    }
    res.status(httpStatus.NO_CONTENT).send();
});

const getProperties = catchAsync(async function (req: IAuthAndPlatform, res: Response) {
    const { platform } = req;
    let result;
    if (platform?.name === 'discord') {
        result = await discordServices.coreService.getPropertyHandler(req)
    }
    res.status(httpStatus.OK).send(result);
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
    getProperties
}

