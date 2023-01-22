import { Connection } from 'mongoose';

/**
 * Create heatmap
 * @param {IHeatMap} data
 * @returns {Promise<IHeatMap>}
 */
async function getHeatmaps(connection: Connection, startDate: Date) {
    const heatmaps = await connection.models.HeatMap.aggregate([
        // Stage1 : find heatmaps between startDate and today
        {
            $match: {
                'date': {
                    $gte: new Date(startDate),
                    $lte: new Date()
                }
            }
        },

        // Stage2 : extract needed data
        {
            $project: {
                _id: 0,
                'dayOfWeek': { $dayOfWeek: "$date" },
                'hour': { $hour: "$date" },
                'interactions': { '$sum': '$interactions' },
            }
        }
    ]);

    // // Convert Arrays of objects to array of arrays
    return heatmaps.map(object => [object.dayOfWeek, object.hour, object.interactions]);
}

export default {
    getHeatmaps
}




// ****TEST****
    // async function runer(startDate: string) {
    //     // const stage1 = {
    //     //     $project: {
    //     //         _id: 0,
    //     //         'interactions': 1,
    //     //         'date': { date: "$date", timezone: "IR" }
    //     //     },
    //     //     $match: {
    //     //         'date': {
    //     //             $gte: new Date(startDate),
    //     //             $lte: new Date()
    //     //         }
    //     //     }
    //     // }

    //     // const stage2 = {
    //     //     $project: {
    //     //         _id: 0,
    //     //         'dayOfWeek': { $dayOfWeek: "$date" },
    //     //         'hour': { $hour: "$date" },
    //     //         'interactions': { '$sum': '$interactions' },
    //     //     }
    //     // }

    //     // // Ignore stage1 if startDate is not provided
    //     // const stages = startDate === " " ? [stage2] : [stage1, stage2]

    //     // {
    //     //     $addFields: {
    //     //         expiry: {
    //     //             $function: {
    //     //                 body: function (date) { 
    //     //                     return moment(date).format('h') 
    //     //                 },
    //     //                 args: ['$date'],
    //     //                 lang: "js"
    //     //             }
    //     //         }
    //     //     }
    //     // },
    //     // {
    //     //     $match: {
    //     //         'date': {
    //     //             $gte: moment.tz(startDate, "Asia/Tehran").format(),
    //     //             $lte: moment.tz(Date.now(), "Asia/Tehran").format()
    //     //         }
    //     //     }
    //     // }


    //     const result = await connection.models.HeatMap.aggregate([
    //         // {
    //         //     $addFields: {
    //         //         'datex': {
    //         //             $function: {
    //         //                 body: function (date: string) {
    //         //                     console.log(date)
    //         //                     return moment.tz(date, "Asia/Tehran").format()
    //         //                 },
    //         //                 args: ['$date'],
    //         //                 lang: "js"
    //         //             }
    //         //         }
    //         //     },

    //         // },

    //         {
    //             $project: {
    //                 _id: 0,
    //                 interactions: 1,
    //                 date: {
    //                     $function: {
    //                         body: function (date: any) { const tz = new Date(date).toLocaleString('en-US', { timeZone: 'Asia/Tehran' }); return new Date(tz) },
    //                         args: ['$date'],
    //                         lang: "js"
    //                     }
    //                 }
    //             }
    //         },
    //         // {
    //         //     $project: {
    //         //         'dayOfWeek': { $dayOfWeek: "$date" },
    //         //         'hour': { $hour: "$date" },
    //         //         'interactions': { '$sum': '$interactions' },
    //         //     }
    //         // }
    //         // {
    //         //     $match: {
    //         //         // 'date': {
    //         //         //     $gte: new Date(startDate).toLocaleString('en-US', { timeZone: 'Asia/Tehran' }),
    //         //         //     $lte: new Date().toLocaleString('en-US', { timeZone: 'Asia/Tehran' })
    //         //         // }
    //         //     }
    //         // }
    //     ]);
    //     // return moment.tz(new Date(date), "Asia/Tehran").format()
    //     console.log(result)



    //     // // Convert Arrays of objects to array of arrays
    //     // const arrayOfArrays = result.map(object => [object.dayOfWeek, object.hour, object.interactions]);
    //     // console.log(arrayOfArrays)

    // }

    // runer("2023-01-17T13:02:10.911+00:00")


    // // // console.log((new Date().toLocaleString('en-US', { timeZone: 'Asia/Tehran' })))

    // // const x = new Date().toLocaleString('en-US', { timeZone: 'Asia/Tehran' })

    // // console.log(new Date(x))
    // // // console.log(moment.tz(Date.now(), "America/New_York").format())


    // // console.log(dayjs(new Date()).tz("Asia/Tehran").format())

    // // body: function (date: any) { return new Date(date).toLocaleDateString('en-US', { timeZone: 'Asia/Tehran' }) },


    // // dayjs(new Date(date)).tz("Asia/Tehran").format()

