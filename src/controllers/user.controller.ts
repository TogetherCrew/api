import { Response } from 'express';
import { Types } from 'mongoose';
import { userService } from '../services';
import { IAuthRequest } from '../interfaces/request1.interface';
import { catchAsync } from "../utils";

const getUser = catchAsync(async function (req: IAuthRequest, res: Response) {
    res.send(req.user);
});
const updateUser = catchAsync(async function (req: IAuthRequest, res: Response) {
    const user = await userService.updateUserById(new Types.ObjectId(req.user.id), req.body);
    res.send(user);
});


export default {
    getUser,
    updateUser,

}

