import { Response } from 'express';
import { moduleService, } from '../services';
import { IAuthRequest } from '../interfaces/Request.interface';
import { catchAsync, pick, ApiError } from '../utils';
import config from '../config';
import httpStatus from 'http-status';
import { Module } from '@togethercrew.dev/db';

const createModule = catchAsync(async function (req: IAuthRequest, res: Response) {
    if (await moduleService.getModuleByFilter(req.body)) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'This Module is already created!')
    }
    const module = await moduleService.createModule(req.body);
    res.status(httpStatus.CREATED).send(module);
});

const getModules = catchAsync(async function (req: IAuthRequest, res: Response) {
    const filter = pick(req.query, ['name', 'community']);
    const options = pick(req.query, ['sortBy', 'limit', 'page']);
    const result = await moduleService.queryModules(filter, options);
    res.send(result);
});

export default {
    createModule,
    getModules
};
