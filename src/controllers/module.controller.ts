import { Response } from 'express';
import { moduleService, } from '../services';
import { IAuthRequest } from '../interfaces/Request.interface';
import { catchAsync, pick, ApiError } from '../utils';
import config from '../config';
import httpStatus from 'http-status';

const createModule = catchAsync(async function (req: IAuthRequest, res: Response) {
    const platform = await moduleService.createModule(req.body);
    res.status(httpStatus.CREATED).send(platform);
});


export default {
    createModule,
};
