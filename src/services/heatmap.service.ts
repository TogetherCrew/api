import { Connection } from 'mongoose';

/**
 * get heatmap chart data
 * @param {Connection} connection
 * @param {Date} startDate
 * @param {Date} endDate
 * @returns {Array<Array<number>>}
 */
async function getHeatmapChart(connection: Connection, startDate: Date, endDate: Date) {
    try {
        const heatmaps = await connection.models.HeatMap.aggregate([


            // Stage1 : convert date from string to date type and extract needed data
            {
                $project: {
                    _id: 0,
                    date: { $convert: { input: "$date", to: "date", } },
                    lone_messages: 1,
                    thr_messages: 1,
                    replier: 1,

                }
            },

            // Stage2 : find heatmaps between startDate and endDate
            {
                $match: {
                    'date': {
                        $gte: new Date(startDate),
                        $lte: new Date(endDate)
                    }
                }
            },

            // Stage3 : provide one document for each element of interactions array
            {
                $unwind: {
                    path: '$thr_messages',
                    includeArrayIndex: "arrayIndex",
                }
            },

            // Stage4 : extract needed data
            {
                $project: {
                    'dayOfWeek': { $add: [{ $dayOfWeek: "$date" }, -1] },
                    'hour': { $add: ['$arrayIndex', 1] },
                    'interactions': { $add: ['$thr_messages', { $arrayElemAt: ['$lone_messages', '$arrayIndex'] }, { $arrayElemAt: ['$replier', '$arrayIndex'] }] },
                }
            },

            // Stage5 : group documents base on day and hour
            {
                $group: {
                    '_id': { dayOfWeek: '$dayOfWeek', hour: '$hour' }
                    , interactions: { $sum: "$interactions" }
                }
            }
        ]);

        // Convert Arrays of objects to array of 2D arrays
        return heatmaps.map(object => [object._id.dayOfWeek, object._id.hour, object.interactions]);

    } catch (err) {
        console.log(err);
        return [];
    }

}

export default {
    getHeatmapChart
}