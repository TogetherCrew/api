import { FilterQuery, HydratedDocument, ObjectId, Types } from 'mongoose';

import { IModule, IModuleUpdateBody, Module, ModuleNames, PlatformNames } from '@togethercrew.dev/db';

import platformService from './platform.service';
import websiteService from './website';

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
const getModuleByFilter = async (filter: FilterQuery<IModule>): Promise<HydratedDocument<IModule> | null> => {
  return Module.findOne(filter);
};

/**
 * Get modules by filter
 * @param {Object} filter - Mongo filter
 * @returns {Promise<HydratedDocument<IModule> | null>}
 */
const getModulesByFilter = async (filter: FilterQuery<IModule>): Promise<HydratedDocument<IModule>[]> => {
  return Module.find(filter);
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
  if (updateBody.options && updateBody.options.platforms) {
    if (updateBody.options.platforms[0].name == undefined) {
      {
        const globalOption = module.options?.platforms[0];
        if (globalOption) globalOption.metadata = updateBody.options.platforms[0].metadata;
        else module.options?.platforms.push(updateBody.options.platforms[0]);
      }
    } else {
      for (const newPlatform of updateBody.options.platforms) {
        const existingPlatform = module.options?.platforms.find((p) => p.name === newPlatform.name);
        if (existingPlatform) {
          existingPlatform.metadata = newPlatform.metadata;
        } else {
          module.options?.platforms.push(newPlatform);
          if (module.name === ModuleNames.Hivemind && newPlatform.name === PlatformNames.Website) {
            const scheduleId = await websiteService.coreService.createWebsiteSchedule(newPlatform.platform);
            const platform = await platformService.getPlatformById(newPlatform.platform);
            platform?.set('metadata.scheduleId', scheduleId);
            await platform?.save();
          }
        }
      }
    }
  }
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
