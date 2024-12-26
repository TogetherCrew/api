import { Connection } from 'mongoose';

import parentLogger from '../../config/logger';
import { sort } from '../../utils';

const logger = parentLogger.child({ module: 'DiscourseMemberService' });

type Filter = {
  activityComposition?: Array<string>;
  ngu?: string;
};

type Options = {
  sortBy?: string;
  limit?: string;
  page?: string;
};


function getNgu(user: any): string {
  const { firstName, lastName, username } = user;
  const combinedName = [firstName, lastName].filter(Boolean).join(" ");
  return combinedName || username;
}
/**
 *  Query  members with a filter and options.
 * @param {Connection} platformConnection - The MongoDB connection.
 * @param {Filter} filter - The filter object
 * @param {Options} options - The options object with fields like 'sortBy', 'limit' and 'page'.
 * @param {any} memberActivity - The document containing the last member activity.
 * @param {Array<string>} activityCompostionsTypes - An array containing types of activity compositions.
 * @returns {Promise<QueryResult>} - An object with the query results and other information like 'limit', 'page', 'totalPages', 'totalResults'.
 */
async function queryMembersForTables(
  platformConnection: Connection,
  filter: Filter,
  options: Options,
  memberActivity: any,
  activityCompostionsTypes: Array<string>,
) {
  try {
    const { ngu, activityComposition } = filter;
    const { sortBy } = options;
    const limit = options.limit && parseInt(options.limit, 10) > 0 ? parseInt(options.limit, 10) : 10;
    const page = options.page && parseInt(options.page, 10) > 0 ? parseInt(options.page, 10) : 1;
    const sortParams: Record<string, 1 | -1> = sortBy ? sort.sortByHandler(sortBy) : { 'options.username': 1 };

    let matchStage: any = {};
    let allActivityIds: string[] = [];

    const memberActivityDocument = await platformConnection.models.MemberActivity.findOne()
      .sort({ date: -1 })
      .select({ date: 1, _id: 0 });

    if (activityComposition && activityComposition.length > 0) { 
      // If 'others' is in activityComposition, we exclude all IDs that are part of other activities
      if (activityComposition.includes('others')) {
        allActivityIds = activityCompostionsTypes
          .filter((activity) => activity !== 'others')
          .flatMap((activity) => memberActivity[activity]);

        matchStage.id = { $nin: allActivityIds };
        console.log('activityComposition.INCLUDE',matchStage)  

      }

      // If specific activity compositions are mentioned along with 'others', we add them separately
      if (activityComposition.some((activity) => activity !== 'others')) {
        const specificActivityIds = activityComposition
          .filter((activity) => activity !== 'others')
          .flatMap((activity) => memberActivity[activity]);

        if (matchStage.id) {
          matchStage = { $or: [{ id: { $in: specificActivityIds } }, matchStage] };
        } else {
          matchStage.id = { $in: specificActivityIds };
        }
        console.log('activityComposition.some',matchStage)  

      }
    }

    if (ngu) {
      matchStage.$or = [
        { 'options.username': { $regex: ngu, $options: 'i' } },
        { 'options.first_name': { $regex: ngu, $options: 'i' } },
        { 'options.last_name': { $regex: ngu, $options: 'i' } },
      ];
      console.log('ngu',matchStage)  

    }

    if (memberActivityDocument) {
      const date = new Date(memberActivityDocument.date);
      date.setHours(23, 59, 59, 999);
      matchStage.$or = [
        { joined_at: null },
        { joined_at: { $lte: date } }
      ];
            console.log('memberActivityDocument',matchStage)  
    }


    const totalResults = await platformConnection.db.collection('rawmembers').countDocuments(matchStage);

      console.log(1000,totalResults,matchStage)
    const results = await platformConnection.db
      .collection('rawmembers')
      .aggregate([
        {
          $match: matchStage,
        },
        {
          $sort: sortParams,
        },
        {
          $skip: limit * (page - 1),
        },
        {
          $limit: limit,
        },
        {
          $project: {
            id: 1,
            username: '$options.username',
            avatar: '$options.avatar',
            joined_at: 1,
            firstName: '$options.first_name',
            lastName: '$options.last_name',
            _id: 0,
          },
        },
      ])
      .toArray();

    const totalPages = Math.ceil(totalResults / limit);

    return {
      results,
      limit,
      page,
      totalPages,
      totalResults,
    };
  } catch (error) {
    logger.error(
      {
        platformConnection: platformConnection.name,
        filter,
        options,
        memberActivity,
        activityCompostionsTypes,
        error,
      },
      'Failed to query members',
    );
    return {
      results: [],
      limit: 10,
      page: 1,
      totalPages: 0,
      totalResults: 0,
    };
  }
}

export default {
  queryMembersForTables,
  getNgu,
};
