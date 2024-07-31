import { Connection } from 'mongoose';
import { IHeatmapChartRequestBody } from '../interfaces/Request.interface';
import { date, math } from '../utils';
import parentLogger from '../config/logger';

const logger = parentLogger.child({ module: 'HeatmapService' });

/**
 * get heatmap chart
 * @param {Connection} platformConnection
 * @param {IHeatmapChartRequestBody} body
 * @returns {Array<Array<number>>}
 */
async function getHeatmapChart(platformConnection: Connection, body: IHeatmapChartRequestBody) {
  const { startDate, endDate, channelIds } = body;
  try {
    const heatmaps = await platformConnection.models.HeatMap.aggregate([
      // Stage1 : convert date from string to date type and extract needed data
      {
        $project: {
          _id: 0,
          date: { $convert: { input: '$date', to: 'date' } },
          lone_messages: 1,
          thr_messages: 1,
          replier: 1,
          channelId: 1,
        },
      },

      // Stage2: find heatmaps between startDate and endDate and filter by channelIds if it's not empty
      {
        $match: {
          $and: [
            { date: { $gte: new Date(startDate) } },
            { date: { $lte: new Date(endDate) } },
            {
              $or: [{ channelId: { $in: channelIds } }, { $expr: { $eq: [channelIds, []] } }],
            },
          ],
        },
      },

      // Stage3 : provide one document for each element of interactions array
      {
        $unwind: {
          path: '$thr_messages',
          includeArrayIndex: 'arrayIndex',
        },
      },

      // Stage4 : extract needed data
      {
        $project: {
          dayOfWeek: { $add: [{ $dayOfWeek: '$date' }, -1] },
          hour: { $add: ['$arrayIndex', 1] },
          interactions: {
            $add: [
              '$thr_messages',
              { $arrayElemAt: ['$lone_messages', '$arrayIndex'] },
              { $arrayElemAt: ['$replier', '$arrayIndex'] },
            ],
          },
        },
      },

      // Stage5 : group documents base on day and hour
      {
        $group: {
          _id: { dayOfWeek: '$dayOfWeek', hour: '$hour' },
          interactions: { $sum: '$interactions' },
        },
      },
    ]);

    // Convert Arrays of objects to array of 2D arrays
    return heatmaps.map((object) => [object._id.dayOfWeek, object._id.hour, object.interactions]);
  } catch (error) {
    logger.error({ platform_connection: platformConnection.name, body, error }, 'Failed to get heatmap chart');
    return [];
  }
}

/**
 * get line graph
 * @param {Connection} connection
 * @param {Date} startDate
 * @param {Date} endDate
 * @returns {Object}
 */
async function lineGraph(platformConnection: Connection, startDate: Date, endDate: Date) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  try {
    const heatmaps = await platformConnection.models.HeatMap.aggregate([
      // Stage 1: Convert date from string to date type and extract needed data
      {
        $project: {
          _id: 0,
          date: { $convert: { input: '$date', to: 'date' } },
          lone_messages: 1,
          thr_messages: 1,
          replier: 1,
          reacter: 1,
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

      // Stage 4: Calculate statistics and concatenate day-month field
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
          total_lone_messages: {
            $reduce: {
              input: '$lone_messages',
              initialValue: 0,
              in: { $sum: ['$$value', '$$this'] },
            },
          },
          total_thr_messages: {
            $reduce: {
              input: '$thr_messages',
              initialValue: 0,
              in: { $sum: ['$$value', '$$this'] },
            },
          },
          total_replier: {
            $reduce: {
              input: '$replier',
              initialValue: 0,
              in: { $sum: ['$$value', '$$this'] },
            },
          },
          emojis: {
            $reduce: {
              input: '$reacter',
              initialValue: 0,
              in: { $sum: ['$$value', '$$this'] },
            },
          },
        },
      },

      // Stage 5: Sort documents by date
      {
        $sort: { date: 1 },
      },

      // Stage 6: Group documents by day and compute summary statistics
      {
        $group: {
          _id: {
            date: '$date',
            day_month: '$day_month',
          },
          emojis: { $sum: '$emojis' },
          messages: { $sum: { $sum: ['$total_lone_messages', '$total_thr_messages', '$total_replier'] } },
        },
      },

      // Stage 7: Sort documents by date
      {
        $sort: { '_id.date': 1 },
      },

      // Stage 8: Transform group data into final format for charting
      {
        $group: {
          _id: null,
          categories: { $push: '$_id.day_month' },
          emojis: { $push: '$emojis' },
          messages: { $push: '$messages' },
          // totalEmojis: { $sum: "$emojis" },
          // totalMessages: { $sum: "$messages" }
          lastMessages: { $last: '$messages' },
          lastEmojis: { $last: '$emojis' },
        },
      },
      // Stage 9: Project data into final format
      {
        $project: {
          _id: 0,
          categories: '$categories',
          series: [
            { name: 'emojis', data: '$emojis' },
            { name: 'messages', data: '$messages' },
          ],
          emojis: '$lastEmojis',
          messages: '$lastMessages',
        },
      },
    ]);

    if (heatmaps.length === 0) {
      return {
        categories: [],
        series: [],
        emojis: 0,
        messages: 0,
        msgPercentageChange: 0,
        emojiPercentageChange: 0,
      };
    }

    const adjustedDate = date.calculateAdjustedDate(endDate, heatmaps[0].categories[heatmaps[0].categories.length - 1]);
    const adjustedHeatmap = await platformConnection.models.HeatMap.aggregate([
      // Stage 1: Convert date from string to date type and extract needed data
      {
        $project: {
          _id: 0,
          date: { $convert: { input: '$date', to: 'date' } },
          lone_messages: 1,
          thr_messages: 1,
          replier: 1,
          reacter: 1,
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

      // Stage 3: Calculate statistics and concatenate day-month field
      {
        $project: {
          total_lone_messages: {
            $reduce: {
              input: '$lone_messages',
              initialValue: 0,
              in: { $sum: ['$$value', '$$this'] },
            },
          },
          total_thr_messages: {
            $reduce: {
              input: '$thr_messages',
              initialValue: 0,
              in: { $sum: ['$$value', '$$this'] },
            },
          },
          total_replier: {
            $reduce: {
              input: '$replier',
              initialValue: 0,
              in: { $sum: ['$$value', '$$this'] },
            },
          },
          emojis: {
            $reduce: {
              input: '$reacter',
              initialValue: 0,
              in: { $sum: ['$$value', '$$this'] },
            },
          },
        },
      },

      // Stage 4: Group documents by null (aggregate all) and sum up all the values
      {
        $group: {
          _id: null, // Aggregate all documents
          total_lone_messages: { $sum: '$total_lone_messages' },
          total_thr_messages: { $sum: '$total_thr_messages' },
          total_replier: { $sum: '$total_replier' },
          total_emojis: { $sum: '$emojis' },
        },
      },
      // Stage 5: Transform totals into 'messages' and 'emojis'
      {
        $project: {
          _id: 0,
          messages: {
            $add: ['$total_lone_messages', '$total_thr_messages', '$total_replier'],
          },
          emojis: '$total_emojis',
        },
      },
    ]);

    if (adjustedHeatmap.length === 0) {
      return {
        ...heatmaps[0],
        msgPercentageChange: 'N/A',
        emojiPercentageChange: 'N/A',
      };
    }

    return {
      ...heatmaps[0],
      msgPercentageChange: math.calculatePercentageChange(adjustedHeatmap[0].messages, heatmaps[0].messages),
      emojiPercentageChange: math.calculatePercentageChange(adjustedHeatmap[0].emojis, heatmaps[0].emojis),
    };
  } catch (err) {
    logger.error({ platform_connection: platformConnection.name, startDate, endDate }, 'Failed to get line graph data');
    return {
      categories: [],
      series: [],
      emojis: 0,
      messages: 0,
      msgPercentageChange: 0,
      emojiPercentageChange: 0,
    };
  }
}

export default {
  getHeatmapChart,
  lineGraph,
};
