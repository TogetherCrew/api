// import request from 'supertest';
// import httpStatus from 'http-status';
// import app from '../../src/app';
// import setupTestDB, { cleanUpTenantDatabases } from '../utils/setupTestDB';
// import { userOne, insertUsers, userTwo } from '../fixtures/user.fixture';
// import { userOneAccessToken } from '../fixtures/token.fixture';
// import { Platform, Community, IPlatformUpdateBody, DatabaseManager } from '@togethercrew.dev/db';
// import { communityOne, communityTwo, communityThree, insertCommunities } from '../fixtures/community.fixture';

// import {
//   platformOne,
//   platformTwo,
//   platformThree,
//   platformFour,
//   platformFive,
//   insertPlatforms,
// } from '../fixtures/platform.fixture';
// import { discordRole1, discordRole2, discordRole3, discordRole4, insertRoles } from '../fixtures/discord/roles.fixture';
// import {
//   discordChannel1,
//   discordChannel2,
//   discordChannel3,
//   discordChannel4,
//   discordChannel5,
//   insertChannels,
// } from '../fixtures/discord/channels.fixture';
// import {
//   discordGuildMember1,
//   discordGuildMember2,
//   discordGuildMember3,
//   discordGuildMember4,
//   insertGuildMembers,
// } from '../fixtures/discord/guildMember.fixture';
// import { discordServices } from '../../src/services';
// import { analyzerAction, analyzerWindow } from '../../src/config/analyzer.statics';
// import { Connection } from 'mongoose';
// import mongoose from 'mongoose';

// setupTestDB();

// describe('Platform routes', () => {
//   let connection: Connection;
//   beforeAll(async () => {
//     connection = await DatabaseManager.getInstance().getTenantDb(platformOne.metadata?.id);
//   });
//   beforeEach(async () => {
//     cleanUpTenantDatabases();
//     userOne.communities = [communityOne._id, communityTwo._id];
//     userTwo.communities = [communityThree._id];

//     communityOne.users = [userOne._id];
//     communityTwo.users = [userOne._id];
//     communityThree.users = [userTwo._id];

//     communityOne.platforms = [platformOne._id, platformTwo._id, platformFive._id];
//     communityTwo.platforms = [platformThree._id];
//     communityThree.platforms = [platformFour._id];

//     platformOne.community = communityOne._id;
//     platformTwo.community = communityOne._id;
//     platformThree.community = communityTwo._id;
//     platformFour.community = communityThree._id;
//     platformFive.community = communityOne._id;
//   });
//   describe('POST api/v1/platforms', () => {
//     beforeEach(async () => {
//       cleanUpTenantDatabases();
//     });
//     // eslint-disable-next-line @typescript-eslint/no-explicit-any
//     let newPlatform: any;

//     beforeEach(async () => {
//       await connection.collection('connection-platform').deleteMany({});
//       newPlatform = {
//         name: 'discord',
//         community: communityOne._id,
//         metadata: {
//           id: '1234',
//           name: 'guild',
//           icon: 'path',
//         },
//       };
//     });

//     test('should return 201 and successfully create new discord platform if data is ok', async () => {
//       userOne.communities = [communityOne._id];
//       communityOne.users = [userOne._id];
//       await insertCommunities([communityOne]);
//       await insertUsers([userOne]);

//       const res = await request(app)
//         .post(`/api/v1/platforms`)
//         .set('Authorization', `Bearer ${userOneAccessToken}`)
//         .send(newPlatform)
//         .expect(httpStatus.CREATED);

//       expect(res.body).toEqual({
//         id: expect.anything(),
//         name: newPlatform.name,
//         metadata: { ...newPlatform.metadata, action: analyzerAction, window: analyzerWindow },
//         community: communityOne._id.toHexString(),
//         disconnectedAt: null,
//         connectedAt: expect.anything(),
//       });

//       const dbPlatform = await Platform.findById(res.body.id);
//       expect(dbPlatform).toBeDefined();
//       expect(dbPlatform).toMatchObject({
//         name: newPlatform.name,
//         metadata: newPlatform.metadata,
//       });

//       const dbCommunity = await Community.findById(res.body.community);
//       expect(dbCommunity).toMatchObject({
//         id: communityOne._id.toHexString(),
//         name: communityOne.name,
//         avatarURL: communityOne.avatarURL,
//         users: [userOne._id],
//       });
//     });

//     test('should return 201 and successfully create new google platform if data is ok', async () => {
//       userOne.communities = [communityOne._id];
//       communityOne.users = [userOne._id];
//       await insertCommunities([communityOne]);
//       await insertUsers([userOne]);
//       newPlatform = {
//         name: 'google',
//         community: communityOne._id,
//         metadata: {
//           userId: userOne._id.toHexString(),
//           id: 'id',
//           name: 'name',
//           picture: 'picture',
//         },
//       };
//       const res = await request(app)
//         .post(`/api/v1/platforms`)
//         .set('Authorization', `Bearer ${userOneAccessToken}`)
//         .send(newPlatform)
//         .expect(httpStatus.CREATED);

//       expect(res.body).toEqual({
//         id: expect.anything(),
//         name: newPlatform.name,
//         metadata: { userId: userOne._id.toHexString(), ...newPlatform.metadata },
//         community: communityOne._id.toHexString(),
//         disconnectedAt: null,
//         connectedAt: expect.anything(),
//       });

//       const dbPlatform = await Platform.findById(res.body.id);
//       expect(dbPlatform).toBeDefined();
//       expect(dbPlatform).toMatchObject({
//         name: newPlatform.name,
//         metadata: newPlatform.metadata,
//       });

//       const dbCommunity = await Community.findById(res.body.community);
//       expect(dbCommunity).toMatchObject({
//         id: communityOne._id.toHexString(),
//         name: communityOne.name,
//         avatarURL: communityOne.avatarURL,
//         users: [userOne._id],
//       });
//     });

//     test('should return 201 and successfully create new github platform if data is ok', async () => {
//       userOne.communities = [communityOne._id];
//       communityOne.users = [userOne._id];
//       await insertCommunities([communityOne]);
//       await insertUsers([userOne]);
//       newPlatform = {
//         name: 'github',
//         community: communityOne._id,
//         metadata: {
//           installationId: 'id',
//           account: {
//             login: 'login',
//             id: 'id',
//             avatarUrl: 'url',
//           },
//         },
//       };
//       const res = await request(app)
//         .post(`/api/v1/platforms`)
//         .set('Authorization', `Bearer ${userOneAccessToken}`)
//         .send(newPlatform)
//         .expect(httpStatus.CREATED);

//       expect(res.body).toEqual({
//         id: expect.anything(),
//         name: newPlatform.name,
//         metadata: newPlatform.metadata,
//         community: communityOne._id.toHexString(),
//         disconnectedAt: null,
//         connectedAt: expect.anything(),
//       });

//       const dbPlatform = await Platform.findById(res.body.id);
//       expect(dbPlatform).toBeDefined();
//       expect(dbPlatform).toMatchObject({
//         name: newPlatform.name,
//         metadata: newPlatform.metadata,
//       });

//       const dbCommunity = await Community.findById(res.body.community);
//       expect(dbCommunity).toMatchObject({
//         id: communityOne._id.toHexString(),
//         name: communityOne.name,
//         avatarURL: communityOne.avatarURL,
//         users: [userOne._id],
//       });
//     });

//     test('should return 201 and successfully create new notion platform if data is ok', async () => {
//       userOne.communities = [communityOne._id];
//       communityOne.users = [userOne._id];
//       await insertCommunities([communityOne]);
//       await insertUsers([userOne]);
//       newPlatform = {
//         name: 'notion',
//         community: communityOne._id,
//         metadata: {
//           userId: userOne._id.toHexString(),
//           bot_id: 'botId',
//           request_id: 'requestId',
//           workspace_name: 'wsn',
//           workspace_icon: 'wsi',
//           workspace_id: 'wsId',
//           owner: {
//             type: 'type',
//             user: {
//               type: 'user',
//               object: 'object',
//               id: 'id',
//               name: 'name',
//               avatar_url: 'avatarURL',
//             },
//           },
//         },
//       };
//       const res = await request(app)
//         .post(`/api/v1/platforms`)
//         .set('Authorization', `Bearer ${userOneAccessToken}`)
//         .send(newPlatform)
//         .expect(httpStatus.CREATED);

//       expect(res.body).toEqual({
//         id: expect.anything(),
//         name: newPlatform.name,
//         metadata: { userId: userOne._id.toHexString(), ...newPlatform.metadata },
//         community: communityOne._id.toHexString(),
//         disconnectedAt: null,
//         connectedAt: expect.anything(),
//       });

//       const dbPlatform = await Platform.findById(res.body.id);
//       expect(dbPlatform).toBeDefined();
//       expect(dbPlatform).toMatchObject({
//         name: newPlatform.name,
//         metadata: newPlatform.metadata,
//       });

//       const dbCommunity = await Community.findById(res.body.community);
//       expect(dbCommunity).toMatchObject({
//         id: communityOne._id.toHexString(),
//         name: communityOne.name,
//         avatarURL: communityOne.avatarURL,
//         users: [userOne._id],
//       });
//     });

//     test('should return 201 and successfully create new mediaWiki platform if data is ok', async () => {
//       userOne.communities = [communityOne._id];
//       communityOne.users = [userOne._id];
//       await insertCommunities([communityOne]);
//       await insertUsers([userOne]);
//       newPlatform = {
//         name: 'mediaWiki',
//         community: communityOne._id,
//         metadata: {
//           baseURL: 'base',
//           path: '/w/api.php',
//         },
//       };
//       const res = await request(app)
//         .post(`/api/v1/platforms`)
//         .set('Authorization', `Bearer ${userOneAccessToken}`)
//         .send(newPlatform)
//         .expect(httpStatus.CREATED);

//       expect(res.body).toEqual({
//         id: expect.anything(),
//         name: newPlatform.name,
//         metadata: newPlatform.metadata,
//         community: communityOne._id.toHexString(),
//         disconnectedAt: null,
//         connectedAt: expect.anything(),
//       });

//       const dbPlatform = await Platform.findById(res.body.id);
//       expect(dbPlatform).toBeDefined();
//       expect(dbPlatform).toMatchObject({
//         name: newPlatform.name,
//         metadata: newPlatform.metadata,
//       });

//       const dbCommunity = await Community.findById(res.body.community);
//       expect(dbCommunity).toMatchObject({
//         id: communityOne._id.toHexString(),
//         name: communityOne.name,
//         avatarURL: communityOne.avatarURL,
//         users: [userOne._id],
//       });
//     });

//     test('should return 201 and successfully connect a disconneced platform if data is ok', async () => {
//       userOne.communities = [communityOne._id];
//       communityOne.users = [userOne._id];
//       await insertCommunities([communityOne]);
//       await insertUsers([userOne]);
//       platformOne.disconnectedAt = new Date();
//       await insertPlatforms([platformOne]);
//       platformOne.disconnectedAt = null;
//       newPlatform.metadata.id = platformOne.metadata?.id;

//       const res = await request(app)
//         .post(`/api/v1/platforms`)
//         .set('Authorization', `Bearer ${userOneAccessToken}`)
//         .send(newPlatform)
//         .expect(httpStatus.CREATED);

//       expect(res.body).toEqual({
//         id: expect.anything(),
//         name: platformOne.name,
//         metadata: platformOne.metadata,
//         community: communityOne._id.toHexString(),
//         disconnectedAt: null,
//         connectedAt: expect.anything(),
//       });

//       const dbPlatform = await Platform.findById(res.body.id);
//       expect(dbPlatform).toBeDefined();
//       expect(dbPlatform).toMatchObject({
//         name: platformOne.name,
//         metadata: platformOne.metadata,
//         disconnectedAt: null,
//       });
//     });

//     test('should return 401 error if access token is missing', async () => {
//       await request(app).post(`/api/v1/platforms`).send(newPlatform).expect(httpStatus.UNAUTHORIZED);
//     });

//     test('should return 400 error if user trys to connect a connected platform', async () => {
//       await insertCommunities([communityOne]);
//       await insertUsers([userOne]);
//       await insertPlatforms([platformOne]);
//       newPlatform.metadata.id = platformOne.metadata?.id;
//       const res = await request(app)
//         .post(`/api/v1/platforms`)
//         .set('Authorization', `Bearer ${userOneAccessToken}`)
//         .send(newPlatform)
//         .expect(httpStatus.BAD_REQUEST);

//       expect(res.body.message).toBe(
//         `Platform ${newPlatform.name} with specified metadata is already connected to this community.`,
//       );
//     });

//     test('should return 400 error if user trys to connect a same platform', async () => {
//       await insertCommunities([communityOne]);
//       await insertUsers([userOne]);
//       await insertPlatforms([platformOne]);
//       const res = await request(app)
//         .post(`/api/v1/platforms`)
//         .set('Authorization', `Bearer ${userOneAccessToken}`)
//         .send(newPlatform)
//         .expect(httpStatus.BAD_REQUEST);

//       expect(res.body.message).toBe(`A platform of type '${newPlatform.name}' is already connected to this community.`);
//     });

//     test('should return 400 error if user trys to connect a platform which is already connected to another community', async () => {
//       await insertCommunities([communityOne, communityTwo]);
//       await insertUsers([userOne, userTwo]);
//       if (platformFour.metadata) {
//         platformFour.metadata.id = platformOne.metadata?.id;
//         newPlatform.metadata.id = platformOne.metadata?.id;
//         await insertPlatforms([platformFour]);
//         platformFour.metadata.id = '681946187490000802';
//       }
//       const res = await request(app)
//         .post(`/api/v1/platforms`)
//         .set('Authorization', `Bearer ${userOneAccessToken}`)
//         .send(newPlatform)
//         .expect(httpStatus.BAD_REQUEST);

//       expect(res.body.message).toBe('This platform is already connected to another community');
//     });

//     test('should return 400 error if name is invalid', async () => {
//       await insertCommunities([communityOne]);
//       await insertUsers([userOne]);
//       newPlatform.name = 'invalid';
//       await request(app)
//         .post(`/api/v1/platforms`)
//         .set('Authorization', `Bearer ${userOneAccessToken}`)
//         .send(newPlatform)
//         .expect(httpStatus.BAD_REQUEST);
//     });

//     test('should return 400 error if community is invalid', async () => {
//       await insertCommunities([communityOne]);
//       await insertUsers([userOne]);
//       newPlatform.community = 'invalid';
//       await request(app)
//         .post(`/api/v1/platforms`)
//         .set('Authorization', `Bearer ${userOneAccessToken}`)
//         .send(newPlatform)
//         .expect(httpStatus.BAD_REQUEST);
//     });

//     test('should return 400 error if metadata is invalid based on the name field', async () => {
//       await insertCommunities([communityOne]);
//       await insertUsers([userOne]);
//       newPlatform.metadata = { username: 'str' };
//       await request(app)
//         .post(`/api/v1/platforms`)
//         .set('Authorization', `Bearer ${userOneAccessToken}`)
//         .send(newPlatform)
//         .expect(httpStatus.BAD_REQUEST);
//     });

//     test('should return 400 error if community is invalid', async () => {
//       await insertCommunities([communityOne]);
//       await insertUsers([userOne]);
//       newPlatform.community = 'invalid';
//       await request(app)
//         .post(`/api/v1/platforms`)
//         .set('Authorization', `Bearer ${userOneAccessToken}`)
//         .send(newPlatform)
//         .expect(httpStatus.BAD_REQUEST);
//     });
//   });
//   describe('GET /api/v1/platforms', () => {
//     beforeEach(async () => {
//       cleanUpTenantDatabases();
//     });
//     test('should return 200 and apply the default query options', async () => {
//       await insertCommunities([communityOne, communityTwo, communityThree]);
//       await insertUsers([userOne, userTwo]);
//       await insertPlatforms([platformOne, platformTwo, platformThree, platformFour, platformFive]);
//       const res = await request(app)
//         .get('/api/v1/platforms')
//         .set('Authorization', `Bearer ${userOneAccessToken}`)
//         .query({ community: communityOne._id.toHexString() })
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

//       expect(res.body.results[0]).toMatchObject({
//         id: platformTwo._id.toHexString(),
//         name: platformTwo.name,
//         metadata: platformTwo.metadata,
//         community: communityOne._id.toHexString(),
//       });

//       expect(res.body.results[1]).toMatchObject({
//         id: platformOne._id.toHexString(),
//         name: platformOne.name,
//         metadata: platformOne.metadata,
//         community: communityOne._id.toHexString(),
//       });
//     });

//     test('should return 401 if access token is missing', async () => {
//       await insertCommunities([communityOne, communityTwo, communityThree]);
//       await insertUsers([userOne, userTwo]);
//       await insertPlatforms([platformOne, platformTwo, platformThree, platformFour, platformFive]);
//       await request(app)
//         .get('/api/v1/platforms')
//         .query({ community: communityOne._id.toHexString() })
//         .send()
//         .expect(httpStatus.UNAUTHORIZED);
//     });

//     test('should correctly apply filter on name field', async () => {
//       await insertCommunities([communityOne, communityTwo, communityThree]);
//       await insertUsers([userOne, userTwo]);
//       await insertPlatforms([platformOne, platformTwo, platformThree, platformFour, platformFive]);
//       const res = await request(app)
//         .get('/api/v1/platforms')
//         .set('Authorization', `Bearer ${userOneAccessToken}`)
//         .query({ name: platformOne.name, community: communityOne._id.toHexString() })
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
//       expect(res.body.results[0].id).toBe(platformTwo._id.toHexString());
//       expect(res.body.results[1].id).toBe(platformOne._id.toHexString());
//     });

//     test('should correctly sort the returned array if descending sort param is specified', async () => {
//       await insertCommunities([communityOne, communityTwo, communityThree]);
//       await insertUsers([userOne, userTwo]);
//       await insertPlatforms([platformOne, platformTwo, platformThree, platformFour, platformFive]);
//       const res = await request(app)
//         .get('/api/v1/platforms')
//         .set('Authorization', `Bearer ${userOneAccessToken}`)
//         .query({ sortBy: 'name:desc', community: communityOne._id.toHexString() })
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
//       expect(res.body.results[0].id).toBe(platformOne._id.toHexString());
//       expect(res.body.results[1].id).toBe(platformTwo._id.toHexString());
//     });

//     test('should correctly sort the returned array if ascending sort param is specified', async () => {
//       await insertCommunities([communityOne, communityTwo, communityThree]);
//       await insertUsers([userOne, userTwo]);
//       await insertPlatforms([platformOne, platformTwo, platformThree, platformFour, platformFive]);
//       const res = await request(app)
//         .get('/api/v1/platforms')
//         .set('Authorization', `Bearer ${userOneAccessToken}`)
//         .query({ sortBy: 'name:asc', community: communityOne._id.toHexString() })
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
//       expect(res.body.results[0].id).toBe(platformOne._id.toHexString());
//       expect(res.body.results[1].id).toBe(platformTwo._id.toHexString());
//     });

//     test('should limit returned array if limit param is specified', async () => {
//       await insertCommunities([communityOne, communityTwo, communityThree]);
//       await insertUsers([userOne, userTwo]);
//       await insertPlatforms([platformOne, platformTwo, platformThree, platformFour, platformFive]);
//       const res = await request(app)
//         .get('/api/v1/platforms')
//         .set('Authorization', `Bearer ${userOneAccessToken}`)
//         .query({ limit: 1, community: communityOne._id.toHexString() })
//         .send()
//         .expect(httpStatus.OK);

//       expect(res.body).toEqual({
//         results: expect.any(Array),
//         page: 1,
//         limit: 1,
//         totalPages: 2,
//         totalResults: 2,
//       });
//       expect(res.body.results).toHaveLength(1);
//       expect(res.body.results[0].id).toBe(platformTwo._id.toHexString());
//     });

//     test('should return the correct page if page and limit params are specified', async () => {
//       await insertCommunities([communityOne, communityTwo, communityThree]);
//       await insertUsers([userOne, userTwo]);
//       await insertPlatforms([platformOne, platformTwo, platformThree, platformFour, platformFive]);
//       const res = await request(app)
//         .get('/api/v1/platforms')
//         .set('Authorization', `Bearer ${userOneAccessToken}`)
//         .query({ page: 2, limit: 1, community: communityOne._id.toHexString() })
//         .send()
//         .expect(httpStatus.OK);

//       expect(res.body).toEqual({
//         results: expect.any(Array),
//         page: 2,
//         limit: 1,
//         totalPages: 2,
//         totalResults: 2,
//       });
//       expect(res.body.results).toHaveLength(1);
//       expect(res.body.results[0].id).toBe(platformOne._id.toHexString());
//     });
//   });
//   describe('GET /api/v1/platforms/:platformId', () => {
//     beforeEach(async () => {
//       cleanUpTenantDatabases();
//     });
//     discordServices.coreService.getBotPermissions = jest.fn().mockReturnValue(['ViewChannel', 'ReadMessageHistory']);
//     test('should return 200 and the platform object if data is ok', async () => {
//       await insertCommunities([communityOne, communityTwo, communityThree]);
//       await insertUsers([userOne, userTwo]);
//       await insertPlatforms([platformOne, platformTwo, platformThree, platformFour, platformFive]);
//       const res = await request(app)
//         .get(`/api/v1/platforms/${platformOne._id}`)
//         .set('Authorization', `Bearer ${userOneAccessToken}`)
//         .send()
//         .expect(httpStatus.OK);

//       expect(res.body).toEqual({
//         id: expect.anything(),
//         name: platformOne.name,
//         metadata: {
//           ...platformOne.metadata,
//           permissions: {
//             ReadData: {
//               ViewChannel: true,
//               ReadMessageHistory: true,
//             },
//             Announcement: {
//               ViewChannel: true,
//               SendMessages: false,
//               SendMessagesInThreads: false,
//               CreatePublicThreads: false,
//               CreatePrivateThreads: false,
//               EmbedLinks: false,
//               AttachFiles: false,
//               MentionEveryone: false,
//               Connect: false,
//             },
//           },
//         },
//         community: communityOne._id.toHexString(),
//         disconnectedAt: null,
//         connectedAt: expect.anything(),
//       });
//     });

//     test('should return 401 error if access token is missing', async () => {
//       await insertUsers([userOne]);

//       await request(app).get(`/api/v1/platforms/${platformOne._id}`).send().expect(httpStatus.UNAUTHORIZED);
//     });

//     test('should return 403 when user trys to access platoform they does not belong to', async () => {
//       await insertCommunities([communityOne, communityTwo, communityThree]);
//       await insertUsers([userOne, userTwo]);
//       await insertPlatforms([platformOne, platformTwo, platformThree, platformFour, platformFive]);

//       await request(app)
//         .get(`/api/v1/platforms/${platformFour._id}`)
//         .set('Authorization', `Bearer ${userOneAccessToken}`)
//         .send()
//         .expect(httpStatus.FORBIDDEN);
//     });

//     test('should return 400 error if platformId is not a valid mongo id', async () => {
//       await insertUsers([userOne, userTwo]);
//       await request(app)
//         .get(`/api/v1/platforms/invalid`)
//         .set('Authorization', `Bearer ${userOneAccessToken}`)
//         .send()
//         .expect(httpStatus.BAD_REQUEST);
//     });

//     test('should return 404 error if platoform is not found', async () => {
//       await insertUsers([userOne]);

//       await request(app)
//         .get(`/api/v1/platforms/${platformOne._id}`)
//         .set('Authorization', `Bearer ${userOneAccessToken}`)
//         .send()
//         .expect(httpStatus.NOT_FOUND);
//     });
//   });
//   describe('PATCH /api/v1/platforms/:platformId', () => {
//     let updateBody: IPlatformUpdateBody;
//     beforeEach(() => {
//       cleanUpTenantDatabases();

//       updateBody = {
//         metadata: {
//           selectedChannels: ['8765', '1234'],
//           period: new Date(),
//           analyzerStartedAt: new Date(),
//         },
//       };
//     });
//     test('should return 200 and successfully update platform if data is ok', async () => {
//       await insertCommunities([communityOne, communityTwo]);
//       await insertUsers([userOne]);
//       await insertPlatforms([platformOne]);

//       const res = await request(app)
//         .patch(`/api/v1/platforms/${platformOne._id}`)
//         .set('Authorization', `Bearer ${userOneAccessToken}`)
//         .send(updateBody)
//         .expect(httpStatus.OK);

//       expect(res.body).toEqual({
//         id: expect.anything(),
//         name: platformOne.name,
//         metadata: {
//           id: platformOne.metadata?.id,
//           selectedChannels: updateBody.metadata?.selectedChannels,
//           period: updateBody.metadata?.period.toISOString(),
//           analyzerStartedAt: expect.anything(),
//         },
//         community: communityOne._id.toHexString(),
//         disconnectedAt: null,
//         connectedAt: expect.anything(),
//       });

//       const dbPlatform = await Platform.findById(res.body.id);
//       expect(dbPlatform).toBeDefined();
//       expect(dbPlatform).toMatchObject({
//         name: platformOne.name,
//         metadata: {
//           id: platformOne.metadata?.id,
//           selectedChannels: updateBody.metadata?.selectedChannels,
//           period: updateBody.metadata?.period,
//           analyzerStartedAt: expect.anything(),
//         },
//       });
//     });

//     test('should return 401 error if access token is missing', async () => {
//       await insertUsers([userOne]);
//       await request(app).patch(`/api/v1/platforms/${platformOne._id}`).send(updateBody).expect(httpStatus.UNAUTHORIZED);
//     });

//     test('should return 403 when user trys to update platform they does not belong to', async () => {
//       await insertCommunities([communityOne, communityTwo, communityThree]);
//       await insertUsers([userOne, userTwo]);
//       await insertPlatforms([platformOne, platformTwo, platformThree, platformFour, platformFive]);
//       await request(app)
//         .patch(`/api/v1/platforms/${platformFour._id}`)
//         .set('Authorization', `Bearer ${userOneAccessToken}`)
//         .send(updateBody)
//         .expect(httpStatus.FORBIDDEN);
//     });

//     test('should return 400 error if platformId is not a valid mongo id', async () => {
//       await insertCommunities([communityOne, communityTwo]);
//       await insertUsers([userOne]);
//       await insertPlatforms([platformOne]);
//       await request(app)
//         .patch(`/api/v1/platforms/invalid`)
//         .set('Authorization', `Bearer ${userOneAccessToken}`)
//         .send(updateBody)
//         .expect(httpStatus.BAD_REQUEST);
//     });

//     test('should return 400 error if metadata is invalid based on the name field', async () => {
//       await insertCommunities([communityOne, communityTwo]);
//       await insertUsers([userOne]);
//       await insertPlatforms([platformOne]);
//       updateBody.metadata = { id: '1234' };
//       await request(app)
//         .patch(`/api/v1/platforms/${platformOne._id}`)
//         .set('Authorization', `Bearer ${userOneAccessToken}`)
//         .send(updateBody)
//         .expect(httpStatus.BAD_REQUEST);
//     });

//     test('should return 400 error if metadata selectedChannels is invalid', async () => {
//       await insertCommunities([communityOne, communityTwo]);
//       await insertUsers([userOne]);
//       await insertPlatforms([platformOne]);
//       updateBody.metadata = { selectedChannels: '1234' };
//       await request(app)
//         .patch(`/api/v1/platforms/${platformOne._id}`)
//         .set('Authorization', `Bearer ${userOneAccessToken}`)
//         .send(updateBody)
//         .expect(httpStatus.BAD_REQUEST);
//     });

//     test('should return 400 error if metadata period is invalid', async () => {
//       await insertCommunities([communityOne, communityTwo]);
//       await insertUsers([userOne]);
//       await insertPlatforms([platformOne]);
//       updateBody.metadata = { period: false };
//       await request(app)
//         .patch(`/api/v1/platforms/${platformOne._id}`)
//         .set('Authorization', `Bearer ${userOneAccessToken}`)
//         .send(updateBody)
//         .expect(httpStatus.BAD_REQUEST);
//     });

//     test('should return 400 error if metadata analyzerStartedAt is invalid', async () => {
//       await insertCommunities([communityOne, communityTwo]);
//       await insertUsers([userOne]);
//       await insertPlatforms([platformOne]);
//       updateBody.metadata = { analyzerStartedAt: true };
//       await request(app)
//         .patch(`/api/v1/platforms/${platformOne._id}`)
//         .set('Authorization', `Bearer ${userOneAccessToken}`)
//         .send(updateBody)
//         .expect(httpStatus.BAD_REQUEST);
//     });

//     test('should return 400 error if isInprogress is true and user trys to update selectedChannel', async () => {
//       await insertCommunities([communityOne, communityTwo]);
//       await insertUsers([userOne]);
//       if (platformOne.metadata) platformOne.metadata.isInProgress = true;
//       await insertPlatforms([platformOne]);
//       if (platformOne.metadata) platformOne.metadata.isInProgress = false;
//       await request(app)
//         .patch(`/api/v1/platforms/${platformOne._id}`)
//         .set('Authorization', `Bearer ${userOneAccessToken}`)
//         .send(updateBody)
//         .expect(httpStatus.BAD_REQUEST);
//     });

//     test('should return 400 error if isInprogress is true and user trys to update period', async () => {
//       await insertCommunities([communityOne, communityTwo]);
//       await insertUsers([userOne]);
//       if (platformOne.metadata) platformOne.metadata.isInProgress = true;
//       await insertPlatforms([platformOne]);
//       if (platformOne.metadata) platformOne.metadata.isInProgress = false;
//       await request(app)
//         .patch(`/api/v1/platforms/${platformOne._id}`)
//         .set('Authorization', `Bearer ${userOneAccessToken}`)
//         .send(updateBody)
//         .expect(httpStatus.BAD_REQUEST);
//     });
//   });
//   describe('DELETE /api/v1/platforms/:platformId', () => {
//     beforeEach(async () => {
//       cleanUpTenantDatabases();
//     });
//     discordServices.coreService.leaveBotFromGuild = jest.fn().mockReturnValue(null);
//     test('should return 204 and soft delete the platform is deleteType is soft', async () => {
//       await insertCommunities([communityOne, communityTwo, communityThree]);
//       await insertUsers([userOne, userTwo]);
//       await insertPlatforms([platformOne, platformTwo, platformThree, platformFour, platformFive]);

//       await request(app)
//         .delete(`/api/v1/platforms/${platformOne._id}`)
//         .set('Authorization', `Bearer ${userOneAccessToken}`)
//         .send({ deleteType: 'soft' })
//         .expect(httpStatus.NO_CONTENT);

//       const dbPlatform = await Platform.findById(platformOne._id);
//       expect(dbPlatform).toBeDefined();
//       expect(dbPlatform).toMatchObject({
//         disconnectedAt: expect.any(Date),
//       });
//     });

//     test('should return 204 and hard delete the platform is deleteType is hard', async () => {
//       await insertCommunities([communityOne, communityTwo, communityThree]);
//       await insertUsers([userOne, userTwo]);
//       await insertPlatforms([platformOne, platformTwo, platformThree, platformFour, platformFive]);

//       const res = await request(app)
//         .delete(`/api/v1/platforms/${platformOne._id}`)
//         .set('Authorization', `Bearer ${userOneAccessToken}`)
//         .send({ deleteType: 'hard' })
//         .expect(httpStatus.NO_CONTENT);

//       const dbPlatform = await Platform.findById(res.body.id);
//       expect(dbPlatform).toBeNull();
//     });

//     test('should return 401 error if access token is missing', async () => {
//       await insertUsers([userOne]);
//       await request(app)
//         .delete(`/api/v1/platforms/${platformOne._id}`)
//         .send({ deleteType: 'hard' })
//         .expect(httpStatus.UNAUTHORIZED);
//     });

//     test('should return 403 when user trys to delete platform they does not belong to', async () => {
//       await insertCommunities([communityOne, communityTwo, communityThree]);
//       await insertUsers([userOne, userTwo]);
//       await insertPlatforms([platformOne, platformTwo, platformThree, platformFour, platformFive]);

//       await request(app)
//         .delete(`/api/v1/platforms/${platformFour._id}`)
//         .set('Authorization', `Bearer ${userOneAccessToken}`)
//         .send({ deleteType: 'hard' })
//         .expect(httpStatus.FORBIDDEN);
//     });

//     test('should return 400 error if platformId is not a valid mongo id', async () => {
//       await insertUsers([userOne]);

//       await request(app)
//         .delete(`/api/v1/platforms/invalid`)
//         .set('Authorization', `Bearer ${userOneAccessToken}`)
//         .send()
//         .expect(httpStatus.BAD_REQUEST);
//     });

//     test('should return 404 error if platform already is not found', async () => {
//       await insertUsers([userOne]);

//       await request(app)
//         .delete(`/api/v1/platforms/${platformOne._id}`)
//         .set('Authorization', `Bearer ${userOneAccessToken}`)
//         .send({ deleteType: 'hard' })
//         .expect(httpStatus.NOT_FOUND);
//     });
//   });
//   describe('POST /:platformId/properties', () => {
//     beforeEach(async () => {
//       cleanUpTenantDatabases();
//     });
//     discordServices.coreService.getBotPermissions = jest.fn().mockReturnValue(['ViewChannel', 'ReadMessageHistory']);
//     test('should return 200 and apply the default query options if requested property is discord-role', async () => {
//       await insertCommunities([communityOne]);
//       await insertUsers([userOne]);
//       await insertPlatforms([platformOne]);
//       await insertRoles([discordRole1, discordRole2, discordRole3, discordRole4], connection);

//       const res = await request(app)
//         .post(`/api/v1/platforms/${platformOne._id}/properties`)
//         .set('Authorization', `Bearer ${userOneAccessToken}`)
//         .query({ property: 'role' })
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

//       expect(res.body.results[0]).toMatchObject({
//         roleId: discordRole1.roleId,
//         name: discordRole1.name,
//         color: discordRole1.color,
//       });
//       expect(res.body.results[1]).toMatchObject({
//         roleId: discordRole2.roleId,
//         name: discordRole2.name,
//         color: discordRole2.color,
//       });

//       expect(res.body.results[2]).toMatchObject({
//         roleId: discordRole3.roleId,
//         name: discordRole3.name,
//         color: discordRole3.color,
//       });
//     });

//     test('should correctly apply filter on name field if requested property is discord-role', async () => {
//       await insertCommunities([communityOne]);
//       await insertUsers([userOne]);
//       await insertPlatforms([platformOne]);
//       await insertRoles([discordRole1, discordRole2, discordRole3, discordRole4], connection);

//       const res = await request(app)
//         .post(`/api/v1/platforms/${platformOne._id}/properties`)
//         .set('Authorization', `Bearer ${userOneAccessToken}`)
//         .query({ property: 'role', name: 'Member' })
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
//       expect(res.body.results[0].roleId).toBe(discordRole3.roleId);
//     });

//     test('should correctly sort the returned array if descending sort param is specified and requested property is discord-role', async () => {
//       await insertCommunities([communityOne]);
//       await insertUsers([userOne]);
//       await insertPlatforms([platformOne]);
//       await insertRoles([discordRole1, discordRole2, discordRole3, discordRole4], connection);

//       const res = await request(app)
//         .post(`/api/v1/platforms/${platformOne._id}/properties`)
//         .set('Authorization', `Bearer ${userOneAccessToken}`)
//         .query({ property: 'role', sortBy: 'name:desc' })
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
//       expect(res.body.results[0].roleId).toBe(discordRole2.roleId);
//       expect(res.body.results[1].roleId).toBe(discordRole3.roleId);
//       expect(res.body.results[2].roleId).toBe(discordRole1.roleId);
//     });

//     test('should correctly sort the returned array if ascending sort param is specified and requested property is discord-role', async () => {
//       await insertCommunities([communityOne]);
//       await insertUsers([userOne]);
//       await insertPlatforms([platformOne]);
//       await insertRoles([discordRole1, discordRole2, discordRole3, discordRole4], connection);

//       const res = await request(app)
//         .post(`/api/v1/platforms/${platformOne._id}/properties`)
//         .set('Authorization', `Bearer ${userOneAccessToken}`)
//         .query({ property: 'role', sortBy: 'name:asc' })
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
//       expect(res.body.results[0].roleId).toBe(discordRole1.roleId);
//       expect(res.body.results[1].roleId).toBe(discordRole3.roleId);
//       expect(res.body.results[2].roleId).toBe(discordRole2.roleId);
//     });

//     test('should limit returned array if limit param is specified and requested property is discord-role', async () => {
//       await insertCommunities([communityOne]);
//       await insertUsers([userOne]);
//       await insertPlatforms([platformOne]);
//       await insertRoles([discordRole1, discordRole2, discordRole3, discordRole4], connection);

//       const res = await request(app)
//         .post(`/api/v1/platforms/${platformOne._id}/properties`)
//         .set('Authorization', `Bearer ${userOneAccessToken}`)
//         .query({ property: 'role', limit: 1 })
//         .send()
//         .expect(httpStatus.OK);

//       expect(res.body).toEqual({
//         results: expect.any(Array),
//         page: 1,
//         limit: 1,
//         totalPages: 3,
//         totalResults: 3,
//       });
//       expect(res.body.results).toHaveLength(1);
//       expect(res.body.results[0].roleId).toBe(discordRole1.roleId);
//     });

//     test('should return the correct page if page and limit params are specified and requested property is discord-role', async () => {
//       await insertCommunities([communityOne]);
//       await insertUsers([userOne]);
//       await insertPlatforms([platformOne]);
//       await insertRoles([discordRole1, discordRole2, discordRole3, discordRole4], connection);

//       const res = await request(app)
//         .post(`/api/v1/platforms/${platformOne._id}/properties`)
//         .set('Authorization', `Bearer ${userOneAccessToken}`)
//         .query({ property: 'role', page: 2, limit: 1 })
//         .send()
//         .expect(httpStatus.OK);

//       expect(res.body).toEqual({
//         results: expect.any(Array),
//         page: 2,
//         limit: 1,
//         totalPages: 3,
//         totalResults: 3,
//       });
//       expect(res.body.results).toHaveLength(1);
//       expect(res.body.results[0].roleId).toBe(discordRole2.roleId);
//     });

//     // test('should return 200 and channels data if requested property is discord-channel', async () => {
//     //     await insertCommunities([communityOne]);
//     //     await insertUsers([userOne]);
//     //     await insertPlatforms([platformOne]);
//     //     await insertChannels([discordChannel1, discordChannel2, discordChannel3, discordChannel4, discordChannel5], connection)

//     //     const res = await request(app)
//     //         .post(`/api/v1/platforms/${platformOne._id}/properties`)
//     //         .set('Authorization', `Bearer ${userOneAccessToken}`)
//     //         .query({ property: 'channel' })
//     //         .send()
//     //         .expect(httpStatus.OK);

//     //     expect(res.body).toHaveLength(2);
//     //     expect(res.body[0].subChannels).toHaveLength(2);
//     //     expect(res.body[1].subChannels).toHaveLength(1);

//     //     expect(res.body[0]).toMatchObject({
//     //         channelId: "987654321098765432",
//     //         title: "Channel 1",
//     //         subChannels: [{
//     //             channelId: "234567890123456789",
//     //             name: "Channel 2",
//     //             parentId: "987654321098765432",
//     //             canReadMessageHistoryAndViewChannel: false,
//     //             announcementAccess: false
//     //         },
//     //         {
//     //             channelId: "345678901234567890",
//     //             name: "Channel 3",
//     //             parentId: "987654321098765432",
//     //             canReadMessageHistoryAndViewChannel: false,
//     //             announcementAccess: false
//     //         }]
//     //     });
//     //     expect(res.body[1]).toMatchObject({
//     //         channelId: "0",
//     //         title: "unCategorized",
//     //         subChannels: [{
//     //             channelId: "345678901234567000",
//     //             name: "Channel 4",
//     //             parentId: "345678901234567000",
//     //             canReadMessageHistoryAndViewChannel: false,
//     //             announcementAccess: false
//     //         }]
//     //     });
//     // });

//     // test('should correctly apply filter on channelId field if requested property is discord-channel', async () => {
//     //     await insertCommunities([communityOne]);
//     //     await insertUsers([userOne]);
//     //     await insertPlatforms([platformOne]);
//     //     await insertChannels([discordChannel1, discordChannel2, discordChannel3, discordChannel4, discordChannel5], connection)

//     //     const res = await request(app)
//     //         .post(`/api/v1/platforms/${platformOne._id}/properties`)
//     //         .set('Authorization', `Bearer ${userOneAccessToken}`)
//     //         .query({ property: 'channel' })
//     //         .send({ channelIds: [discordChannel1.channelId, discordChannel2.channelId, discordChannel3.channelId] })
//     //         .expect(httpStatus.OK);

//     //     expect(res.body).toHaveLength(1);
//     //     expect(res.body[0].subChannels).toHaveLength(2);

//     //     expect(res.body[0]).toMatchObject({
//     //         channelId: "987654321098765432",
//     //         title: "Channel 1",
//     //         subChannels: [{
//     //             channelId: "234567890123456789",
//     //             name: "Channel 2",
//     //             parentId: "987654321098765432",
//     //             canReadMessageHistoryAndViewChannel: false
//     //         },
//     //         {
//     //             channelId: "345678901234567890",
//     //             name: "Channel 3",
//     //             parentId: "987654321098765432",
//     //             canReadMessageHistoryAndViewChannel: false
//     //         }]
//     //     });
//     // });

//     test('should return 200 and apply the default query options if requested property is discord-guildMember', async () => {
//       await insertCommunities([communityOne]);
//       await insertUsers([userOne]);
//       await insertPlatforms([platformOne]);
//       await insertGuildMembers(
//         [discordGuildMember1, discordGuildMember2, discordGuildMember3, discordGuildMember4],
//         connection,
//       );

//       const res = await request(app)
//         .post(`/api/v1/platforms/${platformOne._id}/properties`)
//         .set('Authorization', `Bearer ${userOneAccessToken}`)
//         .query({ property: 'guildMember' })
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

//       expect(res.body.results[0]).toMatchObject({
//         discordId: discordGuildMember3.discordId,
//         username: discordGuildMember3.username,
//         ngu: discordGuildMember3.username,
//         discriminator: discordGuildMember3.discriminator,
//         nickname: discordGuildMember3.nickname,
//         globalName: discordGuildMember3.globalName,
//         avatar: discordGuildMember3.avatar,
//       });

//       expect(res.body.results[1]).toMatchObject({
//         discordId: discordGuildMember1.discordId,
//         username: discordGuildMember1.username,
//         ngu: discordGuildMember1.globalName,
//         discriminator: discordGuildMember1.discriminator,
//         nickname: discordGuildMember1.nickname,
//         globalName: discordGuildMember1.globalName,
//         avatar: discordGuildMember1.avatar,
//       });
//       expect(res.body.results[2]).toMatchObject({
//         discordId: discordGuildMember2.discordId,
//         username: discordGuildMember2.username,
//         ngu: discordGuildMember2.nickname,
//         discriminator: discordGuildMember2.discriminator,
//         nickname: discordGuildMember2.nickname,
//         globalName: discordGuildMember2.globalName,
//         avatar: discordGuildMember2.avatar,
//       });

//       expect(res.body.results[3]).toMatchObject({
//         discordId: discordGuildMember4.discordId,
//         username: discordGuildMember4.username + '#' + discordGuildMember4.discriminator,
//         ngu: discordGuildMember4.username + '#' + discordGuildMember4.discriminator,
//         discriminator: discordGuildMember4.discriminator,
//         nickname: discordGuildMember4.nickname,
//         globalName: discordGuildMember4.globalName,
//         avatar: discordGuildMember4.avatar,
//       });
//     });

//     test('should correctly apply filter on ngu if requested property is discord-guildMember', async () => {
//       await insertCommunities([communityOne]);
//       await insertUsers([userOne]);
//       await insertPlatforms([platformOne]);
//       await insertGuildMembers(
//         [discordGuildMember1, discordGuildMember2, discordGuildMember3, discordGuildMember4],
//         connection,
//       );

//       const res = await request(app)
//         .post(`/api/v1/platforms/${platformOne._id}/properties`)
//         .set('Authorization', `Bearer ${userOneAccessToken}`)
//         .query({ property: 'guildMember', ngu: 'behzad' })
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

//     test('should limit returned array if limit param is specified and requested property is discord-guildMember', async () => {
//       await insertCommunities([communityOne]);
//       await insertUsers([userOne]);
//       await insertPlatforms([platformOne]);
//       await insertGuildMembers(
//         [discordGuildMember1, discordGuildMember2, discordGuildMember3, discordGuildMember4],
//         connection,
//       );

//       const res = await request(app)
//         .post(`/api/v1/platforms/${platformOne._id}/properties`)
//         .set('Authorization', `Bearer ${userOneAccessToken}`)
//         .query({ property: 'guildMember', limit: 1 })
//         .send()
//         .expect(httpStatus.OK);

//       expect(res.body).toEqual({
//         results: expect.any(Array),
//         page: 1,
//         limit: 1,
//         totalPages: 4,
//         totalResults: 4,
//       });
//       expect(res.body.results).toHaveLength(1);
//       expect(res.body.results[0].discordId).toBe(discordGuildMember3.discordId);
//     });

//     test('should return 401 error if access token is missing', async () => {
//       await insertUsers([userOne]);

//       await request(app)
//         .post(`/api/v1/platforms/${platformOne._id}/properties`)
//         .query({ property: 'role' })
//         .send()
//         .expect(httpStatus.UNAUTHORIZED);
//     });

//     test('should return 403 when user trys to delete platform they does not belong to', async () => {
//       await insertCommunities([communityOne, communityTwo, communityThree]);
//       await insertUsers([userOne, userTwo]);
//       await insertPlatforms([platformOne, platformTwo, platformThree, platformFour, platformFive]);
//       await request(app)
//         .post(`/api/v1/platforms/${platformFour._id}/properties`)
//         .set('Authorization', `Bearer ${userOneAccessToken}`)
//         .query({ property: 'role' })
//         .send()
//         .expect(httpStatus.FORBIDDEN);
//     });

//     test('should return 400 error if platformId is not a valid mongo id', async () => {
//       await insertCommunities([communityOne]);
//       await insertUsers([userOne]);
//       await insertPlatforms([platformOne]);
//       await request(app)
//         .post(`/api/v1/platforms/invalid/properties`)
//         .set('Authorization', `Bearer ${userOneAccessToken}`)
//         .query({ property: 'role' })
//         .send()
//         .expect(httpStatus.BAD_REQUEST);
//     });

//     test('should return 400 error if requested property is invalid', async () => {
//       await insertCommunities([communityOne]);
//       await insertUsers([userOne]);
//       await insertPlatforms([platformOne]);
//       await request(app)
//         .post(`/api/v1/platforms/${platformOne._id}/properties`)
//         .set('Authorization', `Bearer ${userOneAccessToken}`)
//         .query({ property: 'member' })
//         .send()
//         .expect(httpStatus.BAD_REQUEST);
//     });

//     test('should return 404 error if platform already is not found', async () => {
//       await insertUsers([userOne]);
//       await request(app)
//         .post(`/api/v1/platforms/${platformOne._id}/properties`)
//         .query({ property: 'role' })
//         .set('Authorization', `Bearer ${userOneAccessToken}`)
//         .send()
//         .expect(httpStatus.NOT_FOUND);
//     });
//   });

//   // TODO: add tests for connect platform and request access APIs
// });

describe('TEST', () => {
  describe('TEST', () => {
    test('TEST', async () => {
      expect(true).toEqual(true);
    });
  });
});
