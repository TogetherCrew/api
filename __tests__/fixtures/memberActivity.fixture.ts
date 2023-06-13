import { Connection } from 'mongoose';

export const memberActivityOne = {
    date: new Date("2023-04-07"),
    all_active: ["A",],
    all_new_active: ["A", "B"],
    all_consistent: [],
    all_vital: [],
    all_new_disengaged: ["A"],
    all_disengaged: [],
    all_unpaused: [],
    all_returned: ["A"],
    all_still_active: ["A"],
    all_dropped: ["A", "B", "C"],
    all_joined: ["A"],
    all_disengaged_were_newly_active: ["A", "B", "C"],
    all_disengaged_were_consistenly_active: ["A"],
    all_disengaged_were_vital: ["A"],
}

export const memberActivityTwo = {
    date: new Date("2023-03-31"),
    all_active: [],
    all_new_active: ["A",],
    all_consistent: [],
    all_vital: ["A"],
    all_new_disengaged: ["A"],
    all_disengaged: [],
    all_unpaused: [],
    all_returned: [],
    all_still_active: ["A"],
    all_dropped: [],
    all_joined: ["A", "B"],
    all_disengaged_were_newly_active: ["A"],
    all_disengaged_were_consistenly_active: [],
    all_disengaged_were_vital: ["A", "B", "C", "D"],
}


export const memberActivityThree = {
    date: new Date("2022-06-01"),
    all_active: [],
    all_new_active: ["A",],
    all_consistent: [],
    all_vital: ["A"],
    all_new_disengaged: ["A"],
    all_disengaged: [],
    all_unpaused: [],
    all_returned: ["A", "B"],
    all_still_active: [],
    all_dropped: [],
    all_joined: [],
    all_disengaged_were_newly_active: ["A"],
    all_disengaged_were_consistenly_active: [],
    all_disengaged_were_vital: ["A", "B", "C", "D"],
}

export const insertMemberActivities = async function <Type>(memberActivities: Array<Type>, connection: Connection) {
    await connection.models.MemberActivity.insertMany(memberActivities.map((memberActivity) => (memberActivity)));
};
