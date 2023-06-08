import { Connection } from 'mongoose';
import { IHeatmapChartRequestBody } from '../interfaces/request.interface';
import { date, math } from '../utils';

/**
 * get heatmap chart 
 * @param {Connection} connection
 * @param {IHeatmapChartRequestBody} Body
 * @returns {Array<Array<number>>}
 */
async function getHeatmapChart(connection: Connection, Body: IHeatmapChartRequestBody) {
    const { startDate, endDate, channelIds } = Body;
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
                    channelId: 1

                }
            },

            // Stage2: find heatmaps between startDate and endDate and filter by channelIds if it's not empty
            {
                $match: {
                    $and: [
                        { date: { $gte: new Date(startDate) } },
                        { date: { $lte: new Date(endDate) } },
                        {
                            $or: [
                                { channelId: { $in: channelIds } },
                                { $expr: { $eq: [channelIds, []] } }
                            ]
                        }
                    ]
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


/**
 * get line graph 
 * @param {Connection} connection
 * @param {Date} startDate
 * @param {Date} endDate
 * @returns {Object}
 */
async function lineGraph(connection: Connection, startDate: Date, endDate: Date) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    try {
        const heatmaps = await connection.models.HeatMap.aggregate([
            // Stage 1: Convert date from string to date type and extract needed data
            {
                $project: {
                    _id: 0,
                    date: { $convert: { input: "$date", to: "date" } },
                    lone_messages: 1,
                    thr_messages: 1,
                    replier: 1,
                    reacter: 1
                }
            },

            // Stage 2: Filter documents based on date range
            {
                $match: {
                    date: {
                        $gte: new Date(start),
                        $lte: new Date(end)
                    }
                }
            },

            // Stage 3: Add month names array for later use
            {
                $addFields: {
                    monthNames: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
                }
            },

            // Stage 4: Calculate statistics and concatenate day-month field
            {
                $project: {
                    date: 1,
                    day_month: {
                        $concat: [
                            { $dateToString: { format: "%d", date: "$date" } },
                            " ",
                            {
                                $arrayElemAt: [
                                    "$monthNames",
                                    { $subtract: [{ $month: "$date" }, 1] }
                                ]
                            }
                        ]
                    },
                    total_lone_messages: {
                        $reduce: {
                            input: "$lone_messages",
                            initialValue: 0,
                            in: { $sum: ["$$value", "$$this"] }
                        }
                    },
                    total_thr_messages: {
                        $reduce: {
                            input: "$thr_messages",
                            initialValue: 0,
                            in: { $sum: ["$$value", "$$this"] }
                        }
                    },
                    total_replier: {
                        $reduce: {
                            input: "$replier",
                            initialValue: 0,
                            in: { $sum: ["$$value", "$$this"] }
                        }
                    },
                    emojis: {
                        $reduce: {
                            input: "$reacter",
                            initialValue: 0,
                            in: { $sum: ["$$value", "$$this"] }
                        }
                    }
                }
            },

            // Stage 5: Sort documents by date
            {
                $sort: { date: 1 }
            },


            // Stage 6: Group all documents and keep the arrays
            {
                $group: {
                    _id: null,
                    day_month: { $push: "$day_month" },
                    emojis: { $push: "$emojis" },
                    messages: {
                        $push: {
                            $sum: ["$total_lone_messages", "$total_thr_messages", "$total_replier"]
                        }
                    },

                    // Store last and second-to-last document values                    
                    lastEmojis: { $last: "$emojis" },
                    lastTotalLoneMessages: { $last: "$total_lone_messages" },
                    lastTotalThrMessages: { $last: "$total_thr_messages" },
                    lastTotalReplier: { $last: "$total_replier" }
                }
            },

            // Stage 7: Transform group data into final format for charting
            {
                $project: {
                    _id: 0,
                    categories: "$day_month",
                    series: [
                        { name: "emojis", data: "$emojis" },
                        { name: "messages", data: "$messages" }
                    ],
                    // Use the last document values
                    emojis: "$lastEmojis",
                    messages: {
                        $sum: {
                            $add: [
                                { $ifNull: ["$lastTotalLoneMessages", 0] },
                                { $ifNull: ["$lastTotalThrMessages", 0] },
                                { $ifNull: ["$lastTotalReplier", 0] }
                            ]
                        }
                    }
                }
            }
        ]);

        if (heatmaps.length === 0) {
            return {
                categories: [],
                series: [],
                emojis: 0,
                messages: 0,
                msgPercentageChange: 0,
                emojiPercentageChange: 0

            }
        }

        const adjustedDate = date.calculateAdjustedDate(endDate, heatmaps[0].categories[heatmaps[0].categories.length - 1]);
        const adjustedHeatmap = await connection.models.HeatMap.aggregate([
            // Stage 1: Convert date from string to date type and extract needed data
            {
                $project: {
                    _id: 0,
                    date: { $convert: { input: "$date", to: "date" } },
                    lone_messages: 1,
                    thr_messages: 1,
                    replier: 1,
                    reacter: 1
                }
            },

            // Stage 2: Filter documents based on date
            {
                $match: {
                    date: new Date(adjustedDate)
                }
            },


            // Stage 3: Calculate statistics and concatenate day-month field
            {
                $project: {
                    total_lone_messages: {
                        $reduce: {
                            input: "$lone_messages",
                            initialValue: 0,
                            in: { $sum: ["$$value", "$$this"] }
                        }
                    },
                    total_thr_messages: {
                        $reduce: {
                            input: "$thr_messages",
                            initialValue: 0,
                            in: { $sum: ["$$value", "$$this"] }
                        }
                    },
                    total_replier: {
                        $reduce: {
                            input: "$replier",
                            initialValue: 0,
                            in: { $sum: ["$$value", "$$this"] }
                        }
                    },
                    emojis: {
                        $reduce: {
                            input: "$reacter",
                            initialValue: 0,
                            in: { $sum: ["$$value", "$$this"] }
                        }
                    }
                }
            },

        ]);

        if (adjustedHeatmap.length === 0) {
            return {
                ...heatmaps[0],
                msgPercentageChange: 0,
                emojiPercentageChange: 0
            }
        }

        return {
            ...heatmaps[0],
            msgPercentageChange: math.calculatePercentageChange((adjustedHeatmap[0].total_lone_messages + adjustedHeatmap[0].total_thr_messages + adjustedHeatmap[0].total_replier), heatmaps[0].messages),
            emojiPercentageChange: math.calculatePercentageChange(adjustedHeatmap[0].emojis, heatmaps[0].emojis)
        }

    } catch (err) {
        console.log(err);
        return {
            categories: [],
            series: [],
            emojis: 0,
            messages: 0,
            msgPercentageChange: 0,
            emojiPercentageChange: 0

        }
    }

}


export default {
    getHeatmapChart,
    lineGraph
}

