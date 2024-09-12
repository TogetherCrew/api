import { ApiError } from '../../utils';
import parentLogger from '../../config/logger';
import httpStatus from 'http-status';
import * as Neo4j from '../../neo4j';

const logger = parentLogger.child({ module: 'DiscourseCategoryService' });

/**
 * get list of categories
 * @param {string} filters
 * @param {options} filters
 * @returns {Promise<any>}
 */
async function getCategoriesByEndPoint(filters: any, options: any): Promise<any> {
  const { endPoint, name } = filters;
  let { limit, page, skip, sortBy } = options;
  limit = limit && parseInt(limit, 10) > 0 ? parseInt(limit, 10) : 10;
  page = page && parseInt(page, 10) > 0 ? parseInt(page, 10) : 1;
  skip = (page - 1) * limit;
  const totalQuery = `
    MATCH (forum:DiscourseForum {endpoint: "${endPoint}"})
    MATCH (dc:DiscourseCategory {forumUuid: forum.uuid})
    ${name ? `WHERE dc.name =~ '(?i).*${name}.*'` : ''}
    RETURN COUNT(dc) as totalResults
  `;
  const query = `
    MATCH (forum:DiscourseForum {endpoint: "${endPoint}"})
    MATCH (dc:DiscourseCategory {forumUuid: forum.uuid})
    ${name ? `WHERE dc.name =~ '(?i).*${name}.*'` : ''}
    RETURN dc.id as categoryId, dc.name as name, dc.color as color, dc.descriptionText as description
    ORDER BY ${sortBy ? sortBy : 'dc.id'}
    SKIP ${skip}
    LIMIT ${limit}
  `;

  try {
    const totalResultDataNeo4j = await Neo4j.read(totalQuery);
    const { records: totalResultData } = totalResultDataNeo4j;
    // @ts-ignore
    const { _fieldLookup, _fields } = totalResultData[0];
    const totalResults = _fields[_fieldLookup['totalResults']] as number;

    // Fetch paginated category results
    const neo4jCategories = await Neo4j.read(query);
    const { records: categories } = neo4jCategories;

    // Map the results to an object array
    const CategoryList = categories.map((category) => {
      // @ts-ignore
      const { _fieldLookup, _fields } = category;
      const categoryId = _fields[_fieldLookup['categoryId']] as string;
      const name = _fields[_fieldLookup['name']] as string;
      const color = _fields[_fieldLookup['color']] as string;
      const description = _fields[_fieldLookup['description']] as string;
      return { categoryId, name, color, description };
    });

    // Calculate total pages
    const totalPages = Math.ceil(totalResults / limit);

    // Return structured response
    return {
      results: CategoryList,
      page,
      limit,
      totalPages,
      totalResults,
    };
  } catch (error) {
    logger.error(error, 'Failed to get category list by endpoint');
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to get category list by endpoint');
  }
}

export default {
  getCategoriesByEndPoint,
};
