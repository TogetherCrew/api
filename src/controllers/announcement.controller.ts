import { Response } from 'express';
import { IAuthRequest } from '../interfaces/Request.interface';
import { catchAsync } from "../utils";

const createAnnouncement = catchAsync(async function (req: IAuthRequest, res: Response) {
    console.log(req.body)
    res.send({ status: 'ok' })
})

export default {
    createAnnouncement
};
