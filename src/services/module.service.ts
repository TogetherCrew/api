import { HydratedDocument, Types, FilterQuery } from 'mongoose';
import { Module, IModule, IModuleUpdateBody } from '@togethercrew.dev/db';

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
  // Check if `options.platforms` is in the updateBody
  if (updateBody.options && updateBody.options.platforms) {
    // Iterate through each platform in the incoming update
    for (const newPlatform of updateBody.options.platforms) {
      const existingPlatform = module.options?.platforms.find((p) => p.name === newPlatform.name);

      // If the platform already exists, update it
      if (existingPlatform) {
        existingPlatform.metadata = newPlatform.metadata;
      } else {
        // If the platform does not exist, add new
        module.options?.platforms.push(newPlatform);
      }
    }
  }

  // Other update operations can be handled here
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
