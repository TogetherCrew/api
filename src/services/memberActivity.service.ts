import { Connection } from 'mongoose';

/**
 * active members line graph 
 * @param {Connection} connection
 * @param {Date} startDate
 * @param {Date} endDate
 * @returns {Object}
 */
async function activeMembersLineGraph(connection: Connection, startDate: Date, endDate: Date) {

    const start = new Date(startDate);
    const end = new Date(endDate);

    console.log(start, end)
    // try {
    const heatmaps = await connection.models.MemberActivity.aggregate([
        {
            $addFields: {
                tot_active_members: {
                    $objectToArray: "$all_active"
                },
                newly_active: {
                    $objectToArray: "$all_new_active"
                },
                consistently_active: {
                    $objectToArray: "$all_consistent"
                },
                vital_members: {
                    $objectToArray: "$all_vital"
                },
                became_disengaged: {
                    $objectToArray: "$all_new_disengaged"
                },
            }
        },

        {

            $project: {
                _id: 0,
                // date: { $convert: { input: "$date", to: "date", } },
                first_end_date: 1,
                tot_active_members: 1,
                newly_active: 1,
                consistently_active: 1,
                vital_members: 1,
                became_disengaged: 1
            }
        },

        {
            $match: {
                first_end_date: {
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
                        { $dateToString: { format: "%d", date: "$first_end_date" } },
                        " ",
                        {
                            $arrayElemAt: [
                                "$monthNames",
                                { $subtract: [{ $month: "$first_end_date" }, 1] }
                            ]
                        }
                    ]
                },


                tot_active_members: {
                    $sum: {
                        $map: {
                            input: "$tot_active_members",
                            as: "item",
                            in: {
                                $size: "$$item.v"
                            }
                        }
                    }
                },
                newly_active: {
                    $sum: {
                        $map: {
                            input: "$newly_active",
                            as: "item",
                            in: {
                                $size: "$$item.v"
                            }
                        }
                    }
                },
                consistently_active: {
                    $sum: {
                        $map: {
                            input: "$consistently_active",
                            as: "item",
                            in: {
                                $size: "$$item.v"
                            }
                        }
                    }
                },
                vital_members: {
                    $sum: {
                        $map: {
                            input: "$vital_members",
                            as: "item",
                            in: {
                                $size: "$$item.v"
                            }
                        }
                    }
                },
                became_disengaged: {
                    $sum: {
                        $map: {
                            input: "$became_disengaged",
                            as: "item",
                            in: {
                                $size: "$$item.v"
                            }
                        }
                    }
                },
            }
        },
        // Stage 5: Sort documents by date
        {
            $sort: { date: 1 }
        },
        {
            $group: {
                _id: null,
                total_tot_active_members: {
                    $sum: "$tot_active_members"
                },
                total_newly_active: {
                    $sum: "$newly_active"
                },
                total_consistently_active: {
                    $sum: "$consistently_active"
                },
                total_vital_members: {
                    $sum: "$vital_members"
                },
                total_became_disengaged: {
                    $sum: "$became_disengaged"
                }

            }
        },
        // Stage 5: Sort documents by date
        // {
        //     $sort: { date: 1 }
        // },
    ]);

    console.log(heatmaps)

    //     let msgPercentageChange = 0;
    //     let emojiPercentageChange = 0;

    //     if (heatmaps[0] && pastHeatmaps[0] && pastHeatmaps[0].messages !== 0) {
    //         msgPercentageChange = ((heatmaps[0].messages - pastHeatmaps[0].messages) / pastHeatmaps[0].messages) * 100;
    //     }

    //     if (heatmaps[0] && pastHeatmaps[0] && pastHeatmaps[0].emojis !== 0) {
    //         emojiPercentageChange = ((heatmaps[0].emojis - pastHeatmaps[0].emojis) / pastHeatmaps[0].emojis) * 100;
    //     }

    //     return {
    //         ...heatmaps[0],
    //         msgPercentageChange,
    //         emojiPercentageChange
    //     }

    // } catch (err) {
    //     console.log(err);
    //     return {
    //         categories: [],
    //         series: [],
    //         emojis: 0,
    //         messages: 0,
    //         msgPercentageChange: 0,
    //         emojiPercentageChange: 0

    //     }
    // }

}


export default {
    activeMembersLineGraph,
}

