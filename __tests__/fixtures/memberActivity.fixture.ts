import { Connection } from 'mongoose';

export const memberActivity1 = {
  date: new Date('2023-04-07'),
  all_active: [],
  all_new_active: ['123456789', '987654321', '555555555'],
  all_consistent: [],
  all_vital: [],
  all_new_disengaged: ['123456789'],
  all_disengaged: [],
  all_unpaused: [],
  all_returned: ['123456789'],
  all_still_active: [],
  all_dropped: ['123456789', '987654321', '555555555'],
  all_joined: ['123456789'],
  all_joined_day: ['123456789'],
  all_disengaged_were_newly_active: ['123456789', '987654321', '555555555'],
  all_disengaged_were_consistently_active: ['123456789'],
  all_disengaged_were_vital: [],
};

export const memberActivity2 = {
  date: new Date('2023-03-31'),
  all_active: [],
  all_new_active: ['123456789'],
  all_consistent: [],
  all_vital: ['123456789'],
  all_new_disengaged: ['123456789'],
  all_disengaged: [],
  all_unpaused: [],
  all_returned: [],
  all_still_active: ['123456789'],
  all_dropped: [],
  all_joined: ['123456789', '987654321'],
  all_joined_day: ['123456789', '987654321'],
  all_disengaged_were_newly_active: ['123456789'],
  all_disengaged_were_consistently_active: [],
  all_disengaged_were_vital: ['123456789', '987654321', '555555555', '444444444'],
};

export const memberActivity3 = {
  date: new Date('2022-06-01'),
  all_active: [],
  all_new_active: ['123456789'],
  all_consistent: [],
  all_vital: ['123456789'],
  all_new_disengaged: ['123456789'],
  all_disengaged: [],
  all_unpaused: [],
  all_returned: ['123456789', '987654321'],
  all_still_active: [],
  all_dropped: [],
  all_joined: [],
  all_joined_day: [],
  all_disengaged_were_newly_active: ['123456789'],
  all_disengaged_were_consistently_active: [],
  all_disengaged_were_vital: ['123456789', '987654321', '555555555', '444444444'],
};

export const memberActivity4 = {
  date: new Date('2023-04-01'),
  all_active: [],
  all_new_active: ['123456789'],
  all_consistent: [],
  all_vital: ['123456789'],
  all_new_disengaged: ['123456789'],
  all_disengaged: [],
  all_unpaused: [],
  all_returned: ['123456789', '123456789'],
  all_still_active: ['123456789'],
  all_dropped: [],
  all_joined: ['123456789'],
  all_joined_day: ['123456789'],
  all_disengaged_were_newly_active: ['123456789'],
  all_disengaged_were_consistently_active: [],
  all_disengaged_were_vital: ['123456789'],
};

export const insertMemberActivities = async function <Type>(memberActivities: Array<Type>, connection: Connection) {
  for (const memberActivity of memberActivities) {
    await connection.models.MemberActivity.create(memberActivity);
  }
};
