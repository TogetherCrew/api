import { Response } from 'express';
import { tokenService, userService, } from '../services';
import { IAuthRequest } from '../interfaces/Request.interface';
import { catchAsync } from "../utils";
import { permissions } from '../config/dicord';

const getGuildsWithAdminRole = catchAsync(async function (req: IAuthRequest, res: Response) {
    const user = req.user;
    const { access } = await tokenService.getDiscordOAuth2Tokens(user.id);
    const guilds = await userService.getCurrentUserGuilds(access.token);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const guildsWithAdminRole = guilds.filter((guild: any) => (guild.permissions & permissions.manageServer) === permissions.manageServer);
    res.send(guildsWithAdminRole)
});

const getUser = catchAsync(async function (req: IAuthRequest, res: Response) {
    res.send(req.user);
});

const updateUser = catchAsync(async function (req: IAuthRequest, res: Response) {
    const user = await userService.updateUserByDiscordId(req.user.discordId, req.body);
    res.send(user);
});


export default {
    getGuildsWithAdminRole,
    updateUser,
    getUser
}

