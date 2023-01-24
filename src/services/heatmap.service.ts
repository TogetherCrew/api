import { Connection } from 'mongoose';

/**
 * Create heatmap
 * @param {IHeatMap} data
 * @returns {Promise<IHeatMap>}
 */
async function getHeatmaps(connection: Connection, startDate: Date, endDate: Date, timeZone: string) {
    timeZone = 'America/Havana'
    const heatmaps = await connection.models.HeatMap.aggregate([

        // Stage1 : convert dates to required timeZone
        // {
        //     $project: {
        //         _id: 0,
        //         interactions: 1,
        //         date: {
        //             $function: {
        //                 body: function (date: Date) { const tz = new Date(date).toLocaleString('en-US', { timeZone: "100" }); return new Date(tz) },
        //                 args: ['$date'],
        //                 lang: "js"
        //             }
        //         }
        //     }
        // },

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
        // {
        //     $unwind: {
        //         path: '$interactions',
        //         includeArrayIndex: "arrayIndex",
        //     }
        // },

        // Stage4 : extract needed data
        {
            $project: {
                _id: 0,
                // 'dayOfWeek': { $dayOfWeek: "$date" },
                // 'hour': { $add: ['$arrayIndex', 1] },
                'interactions': 1,
                'date': 1,
                'input': `${timeZone}`,
            }
        },


        {
            $project: {
                _id: 0,
                interactions: 1,
                date: {
                    $function: {
                        body: function (date: Date) { return new Date().toLocaleString('en-US', { timeZone: "$input" }) },
                        args: ['$date'],
                        lang: "js"
                    }
                },
                input: 1,
            }
        },

    ]);

    console.log(heatmaps)
    console.log(new Date().toLocaleString('en-US', { timeZone: "America/Havana" }));
    import moment from 'moment-timezone';
    const timezoneOffsetInHours = moment().tz('Europe/Amsterdam').hour() - new Date().getHours()
    // // Convert Arrays of objects to array of arrays
    return heatmaps.map(object => [object.dayOfWeek, object.hour, object.interactions]);
}

export default {
    getHeatmaps
}
