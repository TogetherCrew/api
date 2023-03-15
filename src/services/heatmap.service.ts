import { Connection } from 'mongoose';
import { IHeatmapChartRequestBody } from '../interfaces/request.interface';
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
            {
                $match: {
                    date: {
                        $gte: new Date(start),
                        $lte: new Date(end)
                    }
                }
            },
            {
                $addFields: {
                    monthNames: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
                }
            },
            {
                $project: {
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
            {
                $sort: { date: 1 }
            },
            {
                $group: {
                    _id: null,
                    day_month: { $push: "$day_month" },
                    emojis: { $push: "$emojis" },
                    messages: {
                        $push: {
                            $sum: ["$total_lone_messages", "$total_thr_messages", "$total_replier"]
                        }
                    }
                }
            },
            {
                $project: {
                    _id: 0,
                    categories: "$day_month",
                    series: [
                        { name: "emojis", data: "$emojis" },
                        { name: "messages", data: "$messages" }
                    ],
                    emojis: {
                        $reduce: {
                            input: "$emojis",
                            initialValue: 0,
                            in: { $sum: ["$$value", "$$this"] }
                        }
                    },
                    messages: {
                        $reduce: {
                            input: "$messages",
                            initialValue: 0,
                            in: { $sum: ["$$value", "$$this"] }
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
        const diffInMs = Math.abs(end.getTime() - start.getTime());
        const diffInDays = Math.ceil(diffInMs / (1000 * 60 * 60 * 24));
        const numDaysToSubtract = diffInDays;
        const pastHeatmaps = await connection.models.HeatMap.aggregate([
            {
                $project: {
                    _id: 0,
                    lone_messages: 1,
                    thr_messages: 1,
                    replier: 1,
                    reacter: 1,
                    date: { $convert: { input: "$date", to: "date" } },

                }
            },
            {
                $match: {
                    date: {
                        $gte: new Date(start.setDate(start.getDate() - numDaysToSubtract)),
                        $lte: new Date(end.setDate(end.getDate() - (numDaysToSubtract + 1)))
                    }
                }
            },

            {
                $project: {
                    date: 1,
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
            {
                $group: {
                    date: { $push: "$date" },
                    _id: null,
                    emojis: { $push: "$emojis" },
                    messages: {
                        $push: {
                            $sum: ["$total_lone_messages", "$total_thr_messages", "$total_replier"]
                        }
                    }
                }
            },
            {
                $project: {
                    date: 1,
                    emojis: {
                        $reduce: {
                            input: "$emojis",
                            initialValue: 0,
                            in: { $sum: ["$$value", "$$this"] }
                        }
                    },
                    messages: {
                        $reduce: {
                            input: "$messages",
                            initialValue: 0,
                            in: { $sum: ["$$value", "$$this"] }
                        }
                    }
                }
            }
        ]

        );


        let msgPercentageChange = 0;
        let emojiPercentageChange = 0;

        if (heatmaps[0] && pastHeatmaps[0] && pastHeatmaps[0].messages !== 0) {
            msgPercentageChange = ((heatmaps[0].messages - pastHeatmaps[0].messages) / pastHeatmaps[0].messages) * 100;
        }

        if (heatmaps[0] && pastHeatmaps[0] && pastHeatmaps[0].emojis !== 0) {
            emojiPercentageChange = ((heatmaps[0].emojis - pastHeatmaps[0].emojis) / pastHeatmaps[0].emojis) * 100;
        }

        return {
            ...heatmaps[0],
            msgPercentageChange,
            emojiPercentageChange
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

