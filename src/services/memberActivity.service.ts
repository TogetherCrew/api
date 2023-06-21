import { Connection } from 'mongoose';
import { date, math } from '../utils';
import { IGuildMember } from 'tc_dbcomm';

/**
 * active members composition line graph 
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

            // Stage 2: Filter documents based on date
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

        const adjustedDate = date.calculateAdjustedDate(endDate, membersActivities[0].categories[membersActivities[0].categories.length - 1]);
        const AdjustedMemberActivity = await connection.models.MemberActivity.aggregate([
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
                        $gte: new Date(adjustedDate),
                        $lt: new Date(new Date(adjustedDate).getTime() + 24 * 60 * 60 * 1000) // add one day in milliseconds
                    }
                }
            },


            // Stage 3: Calculate statistics and concatenate day - month field
            {
                $project: {
                    totActiveMembers: { $size: "$all_active" },
                    newlyActive: { $size: "$all_new_active" },
                    consistentlyActive: { $size: "$all_consistent" },
                    vitalMembers: { $size: "$all_vital" },
                    becameDisengaged: { $size: "$all_new_disengaged" },
                }
            },
        ]);



        if (AdjustedMemberActivity.length === 0) {
            return {
                ...membersActivities[0],
                totActiveMembersPercentageChange: "N/A",
                newlyActivePercentageChange: "N/A",
                consistentlyActivePercentageChange: "N/A",
                vitalMembersPercentageChange: "N/A",
                becameDisengagedPercentageChange: "N/A",
            }
        }


        return {
            ...membersActivities[0],
            totActiveMembersPercentageChange: math.calculatePercentageChange(AdjustedMemberActivity[0].totActiveMembers, membersActivities[0].totActiveMembers),
            newlyActivePercentageChange: math.calculatePercentageChange(AdjustedMemberActivity[0].newlyActive, membersActivities[0].newlyActive),
            consistentlyActivePercentageChange: math.calculatePercentageChange(AdjustedMemberActivity[0].consistentlyActive, membersActivities[0].consistentlyActive),
            vitalMembersPercentageChange: math.calculatePercentageChange(AdjustedMemberActivity[0].vitalMembers, membersActivities[0].vitalMembers),
            becameDisengagedPercentageChange: math.calculatePercentageChange(AdjustedMemberActivity[0].becameDisengaged, membersActivities[0].becameDisengaged),
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
 * active members onboarding line graph 
 * @param {Connection} connection
 * @param {Date} startDate
 * @param {Date} endDate
 * @returns {Object}
 */
async function activeMembersOnboardingLineGraph(connection: Connection, startDate: Date, endDate: Date) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    try {
        const membersActivities = await connection.models.MemberActivity.aggregate([
            // Stage 1: Convert date from string to date type and extract needed data
            {
                $project: {
                    _id: 0,
                    date: { $convert: { input: "$date", to: "date" } },
                    all_joined: 1,
                    all_new_active: 1,
                    all_still_active: 1,
                    all_dropped: 1,
                }
            },

            // Stage 2: Filter documents based on date
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
                    joined: { $size: "$all_joined" },
                    newly_active: { $size: "$all_new_active" },
                    still_active: { $size: "$all_still_active" },
                    dropped: { $size: "$all_dropped" },
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
                    joined: { $push: "$joined" },
                    newlyActive: { $push: "$newly_active" },
                    stillActive: { $push: "$still_active" },
                    dropped: { $push: "$dropped" },

                    // Store last and second-to-last document values                    
                    lastJoined: { $last: "$joined" },
                    lastNewlyActive: { $last: "$newly_active" },
                    lastStillActive: { $last: "$still_active" },
                    lastDropped: { $last: "$dropped" },
                }
            },

            // Stage 7: Transform group data into final format for charting
            {
                $project: {
                    _id: 0,
                    categories: "$day_month",
                    series: [
                        { name: "joined", data: "$joined" },
                        { name: "newlyActive", data: "$newlyActive" },
                        { name: "stillActive", data: "$stillActive" },
                        { name: "dropped", data: "$dropped" },
                    ],
                    // Use the last document values
                    joined: "$lastJoined",
                    newlyActive: "$lastNewlyActive",
                    stillActive: "$lastStillActive",
                    dropped: "$lastDropped",
                }
            }
        ]);

        if (membersActivities.length === 0) {
            return {
                categories: [],
                series: [],
                joined: 0,
                newlyActive: 0,
                stillActive: 0,
                dropped: 0,
                joinedPercentageChange: 0,
                newlyActivePercentageChange: 0,
                stillActivePercentageChange: 0,
                droppedPercentageChange: 0,
            }
        }
        const adjustedDate = date.calculateAdjustedDate(endDate, membersActivities[0].categories[membersActivities[0].categories.length - 1]);
        const AdjustedMemberActivity = await connection.models.MemberActivity.aggregate([
            // Stage 1: Convert date from string to date type and extract needed data
            {
                $project: {
                    _id: 0,
                    date: { $convert: { input: "$date", to: "date" } },
                    all_joined: 1,
                    all_new_active: 1,
                    all_still_active: 1,
                    all_dropped: 1,
                }
            },

            // Stage 2: Filter documents based on date range
            {
                $match: {
                    date: {
                        $gte: new Date(adjustedDate),
                        $lt: new Date(new Date(adjustedDate).getTime() + 24 * 60 * 60 * 1000) // add one day in milliseconds
                    }
                }
            },


            // Stage 3: Calculate statistics and concatenate day - month field
            {
                $project: {
                    joined: { $size: "$all_joined" },
                    newlyActive: { $size: "$all_new_active" },
                    stillActive: { $size: "$all_still_active" },
                    dropped: { $size: "$all_dropped" },
                }
            },
        ]);

        if (AdjustedMemberActivity.length === 0) {
            return {
                ...membersActivities[0],
                joinedPercentageChange: "N/A",
                newlyActivePercentageChange: "N/A",
                stillActivePercentageChange: "N/A",
                droppedPercentageChange: "N/A",
            }
        }


        return {
            ...membersActivities[0],
            joinedPercentageChange: math.calculatePercentageChange(AdjustedMemberActivity[0].joined, membersActivities[0].joined),
            newlyActivePercentageChange: math.calculatePercentageChange(AdjustedMemberActivity[0].newlyActive, membersActivities[0].newlyActive),
            stillActivePercentageChange: math.calculatePercentageChange(AdjustedMemberActivity[0].stillActive, membersActivities[0].stillActive),
            droppedPercentageChange: math.calculatePercentageChange(AdjustedMemberActivity[0].dropped, membersActivities[0].dropped),
        }

    } catch (err) {
        console.log(err);
        return {
            categories: [],
            series: [],
            joined: 0,
            newlyActive: 0,
            stillActive: 0,
            dropped: 0,
            joinedPercentageChange: 0,
            newlyActivePercentageChange: 0,
            stillActivePercentageChange: 0,
            droppedPercentageChange: 0
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

        const adjustedDate = date.calculateAdjustedDate(endDate, membersActivities[0].categories[membersActivities[0].categories.length - 1]);
        const AdjustedMemberActivity = await connection.models.MemberActivity.aggregate([
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

            // Stage 2: Filter documents based on date
            {
                $match: {
                    date: {
                        $gte: new Date(adjustedDate),
                        $lt: new Date(new Date(adjustedDate).getTime() + 24 * 60 * 60 * 1000) // add one day in milliseconds
                    }
                }
            },


            // Stage 3: Calculate statistics and concatenate day - month field
            {
                $project: {
                    becameDisengaged: { $size: "$all_new_disengaged" },
                    wereNewlyActive: { $size: "$all_disengaged_were_newly_active" },
                    wereConsistentlyActive: { $size: "$all_disengaged_were_consistenly_active" },
                    wereVitalMembers: { $size: "$all_disengaged_were_vital" },
                }
            },
        ]);

        if (AdjustedMemberActivity.length === 0) {
            return {
                ...membersActivities[0],
                becameDisengagedPercentageChange: "N/A",
                wereNewlyActivePercentageChange: "N/A",
                wereConsistentlyActivePercentageChange: "N/A",
                wereVitalMembersPercentageChange: "N/A",
            }
        }


        return {
            ...membersActivities[0],
            becameDisengagedPercentageChange: math.calculatePercentageChange(AdjustedMemberActivity[0].becameDisengaged, membersActivities[0].becameDisengaged),
            wereNewlyActivePercentageChange: math.calculatePercentageChange(AdjustedMemberActivity[0].wereNewlyActive, membersActivities[0].wereNewlyActive),
            wereConsistentlyActivePercentageChange: math.calculatePercentageChange(AdjustedMemberActivity[0].wereConsistentlyActive, membersActivities[0].wereConsistentlyActive),
            wereVitalMembersPercentageChange: math.calculatePercentageChange(AdjustedMemberActivity[0].wereVitalMembers, membersActivities[0].wereVitalMembers),
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
                    returned: { $size: "$all_returned" },
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
                    returned: "$lastReturned"
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

        const adjustedDate = date.calculateAdjustedDate(endDate, membersActivities[0].categories[membersActivities[0].categories.length - 1]);
        const AdjustedMemberActivity = await connection.models.MemberActivity.aggregate([
            // Stage 1: Convert date from string to date type and extract needed data
            {
                $project: {
                    _id: 0,
                    date: { $convert: { input: "$date", to: "date" } },
                    all_returned: 1,

                }
            },

            // Stage 2: Filter documents based on date
            {
                $match: {
                    date: {
                        $gte: new Date(adjustedDate),
                        $lt: new Date(new Date(adjustedDate).getTime() + 24 * 60 * 60 * 1000) // add one day in milliseconds
                    }
                }
            },


            // Stage 3: Calculate statistics and concatenate day - month field
            {
                $project: {
                    returned: { $size: "$all_returned" },

                }
            },
        ]);

        if (AdjustedMemberActivity.length === 0) {
            return {
                ...membersActivities[0],
                returnedPercentageChange: "N/A"
            }
        }


        return {
            ...membersActivities[0],
            returnedPercentageChange: math.calculatePercentageChange(AdjustedMemberActivity[0].returned, membersActivities[0].returned)
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

/**
 * Constructs a projection stage object for MongoDB aggregation pipeline based on the provided activity composition fields.
 * 
 * @param {Array<string>} fields - The activity composition fields to include in the projection. Each field corresponds to a property in the database documents.
 * @returns {Stage} The projection stage object. It includes a '_id' field set to '0', an 'all' field with an empty '$setUnion', and additional fields based on the 'fields' parameter. Each additional field is prefixed with a '$'.
 */
function buildProjectStageBasedOnActivityComposition(fields: Array<string>) {
    const initialStage: {
        _id: string;
        all: { $setUnion: Array<string> };
        [key: string]: string | { $setUnion: Array<string> }
    } = {
        _id: "0",
        all: { $setUnion: [] }
    };

    const finalStage = fields.reduce((stage, field) => {
        stage[field] = `$${field}`;
        stage.all.$setUnion.push(`$${field}`);
        return stage;
    }, initialStage);

    return finalStage;
}

/**
 * get last member activity document for usage of active member compostion table 
 * @param {Connection} connection
 * @param {Any} activityComposition
 * @returns {Object}
 */
async function getLastDocumentForActiveMembersCompositionTable(connection: Connection, activityComposition: Array<string>) {
    const fields = (activityComposition === undefined || activityComposition.length === 0 || activityComposition.includes('others')) ? ["all_active", "all_new_active", "all_consistent", "all_vital", "all_new_disengaged"] : activityComposition;
    const projectStage = buildProjectStageBasedOnActivityComposition(fields);
    const lastDocument = await connection.models.MemberActivity.aggregate([
        { $sort: { date: -1 } },
        { $limit: 1 },
        { $project: projectStage }
    ]);
    return lastDocument[0]

}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getActivityComposition(guildMember: IGuildMember, memberActivity: any) {
    const activityCompositions = [];
    if (memberActivity.all_new_active && memberActivity.all_new_active.includes(guildMember.discordId)) {
        activityCompositions.push("newlyActive");
    }

    if (memberActivity.all_new_disengaged && memberActivity.all_new_disengaged.includes(guildMember.discordId)) {
        activityCompositions.push("becameDisengaged");
    }

    if (memberActivity.all_active && memberActivity.all_active.includes(guildMember.discordId)) {
        activityCompositions.push("totActiveMembers");
    }

    if (memberActivity.all_consistent && memberActivity.all_consistent.includes(guildMember.discordId)) {
        activityCompositions.push("consistentlyActive");
    }

    if (memberActivity.all_vital && memberActivity.all_vital.includes(guildMember.discordId)) {
        activityCompositions.push("vitalMembers");
    }

    return activityCompositions;
}


export default {
    activeMembersCompositionLineGraph,
    disengagedMembersCompositionLineGraph,
    inactiveMembersLineGraph,
    activeMembersOnboardingLineGraph,
    getLastDocumentForActiveMembersCompositionTable,
    getActivityComposition
}

