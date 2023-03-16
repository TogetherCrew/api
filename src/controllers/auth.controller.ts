import httpStatus from 'http-status';
import { Request, Response } from 'express';
import config from '../config';
import { scopes, permissions } from '../config/dicord'
import { userService, authService, tokenService, guildService } from '../services';
import { IDiscordUser, IDiscordOathBotCallback } from 'tc_dbcomm';
import { catchAsync } from "../utils";
import { authTokens } from '../interfaces/token.interface'
import querystring from 'querystring';

const tryNow = catchAsync(async function (req: Request, res: Response) {
    res.redirect(`https://discord.com/api/oauth2/authorize?client_id=${config.discord.clientId}&redirect_uri=${config.discord.callbackURI.tryNow}&response_type=code&scope=${scopes.tryNow}&permissions=${permissions.ViewChannels}`);
});

const tryNowCallback = catchAsync(async function (req: Request, res: Response) {
    const code = req.query.code as string;
    let statusCode = 501, guildName, guildId, connectedGuild;
    try {
        if (!code) {
            throw new Error();
        }
        const discordOathCallback: IDiscordOathBotCallback = await authService.exchangeCode(code, config.discord.callbackURI.tryNow);
        const discordUser: IDiscordUser = await userService.getUserFromDiscordAPI(discordOathCallback.access_token);
        let user = await userService.getUserByDiscordId(discordUser.id);
        let guild = await guildService.getGuildByGuildId(discordOathCallback.guild.id);
        if (!user) {
            user = await userService.createUser(discordUser);
        }
        connectedGuild = await guildService.getGuild({ user: user.discordId, guildId: { $ne: discordOathCallback.guild.id }, isDisconnected: false });
        if (connectedGuild) {
            guildName = connectedGuild.name;
            guildId = connectedGuild.guildId;
            statusCode = 502;
        } else {
            if (!guild) {
                guild = await guildService.createGuild(discordOathCallback.guild, user.discordId);
            }
            else {
                if (guild.isDisconnected) {
                    statusCode = 504;
                    await guildService.updateGuild({ guildId: discordOathCallback.guild.id, user: user.discordId }, { isDisconnected: false });
                }
                else {
                    statusCode = 503;
                }
            }
            guildName = guild.name;
            guildId = guild.guildId;
        }
        tokenService.saveDiscordAuth(user.discordId, discordOathCallback);
        const tokens: authTokens = await tokenService.generateAuthTokens(user.discordId);
        const query = querystring.stringify({
            "statusCode": statusCode, "guildId": guildId, "guildName": guildName,
            "accessToken": tokens.access.token, "accessExp": tokens.access.expires.toString(), "refreshToken": tokens.refresh.token, "refreshExp": tokens.refresh.expires.toString(),
        });
        res.redirect(`${config.frontend.url}/callback?` + query);
    } catch (err) {
        const query = querystring.stringify({
            "statusCode": 490
        });
        res.redirect(`${config.frontend.url}/callback?` + query);
    }
});

const login = catchAsync(async function (req: Request, res: Response) {
    res.redirect(`https://discord.com/api/oauth2/authorize?client_id=${config.discord.clientId}&redirect_uri=${config.discord.callbackURI.login}&response_type=code&scope=${scopes.login}`);
});

const loginCallback = catchAsync(async function (req: Request, res: Response) {
    const code = req.query.code as string;
    let statusCode = 601;
    try {
        if (!code) {
            throw new Error();
        }
        const discordOathCallback: IDiscordOathBotCallback = await authService.exchangeCode(code, config.discord.callbackURI.login);
        const discordUser: IDiscordUser = await userService.getUserFromDiscordAPI(discordOathCallback.access_token);
        const user = await userService.getUserByDiscordId(discordUser.id);
        if (!user) {
            statusCode = 602;
            const query = querystring.stringify({ "statusCode": statusCode, });
            res.redirect(`${config.frontend.url}/callback?` + query);
        }
        else {
            const guild = await guildService.getGuild({ user: user.discordId, isDisconnected: false });
            if (!guild) {
                statusCode = 603;
            }
            tokenService.saveDiscordAuth(user.discordId, discordOathCallback);
            const tokens: authTokens = await tokenService.generateAuthTokens(user.discordId);
            const query = querystring.stringify({
                "statusCode": statusCode, "guildId": guild?.guildId, "guildName": guild?.name,
                "accessToken": tokens.access.token, "accessExp": tokens.access.expires.toString(), "refreshToken": tokens.refresh.token, "refreshExp": tokens.refresh.expires.toString(),
            });
            res.redirect(`${config.frontend.url}/callback?` + query);
        }

    } catch (err) {
        const query = querystring.stringify({
            "statusCode": 490
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
    logout
}
