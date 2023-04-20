import { Connection } from 'mongoose';

/**
 * active members line graph 
 * @param {Connection} connection
 * @param {Date} startDate
 * @param {Date} endDate
 * @returns {Object}
 */
async function activeMembersCompositionLineGraph(connection: Connection, startDate: Date, endDate: Date) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    try {
        const membersActivities = await connection.models.MemberActivity.aggregate([
            // Stage 1: Convert date from string to date type and extract needed data
            {
                $project: {
                    _id: 0,
                    date: { $convert: { input: "$date", to: "date" } },
                    all_active: 1,
                    all_new_active: 1,
                    all_consistent: 1,
                    all_vital: 1,
                    all_new_disengaged: 1
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

            // Stage 4: Calculate statistics and concatenate day - month field
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
                    tot_active_members: { $size: "$all_active" },
                    newly_active: { $size: "$all_new_active" },
                    consistently_active: { $size: "$all_consistent" },
                    vital_members: { $size: "$all_vital" },
                    became_disengaged: { $size: "$all_new_disengaged" },
                }
            },

            // Stage 5: Sort documents by day_month
            {
                $sort: { day_month: 1 }
            },

            // Stage 6: Group all documents and keep the arrays
            {
                $group: {
                    _id: null,
                    day_month: { $push: "$day_month" },
                    totActiveMembers: { $push: "$tot_active_members" },
                    newlyActive: { $push: "$newly_active" },
                    consistentlyActive: { $push: "$consistently_active" },
                    vitalMembers: { $push: "$vital_members" },
                    becameDisengaged: { $push: "$became_disengaged" },

                    // Store last and second-to-last document values                    
                    lastTotActiveMembers: { $last: "$tot_active_members" },
                    lastNewlyActive: { $last: "$newly_active" },
                    lastConsistentlyActive: { $last: "$consistently_active" },
                    lastVitalMembers: { $last: "$vital_members" },
                    lastBecameDisengaged: { $last: "$became_disengaged" },
                }
            },

            // Stage 7: Transform group data into final format for charting
            {
                $project: {
                    _id: 0,
                    categories: "$day_month",
                    series: [
                        { name: "totActiveMembers", data: "$totActiveMembers" },
                        { name: "newlyActive", data: "$newlyActive" },
                        { name: "consistentlyActive", data: "$consistentlyActive" },
                        { name: "vitalMembers", data: "$vitalMembers" },
                        { name: "becameDisengaged", data: "$becameDisengaged" }
                    ],
                    // Use the last document values
                    totActiveMembers: "$lastTotActiveMembers",
                    newlyActive: "$lastNewlyActive",
                    consistentlyActive: "$lastConsistentlyActive",
                    vitalMembers: "$lastVitalMembers",
                    becameDisengaged: "$lastBecameDisengaged",
                    totActiveMembersPercentageChange: {
                        $cond: [
                            { $eq: [{ $arrayElemAt: ["$totActiveMembers", -2] }, 0] }, 0,
                            {
                                $multiply: [
                                    {
                                        $divide: [
                                            { $subtract: ["$lastTotActiveMembers", { $arrayElemAt: ["$totActiveMembers", -2] }] },
                                            { $arrayElemAt: ["$totActiveMembers", -2] }
                                        ]
                                    }, 100]
                            }
                        ]
                    },
                    newlyActivePercentageChange: {
                        $cond: [
                            { $eq: [{ $arrayElemAt: ["$newlyActive", -2] }, 0] }, 0,
                            {
                                $multiply: [
                                    {
                                        $divide: [
                                            { $subtract: ["$lastNewlyActive", { $arrayElemAt: ["$newlyActive", -2] }] },
                                            { $arrayElemAt: ["$newlyActive", -2] }]
                                    }, 100]
                            }
                        ]
                    },
                    consistentlyActivePercentageChange: {
                        $cond: [
                            { $eq: [{ $arrayElemAt: ["$consistentlyActive", -2] }, 0] }, 0,
                            {
                                $multiply: [
                                    {
                                        $divide: [
                                            { $subtract: ["$lastConsistentlyActive", { $arrayElemAt: ["$consistentlyActive", -2] }] },
                                            { $arrayElemAt: ["$consistentlyActive", -2] }]
                                    }, 100]
                            }
                        ]
                    },
                    vitalMembersPercentageChange: {
                        $cond: [
                            { $eq: [{ $arrayElemAt: ["$vitalMembers", -2] }, 0] }, 0,
                            {
                                $multiply: [
                                    {
                                        $divide: [
                                            { $subtract: ["$lastVitalMembers", { $arrayElemAt: ["$vitalMembers", -2] }] },
                                            { $arrayElemAt: ["$vitalMembers", -2] }]
                                    }, 100]
                            }
                        ]
                    },
                    becameDisengagedPercentageChange: {
                        $cond: [
                            { $eq: [{ $arrayElemAt: ["$becameDisengaged", -2] }, 0] }, 0,
                            {
                                $multiply: [
                                    {
                                        $divide: [
                                            { $subtract: ["$lastBecameDisengaged", { $arrayElemAt: ["$becameDisengaged", -2] }] },
                                            { $arrayElemAt: ["$becameDisengaged", -2] }]
                                    }, 100]
                            }
                        ]
                    },
                }
            }
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

            }
        }

        return {
            ...membersActivities[0]
        }

    } catch (err) {
        console.log(err);
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

        }
    }
}


/**
 * disengaged members line graph 
 * @param {Connection} connection
 * @param {Date} startDate
 * @param {Date} endDate
 * @returns {Object}
 */
async function disengagedMembersCompositionLineGraph(connection: Connection, startDate: Date, endDate: Date) {
    const start = new Date(startDate);
    const end = new Date(endDate);


    try {
        const membersActivities = await connection.models.MemberActivity.aggregate([
            // Stage 1: Convert date from string to date type and extract needed data
            {
                $project: {
                    _id: 0,
                    date: { $convert: { input: "$date", to: "date" } },
                    all_new_disengaged: 1,
                    all_disengaged_were_newly_active: 1,
                    all_disengaged_were_consistenly_active: 1,
                    all_disengaged_were_vital: 1,
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

            // Stage 4: Calculate statistics and concatenate day - month field
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
                    became_disengaged: { $size: "$all_new_disengaged" },
                    were_newly_active: { $size: "$all_disengaged_were_newly_active" },
                    were_consistently_active: { $size: "$all_disengaged_were_consistenly_active" },
                    were_vital_members: { $size: "$all_disengaged_were_vital" },
                }
            },

            // Stage 5: Sort documents by day_month
            {
                $sort: { day_month: 1 }
            },

            // Stage 6: Group all documents and keep the arrays
            {
                $group: {
                    _id: null,
                    day_month: { $push: "$day_month" },
                    becameDisengaged: { $push: "$became_disengaged" },
                    wereNewlyActive: { $push: "$were_newly_active" },
                    wereConsistentlyActive: { $push: "$were_consistently_active" },
                    wereVitalMembers: { $push: "$were_vital_members" },

                    // Store last and second-to-last document values                    
                    lastBecameDisengaged: { $last: "$became_disengaged" },
                    lastWereNewlyActive: { $last: "$were_newly_active" },
                    lastWereConsistentlyActive: { $last: "$were_consistently_active" },
                    lastWereVitalMembers: { $last: "$were_vital_members" },
                }
            },

            // Stage 7: Transform group data into final format for charting
            {
                $project: {
                    _id: 0,
                    categories: "$day_month",
                    series: [
                        { name: "becameDisengaged", data: "$becameDisengaged" },
                        { name: "wereNewlyActive", data: "$wereNewlyActive" },
                        { name: "wereConsistentlyActive", data: "$wereConsistentlyActive" },
                        { name: "wereVitalMembers", data: "$wereVitalMembers" },
                    ],
                    // Use the last document values
                    becameDisengaged: "$lastBecameDisengaged",
                    wereNewlyActive: "$lastWereNewlyActive",
                    wereConsistentlyActive: "$lastWereConsistentlyActive",
                    wereVitalMembers: "$lastWereVitalMembers",
                    becameDisengagedPercentageChange: {
                        $cond: [
                            { $eq: [{ $arrayElemAt: ["$becameDisengaged", -2] }, 0] }, 0,
                            {
                                $multiply: [
                                    {
                                        $divide: [
                                            { $subtract: ["$lastBecameDisengaged", { $arrayElemAt: ["$becameDisengaged", -2] }] },
                                            { $arrayElemAt: ["$becameDisengaged", -2] }
                                        ]
                                    }, 100]
                            }
                        ]
                    },
                    wereNewlyActivePercentageChange: {
                        $cond: [
                            { $eq: [{ $arrayElemAt: ["$wereNewlyActive", -2] }, 0] }, 0,
                            {
                                $multiply: [
                                    {
                                        $divide: [
                                            { $subtract: ["$lastWereNewlyActive", { $arrayElemAt: ["$wereNewlyActive", -2] }] },
                                            { $arrayElemAt: ["$wereNewlyActive", -2] }]
                                    }, 100]
                            }
                        ]
                    },
                    wereConsistentlyActivePercentageChange: {
                        $cond: [
                            { $eq: [{ $arrayElemAt: ["$wereConsistentlyActive", -2] }, 0] }, 0,
                            {
                                $multiply: [
                                    {
                                        $divide: [
                                            { $subtract: ["$lastWereConsistentlyActive", { $arrayElemAt: ["$wereConsistentlyActive", -2] }] },
                                            { $arrayElemAt: ["$wereConsistentlyActive", -2] }]
                                    }, 100]
                            }
                        ]
                    },
                    wereVitalMembersPercentageChange: {
                        $cond: [
                            { $eq: [{ $arrayElemAt: ["$wereVitalMembers", -2] }, 0] }, 0,
                            {
                                $multiply: [
                                    {
                                        $divide: [
                                            { $subtract: ["$lastWereVitalMembers", { $arrayElemAt: ["$wereVitalMembers", -2] }] },
                                            { $arrayElemAt: ["$wereVitalMembers", -2] }]
                                    }, 100]
                            }
                        ]
                    }
                }
            }
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

            }
        }

        return {
            ...membersActivities[0]
        }
    } catch (err) {
        console.log(err);
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

        }
    }
}

/**
 * inactive members line graph 
 * @param {Connection} connection
 * @param {Date} startDate
 * @param {Date} endDate
 * @returns {Object}
 */
async function inactiveMembersLineGraph(connection: Connection, startDate: Date, endDate: Date) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    try {
        const membersActivities = await connection.models.MemberActivity.aggregate([
            // Stage 1: Convert date from string to date type and extract needed data
            {
                $project: {
                    _id: 0,
                    date: { $convert: { input: "$date", to: "date" } },
                    all_returned: 1,
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

            // Stage 4: Calculate statistics and concatenate day - month field
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
                    returned: { $size: "$all_returned" },
                }
            },

            // Stage 5: Sort documents by day_month
            {
                $sort: { day_month: 1 }
            },

            // Stage 6: Group all documents and keep the arrays
            {
                $group: {
                    _id: null,
                    day_month: { $push: "$day_month" },
                    returned: { $push: "$returned" },


                    // Store last and second-to-last document values                    
                    lastReturned: { $last: "$returned" }
                }
            },

            // Stage 7: Transform group data into final format for charting
            {
                $project: {
                    _id: 0,
                    categories: "$day_month",
                    series: [
                        { name: "returned", data: "$returned" }
                    ],
                    // Use the last document values
                    returned: "$lastReturned",
                    returnedPercentageChange: {
                        $cond: [
                            { $eq: [{ $arrayElemAt: ["$returned", -2] }, 0] }, 0,
                            {
                                $multiply: [
                                    {
                                        $divide: [
                                            { $subtract: ["$lastReturned", { $arrayElemAt: ["$returned", -2] }] },
                                            { $arrayElemAt: ["$returned", -2] }
                                        ]
                                    }, 100]
                            }
                        ]
                    }
                }
            }
        ]);




        if (membersActivities.length === 0) {
            return {
                categories: [],
                series: [],
                returned: 0,
                returnedPercentageChange: 0,
            }
        }

        return {
            ...membersActivities[0],
        }
    } catch (err) {
        console.log(err);
        return {
            categories: [],
            series: [],
            returned: 0,
            returnedPercentageChange: 0,
        }
    }
}

export default {
    activeMembersCompositionLineGraph,
    disengagedMembersCompositionLineGraph,
    inactiveMembersLineGraph
}

