import httpStatus from 'http-status';
import { Request, Response } from 'express';
import config from '../config';
import { scopes, permissions } from '../config/dicord'
import { userService, authService, tokenService, guildService } from '../services';
import { IDiscordUser, IDiscordOathBotCallback } from 'tc-dbcomm';
import { catchAsync } from "../utils";
import querystring from 'querystring';

const login = catchAsync(async function (req: Request, res: Response) {
    res.redirect(`https://discord.com/api/oauth2/authorize?client_id=${config.discord.clientId}&redirect_uri=${config.discord.callbackURI}&response_type=code&scope=${scopes.bot}&permissions=${permissions.ViewChannels}`);
});

const callback = catchAsync(async function (req: Request, res: Response) {
    const code = req.query.code as string;
    try {
        if (!code) {
            throw new Error();
        }
        const discordOathCallback: IDiscordOathBotCallback = await authService.exchangeCode(code);
        const discordUser: IDiscordUser = await userService.getUserFromDiscordAPI(discordOathCallback.access_token);
        let user = await userService.getUserByDiscordId(discordUser.id);
        if (!user) {
            user = await userService.createUser(discordUser);
        }
        let guild = await guildService.getGuildByGuildId(discordOathCallback.guild.id);
        if (!guild) {
            guild = await guildService.createGuild(discordOathCallback.guild, user.discordId);
        }
        tokenService.saveDiscordAuth(user.discordId, discordOathCallback);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const tokens: any = await tokenService.generateAuthTokens(user.discordId);
        const query = querystring.stringify({
            "isSuccessful": true,
            "accessToken": tokens.access.token,
            "accessExp": tokens.access.expires.toString(),
            "refreshToken": tokens.refresh.token,
            "refreshExp": tokens.refresh.expires.toString(),
            "guildId": guild.guildId,
            "guildName": guild.name
        });
        res.redirect('http://localhost:3000/login?' + query);
    } catch (err) {
        const query = querystring.stringify({
            "isSuccessful": false
        });
        res.redirect('http://localhost:3000/login?' + query);
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
    login,
    callback,
    refreshTokens,
    logout
}
