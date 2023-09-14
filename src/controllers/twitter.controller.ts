import { Response } from 'express';
import { userService, } from '../services';
import { IAuthRequest } from '../interfaces/request.interface';
import { catchAsync } from "../utils";
import httpStatus from 'http-status';
import { tokenTypes } from '../config/tokens';
import { Token } from '@togethercrew.dev/db';

const disconnectTwitter = catchAsync(async function (req: IAuthRequest, res: Response) {
    const user = req.user;
    await Token.deleteMany({ user: user.discordId, type: { $in: [tokenTypes.TWITTER_ACCESS, tokenTypes.TWITTER_REFRESH] } });
    await userService.updateUserByDiscordId(user.discordId, {
        twitterId: null,
        twitterUsername: null,
        twitterProfileImageUrl: null,
        twitterConnectedAt: null
    })
    res.status(httpStatus.NO_CONTENT).send();
});

export default {
    disconnectTwitter
}

