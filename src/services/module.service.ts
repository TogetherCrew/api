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

/**
 * Query for modules
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 */
const queryModules = async (filter: object, options: object) => {
    return Module.paginate(filter, options);
};

export default {
    createModule,
    queryModules
};
