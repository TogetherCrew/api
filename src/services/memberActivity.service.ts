import { Connection } from 'mongoose';
import { date, math } from '../utils';
import ScoreStatus from '../utils/enums/scoreStatus.enum';
import NodeStats from '../utils/enums/nodeStats.enum';
import { IGuildMember, IRole, PlatformNames } from '@togethercrew.dev/db';
import * as Neo4j from '../neo4j';
import roleService from './discord/role.service';
import guildMemberService from './discord/guildMember.service';
import { Snowflake } from 'discord.js';
import parentLogger from '../config/logger';
import { NEO4J_PLATFORM_INFO } from '../constants/neo4j.constant';
import { SupportedNeo4jPlatforms } from '../types/neo4j.type';
const logger = parentLogger.child({ module: 'MemberActivityService' });

/**
 * active members composition line graph
 * @param {Connection} platformConnection
 * @param {Date} startDate
 * @param {Date} endDate
 * @returns {Object}
 */
async function activeMembersCompositionLineGraph(platformConnection: Connection, startDate: Date, endDate: Date) {
  const start = new Date(startDate);
  const end = new Date(endDate);

  try {
    const membersActivities = await platformConnection.models.MemberActivity.aggregate([
      // Stage 1: Convert date from string to date type and extract needed data
      {
        $project: {
          _id: 0,
          date: { $convert: { input: '$date', to: 'date' } },
          all_active: 1,
          all_new_active: 1,
          all_consistent: 1,
          all_vital: 1,
          all_new_disengaged: 1,
        },
      },

      // Stage 2: Filter documents based on date
      {
        $match: {
          date: {
            $gte: new Date(start),
            $lte: new Date(end),
          },
        },
      },

      // Stage 3: Add month names array for later use
      {
        $addFields: {
          monthNames: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        },
      },

      // Stage 4: Calculate statistics and concatenate day - month field
      {
        $project: {
          date: 1,
          day_month: {
            $concat: [
              { $dateToString: { format: '%d', date: '$date' } },
              ' ',
              {
                $arrayElemAt: ['$monthNames', { $subtract: [{ $month: '$date' }, 1] }],
              },
            ],
          },
          tot_active_members: { $size: '$all_active' },
          newly_active: { $size: '$all_new_active' },
          consistently_active: { $size: '$all_consistent' },
          vital_members: { $size: '$all_vital' },
          became_disengaged: { $size: '$all_new_disengaged' },
        },
      },

      // Stage 5: Sort documents by date
      {
        $sort: { date: 1 },
      },

      // Stage 6: Group all documents and keep the arrays
      {
        $group: {
          _id: null,
          day_month: { $push: '$day_month' },
          totActiveMembers: { $push: '$tot_active_members' },
          newlyActive: { $push: '$newly_active' },
          consistentlyActive: { $push: '$consistently_active' },
          vitalMembers: { $push: '$vital_members' },
          becameDisengaged: { $push: '$became_disengaged' },

          // Store last and second-to-last document values
          lastTotActiveMembers: { $last: '$tot_active_members' },
          lastNewlyActive: { $last: '$newly_active' },
          lastConsistentlyActive: { $last: '$consistently_active' },
          lastVitalMembers: { $last: '$vital_members' },
          lastBecameDisengaged: { $last: '$became_disengaged' },
        },
      },

      // Stage 7: Transform group data into final format for charting
      {
        $project: {
          _id: 0,
          categories: '$day_month',
          series: [
            { name: 'totActiveMembers', data: '$totActiveMembers' },
            { name: 'newlyActive', data: '$newlyActive' },
            { name: 'consistentlyActive', data: '$consistentlyActive' },
            { name: 'vitalMembers', data: '$vitalMembers' },
            { name: 'becameDisengaged', data: '$becameDisengaged' },
          ],
          // Use the last document values
          totActiveMembers: '$lastTotActiveMembers',
          newlyActive: '$lastNewlyActive',
          consistentlyActive: '$lastConsistentlyActive',
          vitalMembers: '$lastVitalMembers',
          becameDisengaged: '$lastBecameDisengaged',
        },
      },
    ]);

    if (membersActivities.length === 0) {
      return {
        categories: [],
        series: [],
        totActiveMembers: 0,
        newlyActive: 0,
        consistentlyActive: 0,
        vitalMembers: 0,
        becameDisengaged: 0,
        totActiveMembersPercentageChange: 0,
        newlyActivePercentageChange: 0,
        consistentlyActivePercentageChange: 0,
        vitalMembersPercentageChange: 0,
        becameDisengagedPercentageChange: 0,
      };
    }

    const adjustedDate = date.calculateAdjustedDate(
      endDate,
      membersActivities[0].categories[membersActivities[0].categories.length - 1],
    );
    const AdjustedMemberActivity = await platformConnection.models.MemberActivity.aggregate([
      // Stage 1: Convert date from string to date type and extract needed data
      {
        $project: {
          _id: 0,
          date: { $convert: { input: '$date', to: 'date' } },
          all_active: 1,
          all_new_active: 1,
          all_consistent: 1,
          all_vital: 1,
          all_new_disengaged: 1,
        },
      },

      // Stage 2: Filter documents based on date range
      {
        $match: {
          date: {
            $gte: new Date(adjustedDate),
            $lt: new Date(new Date(adjustedDate).getTime() + 24 * 60 * 60 * 1000), // add one day in milliseconds
          },
        },
      },

      // Stage 3: Calculate statistics and concatenate day - month field
      {
        $project: {
          totActiveMembers: { $size: '$all_active' },
          newlyActive: { $size: '$all_new_active' },
          consistentlyActive: { $size: '$all_consistent' },
          vitalMembers: { $size: '$all_vital' },
          becameDisengaged: { $size: '$all_new_disengaged' },
        },
      },
    ]);

    if (AdjustedMemberActivity.length === 0) {
      return {
        ...membersActivities[0],
        totActiveMembersPercentageChange: 'N/A',
        newlyActivePercentageChange: 'N/A',
        consistentlyActivePercentageChange: 'N/A',
        vitalMembersPercentageChange: 'N/A',
        becameDisengagedPercentageChange: 'N/A',
      };
    }

    return {
      ...membersActivities[0],
      totActiveMembersPercentageChange: math.calculatePercentageChange(
        AdjustedMemberActivity[0].totActiveMembers,
        membersActivities[0].totActiveMembers,
      ),
      newlyActivePercentageChange: math.calculatePercentageChange(
        AdjustedMemberActivity[0].newlyActive,
        membersActivities[0].newlyActive,
      ),
      consistentlyActivePercentageChange: math.calculatePercentageChange(
        AdjustedMemberActivity[0].consistentlyActive,
        membersActivities[0].consistentlyActive,
      ),
      vitalMembersPercentageChange: math.calculatePercentageChange(
        AdjustedMemberActivity[0].vitalMembers,
        membersActivities[0].vitalMembers,
      ),
      becameDisengagedPercentageChange: math.calculatePercentageChange(
        AdjustedMemberActivity[0].becameDisengaged,
        membersActivities[0].becameDisengaged,
      ),
    };
  } catch (error) {
    logger.error(
      { platform_connection: platformConnection.name, startDate, endDate, error },
      'Failed to get active members composition line graph',
    );
    return {
      categories: [],
      series: [],
      totActiveMembers: 0,
      newlyActive: 0,
      consistentlyActive: 0,
      vitalMembers: 0,
      becameDisengaged: 0,
      totActiveMembersPercentageChange: 0,
      newlyActivePercentageChange: 0,
      consistentlyActivePercentageChange: 0,
      vitalMembersPercentageChange: 0,
      becameDisengagedPercentageChange: 0,
    };
  }
}

/**
 * active members onboarding line graph
 * @param {Connection} platformConnection
 * @param {Date} startDate
 * @param {Date} endDate
 * @returns {Object}
 */
async function activeMembersOnboardingLineGraph(platformConnection: Connection, startDate: Date, endDate: Date) {
  const start = new Date(startDate);
  const end = new Date(endDate);

  try {
    const membersActivities = await platformConnection.models.MemberActivity.aggregate([
      // Stage 1: Convert date from string to date type and extract needed data
      {
        $project: {
          _id: 0,
          date: { $convert: { input: '$date', to: 'date' } },
          all_joined_day: 1,
          all_new_active: 1,
          all_still_active: 1,
          all_dropped: 1,
          all_joined: 1,
        },
      },

      // Stage 2: Filter documents based on date
      {
        $match: {
          date: {
            $gte: new Date(start),
            $lte: new Date(end),
          },
        },
      },

      // Stage 3: Add month names array for later use
      {
        $addFields: {
          monthNames: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        },
      },

      // Stage 4: Calculate statistics and concatenate day - month field
      {
        $project: {
          date: 1,
          day_month: {
            $concat: [
              { $dateToString: { format: '%d', date: '$date' } },
              ' ',
              {
                $arrayElemAt: ['$monthNames', { $subtract: [{ $month: '$date' }, 1] }],
              },
            ],
          },
          joinedDay: { $size: '$all_joined_day' },
          joined: { $size: '$all_joined' },
          newly_active: { $size: '$all_new_active' },
          still_active: { $size: '$all_still_active' },
          dropped: { $size: '$all_dropped' },
        },
      },

      // Stage 5: Sort documents by date
      {
        $sort: { date: 1 },
      },

      // Stage 6: Group all documents and keep the arrays
      {
        $group: {
          _id: null,
          day_month: { $push: '$day_month' },
          joinedDay: { $push: '$joinedDay' },
          newlyActive: { $push: '$newly_active' },
          stillActive: { $push: '$still_active' },
          dropped: { $push: '$dropped' },

          // Store last and second-to-last document values
          lastJoined: { $last: '$joined' },
          lastNewlyActive: { $last: '$newly_active' },
          lastStillActive: { $last: '$still_active' },
          lastDropped: { $last: '$dropped' },
        },
      },

      // Stage 7: Transform group data into final format for charting
      {
        $project: {
          _id: 0,
          categories: '$day_month',
          series: [
            { name: 'joinedDay', data: '$joinedDay' },
            { name: 'newlyActive', data: '$newlyActive' },
            { name: 'stillActive', data: '$stillActive' },
            { name: 'dropped', data: '$dropped' },
          ],
          // Use the last document values
          joined: '$lastJoined',
          newlyActive: '$lastNewlyActive',
          stillActive: '$lastStillActive',
          dropped: '$lastDropped',
        },
      },
    ]);

    if (membersActivities.length === 0) {
      return {
        categories: [],
        series: [],
        joined: 0,
        newlyActive: 0,
        stillActive: 0,
        dropped: 0,
        joinedPercentageChange: 0,
        newlyActivePercentageChange: 0,
        stillActivePercentageChange: 0,
        droppedPercentageChange: 0,
      };
    }
    const adjustedDate = date.calculateAdjustedDate(
      endDate,
      membersActivities[0].categories[membersActivities[0].categories.length - 1],
    );
    const AdjustedMemberActivity = await platformConnection.models.MemberActivity.aggregate([
      // Stage 1: Convert date from string to date type and extract needed data
      {
        $project: {
          _id: 0,
          date: { $convert: { input: '$date', to: 'date' } },
          all_new_active: 1,
          all_still_active: 1,
          all_dropped: 1,
          all_joined: 1,
        },
      },

      // Stage 2: Filter documents based on date range
      {
        $match: {
          date: {
            $gte: new Date(adjustedDate),
            $lt: new Date(new Date(adjustedDate).getTime() + 24 * 60 * 60 * 1000), // add one day in milliseconds
          },
        },
      },

      // Stage 3: Calculate statistics and concatenate day - month field
      {
        $project: {
          joined: { $size: '$all_joined' },
          newlyActive: { $size: '$all_new_active' },
          stillActive: { $size: '$all_still_active' },
          dropped: { $size: '$all_dropped' },
        },
      },
    ]);

    if (AdjustedMemberActivity.length === 0) {
      return {
        ...membersActivities[0],
        joinedPercentageChange: 'N/A',
        newlyActivePercentageChange: 'N/A',
        stillActivePercentageChange: 'N/A',
        droppedPercentageChange: 'N/A',
      };
    }

    return {
      ...membersActivities[0],
      joinedPercentageChange: math.calculatePercentageChange(
        AdjustedMemberActivity[0].joined,
        membersActivities[0].joined,
      ),
      newlyActivePercentageChange: math.calculatePercentageChange(
        AdjustedMemberActivity[0].newlyActive,
        membersActivities[0].newlyActive,
      ),
      stillActivePercentageChange: math.calculatePercentageChange(
        AdjustedMemberActivity[0].stillActive,
        membersActivities[0].stillActive,
      ),
      droppedPercentageChange: math.calculatePercentageChange(
        AdjustedMemberActivity[0].dropped,
        membersActivities[0].dropped,
      ),
    };
  } catch (error) {
    logger.error(
      { platform_connection: platformConnection.name, startDate, endDate, error },
      'Failed to get active members onboarding line graph',
    );
    return {
      categories: [],
      series: [],
      joined: 0,
      newlyActive: 0,
      stillActive: 0,
      dropped: 0,
      joinedPercentageChange: 0,
      newlyActivePercentageChange: 0,
      stillActivePercentageChange: 0,
      droppedPercentageChange: 0,
    };
  }
}

/**
 * disengaged members line graph
 * @param {Connection} platformConnection
 * @param {Date} startDate
 * @param {Date} endDate
 * @returns {Object}
 */
async function disengagedMembersCompositionLineGraph(platformConnection: Connection, startDate: Date, endDate: Date) {
  const start = new Date(startDate);
  const end = new Date(endDate);

  try {
    const membersActivities = await platformConnection.models.MemberActivity.aggregate([
      // Stage 1: Convert date from string to date type and extract needed data
      {
        $project: {
          _id: 0,
          date: { $convert: { input: '$date', to: 'date' } },
          all_new_disengaged: 1,
          all_disengaged_were_newly_active: 1,
          all_disengaged_were_consistently_active: 1,
          all_disengaged_were_vital: 1,
        },
      },

      // Stage 2: Filter documents based on date range
      {
        $match: {
          date: {
            $gte: new Date(start),
            $lte: new Date(end),
          },
        },
      },

      // Stage 3: Add month names array for later use
      {
        $addFields: {
          monthNames: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        },
      },

      // Stage 4: Calculate statistics and concatenate day - month field
      {
        $project: {
          date: 1,
          day_month: {
            $concat: [
              { $dateToString: { format: '%d', date: '$date' } },
              ' ',
              {
                $arrayElemAt: ['$monthNames', { $subtract: [{ $month: '$date' }, 1] }],
              },
            ],
          },
          became_disengaged: { $size: '$all_new_disengaged' },
          were_newly_active: { $size: '$all_disengaged_were_newly_active' },
          were_consistently_active: { $size: '$all_disengaged_were_consistently_active' },
          were_vital_members: { $size: '$all_disengaged_were_vital' },
        },
      },

      // Stage 5: Sort documents by date
      {
        $sort: { date: 1 },
      },

      // Stage 6: Group all documents and keep the arrays
      {
        $group: {
          _id: null,
          day_month: { $push: '$day_month' },
          becameDisengaged: { $push: '$became_disengaged' },
          wereNewlyActive: { $push: '$were_newly_active' },
          wereConsistentlyActive: { $push: '$were_consistently_active' },
          wereVitalMembers: { $push: '$were_vital_members' },

          // Store last and second-to-last document values
          lastBecameDisengaged: { $last: '$became_disengaged' },
          lastWereNewlyActive: { $last: '$were_newly_active' },
          lastWereConsistentlyActive: { $last: '$were_consistently_active' },
          lastWereVitalMembers: { $last: '$were_vital_members' },
        },
      },

      // Stage 7: Transform group data into final format for charting
      {
        $project: {
          _id: 0,
          categories: '$day_month',
          series: [
            { name: 'becameDisengaged', data: '$becameDisengaged' },
            { name: 'wereNewlyActive', data: '$wereNewlyActive' },
            { name: 'wereConsistentlyActive', data: '$wereConsistentlyActive' },
            { name: 'wereVitalMembers', data: '$wereVitalMembers' },
          ],
          // Use the last document values
          becameDisengaged: '$lastBecameDisengaged',
          wereNewlyActive: '$lastWereNewlyActive',
          wereConsistentlyActive: '$lastWereConsistentlyActive',
          wereVitalMembers: '$lastWereVitalMembers',
        },
      },
    ]);

    if (membersActivities.length === 0) {
      return {
        categories: [],
        series: [],
        becameDisengaged: 0,
        wereNewlyActive: 0,
        wereConsistentlyActive: 0,
        wereVitalMembers: 0,
        becameDisengagedPercentageChange: 0,
        wereNewlyActivePercentageChange: 0,
        wereConsistentlyActivePercentageChange: 0,
        wereVitalMembersPercentageChange: 0,
      };
    }

    const adjustedDate = date.calculateAdjustedDate(
      endDate,
      membersActivities[0].categories[membersActivities[0].categories.length - 1],
    );
    const AdjustedMemberActivity = await platformConnection.models.MemberActivity.aggregate([
      // Stage 1: Convert date from string to date type and extract needed data
      {
        $project: {
          _id: 0,
          date: { $convert: { input: '$date', to: 'date' } },
          all_new_disengaged: 1,
          all_disengaged_were_newly_active: 1,
          all_disengaged_were_consistently_active: 1,
          all_disengaged_were_vital: 1,
        },
      },

      // Stage 2: Filter documents based on date
      {
        $match: {
          date: {
            $gte: new Date(adjustedDate),
            $lt: new Date(new Date(adjustedDate).getTime() + 24 * 60 * 60 * 1000), // add one day in milliseconds
          },
        },
      },

      // Stage 3: Calculate statistics and concatenate day - month field
      {
        $project: {
          becameDisengaged: { $size: '$all_new_disengaged' },
          wereNewlyActive: { $size: '$all_disengaged_were_newly_active' },
          wereConsistentlyActive: { $size: '$all_disengaged_were_consistently_active' },
          wereVitalMembers: { $size: '$all_disengaged_were_vital' },
        },
      },
    ]);

    if (AdjustedMemberActivity.length === 0) {
      return {
        ...membersActivities[0],
        becameDisengagedPercentageChange: 'N/A',
        wereNewlyActivePercentageChange: 'N/A',
        wereConsistentlyActivePercentageChange: 'N/A',
        wereVitalMembersPercentageChange: 'N/A',
      };
    }

    return {
      ...membersActivities[0],
      becameDisengagedPercentageChange: math.calculatePercentageChange(
        AdjustedMemberActivity[0].becameDisengaged,
        membersActivities[0].becameDisengaged,
      ),
      wereNewlyActivePercentageChange: math.calculatePercentageChange(
        AdjustedMemberActivity[0].wereNewlyActive,
        membersActivities[0].wereNewlyActive,
      ),
      wereConsistentlyActivePercentageChange: math.calculatePercentageChange(
        AdjustedMemberActivity[0].wereConsistentlyActive,
        membersActivities[0].wereConsistentlyActive,
      ),
      wereVitalMembersPercentageChange: math.calculatePercentageChange(
        AdjustedMemberActivity[0].wereVitalMembers,
        membersActivities[0].wereVitalMembers,
      ),
    };
  } catch (error) {
    logger.error(
      { platform_connection: platformConnection.name, startDate, endDate, error },
      'Failed to get disengaged members composition line graph',
    );
    return {
      categories: [],
      series: [],
      becameDisengaged: 0,
      wereNewlyActive: 0,
      wereConsistentlyActive: 0,
      wereVitalMembers: 0,
      becameDisengagedPercentageChange: 0,
      wereNewlyActivePercentageChange: 0,
      wereConsistentlyActivePercentageChange: 0,
      wereVitalMembersPercentageChange: 0,
    };
  }
}

/**
 * inactive members line graph
 * @param {Connection} platformConnection
 * @param {Date} startDate
 * @param {Date} endDate
 * @returns {Object}
 */
async function inactiveMembersLineGraph(platformConnection: Connection, startDate: Date, endDate: Date) {
  const start = new Date(startDate);
  const end = new Date(endDate);

  try {
    const membersActivities = await platformConnection.models.MemberActivity.aggregate([
      // Stage 1: Convert date from string to date type and extract needed data
      {
        $project: {
          _id: 0,
          date: { $convert: { input: '$date', to: 'date' } },
          all_returned: 1,
        },
      },

      // Stage 2: Filter documents based on date range
      {
        $match: {
          date: {
            $gte: new Date(start),
            $lte: new Date(end),
          },
        },
      },

      // Stage 3: Add month names array for later use
      {
        $addFields: {
          monthNames: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        },
      },

      // Stage 4: Calculate statistics and concatenate day - month field
      {
        $project: {
          date: 1,
          day_month: {
            $concat: [
              { $dateToString: { format: '%d', date: '$date' } },
              ' ',
              {
                $arrayElemAt: ['$monthNames', { $subtract: [{ $month: '$date' }, 1] }],
              },
            ],
          },
          returned: { $size: '$all_returned' },
        },
      },

      // Stage 5: Sort documents by date
      {
        $sort: { date: 1 },
      },

      // Stage 6: Group all documents and keep the arrays
      {
        $group: {
          _id: null,
          day_month: { $push: '$day_month' },
          returned: { $push: '$returned' },

          // Store last and second-to-last document values
          lastReturned: { $last: '$returned' },
        },
      },

      // Stage 7: Transform group data into final format for charting
      {
        $project: {
          _id: 0,
          categories: '$day_month',
          series: [{ name: 'returned', data: '$returned' }],
          // Use the last document values
          returned: '$lastReturned',
        },
      },
    ]);

    if (membersActivities.length === 0) {
      return {
        categories: [],
        series: [],
        returned: 0,
        returnedPercentageChange: 0,
      };
    }

    const adjustedDate = date.calculateAdjustedDate(
      endDate,
      membersActivities[0].categories[membersActivities[0].categories.length - 1],
    );
    const AdjustedMemberActivity = await platformConnection.models.MemberActivity.aggregate([
      // Stage 1: Convert date from string to date type and extract needed data
      {
        $project: {
          _id: 0,
          date: { $convert: { input: '$date', to: 'date' } },
          all_returned: 1,
        },
      },

      // Stage 2: Filter documents based on date
      {
        $match: {
          date: {
            $gte: new Date(adjustedDate),
            $lt: new Date(new Date(adjustedDate).getTime() + 24 * 60 * 60 * 1000), // add one day in milliseconds
          },
        },
      },

      // Stage 3: Calculate statistics and concatenate day - month field
      {
        $project: {
          returned: { $size: '$all_returned' },
        },
      },
    ]);

    if (AdjustedMemberActivity.length === 0) {
      return {
        ...membersActivities[0],
        returnedPercentageChange: 'N/A',
      };
    }

    return {
      ...membersActivities[0],
      returnedPercentageChange: math.calculatePercentageChange(
        AdjustedMemberActivity[0].returned,
        membersActivities[0].returned,
      ),
    };
  } catch (error) {
    logger.error(
      { platform_connection: platformConnection.name, startDate, endDate, error },
      'Failed to get inactive members line graph',
    );
    return {
      categories: [],
      series: [],
      returned: 0,
      returnedPercentageChange: 0,
    };
  }
}

/**
 * Constructs a projection stage object for MongoDB aggregation pipeline based on the provided activity composition fields.
 *
 * @param {Array<string>} fields - The activity composition fields to include in the projection. Each field corresponds to a property in the database documents.
 * @returns {Stage} The projection stage object. It includes a '_id' field set to '0', an 'all' field with an empty '$setUnion', and additional fields based on the 'fields' parameter. Each additional field is prefixed with a '$'.
 */
function buildProjectStageBasedOnActivityComposition(fields: Array<string>) {
  const initialStage: {
    _id: string;
    all: { $setUnion: Array<string> };
    [key: string]: string | { $setUnion: Array<string> };
  } = {
    _id: '0',
    all: { $setUnion: [] },
  };

  const finalStage = fields.reduce((stage, field) => {
    stage[field] = `$${field}`;
    stage.all.$setUnion.push(`$${field}`);
    return stage;
  }, initialStage);

  return finalStage;
}

/**
 * get activity composition fileds of active member onboarding table
 * @returns {Object}
 */
function getActivityCompositionOfActiveMembersComposition() {
  return ['all_active', 'all_new_active', 'all_consistent', 'all_vital', 'all_new_disengaged'];
}

/**
 * get activity composition fileds of active member compostion table
 * @returns {Object}
 */
function getActivityCompositionOfActiveMembersOnboarding() {
  return ['all_joined', 'all_new_active', 'all_still_active', 'all_dropped'];
}

/**
 * get activity composition fileds of disengaged member compostion table
 * @returns {Object}
 */
function getActivityCompositionOfDisengagedComposition() {
  return [
    'all_new_disengaged',
    'all_disengaged_were_newly_active',
    'all_disengaged_were_consistently_active',
    'all_disengaged_were_vital',
  ];
}

/**
 * get last member activity document for usage of member activity table
 * @param {Connection} platformConnection
 * @param {Any} activityComposition
 * @returns {Object}
 */
async function getLastDocumentForTablesUsage(platformConnection: Connection, activityComposition: Array<string>) {
  const projectStage = buildProjectStageBasedOnActivityComposition(activityComposition);
  const lastDocument = await platformConnection.models.MemberActivity.aggregate([
    { $sort: { date: -1 } },
    { $limit: 1 },
    { $project: projectStage },
  ]);
  return lastDocument[0];
}

function getActivityComposition(guildMember: IGuildMember, memberActivity: any, activityComposition: Array<string>) {
  const activityTypes = [
    { key: 'all_new_active', message: 'Newly active' },
    { key: 'all_new_disengaged', message: 'Became disengaged' },
    { key: 'all_active', message: 'Active members' },
    { key: 'all_consistent', message: 'Consistently active' },
    { key: 'all_vital', message: 'Vital member' },
    { key: 'all_joined', message: 'Joined' },
    { key: 'all_dropped', message: 'Dropped' },
    { key: 'all_still_active', message: 'Still active' },
    { key: 'all_disengaged_were_newly_active', message: 'Were newly active' },
    { key: 'all_disengaged_were_consistently_active', message: 'Were consistenly active' },
    { key: 'all_disengaged_were_vital', message: 'Were vital members' },
  ];

  const activityCompositions = [];

  activityTypes.forEach((activityType) => {
    if (
      memberActivity[activityType.key] &&
      memberActivity[activityType.key].includes(guildMember.discordId) &&
      (!activityComposition || activityComposition.length === 0 || activityComposition.includes(activityType.key))
    ) {
      activityCompositions.push(activityType.message);
    }
  });

  if (activityCompositions.length === 0) {
    activityCompositions.push('Others');
  }

  return activityCompositions;
}

type networkGraphUserInformationType = {
  discordId: Snowflake;
  username: string;
  avatar: string | null | undefined;
  joinedAt: Date | null;
  roles: any;
  ngu: string;
};
function getUserInformationForNetworkGraph(user: IGuildMember, guildRoles: IRole[]): networkGraphUserInformationType {
  const discordId = user?.discordId;
  const fullUsername = guildMemberService.getUsername(user);
  const avatar = user?.avatar;
  const joinedAt = user?.joinedAt;
  const roles = roleService.getRolesForGuildMember(user, guildRoles);
  const ngu = guildMemberService.getNgu(user);

  return {
    discordId,
    username: fullUsername,
    avatar,
    joinedAt,
    roles,
    ngu,
  };
}

type memberInteractionType = { id: string; radius: number; stats: NodeStats } & networkGraphUserInformationType;
type memberInteractionsGraphResponseType = { width: number; from: memberInteractionType; to: memberInteractionType }[];
async function getMembersInteractionsNetworkGraph(
  platformId: string,
  guildConnection: Connection,
): Promise<memberInteractionsGraphResponseType> {
  // TODO: refactor function later
  const usersInNetworkGraph: string[] = [];
  // userInteraction
  const usersInteractionsQuery = `
    MATCH () -[r:INTERACTED_WITH {platformId: "${platformId}"}]-()
    WITH max(r.date) as latest_date
    MATCH (a:DiscordMember)-[r:INTERACTED_WITH {platformId: "${platformId}", date: latest_date}]->(b:DiscordMember)
    RETURN a, r, b`;
  const neo4jUsersInteractionsData = await Neo4j.read(usersInteractionsQuery);
  const { records: neo4jUsersInteractions } = neo4jUsersInteractionsData;
  const usersInteractions = neo4jUsersInteractions.map((usersInteraction) => {
    // @ts-ignore
    const { _fieldLookup, _fields } = usersInteraction;
    const a = _fields[_fieldLookup['a']];
    const r = _fields[_fieldLookup['r']];
    const b = _fields[_fieldLookup['b']];

    const aUserId = a?.properties?.id as string;
    const rWeeklyInteraction = r?.properties?.weight as number;
    const bUserId = b?.properties?.id as string;

    usersInNetworkGraph.push(aUserId);
    usersInNetworkGraph.push(bUserId);
    const interaction = {
      aUserId,
      bUserId,
      rWeeklyInteraction,
    };

    return interaction;
  });
  // userRadius
  const userRadiusQuery = `
    MATCH () -[r:INTERACTED_WITH {platformId: "${platformId}"}]-()
    WITH max(r.date) as latest_date
    MATCH (a:DiscordMember) -[r:INTERACTED_WITH {date: latest_date, platformId :"${platformId}"}]-(:DiscordMember)
    WITH a, r 
    RETURN a.id as userId, SUM(r.weight) as radius`;
  const neo4jUserRadiusData = await Neo4j.read(userRadiusQuery);
  const { records: neo4jUserRadius } = neo4jUserRadiusData;
  const userRadius = neo4jUserRadius.map((userRadius) => {
    // @ts-ignore
    const { _fieldLookup, _fields } = userRadius;
    const userId = _fields[_fieldLookup['userId']] as string;
    const radius = _fields[_fieldLookup['radius']] as number;

    return { userId, radius };
  });
  // userStatus
  const userStatusQuery = `
    MATCH () -[r:INTERACTED_IN]-(g:DiscordPlatform {id: "${platformId}"})
    WITH max(r.date) as latest_date
    MATCH (a:DiscordMember)-[r:INTERACTED_IN {date: latest_date}]->(g:DiscordPlatform {id: "${platformId}"})
    RETURN a.id as userId, r.status as status`;
  const neo4jUserStatusData = await Neo4j.read(userStatusQuery);
  const { records: neo4jUserStatus } = neo4jUserStatusData;
  const userStatus = neo4jUserStatus.map((userStatus) => {
    // @ts-ignore
    const { _fieldLookup, _fields } = userStatus;
    const userId = _fields[_fieldLookup['userId']] as string;
    const status = _fields[_fieldLookup['status']] as number;
    const stats =
      status == 0 ? NodeStats.SENDER : status == 1 ? NodeStats.RECEIVER : status == 2 ? NodeStats.BALANCED : null;

    return { userId, stats };
  });

  // usersInfo
  const usersInfo = await guildConnection.models.GuildMember.find({ discordId: { $in: usersInNetworkGraph } });
  const rolesInNetworkGraph = usersInfo.flatMap((user) => user.roles);
  const roles = await roleService.getRoles(guildConnection, { roleId: { $in: rolesInNetworkGraph } });

  // prepare data
  const response = usersInteractions.flatMap((interaction) => {
    const { aUserId, bUserId, rWeeklyInteraction } = interaction;
    // Radius
    const aUserRadiusObj = userRadius.find((userRadius) => userRadius.userId == aUserId);
    const aUserRadius = aUserRadiusObj?.radius as number;
    const bUserRadiusObj = userRadius.find((userRadius) => userRadius.userId == bUserId);
    const bUserRadius = bUserRadiusObj?.radius as number;
    // Status
    const aUserStatsObj = userStatus.find((userStatus) => userStatus.userId == aUserId);
    const aUserStats = aUserStatsObj?.stats;
    const bUserStatsObj = userStatus.find((userStatus) => userStatus.userId == bUserId);
    const bUserStats = bUserStatsObj?.stats;
    // userInfo
    const aUser = usersInfo.find((user) => user.discordId === aUserId);
    const bUser = usersInfo.find((user) => user.discordId === bUserId);
    if (!aUser || !bUser) return [];

    const aInfo = getUserInformationForNetworkGraph(aUser, roles);
    const bInfo = getUserInformationForNetworkGraph(bUser, roles);

    if (!aUserStats || !bUserStats) {
      return [];
    }

    return {
      from: { id: aUserId, radius: aUserRadius, stats: aUserStats, ...aInfo },
      to: { id: bUserId, radius: bUserRadius, stats: bUserStats, ...bInfo },
      width: rWeeklyInteraction,
    };
  });

  return response;
}

type fragmentationScoreResponseType = {
  fragmentationScore: number | null;
  fragmentationScoreRange: { minimumFragmentationScore: number; maximumFragmentationScore: number };
  scoreStatus: ScoreStatus | null;
};
async function getFragmentationScore(
  platformId: string,
  platformName: SupportedNeo4jPlatforms,
): Promise<fragmentationScoreResponseType> {
  const fragmentationScale = 200;
  const fragmentationScoreRange = { minimumFragmentationScore: 0, maximumFragmentationScore: fragmentationScale };
  const fragmentationScoreQuery = `
    MATCH ()-[r:INTERACTED_WITH {platformId: "${platformId}"}]-()
    WITH max(r.date) as latest_date
    MATCH (g:${NEO4J_PLATFORM_INFO[platformName].platform} {id: "${platformId}"})-[r:HAVE_METRICS {date: latest_date}]->(g)
    RETURN ((r.louvainModularityScore - (-1)) / 2) * 200 as fragmentation_score;
    `;

  const neo4jData = await Neo4j.read(fragmentationScoreQuery);
  const { records } = neo4jData;
  if (records.length == 0) return { fragmentationScore: null, fragmentationScoreRange, scoreStatus: null };

  const fragmentationData = records[0];
  const { _fieldLookup, _fields } = fragmentationData as unknown as {
    _fieldLookup: Record<string, number>;
    _fields: number[];
  };

  const fragmentationScore = _fields[_fieldLookup['fragmentation_score']];
  const scoreStatus = findFragmentationScoreStatus(fragmentationScore);

  return { fragmentationScore, fragmentationScoreRange, scoreStatus };
}
/**
 * this function was written based on what Amin and Ene suggested. (https://discord.com/channels/915914985140531240/1126528102311399464/1126771392512266250)
 * if fragmentationScore is null or -1, it returns null that means there is not enough data to calculate the score
 * ! if fragmentationScoreRange is changed, it we may should rewrite this function
 * @param fragmentationScore number
 * @returns ScoreStatus | null
 */
function findFragmentationScoreStatus(fragmentationScore?: number) {
  if (fragmentationScore == null) return null;
  else if (fragmentationScore == -1) return null;
  else if (fragmentationScore >= 0 && fragmentationScore < 40) return ScoreStatus.DANGEROUSLY_LOW;
  else if (fragmentationScore >= 40 && fragmentationScore < 80) return ScoreStatus.SOMEWHAT_LOW;
  else if (fragmentationScore >= 80 && fragmentationScore < 120) return ScoreStatus.GOOD;
  else if (fragmentationScore >= 120 && fragmentationScore < 160) return ScoreStatus.SOMEWHAT_HIGH;
  else if (fragmentationScore >= 160 && fragmentationScore <= 200) return ScoreStatus.DANGEROUSLY_HIGH;
  else return null;
}

type decentralisationScoreResponseType = {
  decentralisationScore: number | null;
  decentralisationScoreRange: { minimumDecentralisationScore: number; maximumDecentralisationScore: number };
  scoreStatus: ScoreStatus | null;
};
async function getDecentralisationScore(
  platformId: string,
  platformName: SupportedNeo4jPlatforms,
): Promise<decentralisationScoreResponseType> {
  const decentralisationScoreRange = { minimumDecentralisationScore: 0, maximumDecentralisationScore: 200 };
  const decentralisationScoreQuery = `
    MATCH (g:${NEO4J_PLATFORM_INFO[platformName].platform} {id: "${platformId}"})-[r:HAVE_METRICS]->(g)
    RETURN r.decentralizationScore as decentralization_score ORDER BY r.date DESC LIMIT 1;
    `;
  const neo4jData = await Neo4j.read(decentralisationScoreQuery);
  const { records } = neo4jData;
  if (records.length == 0) return { decentralisationScore: null, decentralisationScoreRange, scoreStatus: null };

  const decentralisationData = records[0];
  const { _fieldLookup, _fields } = decentralisationData as unknown as {
    _fieldLookup: Record<string, number>;
    _fields: number[];
  };

  const decentralisationScore = _fields[_fieldLookup['decentralization_score']];
  const scoreStatus = findDecentralisationScoreStatus(decentralisationScore);

  return { decentralisationScore, decentralisationScoreRange, scoreStatus };
}
/**
 * this function was written based on what Amin and Ene suggested. (https://discord.com/channels/915914985140531240/1126528102311399464/1126771392512266250)
 * if fragmentationScore is null or -1, it returns null that means there is not enough data to calculate the score
 * ! if decentralisationScoreRange is changed, it we may should rewrite this function
 * @param fragmentationScore number
 * @returns ScoreStatus | null
 */
function findDecentralisationScoreStatus(decentralisationScore?: number) {
  if (decentralisationScore == null) return null;
  else if (decentralisationScore == -1) return null;
  else if (decentralisationScore >= 0 && decentralisationScore < 40) return ScoreStatus.DANGEROUSLY_LOW;
  else if (decentralisationScore >= 40 && decentralisationScore < 80) return ScoreStatus.SOMEWHAT_LOW;
  else if (decentralisationScore >= 80 && decentralisationScore < 120) return ScoreStatus.GOOD;
  else if (decentralisationScore >= 120 && decentralisationScore < 160) return ScoreStatus.SOMEWHAT_HIGH;
  else if (decentralisationScore >= 160 && decentralisationScore <= 200) return ScoreStatus.DANGEROUSLY_HIGH;
  else return null;
}

export default {
  activeMembersCompositionLineGraph,
  disengagedMembersCompositionLineGraph,
  inactiveMembersLineGraph,
  activeMembersOnboardingLineGraph,
  getLastDocumentForTablesUsage,
  getActivityComposition,
  getMembersInteractionsNetworkGraph,
  getFragmentationScore,
  getDecentralisationScore,
  getActivityCompositionOfActiveMembersComposition,
  getActivityCompositionOfActiveMembersOnboarding,
  getActivityCompositionOfDisengagedComposition,
};
