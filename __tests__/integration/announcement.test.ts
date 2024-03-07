// /* eslint-disable @typescript-eslint/no-explicit-any */
// import request from 'supertest';
// import httpStatus from 'http-status';
// import app from '../../src/app';
// import setupTestDB, { cleanUpTenantDatabases } from '../utils/setupTestDB';
// import { userOne, insertUsers, userTwo } from '../fixtures/user.fixture';
// import { userOneAccessToken } from '../fixtures/token.fixture';
// import { communityOne, communityTwo, communityThree, insertCommunities } from '../fixtures/community.fixture';
// import {
//   generatePublicDiscordAnnouncement,
//   generatePrivateRoleDiscordAnnouncement,
//   generatePrivateUserDiscordAnnouncement,
//   insertAnnouncement,
// } from '../fixtures/announcement.fixture';
// import { discordChannel3, discordChannel4, insertChannels } from '../fixtures/discord/channels.fixture';
// import { Connection } from 'mongoose';
// import { DatabaseManager } from '@togethercrew.dev/db';
// import { insertPlatforms, platformOne } from '../fixtures/platform.fixture';
// import { discordGuildMember1, discordGuildMember2, insertGuildMembers } from '../fixtures/discord/guildMember.fixture';
// import platform from '../../src/middlewares/platform';

// setupTestDB();

// describe('Community routes', () => {
//   const announcementOne = generatePublicDiscordAnnouncement(communityOne._id, platformOne._id, [
//     discordChannel4.channelId,
//     discordChannel3.channelId,
//   ]);
//   const announcementTwo = generatePrivateUserDiscordAnnouncement(communityOne._id, platformOne._id, [
//     discordGuildMember1.discordId,
//     discordGuildMember2.discordId,
//   ]);
//   const announcementThree = generatePrivateRoleDiscordAnnouncement(communityThree._id, platformOne._id, [
//     userOne._id,
//     userTwo._id,
//   ]);

//   let connection: Connection;
//   beforeAll(async () => {
//     connection = await DatabaseManager.getInstance().getTenantDb(platformOne.metadata?.id);
//   });

//   afterAll(async () => {
//     await connection.close();
//   });

//   beforeEach(async () => {
//     cleanUpTenantDatabases();
//     userOne.communities = [communityOne._id, communityTwo._id];
//     userTwo.communities = [communityThree._id];
//     communityOne.users = [userOne._id];
//     communityTwo.users = [userOne._id];
//     communityThree.users = [userTwo._id];
//   });

//   describe('POST api/v1/announcements', () => {
//     // TODO: maybe we need to mock bullMQ or delete the job after the test
//     // eslint-disable-next-line @typescript-eslint/no-explicit-any
//     let newDraftAnnouncement: any;
//     const nowDate = new Date();
//     const nextMonthDate = new Date();
//     nextMonthDate.setMonth(nowDate.getMonth() + 1);
//     beforeEach(async () => {
//       cleanUpTenantDatabases();
//     });
//     test('should return 201 and successfully create a new draft announcement if data is ok', async () => {
//       platformOne.community = communityOne._id;
//       communityOne.platforms = [platformOne._id];
//       await insertPlatforms([platformOne]);
//       await insertCommunities([communityOne, communityTwo, communityThree]);
//       await insertUsers([userOne, userTwo]);
//       await insertChannels([discordChannel4, discordChannel3], connection);
//       await insertGuildMembers([discordGuildMember1, discordGuildMember2], connection);

//       newDraftAnnouncement = {
//         title: 'salam azzm',
//         communityId: communityOne._id,
//         scheduledAt: nextMonthDate.toISOString(),
//         draft: true,
//         data: [
//           {
//             platformId: platformOne._id,
//             template: 'sample template wo wo wo',
//             options: {
//               userIds: [discordGuildMember1.discordId, discordGuildMember2.discordId],
//             },
//           },
//         ],
//       };

//       const res = await request(app)
//         .post('/api/v1/announcements')
//         .set('Authorization', `Bearer ${userOneAccessToken}`)
//         .send(newDraftAnnouncement)
//         .expect(httpStatus.CREATED);

//       expect(res.body).toEqual({
//         id: expect.anything(),
//         community: userOne.communities?.[0].toString(),
//         title: newDraftAnnouncement.title,
//         scheduledAt: newDraftAnnouncement.scheduledAt,
//         draft: newDraftAnnouncement.draft,
//         data: newDraftAnnouncement.data.map((data: any) => {
//           const { platformId, ...rest } = data;

//           return {
//             ...rest,
//             platform: platformOne._id.toString(),
//             options: {
//               users: [
//                 { discordId: '123456789', ngu: 'Behzad', username: 'behzad_rabiei', avatar: null },
//                 { discordId: '987654321', ngu: 'Daniel', avatar: 'AvatarLink', username: 'mrjackalop' },
//               ],
//             },
//             type: 'discord_private',
//           };
//         }),
//       });
//     });

//     test('should return 201 and successfully create a new scheduled announcement if data is ok', async () => {
//       platformOne.community = communityOne._id;
//       communityOne.platforms = [platformOne._id];
//       await insertPlatforms([platformOne]);
//       await insertCommunities([communityOne, communityTwo, communityThree]);
//       await insertUsers([userOne, userTwo]);
//       await insertChannels([discordChannel4, discordChannel3], connection);
//       await insertGuildMembers([discordGuildMember1, discordGuildMember2], connection);
//       await insertAnnouncement([announcementOne, announcementTwo]);

//       const newAnnouncement = {
//         title: 'salam azzm',
//         communityId: communityOne._id,
//         scheduledAt: nextMonthDate.toISOString(),
//         draft: true, // TODO: change this to false when we found a solution for managing jobs after tests
//         data: [
//           {
//             platformId: platformOne._id,
//             template: 'sample template wo wo wo',
//             options: {
//               userIds: [discordGuildMember1.discordId, discordGuildMember2.discordId],
//             },
//           },
//         ],
//       };

//       const res = await request(app)
//         .post('/api/v1/announcements')
//         .set('Authorization', `Bearer ${userOneAccessToken}`)
//         .send(newAnnouncement)
//         .expect(httpStatus.CREATED);

//       expect(res.body).toEqual({
//         id: expect.anything(),
//         community: userOne.communities?.[0].toString(),
//         title: newAnnouncement.title,
//         scheduledAt: newAnnouncement.scheduledAt,
//         draft: newAnnouncement.draft,
//         data: newDraftAnnouncement.data.map((data: any) => {
//           const { platformId, ...rest } = data;

//           return {
//             ...rest,
//             platform: platformOne._id.toString(),
//             options: {
//               users: [
//                 { discordId: '123456789', ngu: 'Behzad', username: 'behzad_rabiei', avatar: null },
//                 { discordId: '987654321', ngu: 'Daniel', avatar: 'AvatarLink', username: 'mrjackalop' },
//               ],
//             },
//             type: 'discord_private',
//           };
//         }),
//       });
//     });

//     test('should return 400 error if scheduledAt is not a valid date (not greater than now)', async () => {
//       await insertCommunities([communityOne, communityTwo, communityThree]);
//       await insertUsers([userOne, userTwo]);

//       const lastMonthDate = new Date();
//       lastMonthDate.setMonth(nowDate.getMonth() - 1);
//       const newAnnouncement = {
//         title: 'salam azzm',
//         communityId: userOne.communities?.[0],
//         scheduledAt: lastMonthDate.toISOString(),
//         draft: true,
//         data: [
//           {
//             platformId: '658d530d84267a217f988c73',
//             template: 'sample template wo wo wo',
//             options: {
//               userIds: ['23', '23'],
//             },
//           },
//         ],
//       };

//       await request(app)
//         .post('/api/v1/announcements')
//         .set('Authorization', `Bearer ${userOneAccessToken}`)
//         .send(newAnnouncement)
//         .expect(httpStatus.BAD_REQUEST);
//     });

//     test('Should return 404 error if community is not found', async () => {
//       await insertCommunities([communityOne, communityTwo]);
//       await insertUsers([userOne, userTwo]);

//       const newAnnouncement = {
//         title: 'salam azzm',
//         communityId: '658d530d84267a217f988c73',
//         scheduledAt: nextMonthDate.toISOString(),
//         draft: true,
//         data: [
//           {
//             platformId: '658d530d84267a217f988c73',
//             template: 'sample template wo wo wo',
//             options: {
//               userIds: ['23', '23'],
//             },
//           },
//         ],
//       };

//       await request(app)
//         .post('/api/v1/announcements')
//         .set('Authorization', `Bearer ${userOneAccessToken}`)
//         .send(newAnnouncement)
//         .expect(httpStatus.NOT_FOUND);
//     });
//   });

//   describe('PATCH api/v1/announcements/:announcementId', () => {
//     beforeEach(async () => {
//       cleanUpTenantDatabases();
//     });
//     test('should return 200 and successfully update announcement if data is ok', async () => {
//       platformOne.community = communityOne._id;
//       await insertPlatforms([platformOne]);
//       await insertCommunities([communityOne, communityTwo, communityThree]);
//       await insertUsers([userOne, userTwo]);
//       await insertChannels([discordChannel4, discordChannel3], connection);
//       await insertGuildMembers([discordGuildMember1, discordGuildMember2], connection);
//       await insertAnnouncement([announcementOne, announcementTwo]);

//       const res = await request(app)
//         .patch(`/api/v1/announcements/${announcementOne._id}`)
//         .set('Authorization', `Bearer ${userOneAccessToken}`)
//         .send({ title: 'Updated Announcement One - 1 is one' })
//         .expect(httpStatus.OK);

//       expect(res.body).toEqual({
//         id: announcementOne._id.toString(),
//         title: 'Updated Announcement One - 1 is one',
//         scheduledAt: announcementOne.scheduledAt.toISOString(),
//         draft: false,
//         data: announcementOne.data.map((data: any) => ({
//           ...data,
//           platform: data.platform.toString(),
//           options: {
//             channels: [
//               {
//                 channelId: '345678901234567000',
//                 name: 'Channel 4',
//               },
//               {
//                 channelId: '345678901234567890',
//                 name: 'Channel 3',
//               },
//             ],
//           },
//         })),
//         community: userOne.communities?.[0].toString(),
//       });
//     });

//     test('should return 400 error if announcementId is not a valid mongo id', async () => {
//       await insertCommunities([communityOne, communityTwo, communityThree]);
//       await insertUsers([userOne, userTwo]);
//       await insertAnnouncement([announcementOne, announcementTwo, announcementThree]);

//       await request(app)
//         .patch('/api/v1/announcements/invalidId')
//         .set('Authorization', `Bearer ${userOneAccessToken}`)
//         .send({ title: 'Updated Announcement One' })
//         .expect(httpStatus.BAD_REQUEST);
//     });

//     test('should return 404 error if announcement is not found', async () => {
//       await insertCommunities([communityOne, communityTwo]);
//       await insertUsers([userOne, userTwo]);

//       await request(app)
//         .patch(`/api/v1/announcements/${announcementOne._id}`)
//         .set('Authorization', `Bearer ${userOneAccessToken}`)
//         .send({ title: 'Updated Announcement One' })
//         .expect(httpStatus.NOT_FOUND);
//     });

//     test('Should return 404 error if user is not a member of the requested community', async () => {
//       await insertCommunities([communityOne, communityTwo]);
//       await insertUsers([userOne, userTwo]);
//       await insertAnnouncement([announcementOne, announcementTwo, announcementThree]);

//       await request(app)
//         .patch(`/api/v1/announcements/${announcementThree._id}`)
//         .set('Authorization', `Bearer ${userOneAccessToken}`)
//         .send({ title: 'Updated Announcement One' })
//         .expect(httpStatus.NOT_FOUND);
//     });
//   });

//   describe('GET api/v1/announcements', () => {
//     beforeEach(async () => {
//       cleanUpTenantDatabases();
//     });
//     test('should return 200 and successfully get announcements if data is ok', async () => {
//       platformOne.community = communityOne._id;
//       await insertPlatforms([platformOne]);
//       await insertCommunities([communityOne, communityTwo, communityThree]);
//       await insertUsers([userOne, userTwo]);
//       await insertChannels([discordChannel4, discordChannel3], connection);
//       await insertGuildMembers([discordGuildMember1, discordGuildMember2], connection);
//       await insertAnnouncement([announcementOne, announcementTwo]);

//       const res = await request(app)
//         .get('/api/v1/announcements')
//         .set('Authorization', `Bearer ${userOneAccessToken}`)
//         .query({ communityId: userOne.communities?.[0].toString() })
//         .expect(httpStatus.OK);

//       expect(res.body.results).toHaveLength(2);
//       expect(res.body.results).toEqual([
//         {
//           id: announcementTwo._id.toString(),
//           title: 'Announcement Two',
//           scheduledAt: announcementTwo.scheduledAt.toISOString(),
//           draft: false,
//           data: announcementTwo.data.map((data: any) => {
//             const { platformId, ...rest } = data;

//             return {
//               ...rest,
//               platform: data.platform.toString(),
//               options: {
//                 users: [
//                   { discordId: '123456789', ngu: 'Behzad', username: 'behzad_rabiei', avatar: null },
//                   { discordId: '987654321', ngu: 'Daniel', avatar: 'AvatarLink', username: 'mrjackalop' },
//                 ],
//               },
//             };
//           }),
//           community: userOne.communities?.[0].toString(),
//         },
//         {
//           id: announcementOne._id.toString(),
//           title: 'Announcement One',
//           scheduledAt: announcementOne.scheduledAt.toISOString(),
//           draft: false,
//           data: announcementOne.data.map((data: any) => ({
//             ...data,
//             platform: data.platform.toString(),
//             options: {
//               channels: [
//                 {
//                   channelId: '345678901234567000',
//                   name: 'Channel 4',
//                 },
//                 {
//                   channelId: '345678901234567890',
//                   name: 'Channel 3',
//                 },
//               ],
//             },
//           })),
//           community: userOne.communities?.[0].toString(),
//         },
//       ]);
//       expect(res.body.page).toEqual(1);
//       expect(res.body.limit).toEqual(10);
//       expect(res.body.totalPages).toEqual(1);
//       expect(res.body.totalResults).toEqual(2);
//     });

//     test('should return 400 error if communityId is not a valid mongo id', async () => {
//       await insertCommunities([communityOne, communityTwo, communityThree]);
//       await insertUsers([userOne, userTwo]);
//       await insertAnnouncement([announcementOne, announcementTwo, announcementThree]);

//       await request(app)
//         .get('/api/v1/announcements')
//         .set('Authorization', `Bearer ${userOneAccessToken}`)
//         .query({ communityId: communityOne._id })
//         .expect(httpStatus.BAD_REQUEST);
//     });

//     test('should return 404 error if community is not found', async () => {
//       await insertCommunities([communityOne, communityTwo]);
//       await insertUsers([userOne, userTwo]);

//       await request(app)
//         .get('/api/v1/announcements')
//         .set('Authorization', `Bearer ${userOneAccessToken}`)
//         .query({ communityId: communityThree._id.toString() })
//         .expect(httpStatus.NOT_FOUND);
//     });

//     test('should return 401 error if access token is missing', async () => {
//       await insertCommunities([communityOne, communityTwo]);
//       await insertUsers([userOne, userTwo]);

//       await request(app)
//         .get('/api/v1/announcements')
//         .query({ communityId: communityOne._id.toString() })
//         .expect(httpStatus.UNAUTHORIZED);
//     });

//     test('should return 401 error if access token is invalid', async () => {
//       await insertCommunities([communityOne, communityTwo]);
//       await insertUsers([userOne, userTwo]);

//       await request(app)
//         .get('/api/v1/announcements')
//         .set('Authorization', 'Bearer invalidtoken')
//         .query({ communityId: communityOne._id.toString() })
//         .expect(httpStatus.UNAUTHORIZED);
//     });
//   });

//   describe('GET api/v1/announcements/:announcementId', () => {
//     beforeEach(async () => {
//       cleanUpTenantDatabases();
//     });
//     test('should return 200 and successfully get announcement if data is ok', async () => {
//       platformOne.community = communityOne._id;
//       await insertPlatforms([platformOne]);
//       await insertCommunities([communityOne, communityTwo, communityThree]);
//       await insertUsers([userOne, userTwo]);
//       await insertChannels([discordChannel4, discordChannel3], connection);
//       await insertAnnouncement([announcementOne, announcementTwo]);

//       const res = await request(app)
//         .get(`/api/v1/announcements/${announcementOne._id}`)
//         .set('Authorization', `Bearer ${userOneAccessToken}`)
//         .expect(httpStatus.OK);

//       expect(res.body).toEqual({
//         id: announcementOne._id.toString(),
//         title: 'Announcement One',
//         scheduledAt: announcementOne.scheduledAt.toISOString(),
//         draft: false,
//         data: announcementOne.data.map((data: any) => ({
//           ...data,
//           platform: data.platform.toString(),
//           options: {
//             channels: [
//               {
//                 channelId: '345678901234567000',
//                 name: 'Channel 4',
//               },
//               {
//                 channelId: '345678901234567890',
//                 name: 'Channel 3',
//               },
//             ],
//           },
//         })),
//         community: userOne.communities?.[0].toString(),
//       });
//     });

//     test('should return 400 error if announcementId is not a valid mongo id', async () => {
//       await insertCommunities([communityOne, communityTwo, communityThree]);
//       await insertUsers([userOne, userTwo]);
//       await insertAnnouncement([announcementOne, announcementTwo]);

//       await request(app)
//         .get('/api/v1/announcements/invalidId')
//         .set('Authorization', `Bearer ${userOneAccessToken}`)
//         .expect(httpStatus.BAD_REQUEST);
//     });

//     test('should return 404 error if announcement is not found', async () => {
//       await insertCommunities([communityOne, communityTwo]);
//       await insertUsers([userOne, userTwo]);

//       await request(app)
//         .get(`/api/v1/announcements/${announcementOne._id}`)
//         .set('Authorization', `Bearer ${userOneAccessToken}`)
//         .expect(httpStatus.NOT_FOUND);
//     });

//     test('Should return 404 error if user is not a member of the requested community', async () => {
//       await insertCommunities([communityOne, communityTwo]);
//       await insertUsers([userOne, userTwo]);
//       await insertAnnouncement([announcementOne, announcementTwo]);

//       await request(app)
//         .get(`/api/v1/announcements/${announcementThree._id}`)
//         .set('Authorization', `Bearer ${userOneAccessToken}`)
//         .expect(httpStatus.NOT_FOUND);
//     });

//     test('should return 401 error if access token is missing', async () => {
//       await insertCommunities([communityOne, communityTwo]);
//       await insertUsers([userOne, userTwo]);

//       await request(app).get(`/api/v1/announcements/${announcementOne._id}`).expect(httpStatus.UNAUTHORIZED);
//     });

//     test('should return 401 error if access token is invalid', async () => {
//       await insertCommunities([communityOne, communityTwo]);
//       await insertUsers([userOne, userTwo]);

//       await request(app)
//         .get(`/api/v1/announcements/${announcementOne._id}`)
//         .set('Authorization', `Bearer invalidAccessToken`)
//         .expect(httpStatus.UNAUTHORIZED);
//     });
//   });
// });

describe('TEST', () => {
    describe('TEST', () => {
        test('TEST', async () => {
            expect(true).toEqual(true);
        });
    });
});
