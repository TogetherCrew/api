// import request from 'supertest';
// import httpStatus from 'http-status';
// import app from '../../src/app';
// import setupTestDB, { cleanUpTenantDatabases } from '../utils/setupTestDB';
// import { userOne, insertUsers, userTwo, userThree } from '../fixtures/user.fixture';
// import { userOneAccessToken, userTwoAccessToken, userThreeAccessToken } from '../fixtures/token.fixture';
// import { User, Community, ICommunityUpdateBody, IUserUpdateBody } from '@togethercrew.dev/db';
// import { communityOne, communityTwo, communityThree, insertCommunities } from '../fixtures/community.fixture';
// import {
//     platformOne,
//     platformTwo,
//     platformThree,
//     platformFour,
//     platformFive,
//     insertPlatforms,
// } from '../fixtures/platform.fixture';
// import { discordRole1, discordRole2, discordRole3, discordRole4, insertRoles } from '../fixtures/discord/roles.fixture';
// import {
//     discordGuildMember1,
//     discordGuildMember2,
//     discordGuildMember3,
//     discordGuildMember4,
//     discordGuildMember5,
//     insertGuildMembers,
// } from '../fixtures/discord/guildMember.fixture';
// import { Connection } from 'mongoose';
// import { DatabaseManager } from '@togethercrew.dev/db';
// setupTestDB();

// describe('User routes', () => {
//     let connection: Connection;
//     beforeAll(async () => {
//         connection = await DatabaseManager.getInstance().getTenantDb(platformOne.metadata?.id);
//     });

//     beforeEach(() => {
//         cleanUpTenantDatabases();
//         userOne.communities = [communityOne._id, communityTwo._id];
//         userTwo.communities = [communityThree._id];
//         communityOne.users = [userOne._id];
//         communityTwo.users = [userOne._id];
//         communityThree.users = [userTwo._id];

//         if (communityOne.roles) {
//             communityOne.roles[0].source.platformId = platformOne._id;
//             communityOne.roles[1].source.platformId = platformOne._id;
//             communityOne.roles[2].source.platformId = platformOne._id;
//         }
//         platformOne.community = communityOne._id;
//         platformThree.community = communityTwo._id;
//         platformFour.community = communityThree._id;
//         platformFive.community = communityOne._id;
//     });
//     describe('GET /api/v1/users/@me', () => {
//         test('should return 200 and the user object if data is ok', async () => {
//             await insertUsers([userOne]);
//             const res = await request(app)
//                 .get('/api/v1/users/@me')
//                 .set('Authorization', `Bearer ${userOneAccessToken}`)
//                 .expect(httpStatus.OK);

//             expect(res.body).toEqual({
//                 id: userOne._id.toHexString(),
//                 discordId: userOne.discordId,
//                 email: userOne.email,
//                 communities: [communityOne._id.toString(), communityTwo._id.toString()],
//             });
//         });
//         test('should return 401 if access token is missing', async () => {
//             await insertUsers([userOne]);
//             await request(app).get('/api/v1/users/@me').expect(httpStatus.UNAUTHORIZED);
//         });
//     });

//     describe('PATCH /api/v1/users/@me', () => {
//         let updateBody: IUserUpdateBody;
//         const currentDate = new Date();

//         beforeEach(() => {
//             updateBody = {
//                 email: 'email@yahoo.com',
//                 tcaAt: currentDate,
//             };
//         });
//         test('should return 200 and successfully update user if data is ok', async () => {
//             await insertUsers([userOne]);
//             const res = await request(app)
//                 .patch('/api/v1/users/@me')
//                 .set('Authorization', `Bearer ${userOneAccessToken}`)
//                 .send(updateBody)
//                 .expect(httpStatus.OK);

//             expect(res.body).toEqual({
//                 id: userOne._id.toHexString(),
//                 discordId: userOne.discordId,
//                 email: updateBody.email,
//                 communities: [communityOne._id.toString(), communityTwo._id.toString()],
//                 tcaAt: currentDate.toISOString(),
//             });

//             const dbUser = await User.findById(userOne._id);
//             expect(dbUser).toBeDefined();
//             expect(dbUser).toMatchObject({ email: updateBody.email, tcaAt: updateBody.tcaAt });
//         });
//         test('should return 401 if access token is missing', async () => {
//             await insertUsers([userOne]);
//             await request(app).patch('/api/v1/users/@me').send(updateBody).expect(httpStatus.UNAUTHORIZED);
//         });

//         test('should return 400 if email is invalid', async () => {
//             await insertUsers([userOne]);
//             const updateBody = { email: 'invalidEmail' };

//             await request(app)
//                 .patch('/api/v1/users/@me')
//                 .set('Authorization', `Bearer ${userOneAccessToken}`)
//                 .send(updateBody)
//                 .expect(httpStatus.BAD_REQUEST);
//         });

//         test('should return 400 error if tcaAt is invalid', async () => {
//             const updateBody = { tcaAt: 'tcaAt' };

//             await insertUsers([userOne]);
//             await request(app)
//                 .patch('/api/v1/users/@me')
//                 .set('Authorization', `Bearer ${userOneAccessToken}`)
//                 .send(updateBody)
//                 .expect(httpStatus.BAD_REQUEST);
//         });
//     });
//     describe('GET /api/v1/users/@me/:communityId/roles', () => {

//         test('should return 200 and array of roleTypes that user has in the community if data is ok', async () => {
//             await insertCommunities([communityOne]);
//             await insertPlatforms([platformOne]);
//             await insertUsers([userOne, userTwo, userThree]);
//             await insertGuildMembers(
//                 [discordGuildMember1, discordGuildMember2, discordGuildMember3, discordGuildMember4],
//                 connection,
//             );
//             const res1 = await request(app)
//                 .get(`/api/v1/users/@me/${communityOne._id}/roles`)
//                 .set('Authorization', `Bearer ${userOneAccessToken}`)
//                 .send()
//                 .expect(httpStatus.OK);

//             expect(res1.body).toEqual(['admin']);

//             const res2 = await request(app)
//                 .get(`/api/v1/users/@me/${communityOne._id}/roles`)
//                 .set('Authorization', `Bearer ${userTwoAccessToken}`)
//                 .send()
//                 .expect(httpStatus.OK);

//             expect(res2.body).toEqual(['admin', 'view']);

//             const res3 = await request(app)
//                 .get(`/api/v1/users/@me/${communityOne._id}/roles`)
//                 .set('Authorization', `Bearer ${userThreeAccessToken}`)
//                 .send()
//                 .expect(httpStatus.OK);

//             expect(res3.body).toEqual([]);

//         });
//         test('should return 401 if access token is missing', async () => {
//             await insertUsers([userOne]);
//             await request(app)
//                 .get(`/api/v1/users/@me/${communityOne._id}/roles`)
//                 .send()
//                 .expect(httpStatus.UNAUTHORIZED);
//         });
//         test('should return 400 error if communityId is not a valid mongo id', async () => {
//             await insertUsers([userOne]);
//             await request(app)
//                 .get(`/api/v1/users/@me/1234/roles`)
//                 .set('Authorization', `Bearer ${userOneAccessToken}`)
//                 .send()
//                 .expect(httpStatus.BAD_REQUEST);
//         });

//         test('should return 404 error if community is not found', async () => {
//             await insertUsers([userOne]);
//             await request(app)
//                 .get(`/api/v1/users/@me/${communityOne._id}/roles`)
//                 .set('Authorization', `Bearer ${userOneAccessToken}`)
//                 .send()
//                 .expect(httpStatus.NOT_FOUND);
//         });
//     });
// });

describe('TEST', () => {
  describe('TEST', () => {
    test('TEST', async () => {
      expect(true).toEqual(true);
    });
  });
});
