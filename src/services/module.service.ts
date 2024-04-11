import { HydratedDocument, Types } from 'mongoose';
import httpStatus from 'http-status';
import { Module, IModule } from '@togethercrew.dev/db';
import ApiError from '../utils/ApiError';

/**
 * Create a module
 * @param {IModule} ModuleBody
 * @returns {Promise<HydratedDocument<IModule>>}
 */
const createModule = async (ModuleBody: IModule): Promise<HydratedDocument<IModule>> => {
    return Module.create(ModuleBody);
};

export default {
    createModule
};
