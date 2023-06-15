import { Connection } from 'mongoose';

export const memberActivityOne = {
    date: new Date("2023-04-07"),
    all_active: ["123456789",],
    all_new_active: ["123456789", "987654321"],
    all_consistent: [],
    all_vital: [],
    all_new_disengaged: ["123456789"],
    all_disengaged: [],
    all_unpaused: [],
    all_returned: ["123456789"],
    all_still_active: ["123456789"],
    all_dropped: ["123456789", "987654321", "555555555"],
    all_joined: ["123456789"],
    all_disengaged_were_newly_active: ["123456789", "987654321", "555555555"],
    all_disengaged_were_consistenly_active: ["123456789"],
    all_disengaged_were_vital: ["123456789"],
}

export const memberActivityTwo = {
    date: new Date("2023-03-31"),
    all_active: [],
    all_new_active: ["123456789",],
    all_consistent: [],
    all_vital: ["123456789"],
    all_new_disengaged: ["123456789"],
    all_disengaged: [],
    all_unpaused: [],
    all_returned: [],
    all_still_active: ["123456789"],
    all_dropped: [],
    all_joined: ["123456789", "987654321"],
    all_disengaged_were_newly_active: ["123456789"],
    all_disengaged_were_consistenly_active: [],
    all_disengaged_were_vital: ["123456789", "987654321", "555555555", "444444444"],
}


export const memberActivityThree = {
    date: new Date("2022-06-01"),
    all_active: [],
    all_new_active: ["123456789",],
    all_consistent: [],
    all_vital: ["123456789"],
    all_new_disengaged: ["123456789"],
    all_disengaged: [],
    all_unpaused: [],
    all_returned: ["123456789", "987654321"],
    all_still_active: [],
    all_dropped: [],
    all_joined: [],
    all_disengaged_were_newly_active: ["123456789"],
    all_disengaged_were_consistenly_active: [],
    all_disengaged_were_vital: ["123456789", "987654321", "555555555", "444444444"],
}

export const memberActivityFour = {
    date: new Date("2023-04-01"),
    all_active: [],
    all_new_active: ["123456789",],
    all_consistent: [],
    all_vital: ["123456789"],
    all_new_disengaged: ["123456789"],
    all_disengaged: [],
    all_unpaused: [],
    all_returned: ["123456789", "123456789"],
    all_still_active: ["123456789"],
    all_dropped: [],
    all_joined: ["123456789",],
    all_disengaged_were_newly_active: ["123456789"],
    all_disengaged_were_consistenly_active: [],
    all_disengaged_were_vital: ["123456789"],
}

export const insertMemberActivities = async function <Type>(memberActivities: Array<Type>, connection: Connection) {
    await connection.models.MemberActivity.insertMany(memberActivities.map((memberActivity) => (memberActivity)));
};
