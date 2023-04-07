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
        const memeberActivities = await connection.models.MemberActivity.aggregate([
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

            // Stage 5: Sort documents by date
            {
                $sort: { date: 1 }
            },

            // Stage 6: Group all documents and compute summary statistics
            {
                $group: {
                    _id: null,
                    day_month: { $push: "$day_month" },
                    totActiveMembers: { $push: "$tot_active_members" },
                    newlyActive: { $push: "$newly_active" },
                    consistentlyActive: { $push: "$consistently_active" },
                    vitalMembers: { $push: "$vital_members" },
                    becameDisengaged: { $push: "$became_disengaged" },

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
                    totActiveMembers: {
                        $reduce: {
                            input: "$totActiveMembers",
                            initialValue: 0,
                            in: { $sum: ["$$value", "$$this"] }
                        }
                    },
                    newlyActive: {
                        $reduce: {
                            input: "$newlyActive",
                            initialValue: 0,
                            in: { $sum: ["$$value", "$$this"] }
                        }
                    },
                    consistentlyActive: {
                        $reduce: {
                            input: "$consistentlyActive",
                            initialValue: 0,
                            in: { $sum: ["$$value", "$$this"] }
                        }
                    },
                    vitalMembers: {
                        $reduce: {
                            input: "$vitalMembers",
                            initialValue: 0,
                            in: { $sum: ["$$value", "$$this"] }
                        }
                    },
                    becameDisengaged: {
                        $reduce: {
                            input: "$becameDisengaged",
                            initialValue: 0,
                            in: { $sum: ["$$value", "$$this"] }
                        }
                    }
                }
            }
        ]);


        if (memeberActivities.length === 0) {
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
        const diffInMs = Math.abs(end.getTime() - start.getTime());
        const diffInDays = Math.ceil(diffInMs / (1000 * 60 * 60 * 24));
        const numDaysToSubtract = diffInDays;


        const pastMemeberActivities = await connection.models.MemberActivity.aggregate([
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
                        $gte: new Date(start.setDate(start.getDate() - numDaysToSubtract)),
                        $lte: new Date(end.setDate(end.getDate() - (numDaysToSubtract + 1)))
                    }
                }
            },


            // Stage 3: Calculate statistics
            {
                $project: {
                    date: 1,
                    tot_active_members: { $size: "$all_active" },
                    newly_active: { $size: "$all_new_active" },
                    consistently_active: { $size: "$all_consistent" },
                    vital_members: { $size: "$all_vital" },
                    became_disengaged: { $size: "$all_new_disengaged" },
                }
            },

            // Stage 4: Group all documents and compute summary statistics
            {
                $group: {
                    _id: null,
                    totActiveMembers: { $push: "$tot_active_members" },
                    newlyActive: { $push: "$newly_active" },
                    consistentlyActive: { $push: "$consistently_active" },
                    vitalMembers: { $push: "$vital_members" },
                    becameDisengaged: { $push: "$became_disengaged" },

                }
            },

            // Stage 5: Transform group data into final format for charting
            {
                $project: {
                    _id: 0,
                    date: 1,
                    totActiveMembers: {
                        $reduce: {
                            input: "$totActiveMembers",
                            initialValue: 0,
                            in: { $sum: ["$$value", "$$this"] }
                        }
                    },
                    newlyActive: {
                        $reduce: {
                            input: "$newlyActive",
                            initialValue: 0,
                            in: { $sum: ["$$value", "$$this"] }
                        }
                    },
                    consistentlyActive: {
                        $reduce: {
                            input: "$consistentlyActive",
                            initialValue: 0,
                            in: { $sum: ["$$value", "$$this"] }
                        }
                    },
                    vitalMembers: {
                        $reduce: {
                            input: "$vitalMembers",
                            initialValue: 0,
                            in: { $sum: ["$$value", "$$this"] }
                        }
                    },
                    becameDisengaged: {
                        $reduce: {
                            input: "$becameDisengaged",
                            initialValue: 0,
                            in: { $sum: ["$$value", "$$this"] }
                        }
                    }
                }
            }

        ]);

        let totActiveMembersPercentageChange = 0;
        let newlyActivePercentageChange = 0;
        let consistentlyActivePercentageChange = 0;
        let vitalMembersPercentageChange = 0;
        let becameDisengagedPercentageChange = 0;


        if (memeberActivities[0] && pastMemeberActivities[0] && pastMemeberActivities[0].totActiveMembers !== 0) {
            totActiveMembersPercentageChange = ((memeberActivities[0].totActiveMembers - pastMemeberActivities[0].totActiveMembers) / pastMemeberActivities[0].totActiveMembers) * 100;
        }
        if (memeberActivities[0] && pastMemeberActivities[0] && pastMemeberActivities[0].newlyActive !== 0) {
            newlyActivePercentageChange = ((memeberActivities[0].newlyActive - pastMemeberActivities[0].newlyActive) / pastMemeberActivities[0].newlyActive) * 100;
        }
        if (memeberActivities[0] && pastMemeberActivities[0] && pastMemeberActivities[0].consistentlyActive !== 0) {
            consistentlyActivePercentageChange = ((memeberActivities[0].consistentlyActive - pastMemeberActivities[0].consistentlyActive) / pastMemeberActivities[0].consistentlyActive) * 100;
        }
        if (memeberActivities[0] && pastMemeberActivities[0] && pastMemeberActivities[0].vitalMembers !== 0) {
            vitalMembersPercentageChange = ((memeberActivities[0].vitalMembers - pastMemeberActivities[0].vitalMembers) / pastMemeberActivities[0].vitalMembers) * 100;
        }
        if (memeberActivities[0] && pastMemeberActivities[0] && pastMemeberActivities[0].becameDisengaged !== 0) {
            becameDisengagedPercentageChange = ((memeberActivities[0].becameDisengaged - pastMemeberActivities[0].becameDisengaged) / pastMemeberActivities[0].becameDisengaged) * 100;
        }

        return {
            ...memeberActivities[0],
            totActiveMembersPercentageChange,
            newlyActivePercentageChange,
            consistentlyActivePercentageChange,
            vitalMembersPercentageChange,
            becameDisengagedPercentageChange
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
        const disengagedActivities = await connection.models.MemberActivity.aggregate([
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

            // Stage 5: Sort documents by date
            {
                $sort: { date: 1 }
            },

            // Stage 6: Group all documents and compute summary statistics
            {
                $group: {
                    _id: null,
                    day_month: { $push: "$day_month" },
                    becameDisengaged: { $push: "$became_disengaged" },
                    wereNewlyActive: { $push: "$were_newly_active" },
                    wereConsistentlyActive: { $push: "$were_consistently_active" },
                    wereVitalMembers: { $push: "$were_vital_members" },
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
                    becameDisengaged: {
                        $reduce: {
                            input: "$becameDisengaged",
                            initialValue: 0,
                            in: { $sum: ["$$value", "$$this"] }
                        }
                    },
                    wereNewlyActive: {
                        $reduce: {
                            input: "$wereNewlyActive",
                            initialValue: 0,
                            in: { $sum: ["$$value", "$$this"] }
                        }
                    },
                    wereConsistentlyActive: {
                        $reduce: {
                            input: "$wereConsistentlyActive",
                            initialValue: 0,
                            in: { $sum: ["$$value", "$$this"] }
                        }
                    },
                    wereVitalMembers: {
                        $reduce: {
                            input: "$wereVitalMembers",
                            initialValue: 0,
                            in: { $sum: ["$$value", "$$this"] }
                        }
                    },
                }
            }
        ]);


        if (disengagedActivities.length === 0) {
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

        const diffInMs = Math.abs(end.getTime() - start.getTime());
        const diffInDays = Math.ceil(diffInMs / (1000 * 60 * 60 * 24));
        const numDaysToSubtract = diffInDays;


        const pastDisengagedActivities = await connection.models.MemberActivity.aggregate([
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
                        $gte: new Date(start.setDate(start.getDate() - numDaysToSubtract)),
                        $lte: new Date(end.setDate(end.getDate() - (numDaysToSubtract + 1)))
                    }
                }
            },


            // Stage 3: Calculate statistics
            {
                $project: {
                    date: 1,
                    became_disengaged: { $size: "$all_new_disengaged" },
                    were_newly_active: { $size: "$all_disengaged_were_newly_active" },
                    were_consistently_active: { $size: "$all_disengaged_were_consistenly_active" },
                    were_vital_members: { $size: "$all_disengaged_were_vital" },
                }
            },

            // Stage 4: Group all documents and compute summary statistics
            {
                $group: {
                    _id: null,
                    becameDisengaged: { $push: "$became_disengaged" },
                    wereNewlyActive: { $push: "$were_newly_active" },
                    wereConsistentlyActive: { $push: "$were_consistently_active" },
                    wereVitalMembers: { $push: "$were_vital_members" },

                }
            },

            // Stage 5: Transform group data into final format for charting
            {
                $project: {
                    _id: 0,
                    date: 1,
                    becameDisengaged: {
                        $reduce: {
                            input: "$becameDisengaged",
                            initialValue: 0,
                            in: { $sum: ["$$value", "$$this"] }
                        }
                    },
                    wereNewlyActive: {
                        $reduce: {
                            input: "$wereNewlyActive",
                            initialValue: 0,
                            in: { $sum: ["$$value", "$$this"] }
                        }
                    },
                    wereConsistentlyActive: {
                        $reduce: {
                            input: "$wereConsistentlyActive",
                            initialValue: 0,
                            in: { $sum: ["$$value", "$$this"] }
                        }
                    },
                    wereVitalMembers: {
                        $reduce: {
                            input: "$wereVitalMembers",
                            initialValue: 0,
                            in: { $sum: ["$$value", "$$this"] }
                        }
                    },
                }
            }

        ]);

        let becameDisengagedPercentageChange = 0;
        let wereNewlyActivePercentageChange = 0;
        let wereConsistentlyActivePercentageChange = 0;
        let wereVitalMembersPercentageChange = 0;

        if (disengagedActivities[0] && pastDisengagedActivities[0] && pastDisengagedActivities[0].becameDisengaged !== 0) {
            becameDisengagedPercentageChange = ((disengagedActivities[0].becameDisengaged - pastDisengagedActivities[0].becameDisengaged) / pastDisengagedActivities[0].becameDisengaged) * 100;
        }
        if (disengagedActivities[0] && pastDisengagedActivities[0] && pastDisengagedActivities[0].wereNewlyActive !== 0) {
            wereNewlyActivePercentageChange = ((disengagedActivities[0].wereNewlyActive - pastDisengagedActivities[0].wereNewlyActive) / pastDisengagedActivities[0].wereNewlyActive) * 100;
        }
        if (disengagedActivities[0] && pastDisengagedActivities[0] && pastDisengagedActivities[0].wereConsistentlyActive !== 0) {
            wereConsistentlyActivePercentageChange = ((disengagedActivities[0].wereConsistentlyActive - pastDisengagedActivities[0].wereConsistentlyActive) / pastDisengagedActivities[0].wereConsistentlyActive) * 100;
        }
        if (disengagedActivities[0] && pastDisengagedActivities[0] && pastDisengagedActivities[0].wereVitalMembers !== 0) {
            wereVitalMembersPercentageChange = ((disengagedActivities[0].wereVitalMembers - pastDisengagedActivities[0].wereVitalMembers) / pastDisengagedActivities[0].wereVitalMembers) * 100;
        }

        return {
            ...disengagedActivities[0],
            becameDisengagedPercentageChange,
            wereNewlyActivePercentageChange,
            wereConsistentlyActivePercentageChange,
            wereVitalMembersPercentageChange,
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


export default {
    activeMembersCompositionLineGraph,
    disengagedMembersCompositionLineGraph
}

