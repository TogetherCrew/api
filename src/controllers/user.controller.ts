import { Response } from 'express';
import { tokenService, userService, } from '../services';
import { IAuthRequest } from '../interfaces/request.interface';
import { catchAsync } from "../utils";

const getGuildsWithAdminRole = catchAsync(async function (req: IAuthRequest, res: Response) {
    const user = req.user;
    const { access } = await tokenService.getDiscordAuth(user.discordId);
    const guilds = await userService.getCurrentUserGuilds(access.token);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const guildsWithAdminRole = guilds.filter((guild: any) => guild.permissions & 0x20);
    res.send(guildsWithAdminRole)
});



export default {
    getGuildsWithAdminRole,

}

