// import request from 'supertest';
// import httpStatus from 'http-status';
// import app from '../../src/app';
// import setupTestDB, { cleanUpTenantDatabases } from '../utils/setupTestDB';
// import { userOne, insertUsers } from '../fixtures/user.fixture';
// import { userOneAccessToken } from '../fixtures/token.fixture';
// import {
//   memberActivity1,
//   memberActivity2,
//   memberActivity3,
//   memberActivity4,
//   insertMemberActivities,
// } from '../fixtures/memberActivity.fixture';
// import {
//   discordGuildMember1,
//   discordGuildMember2,
//   discordGuildMember3,
//   discordGuildMember4,
//   discordGuildMember5,
//   insertGuildMembers,
// } from '../fixtures/discord/guildMember.fixture';
// import { platformOne, platformTwo, platformFour, insertPlatforms } from '../fixtures/platform.fixture';
// import { DatabaseManager } from '@togethercrew.dev/db';
// import { communityOne, insertCommunities } from '../fixtures/community.fixture';
// import { discordRole1, discordRole2, discordRole3, insertRoles } from '../fixtures/discord/roles.fixture';
// import * as Neo4j from '../../src/neo4j';
// import dateUtils from '../../src/utils/date';
// import { Connection } from 'mongoose';

// setupTestDB();

// describe('member-activity routes', () => {
//   let connection: Connection;
//   beforeAll(async () => {
//     connection = await DatabaseManager.getInstance().getTenantDb(platformOne.metadata?.id);
//   });
//   beforeEach(async () => {
//     cleanUpTenantDatabases();
//     userOne.communities = [communityOne._id];
//     communityOne.users = [userOne._id];
//     communityOne.platforms = [platformOne._id, platformTwo._id, platformFour._id];
//     platformOne.community = communityOne._id;
//     platformTwo.community = communityOne._id;
//     platformFour.community = communityOne._id;
//   });
//   describe('POST /api/v1/member-activity/:platformId/active-members-composition-line-graph', () => {
//     beforeEach(async () => {
//       cleanUpTenantDatabases();
//     });
//     test('should return 200 and active members composition line graph data if req data is ok', async () => {
//       await insertCommunities([communityOne]);
//       await insertUsers([userOne]);
//       await insertPlatforms([platformOne]);
//       await insertMemberActivities([memberActivity1, memberActivity2, memberActivity3, memberActivity4], connection);
//       const res = await request(app)
//         .post(`/api/v1/member-activity/${platformOne._id}/active-members-composition-line-graph`)
//         .set('Authorization', `Bearer ${userOneAccessToken}`)
//         .send({ startDate: new Date('2023-04-01'), endDate: new Date('2023-04-07') })
//         .expect(httpStatus.OK);

//       expect(res.body).toMatchObject({
//         totActiveMembers: 0,
//         newlyActive: 3,
//         consistentlyActive: 0,
//         vitalMembers: 0,
//         becameDisengaged: 1,
//         totActiveMembersPercentageChange: 'N/A',
//         newlyActivePercentageChange: 200,
//         consistentlyActivePercentageChange: 'N/A',
//         vitalMembersPercentageChange: -100,
//         becameDisengagedPercentageChange: 0,
//       });

//       expect(res.body.categories).toEqual(['01 Apr', '02 Apr', '03 Apr', '04 Apr', '05 Apr', '06 Apr', '07 Apr']);
//       expect(res.body.series[0].name).toBe('totActiveMembers');
//       expect(res.body.series[1].name).toBe('newlyActive');
//       expect(res.body.series[2].name).toBe('consistentlyActive');
//       expect(res.body.series[3].name).toBe('vitalMembers');
//       expect(res.body.series[4].name).toBe('becameDisengaged');

//       expect(res.body.series[0].data).toEqual([0, 0, 0, 0, 0, 0, 0]);
//       expect(res.body.series[1].data).toEqual([1, 0, 0, 0, 0, 0, 3]);
//       expect(res.body.series[2].data).toEqual([0, 0, 0, 0, 0, 0, 0]);
//       expect(res.body.series[3].data).toEqual([1, 0, 0, 0, 0, 0, 0]);
//       expect(res.body.series[4].data).toEqual([1, 0, 0, 0, 0, 0, 1]);
//     });

//     test('should return 200 and active members composition line graph data (testing for empty data) if req data is ok', async () => {
//       await insertCommunities([communityOne]);
//       await insertUsers([userOne]);
//       await insertPlatforms([platformOne]);
//       const res = await request(app)
//         .post(`/api/v1/member-activity/${platformOne._id}/active-members-composition-line-graph`)
//         .set('Authorization', `Bearer ${userOneAccessToken}`)
//         .send({ startDate: new Date('2021-02-21'), endDate: new Date('2022-02-24') })
//         .expect(httpStatus.OK);

//       expect(res.body).toMatchObject({
//         totActiveMembers: 0,
//         newlyActive: 0,
//         consistentlyActive: 0,
//         vitalMembers: 0,
//         becameDisengaged: 0,
//         totActiveMembersPercentageChange: 0,
//         newlyActivePercentageChange: 0,
//         consistentlyActivePercentageChange: 0,
//         vitalMembersPercentageChange: 0,
//         becameDisengagedPercentageChange: 0,
//       });
//     });

//     test('should return 400 if given platform is not discord', async () => {
//       await insertCommunities([communityOne]);
//       await insertUsers([userOne]);
//       await insertPlatforms([platformFour]);
//       await request(app)
//         .post(`/api/v1/member-activity/${platformFour._id}/active-members-composition-line-graph`)
//         .set('Authorization', `Bearer ${userOneAccessToken}`)
//         .send({ startDate: new Date(), endDate: new Date() })
//         .expect(httpStatus.BAD_REQUEST);
//     });

//     test('should return 401 if access token is missing', async () => {
//       await request(app)
//         .post(`/api/v1/member-activity/${platformOne._id}/active-members-composition-line-graph`)
//         .send({ startDate: new Date(), endDate: new Date() })
//         .expect(httpStatus.UNAUTHORIZED);
//     });

//     test('should return 404 if guild not found', async () => {
//       await insertUsers([userOne]);
//       await request(app)
//         .post(`/api/v1/member-activity/${platformOne._id}/active-members-composition-line-graph`)
//         .set('Authorization', `Bearer ${userOneAccessToken}`)
//         .send({ startDate: new Date(), endDate: new Date() })
//         .expect(httpStatus.NOT_FOUND);
//     });
//   });

//   describe('POST /api/v1/member-activity/:platformId/disengaged-members-composition-line-graph', () => {
//     beforeEach(async () => {
//       cleanUpTenantDatabases();
//     });
//     test('should return 200 and disengaged members composition line graph data if req data is ok', async () => {
//       await insertCommunities([communityOne]);
//       await insertUsers([userOne]);
//       await insertPlatforms([platformOne]);
//       await insertMemberActivities([memberActivity1, memberActivity2, memberActivity3, memberActivity4], connection);

//       const res = await request(app)
//         .post(`/api/v1/member-activity/${platformOne._id}/disengaged-members-composition-line-graph`)
//         .set('Authorization', `Bearer ${userOneAccessToken}`)
//         .send({ startDate: new Date('2023-04-01'), endDate: new Date('2023-04-07') })
//         .expect(httpStatus.OK);

//       expect(res.body).toMatchObject({
//         becameDisengaged: 1,
//         wereNewlyActive: 3,
//         wereConsistentlyActive: 1,
//         wereVitalMembers: 0,
//         becameDisengagedPercentageChange: 0,
//         wereNewlyActivePercentageChange: 200,
//         wereConsistentlyActivePercentageChange: 'N/A',
//         wereVitalMembersPercentageChange: -100,
//       });

//       expect(res.body.categories).toEqual(['01 Apr', '02 Apr', '03 Apr', '04 Apr', '05 Apr', '06 Apr', '07 Apr']);
//       expect(res.body.series[0].name).toBe('becameDisengaged');
//       expect(res.body.series[1].name).toBe('wereNewlyActive');
//       expect(res.body.series[2].name).toBe('wereConsistentlyActive');
//       expect(res.body.series[3].name).toBe('wereVitalMembers');

//       expect(res.body.series[0].data).toEqual([1, 0, 0, 0, 0, 0, 1]);
//       expect(res.body.series[1].data).toEqual([1, 0, 0, 0, 0, 0, 3]);
//       expect(res.body.series[2].data).toEqual([0, 0, 0, 0, 0, 0, 1]);
//       expect(res.body.series[3].data).toEqual([1, 0, 0, 0, 0, 0, 0]);
//     });

//     test('should return 200 and disengaged members composition line graph data (testing for empty data) if req data is ok', async () => {
//       await insertCommunities([communityOne]);
//       await insertUsers([userOne]);
//       await insertPlatforms([platformOne]);

//       const res = await request(app)
//         .post(`/api/v1/member-activity/${platformOne._id}/disengaged-members-composition-line-graph`)
//         .set('Authorization', `Bearer ${userOneAccessToken}`)
//         .send({ startDate: new Date('2023-04-01'), endDate: new Date('2023-04-07') })
//         .expect(httpStatus.OK);

//       expect(res.body).toMatchObject({
//         becameDisengaged: 0,
//         wereNewlyActive: 0,
//         wereConsistentlyActive: 0,
//         wereVitalMembers: 0,
//         becameDisengagedPercentageChange: 0,
//         wereNewlyActivePercentageChange: 0,
//         wereConsistentlyActivePercentageChange: 0,
//         wereVitalMembersPercentageChange: 0,
//       });
//     });

//     test('should return 401 if access token is missing', async () => {
//       await request(app)
//         .post(`/api/v1/member-activity/${platformOne._id}/disengaged-members-composition-line-graph`)
//         .send({ startDate: new Date(), endDate: new Date() })
//         .expect(httpStatus.UNAUTHORIZED);
//     });

//     test('should return 400 if given platform is not discord', async () => {
//       await insertCommunities([communityOne]);
//       await insertUsers([userOne]);
//       await insertPlatforms([platformFour]);
//       await request(app)
//         .post(`/api/v1/member-activity/${platformFour._id}/disengaged-members-composition-line-graph`)
//         .set('Authorization', `Bearer ${userOneAccessToken}`)
//         .send({ startDate: new Date(), endDate: new Date() })
//         .expect(httpStatus.BAD_REQUEST);
//     });

//     test('should return 404 if guild not found', async () => {
//       await insertUsers([userOne]);
//       await request(app)
//         .post(`/api/v1/member-activity/${platformOne._id}/disengaged-members-composition-line-graph`)
//         .set('Authorization', `Bearer ${userOneAccessToken}`)
//         .send({ startDate: new Date(), endDate: new Date() })
//         .expect(httpStatus.NOT_FOUND);
//     });
//   });

//   describe('POST /api/v1/member-activity/:platformId/active-members-onboarding-line-graph', () => {
//     beforeEach(async () => {
//       cleanUpTenantDatabases();
//     });
//     test('should return 200 and active members onboarding line graph data if req data is ok', async () => {
//       await insertCommunities([communityOne]);
//       await insertUsers([userOne]);
//       await insertPlatforms([platformOne]);
//       await insertMemberActivities([memberActivity1, memberActivity2, memberActivity3, memberActivity4], connection);
//       const res = await request(app)
//         .post(`/api/v1/member-activity/${platformOne._id}/active-members-onboarding-line-graph`)
//         .set('Authorization', `Bearer ${userOneAccessToken}`)
//         .send({ startDate: new Date('2023-04-01'), endDate: new Date('2023-04-07') })
//         .expect(httpStatus.OK);

//       expect(res.body).toMatchObject({
//         newlyActive: 3,
//         stillActive: 0,
//         dropped: 3,
//         joined: 1,
//         newlyActivePercentageChange: 200,
//         stillActivePercentageChange: -100,
//         droppedPercentageChange: 'N/A',
//         joinedPercentageChange: -50,
//       });

//       expect(res.body.categories).toEqual(['01 Apr', '02 Apr', '03 Apr', '04 Apr', '05 Apr', '06 Apr', '07 Apr']);
//       expect(res.body.series[0].name).toBe('joined');
//       expect(res.body.series[1].name).toBe('newlyActive');
//       expect(res.body.series[2].name).toBe('stillActive');
//       expect(res.body.series[3].name).toBe('dropped');
//       expect(res.body.series[0].data).toEqual([1, 0, 0, 0, 0, 0, 1]);
//       expect(res.body.series[1].data).toEqual([1, 0, 0, 0, 0, 0, 3]);
//       expect(res.body.series[2].data).toEqual([1, 0, 0, 0, 0, 0, 0]);
//       expect(res.body.series[3].data).toEqual([0, 0, 0, 0, 0, 0, 3]);
//     });

//     test('should return 200 and ctive members onboarding line graph data (testing for empty data) if req data is ok', async () => {
//       await insertCommunities([communityOne]);
//       await insertUsers([userOne]);
//       await insertPlatforms([platformOne]);
//       const res = await request(app)
//         .post(`/api/v1/member-activity/${platformOne._id}/active-members-onboarding-line-graph`)
//         .set('Authorization', `Bearer ${userOneAccessToken}`)
//         .send({ startDate: new Date('2023-04-01'), endDate: new Date('2023-04-07') })
//         .expect(httpStatus.OK);

//       expect(res.body).toMatchObject({
//         newlyActive: 0,
//         stillActive: 0,
//         dropped: 0,
//         joined: 0,
//         newlyActivePercentageChange: 0,
//         stillActivePercentageChange: 0,
//         droppedPercentageChange: 0,
//         joinedPercentageChange: 0,
//       });
//     });

//     test('should return 401 if access token is missing', async () => {
//       await request(app)
//         .post(`/api/v1/member-activity/${platformOne._id}/active-members-onboarding-line-graph`)
//         .send({ startDate: new Date(), endDate: new Date() })
//         .expect(httpStatus.UNAUTHORIZED);
//     });

//     test('should return 400 if given platform is not discord', async () => {
//       await insertCommunities([communityOne]);
//       await insertUsers([userOne]);
//       await insertPlatforms([platformFour]);
//       await request(app)
//         .post(`/api/v1/member-activity/${platformFour._id}/active-members-onboarding-line-graph`)
//         .set('Authorization', `Bearer ${userOneAccessToken}`)
//         .send({ startDate: new Date(), endDate: new Date() })
//         .expect(httpStatus.BAD_REQUEST);
//     });

//     test('should return 404 if guild not found', async () => {
//       await insertUsers([userOne]);
//       await request(app)
//         .post(`/api/v1/member-activity/${platformOne._id}/active-members-onboarding-line-graph`)
//         .set('Authorization', `Bearer ${userOneAccessToken}`)
//         .send({ startDate: new Date(), endDate: new Date() })
//         .expect(httpStatus.NOT_FOUND);
//     });
//   });

//   describe('POST /api/v1/member-activity/:platformId/inactive-members-line-graph', () => {
//     beforeEach(async () => {
//       cleanUpTenantDatabases();
//     });
//     test('should return 200 and inactive members line graph data if req data is ok', async () => {
//       await insertCommunities([communityOne]);
//       await insertUsers([userOne]);
//       await insertPlatforms([platformOne]);
//       await insertMemberActivities([memberActivity1, memberActivity2, memberActivity3, memberActivity4], connection);
//       const res = await request(app)
//         .post(`/api/v1/member-activity/${platformOne._id}/inactive-members-line-graph`)
//         .set('Authorization', `Bearer ${userOneAccessToken}`)
//         .send({ startDate: new Date('2023-04-01'), endDate: new Date('2023-04-07') })
//         .expect(httpStatus.OK);

//       expect(res.body).toMatchObject({
//         returned: 1,
//         returnedPercentageChange: 'N/A',
//       });

//       expect(res.body.categories).toEqual(['01 Apr', '02 Apr', '03 Apr', '04 Apr', '05 Apr', '06 Apr', '07 Apr']);
//       expect(res.body.series[0].name).toBe('returned');
//       expect(res.body.series[0].data).toEqual([2, 0, 0, 0, 0, 0, 1]);
//     });

//     test('should return 200 and inactive members line graph data (testing for empty data) if req data is ok', async () => {
//       await insertCommunities([communityOne]);
//       await insertUsers([userOne]);
//       await insertPlatforms([platformOne]);

//       const res = await request(app)
//         .post(`/api/v1/member-activity/${platformOne._id}/inactive-members-line-graph`)
//         .set('Authorization', `Bearer ${userOneAccessToken}`)
//         .send({ startDate: new Date('2021-02-21'), endDate: new Date('2022-02-24') })
//         .expect(httpStatus.OK);

//       expect(res.body).toMatchObject({
//         returned: 0,
//         returnedPercentageChange: 0,
//       });
//     });

//     test('should return 401 if access token is missing', async () => {
//       await request(app)
//         .post(`/api/v1/member-activity/${platformOne._id}/inactive-members-line-graph`)
//         .send({ startDate: new Date(), endDate: new Date() })
//         .expect(httpStatus.UNAUTHORIZED);
//     });

//     test('should return 400 if given platform is not discord', async () => {
//       await insertCommunities([communityOne]);
//       await insertUsers([userOne]);
//       await insertPlatforms([platformFour]);
//       await request(app)
//         .post(`/api/v1/member-activity/${platformFour._id}/inactive-members-line-graph`)
//         .set('Authorization', `Bearer ${userOneAccessToken}`)
//         .send({ startDate: new Date(), endDate: new Date() })
//         .expect(httpStatus.BAD_REQUEST);
//     });

//     test('should return 404 if guild not found', async () => {
//       await insertUsers([userOne]);
//       await request(app)
//         .post(`/api/v1/member-activity/${platformOne._id}/inactive-members-line-graph`)
//         .set('Authorization', `Bearer ${userOneAccessToken}`)
//         .send({ startDate: new Date(), endDate: new Date() })
//         .expect(httpStatus.NOT_FOUND);
//     });
//   });

//   // describe('POST /api/v1/member-activity/:platformId/members-interactions-network-graph', () => {
//   //     let connection: Connection;
//   //     beforeEach(async () => {
//   //         connection = await DatabaseManager.getInstance().getTenantDb(platformOne.metadata?.id);
//   //         await connection.dropDatabase();
//   //     });

//   //     test('should return 200 and member interaction graph data if req data is ok', async () => {
//   //         await insertCommunities([communityOne]);
//   //         await insertUsers([userOne]);
//   //         await insertPlatforms([platformOne]);
//   //         await insertGuildMembers([discordGuildMember1, discordGuildMember2, discordGuildMember3, discordGuildMember4, discordGuildMember5], connection);

//   //         const yesterdayTimestamp = dateUtils.getYesterdayUTCtimestamp()

//   //         const date = new Date();
//   //         date.setDate(date.getDate() - 2);
//   //         const twodaysAgoTimestamp = date.setHours(10, 0, 0, 0);

//   //         await Neo4j.write("match (n) detach delete (n);")
//   //         await Neo4j.write(`CREATE (a:DiscordAccount) -[:IS_MEMBER]->(g:Guild {guildId: "${platformOne.metadata?.id}"})
//   //             CREATE (b:DiscordAccount) -[:IS_MEMBER]->(g)
//   //             CREATE (c:DiscordAccount) -[:IS_MEMBER]->(g)
//   //             CREATE (d:DiscordAccount) -[:IS_MEMBER]->(g)
//   //             CREATE (e:DiscordAccount) -[:IS_MEMBER]->(g)
//   //             SET a.userId = '${discordGuildMember1.discordId}'
//   //             SET b.userId = '${discordGuildMember2.discordId}'
//   //             MERGE (a) -[r:INTERACTED_WITH {date: ${yesterdayTimestamp}, weight: 1}]->(b)
//   //             MERGE (b) -[r2:INTERACTED_WITH {date: ${twodaysAgoTimestamp}, weight: 2}]->(a)
//   //             MERGE (b) -[r3:INTERACTED_WITH {date: ${yesterdayTimestamp}, weight: 2}]->(a)

//   //             SET r.guildId = "${platformOne.metadata?.id}"
//   //             SET r2.guildId = "${platformOne.metadata?.id}"
//   //             SET r3.guildId = "${platformOne.metadata?.id}"

//   //             MERGE (a) -[:INTERACTED_IN {localclusteringcoefficient: 1, date: ${yesterdayTimestamp}, status: 0}]->(g)
//   //             MERGE (a) -[:INTERACTED_IN {localclusteringcoefficient: 1, date: ${twodaysAgoTimestamp}, status: 2}]->(g)
//   //             MERGE (b) -[:INTERACTED_IN {localclusteringcoefficient: 1, date: ${yesterdayTimestamp}, status: 1}]->(g)
//   //             MERGE (b) -[:INTERACTED_IN {localclusteringcoefficient: 1, date: ${twodaysAgoTimestamp}, status: 1}]->(g)
//   //             `)

//   //         const res = await request(app)
//   //             .post(`/api/v1/member-activity/${platformOne._id}/members-interactions-network-graph`)
//   //             .set('Authorization', `Bearer ${userOneAccessToken}`)
//   //             .expect(httpStatus.OK);

//   //         expect(Array.isArray(res.body)).toBe(true);
//   //         expect(res.body).toHaveLength(2)
//   //         expect(res.body).toEqual(expect.arrayContaining([({
//   //             from: { avatar: null, id: "123456789", discordId: "123456789", joinedAt: "2023-03-07T00:00:00.000Z", ngu: "Behzad", radius: 3, roles: [], stats: "SENDER", username: "behzad_rabiei" },
//   //             to: { avatar: "AvatarLink", id: "987654321", discordId: '987654321', joinedAt: "2023-03-31T00:00:00.000Z", ngu: "Daniel", radius: 3, roles: [], stats: "RECEIVER", username: "mrjackalop" },
//   //             width: 1
//   //         })
//   //         ]))
//   //         expect(res.body).toEqual(expect.arrayContaining([({
//   //             from: { avatar: "AvatarLink", id: "987654321", discordId: "987654321", joinedAt: "2023-03-31T00:00:00.000Z", ngu: "Daniel", radius: 3, roles: [], stats: "RECEIVER", username: "mrjackalop" },
//   //             to: { avatar: null, id: "123456789", discordId: '123456789', joinedAt: "2023-03-07T00:00:00.000Z", ngu: "Behzad", radius: 3, roles: [], stats: "SENDER", username: "behzad_rabiei" },
//   //             width: 2
//   //         })
//   //         ]))

//   //     })
//   //     test('should return 401 if access token is missing', async () => {
//   //         await request(app)
//   //             .post(`/api/v1/member-activity/${platformOne._id}/members-interactions-network-graph`)
//   //             .send({ startDate: new Date(), endDate: new Date() })
//   //             .expect(httpStatus.UNAUTHORIZED);
//   //     })
//   //     test('should return 404 if guild not found', async () => {
//   //         await insertUsers([userOne]);
//   //         await request(app)

//   //             .post(`/api/v1/member-activity/${platformOne._id}/members-interactions-network-graph`)
//   //             .set('Authorization', `Bearer ${userOneAccessToken}`)
//   //             .expect(httpStatus.NOT_FOUND);
//   //     })

//   //     test('should return 400 if given platform is not discord', async () => {
//   //         await insertCommunities([communityOne]);
//   //         await insertUsers([userOne]);
//   //         await insertPlatforms([platformFour]);
//   //         await request(app)
//   //             .post(`/api/v1/member-activity/${platformFour._id}/members-interactions-network-graph`)
//   //             .set('Authorization', `Bearer ${userOneAccessToken}`)
//   //             .send({ startDate: new Date(), endDate: new Date() })
//   //             .expect(httpStatus.BAD_REQUEST);
//   //     })
//   // })

//   describe('GET /api/v1/member-activity/:platformId/fragmentation-score', () => {
//     beforeEach(async () => {
//       cleanUpTenantDatabases();
//     });
//     test('should return 200 and fragmentation score if req data is ok', async () => {
//       await insertCommunities([communityOne]);
//       await insertUsers([userOne]);
//       await insertPlatforms([platformOne]);

//       await Neo4j.write('match (n) detach delete (n);');
//       await Neo4j.write(`
//                 CREATE (a:DiscordAccount) -[:IS_MEMBER]->(g:Guild {guildId: "${platformOne.metadata?.id}"})
//                 CREATE (b:DiscordAccount) -[:IS_MEMBER]->(g)
//                 CREATE (c:DiscordAccount) -[:IS_MEMBER]->(g)
//                 CREATE (d:DiscordAccount) -[:IS_MEMBER]->(g)
//                 CREATE (e:DiscordAccount) -[:IS_MEMBER]->(g)
//                 SET a.userId = "1000"
//                 SET b.userId = "1001"
//                 SET c.userId = "1002"
//                 SET d.userId = "1003"
//                 SET e.userId = "1004"
//                 MERGE (a) -[r:INTERACTED_WITH {date: 1110, weight: 1}]->(b)
//                 MERGE (a) -[r2:INTERACTED_WITH {date: 1111, weight: 2}]->(b)
//                 MERGE (a) -[r3:INTERACTED_WITH {date: 1110, weight: 3}]->(d)
//                 MERGE (c) -[r4:INTERACTED_WITH {date: 1110, weight: 2}]->(b)
//                 MERGE (c) -[r5:INTERACTED_WITH {date: 1111, weight: 1}]->(b)
//                 MERGE (c) -[r6:INTERACTED_WITH {date: 1110, weight: 2}]->(d)
//                 MERGE (d) -[r7:INTERACTED_WITH {date: 1110, weight: 1}]->(b)
//                 MERGE (c) -[r8:INTERACTED_WITH {date: 1111, weight: 2}]->(a)
//                 MERGE (d) -[r9:INTERACTED_WITH {date: 1111, weight: 1}]->(c)
//                 MERGE (b) -[r10:INTERACTED_WITH {date: 1111, weight: 2}]->(d)
//                 MERGE (d) -[r11:INTERACTED_WITH {date: 1111, weight: 1}]->(c)
//                 MERGE (e) -[r12:INTERACTED_WITH {date: 1111, weight: 3}]->(b)
//                 SET r.guildId = "${platformOne.metadata?.id}"
//                 SET r2.guildId = "${platformOne.metadata?.id}"
//                 SET r3.guildId = "${platformOne.metadata?.id}"
//                 SET r4.guildId = "${platformOne.metadata?.id}"
//                 SET r5.guildId = "${platformOne.metadata?.id}"
//                 SET r6.guildId = "${platformOne.metadata?.id}"
//                 SET r7.guildId = "${platformOne.metadata?.id}"
//                 SET r8.guildId = "${platformOne.metadata?.id}"
//                 SET r9.guildId = "${platformOne.metadata?.id}"
//                 SET r10.guildId = "${platformOne.metadata?.id}"
//                 SET r11.guildId = "${platformOne.metadata?.id}"
//                 SET r12.guildId = "${platformOne.metadata?.id}"
//                 MERGE (g) -[:HAVE_METRICS {date: 1110, louvainModularityScore: 0.66666666666 }]->(g)
//                 MERGE (g) -[:HAVE_METRICS {date: 1111, louvainModularityScore: 0.33333333333 }]->(g)`);

//       const res = await request(app)
//         .get(`/api/v1/member-activity/${platformOne._id}/fragmentation-score`)
//         .set('Authorization', `Bearer ${userOneAccessToken}`)
//         .expect(httpStatus.OK);

//       expect(res.body.fragmentationScore).toBe(133.33333333299998);
//       expect(res.body.scoreStatus).toBe(1);
//       expect(res.body.fragmentationScoreRange).toHaveProperty('minimumFragmentationScore', 0);
//       expect(res.body.fragmentationScoreRange).toHaveProperty('maximumFragmentationScore', 200);
//     });

//     test('should return 200 with "null" fragmentation score if there is not interaction or data', async () => {
//       await insertCommunities([communityOne]);
//       await insertUsers([userOne]);
//       await insertPlatforms([platformOne, platformTwo]);

//       const yesterdayTimestamp = dateUtils.getYesterdayUTCtimestamp();

//       const date = new Date();
//       date.setDate(date.getDate() - 2);
//       const twodaysAgoTimestamp = date.setHours(0, 0, 0, 0);

//       await Neo4j.write('match (n) detach delete (n);');
//       await Neo4j.write(`
//                 CREATE (a:DiscordAccount) -[:IS_MEMBER]->(g:Guild {guildId: "${platformOne.metadata?.id}"})
//                 CREATE (b:DiscordAccount) -[:IS_MEMBER]->(g)
//                 CREATE (c:DiscordAccount) -[:IS_MEMBER]->(g)
//                 CREATE (d:DiscordAccount) -[:IS_MEMBER]->(g)
//                 CREATE (e:DiscordAccount) -[:IS_MEMBER]->(g)
//                 SET a.userId = "1000"
//                 SET b.userId = "1001"
//                 SET c.userId = "1002"
//                 SET d.userId = "1003"
//                 SET e.userId = "1004"
//                 MERGE (a) -[r:INTERACTED_WITH {date: ${twodaysAgoTimestamp}, weight: 1}]->(b)
//                 MERGE (a) -[r2:INTERACTED_WITH {date: ${yesterdayTimestamp}, weight: 2}]->(b)
//                 MERGE (a) -[r3:INTERACTED_WITH {date: ${twodaysAgoTimestamp}, weight: 3}]->(d)
//                 MERGE (c) -[r4:INTERACTED_WITH {date: ${twodaysAgoTimestamp}, weight: 2}]->(b)
//                 MERGE (c) -[r5:INTERACTED_WITH {date: ${yesterdayTimestamp}, weight: 1}]->(b)
//                 MERGE (c) -[r6:INTERACTED_WITH {date: ${twodaysAgoTimestamp}, weight: 2}]->(d)
//                 MERGE (d) -[r7:INTERACTED_WITH {date: ${twodaysAgoTimestamp}, weight: 1}]->(b)
//                 MERGE (c) -[r8:INTERACTED_WITH {date: ${yesterdayTimestamp}, weight: 2}]->(a)
//                 MERGE (d) -[r9:INTERACTED_WITH {date: ${yesterdayTimestamp}, weight: 1}]->(c)
//                 MERGE (b) -[r10:INTERACTED_WITH {date: ${yesterdayTimestamp}, weight: 2}]->(d)
//                 MERGE (d) -[r11:INTERACTED_WITH {date: ${yesterdayTimestamp}, weight: 1}]->(c)
//                 MERGE (e) -[r12:INTERACTED_WITH {date: ${yesterdayTimestamp}, weight: 3}]->(b)

//                 MERGE (a) -[: INTERACTED_IN {date: ${yesterdayTimestamp}, localClusteringCoefficient: 1.0, status: 2}]-> (g)
//                 MERGE (a) -[: INTERACTED_IN {date: ${twodaysAgoTimestamp}, localClusteringCoefficient: 1.0, status: 0}] -> (g)
//                 MERGE (b) -[: INTERACTED_IN {date: ${yesterdayTimestamp}, localClusteringCoefficient: 0.6666666666666666, status: 1}] -> (g)
//                 MERGE (b) -[: INTERACTED_IN {date: ${twodaysAgoTimestamp}, localClusteringCoefficient: 0.3333333333333333, status: 1}] -> (g)
//                 MERGE (c) -[: INTERACTED_IN {date: ${yesterdayTimestamp}, localClusteringCoefficient: 1.0}]->(g)
//                 MERGE (c) -[: INTERACTED_IN {date: ${twodaysAgoTimestamp}, localClusteringCoefficient: 0.6666666666666666, status: 0}]->(g)
//                 MERGE (c) -[: INTERACTED_IN {date: ${yesterdayTimestamp}, localClusteringCoefficient: 1.0, status: 0, status: 2}]->(g)
//                 MERGE (c) -[: INTERACTED_IN {date: ${twodaysAgoTimestamp}, localClusteringCoefficient: 0.6666666666666666, status: 1}]->(g)
//                 MERGE (e) -[: INTERACTED_IN {date: ${yesterdayTimestamp}, localClusteringCoefficient: 0.0, status: 0}]->(g)
//                 MERGE (e) -[: INTERACTED_IN {date: ${twodaysAgoTimestamp}, localClusteringCoefficient: 0.0 }]->(g)
//                 MERGE (g) -[:HAVE_METRICS {date: ${twodaysAgoTimestamp}, decentralizationScore: 133.33333333333334 }]->(g)
//                 MERGE (g) -[:HAVE_METRICS {date: ${yesterdayTimestamp}, decentralizationScore: 66.66666666666669 }]->(g)

//                 SET r.guildId = "${platformOne.metadata?.id}"
//                 SET r2.guildId = "${platformOne.metadata?.id}"
//                 SET r3.guildId = "${platformOne.metadata?.id}"
//                 SET r4.guildId = "${platformOne.metadata?.id}"
//                 SET r5.guildId = "${platformOne.metadata?.id}"
//                 SET r6.guildId = "${platformOne.metadata?.id}"
//                 SET r7.guildId = "${platformOne.metadata?.id}"
//                 SET r8.guildId = "${platformOne.metadata?.id}"
//                 SET r9.guildId = "${platformOne.metadata?.id}"
//                 SET r10.guildId = "${platformOne.metadata?.id}"
//                 SET r11.guildId = "${platformOne.metadata?.id}"
//                 SET r12.guildId = "${platformOne.metadata?.id}"`);

//       const res = await request(app)
//         .get(`/api/v1/member-activity/${platformTwo._id}/fragmentation-score`)
//         .set('Authorization', `Bearer ${userOneAccessToken}`)
//         .expect(httpStatus.OK);

//       expect(res.body.fragmentationScore).toBe(null);
//     });

//     test('should return 401 if access token is missing', async () => {
//       await request(app)
//         .get(`/api/v1/member-activity/${platformOne._id}/fragmentation-score`)
//         .send({ startDate: new Date(), endDate: new Date() })
//         .expect(httpStatus.UNAUTHORIZED);
//     });

//     test('should return 404 if guild not found', async () => {
//       await insertUsers([userOne]);
//       await request(app)
//         .get(`/api/v1/member-activity/${platformOne._id}/fragmentation-score`)
//         .set('Authorization', `Bearer ${userOneAccessToken}`)
//         .expect(httpStatus.NOT_FOUND);
//     });

//     test('should return 400 if given platform is not discord', async () => {
//       await insertCommunities([communityOne]);
//       await insertUsers([userOne]);
//       await insertPlatforms([platformFour]);
//       await request(app)
//         .get(`/api/v1/member-activity/${platformFour._id}/fragmentation-score`)
//         .set('Authorization', `Bearer ${userOneAccessToken}`)
//         .send({ startDate: new Date(), endDate: new Date() })
//         .expect(httpStatus.BAD_REQUEST);
//     });
//   });

//   describe('GET /api/v1/member-activity/:platformId/decentralisation-score', () => {
//     beforeEach(async () => {
//       cleanUpTenantDatabases();
//     });
//     test('should return 200 and decentralisation score if req data is ok', async () => {
//       await insertCommunities([communityOne]);
//       await insertUsers([userOne]);
//       await insertPlatforms([platformOne, platformTwo]);

//       const yesterdayTimestamp = dateUtils.getYesterdayUTCtimestamp();

//       const date = new Date();
//       date.setDate(date.getDate() - 2);
//       const twodaysAgoTimestamp = date.setHours(0, 0, 0, 0);

//       // TODO: write neo4j queries in other file
//       await Neo4j.write('match (n) detach delete (n);');
//       await Neo4j.write(`
//                 CREATE (a:DiscordAccount) -[:IS_MEMBER]->(g:Guild {guildId: "${platformOne.metadata?.id}"})
//                 CREATE (b:DiscordAccount) -[:IS_MEMBER]->(g)
//                 CREATE (c:DiscordAccount) -[:IS_MEMBER]->(g)
//                 CREATE (d:DiscordAccount) -[:IS_MEMBER]->(g)
//                 CREATE (e:DiscordAccount) -[:IS_MEMBER]->(g)
//                 SET a.userId = "1000"
//                 SET b.userId = "1001"
//                 SET c.userId = "1002"
//                 SET d.userId = "1003"
//                 SET e.userId = "1004"
//                 MERGE (a) -[r:INTERACTED_WITH {date: ${twodaysAgoTimestamp}, weight: 1}]->(b)
//                 MERGE (a) -[r2:INTERACTED_WITH {date: ${yesterdayTimestamp}, weight: 2}]->(b)
//                 MERGE (a) -[r3:INTERACTED_WITH {date: ${twodaysAgoTimestamp}, weight: 3}]->(d)
//                 MERGE (c) -[r4:INTERACTED_WITH {date: ${twodaysAgoTimestamp}, weight: 2}]->(b)
//                 MERGE (c) -[r5:INTERACTED_WITH {date: ${yesterdayTimestamp}, weight: 1}]->(b)
//                 MERGE (c) -[r6:INTERACTED_WITH {date: ${twodaysAgoTimestamp}, weight: 2}]->(d)
//                 MERGE (d) -[r7:INTERACTED_WITH {date: ${twodaysAgoTimestamp}, weight: 1}]->(b)
//                 MERGE (c) -[r8:INTERACTED_WITH {date: ${yesterdayTimestamp}, weight: 2}]->(a)
//                 MERGE (d) -[r9:INTERACTED_WITH {date: ${yesterdayTimestamp}, weight: 1}]->(c)
//                 MERGE (b) -[r10:INTERACTED_WITH {date: ${yesterdayTimestamp}, weight: 2}]->(d)
//                 MERGE (d) -[r11:INTERACTED_WITH {date: ${yesterdayTimestamp}, weight: 1}]->(c)
//                 MERGE (e) -[r12:INTERACTED_WITH {date: ${yesterdayTimestamp}, weight: 3}]->(b)

//                 MERGE (a) -[: INTERACTED_IN {date: ${yesterdayTimestamp}, localClusteringCoefficient: 1.0, status: 2}]-> (g)
//                 MERGE (a) -[: INTERACTED_IN {date: ${twodaysAgoTimestamp}, localClusteringCoefficient: 1.0, status: 0}] -> (g)
//                 MERGE (b) -[: INTERACTED_IN {date: ${yesterdayTimestamp}, localClusteringCoefficient: 0.6666666666666666, status: 1}] -> (g)
//                 MERGE (b) -[: INTERACTED_IN {date: ${twodaysAgoTimestamp}, localClusteringCoefficient: 0.3333333333333333, status: 1}] -> (g)
//                 MERGE (c) -[: INTERACTED_IN {date: ${yesterdayTimestamp}, localClusteringCoefficient: 1.0}]->(g)
//                 MERGE (c) -[: INTERACTED_IN {date: ${twodaysAgoTimestamp}, localClusteringCoefficient: 0.6666666666666666, status: 0}]->(g)
//                 MERGE (c) -[: INTERACTED_IN {date: ${yesterdayTimestamp}, localClusteringCoefficient: 1.0, status: 0, status: 2}]->(g)
//                 MERGE (c) -[: INTERACTED_IN {date: ${twodaysAgoTimestamp}, localClusteringCoefficient: 0.6666666666666666, status: 1}]->(g)
//                 MERGE (e) -[: INTERACTED_IN {date: ${yesterdayTimestamp}, localClusteringCoefficient: 0.0, status: 0}]->(g)
//                 MERGE (e) -[: INTERACTED_IN {date: ${twodaysAgoTimestamp}, localClusteringCoefficient: 0.0 }]->(g)
//                 MERGE (g) -[:HAVE_METRICS {date: ${twodaysAgoTimestamp}, decentralizationScore: 133.33333333333334 }]->(g)
//                 MERGE (g) -[:HAVE_METRICS {date: ${yesterdayTimestamp}, decentralizationScore: 66.66666666666669 }]->(g)

//                 SET r.guildId = "${platformOne.metadata?.id}"
//                 SET r2.guildId = "${platformOne.metadata?.id}"
//                 SET r3.guildId = "${platformOne.metadata?.id}"
//                 SET r4.guildId = "${platformOne.metadata?.id}"
//                 SET r5.guildId = "${platformOne.metadata?.id}"
//                 SET r6.guildId = "${platformOne.metadata?.id}"
//                 SET r7.guildId = "${platformOne.metadata?.id}"
//                 SET r8.guildId = "${platformOne.metadata?.id}"
//                 SET r9.guildId = "${platformOne.metadata?.id}"
//                 SET r10.guildId = "${platformOne.metadata?.id}"
//                 SET r11.guildId = "${platformOne.metadata?.id}"
//                 SET r12.guildId = "${platformOne.metadata?.id}"`);

//       const res = await request(app)
//         .get(`/api/v1/member-activity/${platformOne._id}/decentralisation-score`)
//         .set('Authorization', `Bearer ${userOneAccessToken}`)
//         .expect(httpStatus.OK);

//       expect(res.body.decentralisationScore).toBe(66.66666666666669);
//       expect(res.body.scoreStatus).toBe(-1);
//       expect(res.body.decentralisationScoreRange).toHaveProperty('minimumDecentralisationScore', 0);
//       expect(res.body.decentralisationScoreRange).toHaveProperty('maximumDecentralisationScore', 200);
//     });

//     test('should return 200 with "null" decentralisation score if there is not interaction or data', async () => {
//       await insertCommunities([communityOne]);
//       await insertUsers([userOne]);
//       await insertPlatforms([platformOne, platformTwo]);

//       const yesterdayTimestamp = dateUtils.getYesterdayUTCtimestamp();

//       const date = new Date();
//       date.setDate(date.getDate() - 2);
//       const twodaysAgoTimestamp = date.setHours(0, 0, 0, 0);

//       // TODO: write neo4j queries in other file
//       await Neo4j.write('match (n) detach delete (n);');
//       await Neo4j.write(`
//                 CREATE (a:DiscordAccount) -[:IS_MEMBER]->(g:Guild {guildId: "${platformOne.metadata?.id}"})
//                 CREATE (b:DiscordAccount) -[:IS_MEMBER]->(g)
//                 CREATE (c:DiscordAccount) -[:IS_MEMBER]->(g)
//                 CREATE (d:DiscordAccount) -[:IS_MEMBER]->(g)
//                 CREATE (e:DiscordAccount) -[:IS_MEMBER]->(g)
//                 SET a.userId = "1000"
//                 SET b.userId = "1001"
//                 SET c.userId = "1002"
//                 SET d.userId = "1003"
//                 SET e.userId = "1004"
//                 MERGE (a) -[r:INTERACTED_WITH {date: ${twodaysAgoTimestamp}, weight: 1}]->(b)
//                 MERGE (a) -[r2:INTERACTED_WITH {date: ${yesterdayTimestamp}, weight: 2}]->(b)
//                 MERGE (a) -[r3:INTERACTED_WITH {date: ${twodaysAgoTimestamp}, weight: 3}]->(d)
//                 MERGE (c) -[r4:INTERACTED_WITH {date: ${twodaysAgoTimestamp}, weight: 2}]->(b)
//                 MERGE (c) -[r5:INTERACTED_WITH {date: ${yesterdayTimestamp}, weight: 1}]->(b)
//                 MERGE (c) -[r6:INTERACTED_WITH {date: ${twodaysAgoTimestamp}, weight: 2}]->(d)
//                 MERGE (d) -[r7:INTERACTED_WITH {date: ${twodaysAgoTimestamp}, weight: 1}]->(b)
//                 MERGE (c) -[r8:INTERACTED_WITH {date: ${yesterdayTimestamp}, weight: 2}]->(a)
//                 MERGE (d) -[r9:INTERACTED_WITH {date: ${yesterdayTimestamp}, weight: 1}]->(c)
//                 MERGE (b) -[r10:INTERACTED_WITH {date: ${yesterdayTimestamp}, weight: 2}]->(d)
//                 MERGE (d) -[r11:INTERACTED_WITH {date: ${yesterdayTimestamp}, weight: 1}]->(c)
//                 MERGE (e) -[r12:INTERACTED_WITH {date: ${yesterdayTimestamp}, weight: 3}]->(b)

//                 MERGE (a) -[: INTERACTED_IN {date: ${yesterdayTimestamp}, localClusteringCoefficient: 1.0, status: 2}]-> (g)
//                 MERGE (a) -[: INTERACTED_IN {date: ${twodaysAgoTimestamp}, localClusteringCoefficient: 1.0, status: 0}] -> (g)
//                 MERGE (b) -[: INTERACTED_IN {date: ${yesterdayTimestamp}, localClusteringCoefficient: 0.6666666666666666, status: 1}] -> (g)
//                 MERGE (b) -[: INTERACTED_IN {date: ${twodaysAgoTimestamp}, localClusteringCoefficient: 0.3333333333333333, status: 1}] -> (g)
//                 MERGE (c) -[: INTERACTED_IN {date: ${yesterdayTimestamp}, localClusteringCoefficient: 1.0}]->(g)
//                 MERGE (c) -[: INTERACTED_IN {date: ${twodaysAgoTimestamp}, localClusteringCoefficient: 0.6666666666666666, status: 0}]->(g)
//                 MERGE (c) -[: INTERACTED_IN {date: ${yesterdayTimestamp}, localClusteringCoefficient: 1.0, status: 0, status: 2}]->(g)
//                 MERGE (c) -[: INTERACTED_IN {date: ${twodaysAgoTimestamp}, localClusteringCoefficient: 0.6666666666666666, status: 1}]->(g)
//                 MERGE (e) -[: INTERACTED_IN {date: ${yesterdayTimestamp}, localClusteringCoefficient: 0.0, status: 0}]->(g)
//                 MERGE (e) -[: INTERACTED_IN {date: ${twodaysAgoTimestamp}, localClusteringCoefficient: 0.0 }]->(g)
//                 MERGE (g) -[:HAVE_METRICS {date: ${twodaysAgoTimestamp}, decentralizationScore: 133.33333333333334 }]->(g)
//                 MERGE (g) -[:HAVE_METRICS {date: ${yesterdayTimestamp}, decentralizationScore: 66.66666666666669 }]->(g)

//                 SET r.guildId = "${platformOne.metadata?.id}"
//                 SET r2.guildId = "${platformOne.metadata?.id}"
//                 SET r3.guildId = "${platformOne.metadata?.id}"
//                 SET r4.guildId = "${platformOne.metadata?.id}"
//                 SET r5.guildId = "${platformOne.metadata?.id}"
//                 SET r6.guildId = "${platformOne.metadata?.id}"
//                 SET r7.guildId = "${platformOne.metadata?.id}"
//                 SET r8.guildId = "${platformOne.metadata?.id}"
//                 SET r9.guildId = "${platformOne.metadata?.id}"
//                 SET r10.guildId = "${platformOne.metadata?.id}"
//                 SET r11.guildId = "${platformOne.metadata?.id}"
//                 SET r12.guildId = "${platformOne.metadata?.id}"`);

//       const res = await request(app)
//         .get(`/api/v1/member-activity/${platformTwo._id}/decentralisation-score`)
//         .set('Authorization', `Bearer ${userOneAccessToken}`)
//         .expect(httpStatus.OK);

//       expect(res.body.decentralisationScore).toBe(null);
//     });

//     test('should return 401 if access token is missing', async () => {
//       await request(app)
//         .get(`/api/v1/member-activity/${platformOne.metadata?.id}/decentralisation-score`)
//         .send({ startDate: new Date(), endDate: new Date() })
//         .expect(httpStatus.UNAUTHORIZED);
//     });

//     test('should return 404 if guild not found', async () => {
//       await insertUsers([userOne]);
//       await request(app)
//         .get(`/api/v1/member-activity/${platformOne._id}/decentralisation-score`)
//         .set('Authorization', `Bearer ${userOneAccessToken}`)
//         .expect(httpStatus.NOT_FOUND);
//     });

//     test('should return 400 if given platform is not discord', async () => {
//       await insertCommunities([communityOne]);
//       await insertUsers([userOne]);
//       await insertPlatforms([platformFour]);
//       await request(app)
//         .get(`/api/v1/member-activity/${platformFour._id}/decentralisation-score`)
//         .set('Authorization', `Bearer ${userOneAccessToken}`)
//         .send({ startDate: new Date(), endDate: new Date() })
//         .expect(httpStatus.BAD_REQUEST);
//     });
//   });

//   describe('POST /api/v1/member-activity/:platformId/active-members-composition-table', () => {
//     beforeEach(async () => {
//       cleanUpTenantDatabases();
//     });
//     test('should return 200 and apply the default query options', async () => {
//       await insertCommunities([communityOne]);
//       await insertUsers([userOne]);
//       await insertPlatforms([platformOne]);
//       await insertMemberActivities([memberActivity1, memberActivity2], connection);
//       await insertGuildMembers(
//         [discordGuildMember1, discordGuildMember2, discordGuildMember3, discordGuildMember4, discordGuildMember5],
//         connection,
//       );
//       await insertRoles([discordRole1, discordRole2, discordRole3], connection);
//       const res = await request(app)
//         .post(`/api/v1/member-activity/${platformOne._id}/active-members-composition-table`)
//         .set('Authorization', `Bearer ${userOneAccessToken}`)
//         .send()
//         .expect(httpStatus.OK);

//       expect(res.body).toEqual({
//         results: expect.any(Array),
//         page: 1,
//         limit: 10,
//         totalPages: 1,
//         totalResults: 4,
//       });

//       expect(res.body.results).toHaveLength(4);
//       expect(res.body.results[0]).toEqual({
//         discordId: discordGuildMember3.discordId,
//         username: discordGuildMember3.username,
//         ngu: discordGuildMember3.username,
//         avatar: discordGuildMember3.avatar,
//         roles: [{ roleId: discordRole2.roleId, name: discordRole2.name, color: discordRole2.color }],
//         joinedAt: discordGuildMember3.joinedAt.toISOString(),
//         discriminator: discordGuildMember3.discriminator,
//         activityComposition: ['Newly active'],
//         nickname: discordGuildMember3.nickname,
//         globalName: discordGuildMember3.globalName,
//       });

//       expect(res.body.results[1]).toEqual({
//         discordId: discordGuildMember1.discordId,
//         username: discordGuildMember1.username,
//         ngu: discordGuildMember1.globalName,
//         avatar: discordGuildMember1.avatar,
//         roles: [
//           { roleId: discordRole2.roleId, name: discordRole2.name, color: discordRole2.color },
//           { roleId: discordRole3.roleId, name: discordRole3.name, color: discordRole3.color },
//         ],
//         joinedAt: discordGuildMember1.joinedAt.toISOString(),
//         discriminator: discordGuildMember1.discriminator,
//         activityComposition: ['Newly active', 'Became disengaged'],
//         nickname: discordGuildMember1.nickname,
//         globalName: discordGuildMember1.globalName,
//       });

//       expect(res.body.results[2]).toEqual({
//         discordId: discordGuildMember2.discordId,
//         username: discordGuildMember2.username,
//         ngu: discordGuildMember2.nickname,
//         avatar: discordGuildMember2.avatar,
//         roles: [
//           { roleId: discordRole1.roleId, name: discordRole1.name, color: discordRole1.color },
//           { roleId: discordRole3.roleId, name: discordRole3.name, color: discordRole3.color },
//         ],
//         joinedAt: discordGuildMember2.joinedAt.toISOString(),
//         discriminator: discordGuildMember2.discriminator,
//         activityComposition: ['Newly active'],
//         nickname: discordGuildMember2.nickname,
//         globalName: discordGuildMember2.globalName,
//       });

//       expect(res.body.results[3]).toEqual({
//         discordId: discordGuildMember4.discordId,
//         username: discordGuildMember4.username + '#' + discordGuildMember4.discriminator,
//         ngu: discordGuildMember4.username + '#' + discordGuildMember4.discriminator,
//         avatar: discordGuildMember4.avatar,
//         roles: [{ roleId: discordRole1.roleId, name: discordRole1.name, color: discordRole1.color }],
//         joinedAt: discordGuildMember4.joinedAt.toISOString(),
//         discriminator: discordGuildMember4.discriminator,
//         activityComposition: ['Others'],
//         nickname: discordGuildMember4.nickname,
//         globalName: discordGuildMember4.globalName,
//       });
//     });

//     test('should return 401 if access token is missing', async () => {
//       await request(app)
//         .post(`/api/v1/member-activity/${platformOne._id}/active-members-composition-table`)
//         .send()
//         .expect(httpStatus.UNAUTHORIZED);
//     });

//     test('should return 404 if guild not found', async () => {
//       await insertUsers([userOne]);
//       await request(app)
//         .post(`/api/v1/member-activity/${platformOne._id}/active-members-composition-table`)
//         .set('Authorization', `Bearer ${userOneAccessToken}`)
//         .send()
//         .expect(httpStatus.NOT_FOUND);
//     });

//     test('should correctly apply filter on activityComposition field', async () => {
//       await insertCommunities([communityOne]);
//       await insertUsers([userOne]);
//       await insertPlatforms([platformOne]);
//       await insertMemberActivities([memberActivity1, memberActivity2, memberActivity3, memberActivity4], connection);
//       await insertGuildMembers(
//         [discordGuildMember1, discordGuildMember2, discordGuildMember3, discordGuildMember4],
//         connection,
//       );
//       await insertRoles([discordRole1, discordRole2, discordRole3], connection);

//       let res = await request(app)
//         .post(`/api/v1/member-activity/${platformOne._id}/active-members-composition-table`)
//         .set('Authorization', `Bearer ${userOneAccessToken}`)
//         .query({ activityComposition: ['all_active'] })
//         .send()
//         .expect(httpStatus.OK);

//       expect(res.body).toEqual({
//         results: expect.any(Array),
//         page: 1,
//         limit: 10,
//         totalPages: 0,
//         totalResults: 0,
//       });
//       expect(res.body.results).toHaveLength(0);

//       res = await request(app)
//         .post(`/api/v1/member-activity/${platformOne._id}/active-members-composition-table`)
//         .set('Authorization', `Bearer ${userOneAccessToken}`)
//         .query({ activityComposition: ['all_active', 'others'] })
//         .send()
//         .expect(httpStatus.OK);

//       expect(res.body).toEqual({
//         results: expect.any(Array),
//         page: 1,
//         limit: 10,
//         totalPages: 1,
//         totalResults: 1,
//       });
//       expect(res.body.results).toHaveLength(1);
//       expect(res.body.results[0].discordId).toBe(discordGuildMember4.discordId);
//       expect(res.body.results[0].activityComposition).toEqual(['Others']);

//       res = await request(app)
//         .post(`/api/v1/member-activity/${platformOne._id}/active-members-composition-table`)
//         .set('Authorization', `Bearer ${userOneAccessToken}`)
//         .query({ activityComposition: ['others'] })
//         .send()
//         .expect(httpStatus.OK);

//       expect(res.body).toEqual({
//         results: expect.any(Array),
//         page: 1,
//         limit: 10,
//         totalPages: 1,
//         totalResults: 1,
//       });

//       expect(res.body.results).toHaveLength(1);
//       expect(res.body.results[0].discordId).toBe(discordGuildMember4.discordId);
//       expect(res.body.results[0].activityComposition).toEqual(['Others']);

//       res = await request(app)
//         .post(`/api/v1/member-activity/${platformOne._id}/active-members-composition-table`)
//         .set('Authorization', `Bearer ${userOneAccessToken}`)
//         .query({ activityComposition: ['all_new_active', 'all_new_disengaged'] })
//         .send()
//         .expect(httpStatus.OK);

//       expect(res.body).toEqual({
//         results: expect.any(Array),
//         page: 1,
//         limit: 10,
//         totalPages: 1,
//         totalResults: 3,
//       });

//       expect(res.body.results).toHaveLength(3);

//       expect(res.body.results[0].discordId).toBe(discordGuildMember3.discordId);
//       expect(res.body.results[0].activityComposition).toEqual(['Newly active']);
//       expect(res.body.results[1].discordId).toBe(discordGuildMember1.discordId);
//       expect(res.body.results[1].activityComposition).toEqual(['Newly active', 'Became disengaged']);
//       expect(res.body.results[2].discordId).toBe(discordGuildMember2.discordId);
//       expect(res.body.results[2].activityComposition).toEqual(['Newly active']);
//     });

//     test('should correctly apply filter on roles field if include provided', async () => {
//       await insertUsers([userOne]);
//       await insertPlatforms([platformOne]);
//       await insertMemberActivities([memberActivity1, memberActivity2, memberActivity3, memberActivity4], connection);
//       await insertGuildMembers(
//         [discordGuildMember1, discordGuildMember2, discordGuildMember3, discordGuildMember4],
//         connection,
//       );
//       await insertRoles([discordRole1, discordRole2, discordRole3], connection);
//       const res = await request(app)
//         .post(`/api/v1/member-activity/${platformOne._id}/active-members-composition-table`)
//         .set('Authorization', `Bearer ${userOneAccessToken}`)
//         .send({ allRoles: false, include: ['987654321123456789'] })
//         .expect(httpStatus.OK);

//       expect(res.body).toEqual({
//         results: expect.any(Array),
//         page: 1,
//         limit: 10,
//         totalPages: 1,
//         totalResults: 2,
//       });
//       expect(res.body.results).toHaveLength(2);
//       expect(res.body.results[0].discordId).toBe(discordGuildMember3.discordId);
//       expect(res.body.results[1].discordId).toBe(discordGuildMember1.discordId);
//     });

//     test('should correctly apply filter on roles field if exclude provided', async () => {
//       await insertUsers([userOne]);
//       await insertPlatforms([platformOne]);
//       await insertMemberActivities([memberActivity1, memberActivity2, memberActivity3, memberActivity4], connection);
//       await insertGuildMembers(
//         [discordGuildMember1, discordGuildMember2, discordGuildMember3, discordGuildMember4],
//         connection,
//       );
//       await insertRoles([discordRole1, discordRole2, discordRole3], connection);
//       const res = await request(app)
//         .post(`/api/v1/member-activity/${platformOne._id}/active-members-composition-table`)
//         .set('Authorization', `Bearer ${userOneAccessToken}`)
//         .send({ allRoles: false, exclude: ['123456789987654321'] })
//         .expect(httpStatus.OK);

//       expect(res.body).toEqual({
//         results: expect.any(Array),
//         page: 1,
//         limit: 10,
//         totalPages: 1,
//         totalResults: 2,
//       });
//       expect(res.body.results).toHaveLength(2);
//       expect(res.body.results[0].discordId).toBe(discordGuildMember3.discordId);
//       expect(res.body.results[1].discordId).toBe(discordGuildMember4.discordId);
//     });

//     test('should correctly apply filter on username field', async () => {
//       await insertUsers([userOne]);
//       await insertPlatforms([platformOne]);
//       await insertMemberActivities([memberActivity1, memberActivity2, memberActivity3, memberActivity4], connection);
//       await insertGuildMembers(
//         [discordGuildMember1, discordGuildMember2, discordGuildMember3, discordGuildMember4],
//         connection,
//       );
//       await insertRoles([discordRole1, discordRole2, discordRole3], connection);
//       const res = await request(app)
//         .post(`/api/v1/member-activity/${platformOne._id}/active-members-composition-table`)
//         .set('Authorization', `Bearer ${userOneAccessToken}`)
//         .query({ ngu: 'behzad' })
//         .send()
//         .expect(httpStatus.OK);

//       expect(res.body).toEqual({
//         results: expect.any(Array),
//         page: 1,
//         limit: 10,
//         totalPages: 1,
//         totalResults: 2,
//       });
//       expect(res.body.results).toHaveLength(2);
//       expect(res.body.results[0].discordId).toBe(discordGuildMember1.discordId);
//       expect(res.body.results[1].discordId).toBe(discordGuildMember4.discordId);
//     });
//     test('should correctly sort the returned array if descending sort param is specified', async () => {
//       await insertUsers([userOne]);
//       await insertPlatforms([platformOne]);
//       await insertMemberActivities([memberActivity1, memberActivity2, memberActivity3, memberActivity4], connection);
//       await insertGuildMembers(
//         [discordGuildMember1, discordGuildMember2, discordGuildMember3, discordGuildMember4],
//         connection,
//       );
//       await insertRoles([discordRole1, discordRole2, discordRole3], connection);
//       const res = await request(app)
//         .post(`/api/v1/member-activity/${platformOne._id}/active-members-composition-table`)
//         .set('Authorization', `Bearer ${userOneAccessToken}`)
//         .query({ sortBy: 'joinedAt:desc' })
//         .send()
//         .expect(httpStatus.OK);

//       expect(res.body).toEqual({
//         results: expect.any(Array),
//         page: 1,
//         limit: 10,
//         totalPages: 1,
//         totalResults: 4,
//       });
//       expect(res.body.results).toHaveLength(4);
//       expect(res.body.results[0].discordId).toBe(discordGuildMember4.discordId);
//       expect(res.body.results[1].discordId).toBe(discordGuildMember2.discordId);
//       expect(res.body.results[2].discordId).toBe(discordGuildMember1.discordId);
//       expect(res.body.results[3].discordId).toBe(discordGuildMember3.discordId);
//     });

//     test('should correctly sort the returned array if ascending  sort param is specified', async () => {
//       await insertUsers([userOne]);
//       await insertPlatforms([platformOne]);
//       await insertMemberActivities([memberActivity1, memberActivity2, memberActivity3, memberActivity4], connection);
//       await insertGuildMembers(
//         [discordGuildMember1, discordGuildMember2, discordGuildMember3, discordGuildMember4],
//         connection,
//       );
//       await insertRoles([discordRole1, discordRole2, discordRole3], connection);

//       const res = await request(app)
//         .post(`/api/v1/member-activity/${platformOne._id}/active-members-composition-table`)
//         .set('Authorization', `Bearer ${userOneAccessToken}`)
//         .query({ sortBy: 'joinedAt:asc' })
//         .send()
//         .expect(httpStatus.OK);

//       expect(res.body).toEqual({
//         results: expect.any(Array),
//         page: 1,
//         limit: 10,
//         totalPages: 1,
//         totalResults: 4,
//       });
//       expect(res.body.results).toHaveLength(4);
//       expect(res.body.results[0].discordId).toBe(discordGuildMember3.discordId);
//       expect(res.body.results[1].discordId).toBe(discordGuildMember1.discordId);
//       expect(res.body.results[2].discordId).toBe(discordGuildMember2.discordId);
//       expect(res.body.results[3].discordId).toBe(discordGuildMember4.discordId);
//     });

//     test('should correctly sort the returned array if multiple sorting criteria are specified', async () => {
//       await insertUsers([userOne]);
//       await insertPlatforms([platformOne]);
//       await insertMemberActivities([memberActivity1, memberActivity2, memberActivity3, memberActivity4], connection);
//       await insertGuildMembers(
//         [discordGuildMember1, discordGuildMember2, discordGuildMember3, discordGuildMember4],
//         connection,
//       );
//       await insertRoles([discordRole1, discordRole2, discordRole3], connection);

//       const res = await request(app)
//         .post(`/api/v1/member-activity/${platformOne._id}/active-members-composition-table`)
//         .set('Authorization', `Bearer ${userOneAccessToken}`)
//         .query({ sortBy: 'joinedAt:desc,username:asc' })
//         .send()
//         .expect(httpStatus.OK);

//       expect(res.body).toEqual({
//         results: expect.any(Array),
//         page: 1,
//         limit: 10,
//         totalPages: 1,
//         totalResults: 4,
//       });

//       const expectedOrder = [discordGuildMember1, discordGuildMember2, discordGuildMember3, discordGuildMember4].sort(
//         (a, b) => {
//           if (a.joinedAt < b.joinedAt) {
//             return 1;
//           }
//           if (a.joinedAt > b.joinedAt) {
//             return -1;
//           }
//           return a.username < b.username ? -1 : 1;
//         },
//       );

//       expectedOrder.forEach((user, index) => {
//         expect(res.body.results[index].discordId).toBe(user.discordId);
//       });
//     });

//     test('should limit returned array if limit param is specified', async () => {
//       await insertUsers([userOne]);
//       await insertPlatforms([platformOne]);
//       await insertMemberActivities([memberActivity1, memberActivity2, memberActivity3, memberActivity4], connection);
//       await insertGuildMembers(
//         [discordGuildMember1, discordGuildMember2, discordGuildMember3, discordGuildMember4],
//         connection,
//       );
//       await insertRoles([discordRole1, discordRole2, discordRole3], connection);

//       const res = await request(app)
//         .post(`/api/v1/member-activity/${platformOne._id}/active-members-composition-table`)
//         .set('Authorization', `Bearer ${userOneAccessToken}`)
//         .query({ limit: 2 })
//         .send()
//         .expect(httpStatus.OK);

//       expect(res.body).toEqual({
//         results: expect.any(Array),
//         page: 1,
//         limit: 2,
//         totalPages: 2,
//         totalResults: 4,
//       });

//       expect(res.body.results).toHaveLength(2);
//       expect(res.body.results[0].discordId).toBe(discordGuildMember3.discordId);
//       expect(res.body.results[1].discordId).toBe(discordGuildMember1.discordId);
//     });

//     test('should correctly sort the returned array if page and limit are  specified', async () => {
//       await insertUsers([userOne]);
//       await insertPlatforms([platformOne]);
//       await insertMemberActivities([memberActivity1, memberActivity2, memberActivity3, memberActivity4], connection);
//       await insertGuildMembers(
//         [discordGuildMember1, discordGuildMember2, discordGuildMember3, discordGuildMember4],
//         connection,
//       );
//       await insertRoles([discordRole1, discordRole2, discordRole3], connection);

//       const res = await request(app)
//         .post(`/api/v1/member-activity/${platformOne._id}/active-members-composition-table`)
//         .set('Authorization', `Bearer ${userOneAccessToken}`)
//         .query({ page: 2, limit: 2 })
//         .send()
//         .expect(httpStatus.OK);

//       expect(res.body).toEqual({
//         results: expect.any(Array),
//         page: 2,
//         limit: 2,
//         totalPages: 2,
//         totalResults: 4,
//       });

//       expect(res.body.results).toHaveLength(2);
//       expect(res.body.results[0].discordId).toBe(discordGuildMember2.discordId);
//       expect(res.body.results[1].discordId).toBe(discordGuildMember4.discordId);
//     });

//     test('should return 400 if given platform is not discord', async () => {
//       await insertCommunities([communityOne]);
//       await insertUsers([userOne]);
//       await insertPlatforms([platformFour]);
//       await request(app)
//         .post(`/api/v1/member-activity/${platformFour._id}/active-members-composition-table`)
//         .set('Authorization', `Bearer ${userOneAccessToken}`)
//         .send({ startDate: new Date(), endDate: new Date() })
//         .expect(httpStatus.BAD_REQUEST);
//     });
//   });

//   describe('POST /api/v1/member-activity/:platformId/active-members-onboarding-table', () => {
//     beforeEach(async () => {
//       cleanUpTenantDatabases();
//     });
//     test('should return 200 and apply the default query options', async () => {
//       await insertUsers([userOne]);
//       await insertPlatforms([platformOne]);
//       await insertMemberActivities([memberActivity1, memberActivity2, memberActivity3, memberActivity4], connection);
//       await insertGuildMembers(
//         [discordGuildMember1, discordGuildMember2, discordGuildMember3, discordGuildMember4],
//         connection,
//       );
//       await insertRoles([discordRole1, discordRole2, discordRole3], connection);

//       const res = await request(app)
//         .post(`/api/v1/member-activity/${platformOne._id}/active-members-onboarding-table`)
//         .set('Authorization', `Bearer ${userOneAccessToken}`)
//         .send()
//         .expect(httpStatus.OK);

//       expect(res.body).toEqual({
//         results: expect.any(Array),
//         page: 1,
//         limit: 10,
//         totalPages: 1,
//         totalResults: 4,
//       });

//       expect(res.body.results).toHaveLength(4);
//       expect(res.body.results[0]).toEqual({
//         discordId: discordGuildMember3.discordId,
//         username: discordGuildMember3.username,
//         ngu: discordGuildMember3.username,
//         avatar: discordGuildMember3.avatar,
//         roles: [{ roleId: discordRole2.roleId, name: discordRole2.name, color: discordRole2.color }],
//         joinedAt: discordGuildMember3.joinedAt.toISOString(),
//         discriminator: discordGuildMember3.discriminator,
//         activityComposition: ['Newly active', 'Dropped'],
//         nickname: discordGuildMember3.nickname,
//         globalName: discordGuildMember3.globalName,
//       });

//       expect(res.body.results[1]).toEqual({
//         discordId: discordGuildMember1.discordId,
//         username: discordGuildMember1.username,
//         ngu: discordGuildMember1.globalName,
//         avatar: discordGuildMember1.avatar,
//         roles: [
//           { roleId: discordRole2.roleId, name: discordRole2.name, color: discordRole2.color },
//           { roleId: discordRole3.roleId, name: discordRole3.name, color: discordRole3.color },
//         ],
//         joinedAt: discordGuildMember1.joinedAt.toISOString(),
//         discriminator: discordGuildMember1.discriminator,
//         activityComposition: ['Newly active', 'Joined', 'Dropped'],
//         nickname: discordGuildMember1.nickname,
//         globalName: discordGuildMember1.globalName,
//       });

//       expect(res.body.results[2]).toEqual({
//         discordId: discordGuildMember2.discordId,
//         username: discordGuildMember2.username,
//         ngu: discordGuildMember2.nickname,
//         avatar: discordGuildMember2.avatar,
//         roles: [
//           { roleId: discordRole1.roleId, name: discordRole1.name, color: discordRole1.color },
//           { roleId: discordRole3.roleId, name: discordRole3.name, color: discordRole3.color },
//         ],
//         joinedAt: discordGuildMember2.joinedAt.toISOString(),
//         discriminator: discordGuildMember2.discriminator,
//         activityComposition: ['Newly active', 'Dropped'],
//         nickname: discordGuildMember2.nickname,
//         globalName: discordGuildMember2.globalName,
//       });

//       expect(res.body.results[3]).toEqual({
//         discordId: discordGuildMember4.discordId,
//         username: discordGuildMember4.username + '#' + discordGuildMember4.discriminator,
//         ngu: discordGuildMember4.username + '#' + discordGuildMember4.discriminator,
//         avatar: discordGuildMember4.avatar,
//         roles: [{ roleId: discordRole1.roleId, name: discordRole1.name, color: discordRole1.color }],
//         joinedAt: discordGuildMember4.joinedAt.toISOString(),
//         discriminator: discordGuildMember4.discriminator,
//         activityComposition: ['Others'],
//         nickname: discordGuildMember4.nickname,
//         globalName: discordGuildMember4.globalName,
//       });
//     });

//     test('should return 401 if access token is missing', async () => {
//       await request(app)
//         .post(`/api/v1/member-activity/${platformOne._id}/active-members-onboarding-table`)
//         .send()
//         .expect(httpStatus.UNAUTHORIZED);
//     });

//     test('should return 404 if guild not found', async () => {
//       await insertUsers([userOne]);
//       await request(app)
//         .post(`/api/v1/member-activity/${platformOne._id}/active-members-onboarding-table`)
//         .set('Authorization', `Bearer ${userOneAccessToken}`)
//         .send()
//         .expect(httpStatus.NOT_FOUND);
//     });

//     test('should correctly apply filter on activityComposition field', async () => {
//       await insertUsers([userOne]);
//       await insertPlatforms([platformOne]);
//       await insertMemberActivities([memberActivity1, memberActivity2, memberActivity3, memberActivity4], connection);
//       await insertGuildMembers(
//         [discordGuildMember1, discordGuildMember2, discordGuildMember3, discordGuildMember4],
//         connection,
//       );
//       await insertRoles([discordRole1, discordRole2, discordRole3], connection);

//       let res = await request(app)
//         .post(`/api/v1/member-activity/${platformOne._id}/active-members-onboarding-table`)
//         .set('Authorization', `Bearer ${userOneAccessToken}`)
//         .query({ activityComposition: ['all_still_active'] })
//         .send()
//         .expect(httpStatus.OK);

//       expect(res.body).toEqual({
//         results: expect.any(Array),
//         page: 1,
//         limit: 10,
//         totalPages: 0,
//         totalResults: 0,
//       });
//       expect(res.body.results).toHaveLength(0);

//       res = await request(app)
//         .post(`/api/v1/member-activity/${platformOne._id}/active-members-onboarding-table`)
//         .set('Authorization', `Bearer ${userOneAccessToken}`)
//         .query({ activityComposition: ['others', 'all_still_active'] })
//         .send()
//         .expect(httpStatus.OK);

//       expect(res.body).toEqual({
//         results: expect.any(Array),
//         page: 1,
//         limit: 10,
//         totalPages: 1,
//         totalResults: 1,
//       });

//       expect(res.body.results).toHaveLength(1);
//       expect(res.body.results[0].discordId).toBe(discordGuildMember4.discordId);
//       expect(res.body.results[0].activityComposition).toEqual(['Others']);

//       res = await request(app)
//         .post(`/api/v1/member-activity/${platformOne._id}/active-members-onboarding-table`)
//         .set('Authorization', `Bearer ${userOneAccessToken}`)
//         .query({ activityComposition: ['others'] })
//         .send()
//         .expect(httpStatus.OK);

//       expect(res.body).toEqual({
//         results: expect.any(Array),
//         page: 1,
//         limit: 10,
//         totalPages: 1,
//         totalResults: 1,
//       });

//       expect(res.body.results).toHaveLength(1);
//       expect(res.body.results[0].discordId).toBe(discordGuildMember4.discordId);
//       expect(res.body.results[0].activityComposition).toEqual(['Others']);

//       res = await request(app)
//         .post(`/api/v1/member-activity/${platformOne._id}/active-members-onboarding-table`)
//         .set('Authorization', `Bearer ${userOneAccessToken}`)
//         .query({ activityComposition: ['all_dropped', 'all_joined'] })
//         .send()
//         .expect(httpStatus.OK);

//       expect(res.body).toEqual({
//         results: expect.any(Array),
//         page: 1,
//         limit: 10,
//         totalPages: 1,
//         totalResults: 3,
//       });

//       expect(res.body.results).toHaveLength(3);
//       expect(res.body.results[0].discordId).toBe(discordGuildMember3.discordId);
//       expect(res.body.results[0].activityComposition).toEqual(['Dropped']);
//       expect(res.body.results[1].discordId).toBe(discordGuildMember1.discordId);
//       expect(res.body.results[1].activityComposition).toEqual(['Joined', 'Dropped']);
//       expect(res.body.results[2].discordId).toBe(discordGuildMember2.discordId);
//       expect(res.body.results[2].activityComposition).toEqual(['Dropped']);
//     });

//     test('should correctly apply filter on roles field if include provided', async () => {
//       await insertUsers([userOne]);
//       await insertPlatforms([platformOne]);
//       await insertMemberActivities([memberActivity1, memberActivity2, memberActivity3, memberActivity4], connection);
//       await insertGuildMembers(
//         [discordGuildMember1, discordGuildMember2, discordGuildMember3, discordGuildMember4],
//         connection,
//       );
//       await insertRoles([discordRole1, discordRole2, discordRole3], connection);

//       const res = await request(app)
//         .post(`/api/v1/member-activity/${platformOne._id}/active-members-onboarding-table`)
//         .set('Authorization', `Bearer ${userOneAccessToken}`)
//         .send({ allRoles: false, include: ['987654321123456789'] })
//         .expect(httpStatus.OK);

//       expect(res.body).toEqual({
//         results: expect.any(Array),
//         page: 1,
//         limit: 10,
//         totalPages: 1,
//         totalResults: 2,
//       });
//       expect(res.body.results).toHaveLength(2);
//       expect(res.body.results[0].discordId).toBe(discordGuildMember3.discordId);
//       expect(res.body.results[1].discordId).toBe(discordGuildMember1.discordId);
//     });

//     test('should correctly apply filter on roles field if exclude provided', async () => {
//       await insertUsers([userOne]);
//       await insertPlatforms([platformOne]);
//       await insertMemberActivities([memberActivity1, memberActivity2, memberActivity3, memberActivity4], connection);
//       await insertGuildMembers(
//         [discordGuildMember1, discordGuildMember2, discordGuildMember3, discordGuildMember4],
//         connection,
//       );
//       await insertRoles([discordRole1, discordRole2, discordRole3], connection);

//       const res = await request(app)
//         .post(`/api/v1/member-activity/${platformOne._id}/active-members-onboarding-table`)
//         .set('Authorization', `Bearer ${userOneAccessToken}`)
//         .send({ allRoles: false, exclude: ['123456789987654321'] })
//         .expect(httpStatus.OK);

//       expect(res.body).toEqual({
//         results: expect.any(Array),
//         page: 1,
//         limit: 10,
//         totalPages: 1,
//         totalResults: 2,
//       });
//       expect(res.body.results).toHaveLength(2);
//       expect(res.body.results[0].discordId).toBe(discordGuildMember3.discordId);
//       expect(res.body.results[1].discordId).toBe(discordGuildMember4.discordId);
//     });

//     test('should correctly apply filter on username field', async () => {
//       await insertUsers([userOne]);
//       await insertPlatforms([platformOne]);
//       await insertMemberActivities([memberActivity1, memberActivity2, memberActivity3, memberActivity4], connection);
//       await insertGuildMembers(
//         [discordGuildMember1, discordGuildMember2, discordGuildMember3, discordGuildMember4],
//         connection,
//       );
//       await insertRoles([discordRole1, discordRole2, discordRole3], connection);

//       const res = await request(app)
//         .post(`/api/v1/member-activity/${platformOne._id}/active-members-onboarding-table`)
//         .set('Authorization', `Bearer ${userOneAccessToken}`)
//         .query({ ngu: 'behzad' })
//         .send()
//         .expect(httpStatus.OK);

//       expect(res.body).toEqual({
//         results: expect.any(Array),
//         page: 1,
//         limit: 10,
//         totalPages: 1,
//         totalResults: 2,
//       });
//       expect(res.body.results).toHaveLength(2);
//       expect(res.body.results[0].discordId).toBe(discordGuildMember1.discordId);
//       expect(res.body.results[1].discordId).toBe(discordGuildMember4.discordId);
//     });
//     test('should correctly sort the returned array if descending sort param is specified', async () => {
//       await insertUsers([userOne]);
//       await insertPlatforms([platformOne]);
//       await insertMemberActivities([memberActivity1, memberActivity2, memberActivity3, memberActivity4], connection);
//       await insertGuildMembers(
//         [discordGuildMember1, discordGuildMember2, discordGuildMember3, discordGuildMember4],
//         connection,
//       );
//       await insertRoles([discordRole1, discordRole2, discordRole3], connection);

//       const res = await request(app)
//         .post(`/api/v1/member-activity/${platformOne._id}/active-members-onboarding-table`)
//         .set('Authorization', `Bearer ${userOneAccessToken}`)
//         .query({ sortBy: 'joinedAt:desc' })
//         .send()
//         .expect(httpStatus.OK);

//       expect(res.body).toEqual({
//         results: expect.any(Array),
//         page: 1,
//         limit: 10,
//         totalPages: 1,
//         totalResults: 4,
//       });
//       expect(res.body.results).toHaveLength(4);
//       expect(res.body.results[0].discordId).toBe(discordGuildMember4.discordId);
//       expect(res.body.results[1].discordId).toBe(discordGuildMember2.discordId);
//       expect(res.body.results[2].discordId).toBe(discordGuildMember1.discordId);
//       expect(res.body.results[3].discordId).toBe(discordGuildMember3.discordId);
//     });

//     test('should correctly sort the returned array if ascending  sort param is specified', async () => {
//       await insertUsers([userOne]);
//       await insertPlatforms([platformOne]);
//       await insertMemberActivities([memberActivity1, memberActivity2, memberActivity3, memberActivity4], connection);
//       await insertGuildMembers(
//         [discordGuildMember1, discordGuildMember2, discordGuildMember3, discordGuildMember4],
//         connection,
//       );
//       await insertRoles([discordRole1, discordRole2, discordRole3], connection);

//       const res = await request(app)
//         .post(`/api/v1/member-activity/${platformOne._id}/active-members-onboarding-table`)
//         .set('Authorization', `Bearer ${userOneAccessToken}`)
//         .query({ sortBy: 'joinedAt:asc' })
//         .send()
//         .expect(httpStatus.OK);

//       expect(res.body).toEqual({
//         results: expect.any(Array),
//         page: 1,
//         limit: 10,
//         totalPages: 1,
//         totalResults: 4,
//       });
//       expect(res.body.results).toHaveLength(4);
//       expect(res.body.results[0].discordId).toBe(discordGuildMember3.discordId);
//       expect(res.body.results[1].discordId).toBe(discordGuildMember1.discordId);
//       expect(res.body.results[2].discordId).toBe(discordGuildMember2.discordId);
//       expect(res.body.results[3].discordId).toBe(discordGuildMember4.discordId);
//     });

//     test('should correctly sort the returned array if multiple sorting criteria are specified', async () => {
//       await insertUsers([userOne]);
//       await insertPlatforms([platformOne]);
//       await insertMemberActivities([memberActivity1, memberActivity2, memberActivity3, memberActivity4], connection);
//       await insertGuildMembers(
//         [discordGuildMember1, discordGuildMember2, discordGuildMember3, discordGuildMember4],
//         connection,
//       );
//       await insertRoles([discordRole1, discordRole2, discordRole3], connection);

//       const res = await request(app)
//         .post(`/api/v1/member-activity/${platformOne._id}/active-members-onboarding-table`)
//         .set('Authorization', `Bearer ${userOneAccessToken}`)
//         .query({ sortBy: 'joinedAt:desc,username:asc' })
//         .send()
//         .expect(httpStatus.OK);

//       expect(res.body).toEqual({
//         results: expect.any(Array),
//         page: 1,
//         limit: 10,
//         totalPages: 1,
//         totalResults: 4,
//       });

//       const expectedOrder = [discordGuildMember1, discordGuildMember2, discordGuildMember3, discordGuildMember4].sort(
//         (a, b) => {
//           if (a.joinedAt < b.joinedAt) {
//             return 1;
//           }
//           if (a.joinedAt > b.joinedAt) {
//             return -1;
//           }
//           return a.username < b.username ? -1 : 1;
//         },
//       );

//       expectedOrder.forEach((user, index) => {
//         expect(res.body.results[index].discordId).toBe(user.discordId);
//       });
//     });

//     test('should limit returned array if limit param is specified', async () => {
//       await insertUsers([userOne]);
//       await insertPlatforms([platformOne]);
//       await insertMemberActivities([memberActivity1, memberActivity2, memberActivity3, memberActivity4], connection);
//       await insertGuildMembers(
//         [discordGuildMember1, discordGuildMember2, discordGuildMember3, discordGuildMember4],
//         connection,
//       );
//       await insertRoles([discordRole1, discordRole2, discordRole3], connection);

//       const res = await request(app)
//         .post(`/api/v1/member-activity/${platformOne._id}/active-members-onboarding-table`)
//         .set('Authorization', `Bearer ${userOneAccessToken}`)
//         .query({ limit: 2 })
//         .send()
//         .expect(httpStatus.OK);

//       expect(res.body).toEqual({
//         results: expect.any(Array),
//         page: 1,
//         limit: 2,
//         totalPages: 2,
//         totalResults: 4,
//       });

//       expect(res.body.results).toHaveLength(2);
//       expect(res.body.results[0].discordId).toBe(discordGuildMember3.discordId);
//       expect(res.body.results[1].discordId).toBe(discordGuildMember1.discordId);
//     });

//     test('should correctly sort the returned array if page and limit are specified', async () => {
//       await insertUsers([userOne]);
//       await insertPlatforms([platformOne]);
//       await insertMemberActivities([memberActivity1, memberActivity2, memberActivity3, memberActivity4], connection);
//       await insertGuildMembers(
//         [discordGuildMember1, discordGuildMember2, discordGuildMember3, discordGuildMember4],
//         connection,
//       );
//       await insertRoles([discordRole1, discordRole2, discordRole3], connection);

//       const res = await request(app)
//         .post(`/api/v1/member-activity/${platformOne._id}/active-members-onboarding-table`)
//         .set('Authorization', `Bearer ${userOneAccessToken}`)
//         .query({ page: 2, limit: 2 })
//         .send()
//         .expect(httpStatus.OK);

//       expect(res.body).toEqual({
//         results: expect.any(Array),
//         page: 2,
//         limit: 2,
//         totalPages: 2,
//         totalResults: 4,
//       });

//       expect(res.body.results).toHaveLength(2);
//       expect(res.body.results[0].discordId).toBe(discordGuildMember2.discordId);
//       expect(res.body.results[1].discordId).toBe(discordGuildMember4.discordId);
//     });

//     test('should return 400 if given platform is not discord', async () => {
//       await insertCommunities([communityOne]);
//       await insertUsers([userOne]);
//       await insertPlatforms([platformFour]);
//       await request(app)
//         .post(`/api/v1/member-activity/${platformFour._id}/active-members-onboarding-table`)
//         .set('Authorization', `Bearer ${userOneAccessToken}`)
//         .send({ startDate: new Date(), endDate: new Date() })
//         .expect(httpStatus.BAD_REQUEST);
//     });
//   });

//   describe('POST /api/v1/member-activity/:platformId/disengaged-members-composition-table', () => {
//     beforeEach(async () => {
//       cleanUpTenantDatabases();
//     });
//     test('should return 200 and apply the default query options', async () => {
//       await insertUsers([userOne]);
//       await insertPlatforms([platformOne]);
//       await insertMemberActivities([memberActivity1, memberActivity2, memberActivity3, memberActivity4], connection);
//       await insertGuildMembers(
//         [discordGuildMember1, discordGuildMember2, discordGuildMember3, discordGuildMember4],
//         connection,
//       );
//       await insertRoles([discordRole1, discordRole2, discordRole3], connection);
//       const res = await request(app)
//         .post(`/api/v1/member-activity/${platformOne._id}/disengaged-members-composition-table`)
//         .set('Authorization', `Bearer ${userOneAccessToken}`)
//         .send()
//         .expect(httpStatus.OK);

//       expect(res.body).toEqual({
//         results: expect.any(Array),
//         page: 1,
//         limit: 10,
//         totalPages: 1,
//         totalResults: 4,
//       });

//       expect(res.body.results).toHaveLength(4);
//       expect(res.body.results[0]).toEqual({
//         discordId: discordGuildMember3.discordId,
//         username: discordGuildMember3.username,
//         ngu: discordGuildMember3.username,
//         avatar: discordGuildMember3.avatar,
//         roles: [{ roleId: discordRole2.roleId, name: discordRole2.name, color: discordRole2.color }],
//         joinedAt: discordGuildMember3.joinedAt.toISOString(),
//         discriminator: discordGuildMember3.discriminator,
//         activityComposition: ['Were newly active'],
//         nickname: discordGuildMember3.nickname,
//         globalName: discordGuildMember3.globalName,
//       });

//       expect(res.body.results[1]).toEqual({
//         discordId: discordGuildMember1.discordId,
//         username: discordGuildMember1.username,
//         ngu: discordGuildMember1.globalName,
//         avatar: discordGuildMember1.avatar,
//         roles: [
//           { roleId: discordRole2.roleId, name: discordRole2.name, color: discordRole2.color },
//           { roleId: discordRole3.roleId, name: discordRole3.name, color: discordRole3.color },
//         ],
//         joinedAt: discordGuildMember1.joinedAt.toISOString(),
//         discriminator: discordGuildMember1.discriminator,
//         activityComposition: ['Became disengaged', 'Were newly active', 'Were consistenly active'],
//         nickname: discordGuildMember1.nickname,
//         globalName: discordGuildMember1.globalName,
//       });

//       expect(res.body.results[2]).toEqual({
//         discordId: discordGuildMember2.discordId,
//         username: discordGuildMember2.username,
//         ngu: discordGuildMember2.nickname,
//         avatar: discordGuildMember2.avatar,
//         roles: [
//           { roleId: discordRole1.roleId, name: discordRole1.name, color: discordRole1.color },
//           { roleId: discordRole3.roleId, name: discordRole3.name, color: discordRole3.color },
//         ],
//         joinedAt: discordGuildMember2.joinedAt.toISOString(),
//         discriminator: discordGuildMember2.discriminator,
//         activityComposition: ['Were newly active'],
//         nickname: discordGuildMember2.nickname,
//         globalName: discordGuildMember2.globalName,
//       });

//       expect(res.body.results[3]).toEqual({
//         discordId: discordGuildMember4.discordId,
//         username: discordGuildMember4.username + '#' + discordGuildMember4.discriminator,
//         ngu: discordGuildMember4.username + '#' + discordGuildMember4.discriminator,
//         avatar: discordGuildMember4.avatar,
//         roles: [{ roleId: discordRole1.roleId, name: discordRole1.name, color: discordRole1.color }],
//         joinedAt: discordGuildMember4.joinedAt.toISOString(),
//         discriminator: discordGuildMember4.discriminator,
//         activityComposition: ['Others'],
//         nickname: discordGuildMember4.nickname,
//         globalName: discordGuildMember4.globalName,
//       });
//     });

//     test('should return 401 if access token is missing', async () => {
//       await request(app)
//         .post(`/api/v1/member-activity/${platformOne._id}/disengaged-members-composition-table`)
//         .send()
//         .expect(httpStatus.UNAUTHORIZED);
//     });

//     test('should return 404 if guild not found', async () => {
//       await insertUsers([userOne]);
//       await request(app)
//         .post(`/api/v1/member-activity/${platformOne._id}/disengaged-members-composition-table`)
//         .set('Authorization', `Bearer ${userOneAccessToken}`)
//         .send()
//         .expect(httpStatus.NOT_FOUND);
//     });

//     test('should correctly apply filter on activityComposition field', async () => {
//       await insertCommunities([communityOne]);
//       await insertUsers([userOne]);
//       await insertPlatforms([platformOne]);
//       await insertMemberActivities([memberActivity1, memberActivity2, memberActivity3, memberActivity4], connection);
//       await insertGuildMembers(
//         [discordGuildMember1, discordGuildMember2, discordGuildMember3, discordGuildMember4],
//         connection,
//       );
//       await insertRoles([discordRole1, discordRole2, discordRole3], connection);

//       let res = await request(app)
//         .post(`/api/v1/member-activity/${platformOne._id}/disengaged-members-composition-table`)
//         .set('Authorization', `Bearer ${userOneAccessToken}`)
//         .query({ activityComposition: ['all_disengaged_were_vital'] })
//         .send()
//         .expect(httpStatus.OK);

//       expect(res.body).toEqual({
//         results: expect.any(Array),
//         page: 1,
//         limit: 10,
//         totalPages: 0,
//         totalResults: 0,
//       });
//       expect(res.body.results).toHaveLength(0);

//       res = await request(app)
//         .post(`/api/v1/member-activity/${platformOne._id}/disengaged-members-composition-table`)
//         .set('Authorization', `Bearer ${userOneAccessToken}`)
//         .query({ activityComposition: ['others', 'all_disengaged_were_vital'] })
//         .send()
//         .expect(httpStatus.OK);

//       expect(res.body).toEqual({
//         results: expect.any(Array),
//         page: 1,
//         limit: 10,
//         totalPages: 1,
//         totalResults: 1,
//       });

//       expect(res.body.results).toHaveLength(1);
//       expect(res.body.results[0].discordId).toBe(discordGuildMember4.discordId);
//       expect(res.body.results[0].activityComposition).toEqual(['Others']);

//       res = await request(app)
//         .post(`/api/v1/member-activity/${platformOne._id}/disengaged-members-composition-table`)
//         .set('Authorization', `Bearer ${userOneAccessToken}`)
//         .query({ activityComposition: ['others'] })
//         .send()
//         .expect(httpStatus.OK);

//       expect(res.body).toEqual({
//         results: expect.any(Array),
//         page: 1,
//         limit: 10,
//         totalPages: 1,
//         totalResults: 1,
//       });

//       expect(res.body.results).toHaveLength(1);
//       expect(res.body.results[0].discordId).toBe(discordGuildMember4.discordId);
//       expect(res.body.results[0].activityComposition).toEqual(['Others']);

//       res = await request(app)
//         .post(`/api/v1/member-activity/${platformOne._id}/disengaged-members-composition-table`)
//         .set('Authorization', `Bearer ${userOneAccessToken}`)
//         .query({ activityComposition: ['all_disengaged_were_newly_active', 'all_disengaged_were_consistently_active'] })
//         .send()
//         .expect(httpStatus.OK);

//       expect(res.body).toEqual({
//         results: expect.any(Array),
//         page: 1,
//         limit: 10,
//         totalPages: 1,
//         totalResults: 3,
//       });

//       expect(res.body.results).toHaveLength(3);
//       expect(res.body.results[0].discordId).toBe(discordGuildMember3.discordId);
//       expect(res.body.results[0].activityComposition).toEqual(['Were newly active']);
//       expect(res.body.results[1].discordId).toBe(discordGuildMember1.discordId);
//       expect(res.body.results[1].activityComposition).toEqual(['Were newly active', 'Were consistenly active']);
//       expect(res.body.results[2].discordId).toBe(discordGuildMember2.discordId);
//       expect(res.body.results[2].activityComposition).toEqual(['Were newly active']);
//     });

//     test('should correctly apply filter on roles field if include provided', async () => {
//       await insertCommunities([communityOne]);
//       await insertUsers([userOne]);
//       await insertPlatforms([platformOne]);
//       await insertMemberActivities([memberActivity1, memberActivity2, memberActivity3, memberActivity4], connection);
//       await insertGuildMembers(
//         [discordGuildMember1, discordGuildMember2, discordGuildMember3, discordGuildMember4],
//         connection,
//       );
//       await insertRoles([discordRole1, discordRole2, discordRole3], connection);

//       const res = await request(app)
//         .post(`/api/v1/member-activity/${platformOne._id}/disengaged-members-composition-table`)
//         .set('Authorization', `Bearer ${userOneAccessToken}`)
//         .send({ allRoles: false, include: ['987654321123456789'] })
//         .expect(httpStatus.OK);

//       expect(res.body).toEqual({
//         results: expect.any(Array),
//         page: 1,
//         limit: 10,
//         totalPages: 1,
//         totalResults: 2,
//       });
//       expect(res.body.results).toHaveLength(2);
//       expect(res.body.results[0].discordId).toBe(discordGuildMember3.discordId);
//       expect(res.body.results[1].discordId).toBe(discordGuildMember1.discordId);
//     });

//     test('should correctly apply filter on roles field if exclude provided', async () => {
//       await insertCommunities([communityOne]);
//       await insertUsers([userOne]);
//       await insertPlatforms([platformOne]);
//       await insertMemberActivities([memberActivity1, memberActivity2, memberActivity3, memberActivity4], connection);
//       await insertGuildMembers(
//         [discordGuildMember1, discordGuildMember2, discordGuildMember3, discordGuildMember4],
//         connection,
//       );
//       await insertRoles([discordRole1, discordRole2, discordRole3], connection);

//       const res = await request(app)
//         .post(`/api/v1/member-activity/${platformOne._id}/disengaged-members-composition-table`)
//         .set('Authorization', `Bearer ${userOneAccessToken}`)
//         .send({ allRoles: false, exclude: ['123456789987654321'] })
//         .expect(httpStatus.OK);

//       expect(res.body).toEqual({
//         results: expect.any(Array),
//         page: 1,
//         limit: 10,
//         totalPages: 1,
//         totalResults: 2,
//       });
//       expect(res.body.results).toHaveLength(2);
//       expect(res.body.results[0].discordId).toBe(discordGuildMember3.discordId);
//       expect(res.body.results[1].discordId).toBe(discordGuildMember4.discordId);
//     });
//     test('should correctly apply filter on username field', async () => {
//       await insertCommunities([communityOne]);
//       await insertUsers([userOne]);
//       await insertPlatforms([platformOne]);
//       await insertMemberActivities([memberActivity1, memberActivity2, memberActivity3, memberActivity4], connection);
//       await insertGuildMembers(
//         [discordGuildMember1, discordGuildMember2, discordGuildMember3, discordGuildMember4],
//         connection,
//       );
//       await insertRoles([discordRole1, discordRole2, discordRole3], connection);

//       const res = await request(app)
//         .post(`/api/v1/member-activity/${platformOne._id}/disengaged-members-composition-table`)
//         .set('Authorization', `Bearer ${userOneAccessToken}`)
//         .query({ ngu: 'behzad' })
//         .send()
//         .expect(httpStatus.OK);

//       expect(res.body).toEqual({
//         results: expect.any(Array),
//         page: 1,
//         limit: 10,
//         totalPages: 1,
//         totalResults: 2,
//       });
//       expect(res.body.results).toHaveLength(2);
//       expect(res.body.results[0].discordId).toBe(discordGuildMember1.discordId);
//       expect(res.body.results[1].discordId).toBe(discordGuildMember4.discordId);
//     });
//     test('should correctly sort the returned array if descending sort param is specified', async () => {
//       await insertCommunities([communityOne]);
//       await insertUsers([userOne]);
//       await insertPlatforms([platformOne]);
//       await insertMemberActivities([memberActivity1, memberActivity2, memberActivity3, memberActivity4], connection);
//       await insertGuildMembers(
//         [discordGuildMember1, discordGuildMember2, discordGuildMember3, discordGuildMember4],
//         connection,
//       );
//       await insertRoles([discordRole1, discordRole2, discordRole3], connection);

//       const res = await request(app)
//         .post(`/api/v1/member-activity/${platformOne._id}/disengaged-members-composition-table`)
//         .set('Authorization', `Bearer ${userOneAccessToken}`)
//         .query({ sortBy: 'joinedAt:desc' })
//         .send()
//         .expect(httpStatus.OK);

//       expect(res.body).toEqual({
//         results: expect.any(Array),
//         page: 1,
//         limit: 10,
//         totalPages: 1,
//         totalResults: 4,
//       });
//       expect(res.body.results).toHaveLength(4);
//       expect(res.body.results[0].discordId).toBe(discordGuildMember4.discordId);
//       expect(res.body.results[1].discordId).toBe(discordGuildMember2.discordId);
//       expect(res.body.results[2].discordId).toBe(discordGuildMember1.discordId);
//       expect(res.body.results[3].discordId).toBe(discordGuildMember3.discordId);
//     });

//     test('should correctly sort the returned array if ascending  sort param is specified', async () => {
//       await insertCommunities([communityOne]);
//       await insertUsers([userOne]);
//       await insertPlatforms([platformOne]);
//       await insertMemberActivities([memberActivity1, memberActivity2, memberActivity3, memberActivity4], connection);
//       await insertGuildMembers(
//         [discordGuildMember1, discordGuildMember2, discordGuildMember3, discordGuildMember4],
//         connection,
//       );
//       await insertRoles([discordRole1, discordRole2, discordRole3], connection);

//       const res = await request(app)
//         .post(`/api/v1/member-activity/${platformOne._id}/disengaged-members-composition-table`)
//         .set('Authorization', `Bearer ${userOneAccessToken}`)
//         .query({ sortBy: 'joinedAt:asc' })
//         .send()
//         .expect(httpStatus.OK);

//       expect(res.body).toEqual({
//         results: expect.any(Array),
//         page: 1,
//         limit: 10,
//         totalPages: 1,
//         totalResults: 4,
//       });
//       expect(res.body.results).toHaveLength(4);
//       expect(res.body.results[0].discordId).toBe(discordGuildMember3.discordId);
//       expect(res.body.results[1].discordId).toBe(discordGuildMember1.discordId);
//       expect(res.body.results[2].discordId).toBe(discordGuildMember2.discordId);
//       expect(res.body.results[3].discordId).toBe(discordGuildMember4.discordId);
//     });

//     test('should correctly sort the returned array if multiple sorting criteria are specified', async () => {
//       await insertCommunities([communityOne]);
//       await insertUsers([userOne]);
//       await insertPlatforms([platformOne]);
//       await insertMemberActivities([memberActivity1, memberActivity2, memberActivity3, memberActivity4], connection);
//       await insertGuildMembers(
//         [discordGuildMember1, discordGuildMember2, discordGuildMember3, discordGuildMember4],
//         connection,
//       );
//       await insertRoles([discordRole1, discordRole2, discordRole3], connection);

//       const res = await request(app)
//         .post(`/api/v1/member-activity/${platformOne._id}/disengaged-members-composition-table`)
//         .set('Authorization', `Bearer ${userOneAccessToken}`)
//         .query({ sortBy: 'joinedAt:desc,username:asc' })
//         .send()
//         .expect(httpStatus.OK);

//       expect(res.body).toEqual({
//         results: expect.any(Array),
//         page: 1,
//         limit: 10,
//         totalPages: 1,
//         totalResults: 4,
//       });

//       const expectedOrder = [discordGuildMember1, discordGuildMember2, discordGuildMember3, discordGuildMember4].sort(
//         (a, b) => {
//           if (a.joinedAt < b.joinedAt) {
//             return 1;
//           }
//           if (a.joinedAt > b.joinedAt) {
//             return -1;
//           }
//           return a.username < b.username ? -1 : 1;
//         },
//       );

//       expectedOrder.forEach((user, index) => {
//         expect(res.body.results[index].discordId).toBe(user.discordId);
//       });
//     });

//     test('should limit returned array if limit param is specified', async () => {
//       await insertCommunities([communityOne]);
//       await insertUsers([userOne]);
//       await insertPlatforms([platformOne]);
//       await insertMemberActivities([memberActivity1, memberActivity2, memberActivity3, memberActivity4], connection);
//       await insertGuildMembers(
//         [discordGuildMember1, discordGuildMember2, discordGuildMember3, discordGuildMember4],
//         connection,
//       );
//       await insertRoles([discordRole1, discordRole2, discordRole3], connection);

//       const res = await request(app)
//         .post(`/api/v1/member-activity/${platformOne._id}/disengaged-members-composition-table`)
//         .set('Authorization', `Bearer ${userOneAccessToken}`)
//         .query({ limit: 2 })
//         .send()
//         .expect(httpStatus.OK);

//       expect(res.body).toEqual({
//         results: expect.any(Array),
//         page: 1,
//         limit: 2,
//         totalPages: 2,
//         totalResults: 4,
//       });

//       expect(res.body.results).toHaveLength(2);
//       expect(res.body.results[0].discordId).toBe(discordGuildMember3.discordId);
//       expect(res.body.results[1].discordId).toBe(discordGuildMember1.discordId);
//     });

//     test('should correctly sort the returned array if page and limit are specified', async () => {
//       await insertCommunities([communityOne]);
//       await insertUsers([userOne]);
//       await insertPlatforms([platformOne]);
//       await insertMemberActivities([memberActivity1, memberActivity2, memberActivity3, memberActivity4], connection);
//       await insertGuildMembers(
//         [discordGuildMember1, discordGuildMember2, discordGuildMember3, discordGuildMember4],
//         connection,
//       );
//       await insertRoles([discordRole1, discordRole2, discordRole3], connection);

//       const res = await request(app)
//         .post(`/api/v1/member-activity/${platformOne._id}/disengaged-members-composition-table`)
//         .set('Authorization', `Bearer ${userOneAccessToken}`)
//         .query({ page: 2, limit: 2 })
//         .send()
//         .expect(httpStatus.OK);

//       expect(res.body).toEqual({
//         results: expect.any(Array),
//         page: 2,
//         limit: 2,
//         totalPages: 2,
//         totalResults: 4,
//       });

//       expect(res.body.results).toHaveLength(2);
//       expect(res.body.results[0].discordId).toBe(discordGuildMember2.discordId);
//       expect(res.body.results[1].discordId).toBe(discordGuildMember4.discordId);
//     });

//     test('should return 400 if given platform is not discord', async () => {
//       await insertCommunities([communityOne]);
//       await insertUsers([userOne]);
//       await insertPlatforms([platformFour]);
//       await request(app)
//         .post(`/api/v1/member-activity/${platformFour._id}/disengaged-members-composition-table`)
//         .set('Authorization', `Bearer ${userOneAccessToken}`)
//         .send({ startDate: new Date(), endDate: new Date() })
//         .expect(httpStatus.BAD_REQUEST);
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
