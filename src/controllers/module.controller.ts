import { Response } from 'express';
import { moduleService } from '../services';
import { IAuthRequest } from '../interfaces/Request.interface';
import { catchAsync, pick, ApiError } from '../utils';
import httpStatus from 'http-status';
import { IModule } from '@togethercrew.dev/db';

const createModule = catchAsync(async function (req: IAuthRequest, res: Response) {
  if (await moduleService.getModuleByFilter(req.body)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'This Module is already created!');
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

const getModule = catchAsync(async function (req: IAuthRequest, res: Response) {
  res.send(req.module);
});

const deleteModule = catchAsync(async function (req: IAuthRequest, res: Response) {
  if (req.module) await moduleService.deleteModule(req.module);
  res.status(httpStatus.NO_CONTENT).send();
});

const updateModule = catchAsync(async function (req: IAuthRequest, res: Response) {
  let module: IModule;
  if (req.module) {
    module = await moduleService.updateModule(req.module, req.body);
    res.send(module);
  } else {
    res.send({});
  }
});

export default {
  createModule,
  getModules,
  getModule,
  deleteModule,
  updateModule,
};
