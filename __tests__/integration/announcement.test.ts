// /* eslint-disable @typescript-eslint/no-explicit-any */
// import request from 'supertest';
// import httpStatus from 'http-status';
// import app from '../../src/app';
// import setupTestDB from '../utils/setupTestDB';
// import { userOne, insertUsers, userTwo } from '../fixtures/user.fixture';
// import { userOneAccessToken } from '../fixtures/token.fixture';
// import { communityOne, communityTwo, communityThree, insertCommunities } from '../fixtures/community.fixture';
// import { announcementOne, announcementThree, announcementTwo, insertAnnouncement } from '../fixtures/announcement.fixture';

// setupTestDB();

// describe('Community routes', () => {
//     beforeEach(() => {
//         userOne.communities = [communityOne._id, communityTwo._id];
//         userTwo.communities = [communityThree._id];
//         communityOne.users = [userOne._id];
//         communityTwo.users = [userOne._id];
//         communityThree.users = [userTwo._id];
//         announcementOne.community = communityOne._id;
//         announcementTwo.community = communityOne._id;
//         announcementThree.community = communityThree._id;
//     });

//     describe('POST api/v1/announcements', () => {
//         // TODO: maybe we need to mock bullMQ or delete the job after the test
//         // eslint-disable-next-line @typescript-eslint/no-explicit-any
//         let newDraftAnnouncement: any;
//         const nowDate = new Date();
//         const nextMonthDate = new Date();
//         nextMonthDate.setMonth(nowDate.getMonth() + 1);

//         test('should return 201 and successfully create a new draft announcement if data is ok', async () => {
//             await insertCommunities([communityOne, communityTwo, communityThree]);
//             await insertUsers([userOne, userTwo]);

//             newDraftAnnouncement = {
//                 "title": "salam azzm",
//                 "communityId": userOne.communities?.[0],
//                 "scheduledAt": nextMonthDate.toISOString(),
//                 "draft": true,
//                 "data": [
//                     {
//                         "platformId": "658d530d84267a217f988c73",
//                         "template": "sample template wo wo wo",
//                         "options": {
//                             "userIds": ["23", "23"]
//                         }
//                     }
//                 ]
//             };

//             const res = await request(app)
//                 .post('/api/v1/announcements')
//                 .set('Authorization', `Bearer ${userOneAccessToken}`)
//                 .send(newDraftAnnouncement)
//                 .expect(httpStatus.CREATED);

//             expect(res.body).toEqual({
//                 id: expect.anything(),
//                 community: userOne.communities?.[0].toString(),
//                 title: newDraftAnnouncement.title,
//                 scheduledAt: newDraftAnnouncement.scheduledAt,
//                 draft: newDraftAnnouncement.draft,
//                 data: newDraftAnnouncement.data.map((data: any) => {
//                     const { platformId, ...rest } = data;
//                     return { ...rest, platform: platformId }
//                 }),
//             });
//         });

//         test('should return 201 and successfully create a new scheduled announcement if data is ok', async () => {
//             await insertCommunities([communityOne, communityTwo, communityThree]);
//             await insertUsers([userOne, userTwo]);

//             const newAnnouncement = {
//                 "title": "salam azzm",
//                 "communityId": userOne.communities?.[0],
//                 "scheduledAt": nextMonthDate.toISOString(),
//                 "draft": true, // TODO: change this to false when we found a solution for managing jobs after tests
//                 "data": [
//                     {
//                         "platformId": "658d530d84267a217f988c73",
//                         "template": "sample template wo wo wo",
//                         "options": {
//                             "userIds": ["23", "23"]
//                         }
//                     }
//                 ]
//             };

//             const res = await request(app)
//                 .post('/api/v1/announcements')
//                 .set('Authorization', `Bearer ${userOneAccessToken}`)
//                 .send(newAnnouncement)
//                 .expect(httpStatus.CREATED);

//             expect(res.body).toEqual({
//                 id: expect.anything(),
//                 community: userOne.communities?.[0].toString(),
//                 title: newAnnouncement.title,
//                 scheduledAt: newAnnouncement.scheduledAt,
//                 draft: newAnnouncement.draft,
//                 data: newAnnouncement.data.map((data: any) => {
//                     const { platformId, ...rest } = data;
//                     return { ...rest, platform: platformId }
//                 }),
//             });
//         })

//         test('should return 400 error if scheduledAt is not a valid date (not greater than now)', async () => {
//             await insertCommunities([communityOne, communityTwo, communityThree]);
//             await insertUsers([userOne, userTwo]);

//             const lastMonthDate = new Date();
//             lastMonthDate.setMonth(nowDate.getMonth() - 1);
//             const newAnnouncement = {
//                 "title": "salam azzm",
//                 "communityId": userOne.communities?.[0],
//                 "scheduledAt": lastMonthDate.toISOString(),
//                 "draft": true,
//                 "data": [
//                     {
//                         "platformId": "658d530d84267a217f988c73",
//                         "template": "sample template wo wo wo",
//                         "options": {
//                             "userIds": ["23", "23"]
//                         }
//                     }
//                 ]
//             };

//             await request(app)
//                 .post('/api/v1/announcements')
//                 .set('Authorization', `Bearer ${userOneAccessToken}`)
//                 .send(newAnnouncement)
//                 .expect(httpStatus.BAD_REQUEST);
//         });

//         test('Should return 404 error if community is not found', async () => {
//             await insertCommunities([communityOne, communityTwo]);
//             await insertUsers([userOne, userTwo]);

//             const newAnnouncement = {
//                 "title": "salam azzm",
//                 "communityId": "658d530d84267a217f988c73",
//                 "scheduledAt": nextMonthDate.toISOString(),
//                 "draft": true,
//                 "data": [
//                     {
//                         "platformId": "658d530d84267a217f988c73",
//                         "template": "sample template wo wo wo",
//                         "options": {
//                             "userIds": ["23", "23"]
//                         }
//                     }
//                 ]
//             };

//             await request(app)
//                 .post('/api/v1/announcements')
//                 .set('Authorization', `Bearer ${userOneAccessToken}`)
//                 .send(newAnnouncement)
//                 .expect(httpStatus.NOT_FOUND);
//         })

//     });

//     describe('PATCH api/v1/announcements/:announcementId', () => {
//         test('should return 200 and successfully update announcement if data is ok', async () => {
//             await insertCommunities([communityOne, communityTwo, communityThree]);
//             await insertUsers([userOne, userTwo]);
//             await insertAnnouncement([announcementOne, announcementTwo, announcementThree]);

//             const res = await request(app)
//                 .patch(`/api/v1/announcements/${announcementOne._id}`)
//                 .set('Authorization', `Bearer ${userOneAccessToken}`)
//                 .send({ title: 'Updated Announcement One - 1 is one' })
//                 .expect(httpStatus.OK);

//             expect(res.body).toEqual({
//                 id: announcementOne._id.toString(),
//                 title: 'Updated Announcement One - 1 is one',
//                 scheduledAt: announcementOne.scheduledAt.toISOString(),
//                 draft: false,
//                 data: announcementOne.data.map((data: any) => ({ ...data, platform: data.platform.toString() })),
//                 community: userOne.communities?.[0].toString()
//             });
//         });

//         test('should return 400 error if announcementId is not a valid mongo id', async () => {
//             await insertCommunities([communityOne, communityTwo, communityThree]);
//             await insertUsers([userOne, userTwo]);
//             await insertAnnouncement([announcementOne, announcementTwo, announcementThree]);

//             await request(app)
//                 .patch('/api/v1/announcements/invalidId')
//                 .set('Authorization', `Bearer ${userOneAccessToken}`)
//                 .send({ title: 'Updated Announcement One' })
//                 .expect(httpStatus.BAD_REQUEST);
//         });

//         test('should return 404 error if announcement is not found', async () => {
//             await insertCommunities([communityOne, communityTwo]);
//             await insertUsers([userOne, userTwo]);

//             await request(app)
//                 .patch(`/api/v1/announcements/${announcementOne._id}`)
//                 .set('Authorization', `Bearer ${userOneAccessToken}`)
//                 .send({ title: 'Updated Announcement One' })
//                 .expect(httpStatus.NOT_FOUND);
//         });

//         test('Should return 404 error if user is not a member of the requested community', async () => {
//             await insertCommunities([communityOne, communityTwo]);
//             await insertUsers([userOne, userTwo]);
//             await insertAnnouncement([announcementOne, announcementTwo, announcementThree]);

//             await request(app)
//                 .patch(`/api/v1/announcements/${announcementThree._id}`)
//                 .set('Authorization', `Bearer ${userOneAccessToken}`)
//                 .send({ title: 'Updated Announcement One' })
//                 .expect(httpStatus.NOT_FOUND);
//         });
//     })

//     describe('GET api/v1/announcements', () => {
//         test('should return 200 and successfully get announcements if data is ok', async () => {
//             await insertCommunities([communityOne, communityTwo, communityThree]);
//             await insertUsers([userOne, userTwo]);
//             await insertAnnouncement([announcementOne, announcementTwo, announcementThree]);

//             const res = await request(app)
//                 .get('/api/v1/announcements')
//                 .set('Authorization', `Bearer ${userOneAccessToken}`)
//                 .query({ communityId: userOne.communities?.[0].toString() })
//                 .expect(httpStatus.OK);


//             expect(res.body.results).toHaveLength(2);
//             expect(res.body.results).toEqual([
//                 {
//                     id: announcementTwo._id.toString(),
//                     title: 'Announcement Two',
//                     scheduledAt: announcementTwo.scheduledAt.toISOString(),
//                     draft: false,
//                     data: announcementTwo.data.map((data: any) => ({ ...data, platform: data.platform.toString() })),
//                     community: userOne.communities?.[0].toString()
//                 },
//                 {
//                     id: announcementOne._id.toString(),
//                     title: 'Announcement One',
//                     scheduledAt: announcementOne.scheduledAt.toISOString(),
//                     draft: false,
//                     data: announcementOne.data.map((data: any) => ({ ...data, platform: data.platform.toString() })),
//                     community: userOne.communities?.[0].toString()
//                 }
//             ]);
//             expect(res.body.page).toEqual(1);
//             expect(res.body.limit).toEqual(10);
//             expect(res.body.totalPages).toEqual(1);
//             expect(res.body.totalResults).toEqual(2);

//         });

//         test('should return 400 error if communityId is not a valid mongo id', async () => {
//             await insertCommunities([communityOne, communityTwo, communityThree]);
//             await insertUsers([userOne, userTwo]);
//             await insertAnnouncement([announcementOne, announcementTwo, announcementThree]);

//             await request(app)
//                 .get('/api/v1/announcements')
//                 .set('Authorization', `Bearer ${userOneAccessToken}`)
//                 .query({ communityId: communityOne._id })
//                 .expect(httpStatus.BAD_REQUEST);
//         });

//         test('should return 404 error if community is not found', async () => {
//             await insertCommunities([communityOne, communityTwo]);
//             await insertUsers([userOne, userTwo]);

//             await request(app)
//                 .get('/api/v1/announcements')
//                 .set('Authorization', `Bearer ${userOneAccessToken}`)
//                 .query({ communityId: communityThree._id.toString() })
//                 .expect(httpStatus.NOT_FOUND);
//         });

//         test('should return 401 error if access token is missing', async () => {
//             await insertCommunities([communityOne, communityTwo]);
//             await insertUsers([userOne, userTwo]);

//             await request(app)
//                 .get('/api/v1/announcements')
//                 .query({ communityId: communityOne._id.toString() })
//                 .expect(httpStatus.UNAUTHORIZED);
//         });

//         test('should return 401 error if access token is invalid', async () => {
//             await insertCommunities([communityOne, communityTwo]);
//             await insertUsers([userOne, userTwo]);

//             await request(app)
//                 .get('/api/v1/announcements')
//                 .set('Authorization', 'Bearer invalidtoken')
//                 .query({ communityId: communityOne._id.toString() })
//                 .expect(httpStatus.UNAUTHORIZED);
//         });
//     });

//     describe('GET api/v1/announcements/:announcementId', () => {
//         test('should return 200 and successfully get announcement if data is ok', async () => {
//             await insertCommunities([communityOne, communityTwo, communityThree]);
//             await insertUsers([userOne, userTwo]);
//             await insertAnnouncement([announcementOne, announcementTwo, announcementThree]);

//             const res = await request(app)
//                 .get(`/api/v1/announcements/${announcementOne._id}`)
//                 .set('Authorization', `Bearer ${userOneAccessToken}`)
//                 .expect(httpStatus.OK);

//             expect(res.body).toEqual({
//                 id: announcementOne._id.toString(),
//                 title: 'Announcement One',
//                 scheduledAt: announcementOne.scheduledAt.toISOString(),
//                 draft: false,
//                 data: announcementOne.data.map((data: any) => ({ ...data, platform: data.platform.toString() })),
//                 community: userOne.communities?.[0].toString()
//             });
//         });

//         test('should return 400 error if announcementId is not a valid mongo id', async () => {
//             await insertCommunities([communityOne, communityTwo, communityThree]);
//             await insertUsers([userOne, userTwo]);
//             await insertAnnouncement([announcementOne, announcementTwo, announcementThree]);

//             await request(app)
//                 .get('/api/v1/announcements/invalidId')
//                 .set('Authorization', `Bearer ${userOneAccessToken}`)
//                 .expect(httpStatus.BAD_REQUEST);
//         });

//         test('should return 404 error if announcement is not found', async () => {
//             await insertCommunities([communityOne, communityTwo]);
//             await insertUsers([userOne, userTwo]);

//             await request(app)
//                 .get(`/api/v1/announcements/${announcementOne._id}`)
//                 .set('Authorization', `Bearer ${userOneAccessToken}`)
//                 .expect(httpStatus.NOT_FOUND);
//         });

//         test('Should return 404 error if user is not a member of the requested community', async () => {
//             await insertCommunities([communityOne, communityTwo]);
//             await insertUsers([userOne, userTwo]);
//             await insertAnnouncement([announcementOne, announcementTwo, announcementThree]);

//             await request(app)
//                 .get(`/api/v1/announcements/${announcementThree._id}`)
//                 .set('Authorization', `Bearer ${userOneAccessToken}`)
//                 .expect(httpStatus.NOT_FOUND);
//         });

//         test('should return 401 error if access token is missing', async () => {
//             await insertCommunities([communityOne, communityTwo]);
//             await insertUsers([userOne, userTwo]);

//             await request(app)
//                 .get(`/api/v1/announcements/${announcementOne._id}`)
//                 .expect(httpStatus.UNAUTHORIZED);
//         });

//         test('should return 401 error if access token is invalid', async () => {
//             await insertCommunities([communityOne, communityTwo]);
//             await insertUsers([userOne, userTwo]);

//             await request(app)
//                 .get(`/api/v1/announcements/${announcementOne._id}`)
//                 .set('Authorization', `Bearer invalidAccessToken`)
//                 .expect(httpStatus.UNAUTHORIZED);
//         })

//     });

// });
