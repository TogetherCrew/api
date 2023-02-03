import { Connection } from 'mongoose';

/**
 * get heatmaps
 * @param {Connection} connection
 * @param {Date} startDate
 * @param {Date} endDate
 * @returns {Array<Array<number>>}
 */
async function getHeatmaps(connection: Connection, startDate: Date, endDate: Date) {
    const heatmaps = await connection.models.HeatMap.aggregate([
        // Stage1 : find heatmaps between startDate and endDate
        {
            $match: {
                'date': {
                    $gte: new Date(startDate),
                    $lte: new Date(endDate)
                }
            }
        },

        // Stage2 : provide one document for each element of interactions array
        {
            $unwind: {
                path: '$interactions',
                includeArrayIndex: "arrayIndex",
            }
        },

        // Stage3 : extract needed data
        {
            $project: {
                _id: 0,
                'dayOfWeek': { $add: [{ $dayOfWeek: "$date" }, -1] },
                'hour': { $add: ['$arrayIndex', 1] },
                'interactions': 1,
            }
        },

        // Stage4 : group documents base on day and hour
        {
            $group: {
                '_id': { dayOfWeek: '$dayOfWeek', hour: '$hour' }
                , interactions: { $sum: "$interactions" }
            }
        }
    ]);

    // Convert Arrays of objects to array of 2D arrays
    return heatmaps.map(object => [object._id.dayOfWeek, object._id.hour, object.interactions]);
}

export default {
    getHeatmaps
}