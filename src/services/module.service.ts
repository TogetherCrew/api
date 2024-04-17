import { HydratedDocument, Types } from 'mongoose';
import httpStatus from 'http-status';
import { Module, IModule, IModuleUpdateBody } from '@togethercrew.dev/db';
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

/**
 * Get module by filter
 * @param {Object} filter - Mongo filter
 * @returns {Promise<HydratedDocument<IModule> | null>}
 */
const getModuleByFilter = async (filter: object): Promise<HydratedDocument<IModule> | null> => {
  return Module.findOne(filter);
};

/**
 * Get module by id
 * @param {Types.ObjectId} id
 * @returns {Promise<HydratedDocument<IModule> | null>}
 */
const getModuleById = async (id: Types.ObjectId): Promise<HydratedDocument<IModule> | null> => {
  return Module.findById(id);
};

/**
 * Update module
 * @param {HydratedDocument<IModule>} module - module doc
 * @param {Partial<IModule>} updateBody
 * @returns {Promise<HydratedDocument<IModule>>}
 */
const updateModule = async (
  module: HydratedDocument<IModule>,
  updateBody: Partial<IModuleUpdateBody>,
): Promise<HydratedDocument<IModule>> => {
  Object.assign(module, updateBody);
  return await module.save();
};

/**
 * Delete module
 * @param {HydratedDocument<IModule>} module - module doc
 * @returns {Promise<HydratedDocument<IModule>>}
 */
const deleteModule = async (module: HydratedDocument<IModule>): Promise<HydratedDocument<IModule>> => {
  return await module.remove();
};

export default {
  createModule,
  queryModules,
  getModuleByFilter,
  getModuleById,
  deleteModule,
  updateModule,
};
