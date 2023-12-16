import request from 'supertest';
import httpStatus from 'http-status';
import app from '../../src/app';
import setupTestDB from '../utils/setupTestDB';
import { userOne, insertUsers, userTwo } from '../fixtures/user.fixture';
import { userOneAccessToken } from '../fixtures/token.fixture';
import { User, Community, ICommunityUpdateBody } from '@togethercrew.dev/db';
import { communityOne, communityTwo, communityThree, insertCommunities } from '../fixtures/community.fixture';

setupTestDB();

describe('Community routes', () => {
    beforeEach(() => {
        userOne.communities = [communityOne._id, communityTwo._id];
        userTwo.communities = [communityThree._id];
        communityOne.users = [userOne._id];
        communityTwo.users = [userOne._id];
        communityThree.users = [userTwo._id];
    });

    describe('POST api/v1/communities', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let newCommunity: any;
        const currentDate = new Date();

        beforeEach(() => {
            newCommunity = {
                name: 'Community A',
                avatarURL: 'path',
                tcaAt: currentDate
            };
        });

        test('should return 201 and successfully create new community if data is ok', async () => {
            await insertUsers([userOne]);

            const res = await request(app)
                .post(`/api/v1/communities`)
                .set('Authorization', `Bearer ${userOneAccessToken}`)
                .send(newCommunity)
                .expect(httpStatus.CREATED);

            expect(res.body).toEqual({
                id: expect.anything(),
                name: newCommunity.name,
                avatarURL: newCommunity.avatarURL,
                users: [userOne._id.toHexString()],
                platforms: [],
                tcaAt: currentDate.toISOString()
            });

            const dbCommunity = await Community.findById(res.body.id);
            expect(dbCommunity).toBeDefined();
            expect(dbCommunity).toMatchObject({
                name: newCommunity.name, avatarURL: newCommunity.avatarURL, users: [userOne._id], tcaAt: newCommunity.tcaAt
            });

            const dbUser = await User.findById(userOne._id);
            expect(dbUser?.communities?.map(String)).toEqual(expect.arrayContaining([res.body.id]));
        });


        test('should return 401 error if access token is missing', async () => {
            await request(app)
                .post(`/api/v1/communities`)
                .send(newCommunity)
                .expect(httpStatus.UNAUTHORIZED);
        });


        test('should return 400 error if name is invalid', async () => {
            await insertUsers([userOne]);

            await request(app)
                .post(`/api/v1/communities`)
                .set('Authorization', `Bearer ${userOneAccessToken}`)
                .send({ name: 1 })
                .expect(httpStatus.BAD_REQUEST);
        });

        test('should return 400 error if avatarURL is invalid', async () => {
            await insertUsers([userOne]);
            await request(app)
                .post(`/api/v1/communities`)
                .set('Authorization', `Bearer ${userOneAccessToken}`)
                .send({ name: "1", avatarURL: 1 })
                .expect(httpStatus.BAD_REQUEST);
        });

        test('should return 400 error if tcaAt is invalid', async () => {
            await insertUsers([userOne]);
            await request(app)
                .post(`/api/v1/communities`)
                .set('Authorization', `Bearer ${userOneAccessToken}`)
                .send({ name: "1", tcaAt: "tcaAt" })
                .expect(httpStatus.BAD_REQUEST);
        });
    });

    describe('GET /api/v1/communities', () => {
        test('should return 200 and apply the default query options', async () => {
            await insertCommunities([communityOne, communityTwo, communityThree]);
            await insertUsers([userOne, userTwo]);

            const res = await request(app)
                .get('/api/v1/communities')
                .set('Authorization', `Bearer ${userOneAccessToken}`)
                .send()
                .expect(httpStatus.OK);

            expect(res.body).toEqual({
                results: expect.any(Array),
                page: 1,
                limit: 10,
                totalPages: 1,
                totalResults: 2,
            });
            expect(res.body.results).toHaveLength(2);

            expect(res.body.results[0]).toMatchObject({
                id: communityTwo._id.toHexString(),
                name: communityTwo.name,
                users: [userOne._id.toHexString()],
                platforms: []
            });
            expect(res.body.results[1]).toMatchObject({
                id: communityOne._id.toHexString(),
                name: communityOne.name,
                avatarURL: communityOne.avatarURL,
                users: [userOne._id.toHexString()],
                platforms: []
            });


        });

        test('should return 401 if access token is missing', async () => {
            await insertUsers([userOne]);

            await request(app)
                .get('/api/v1/communities')
                .send()
                .expect(httpStatus.UNAUTHORIZED);
        });

        test('should correctly apply filter on name field', async () => {
            await insertCommunities([communityOne, communityTwo, communityThree]);
            await insertUsers([userOne, userTwo]);

            const res = await request(app)
                .get('/api/v1/communities')
                .set('Authorization', `Bearer ${userOneAccessToken}`)
                .query({ name: communityTwo.name })
                .send()
                .expect(httpStatus.OK);

            expect(res.body).toEqual({
                results: expect.any(Array),
                page: 1,
                limit: 10,
                totalPages: 1,
                totalResults: 1,
            });
            expect(res.body.results).toHaveLength(1);
            expect(res.body.results[0].id).toBe(communityTwo._id.toHexString());
        });


        test('should correctly sort the returned array if descending sort param is specified', async () => {
            await insertCommunities([communityOne, communityTwo, communityThree]);
            await insertUsers([userOne, userTwo]);


            const res = await request(app)
                .get('/api/v1/communities')
                .set('Authorization', `Bearer ${userOneAccessToken}`)
                .query({ sortBy: 'name:desc' })
                .send()
                .expect(httpStatus.OK);

            expect(res.body).toEqual({
                results: expect.any(Array),
                page: 1,
                limit: 10,
                totalPages: 1,
                totalResults: 2,
            });
            expect(res.body.results).toHaveLength(2);
            expect(res.body.results[0].id).toBe(communityTwo._id.toHexString());
            expect(res.body.results[1].id).toBe(communityOne._id.toHexString());
        });

        test('should correctly sort the returned array if ascending sort param is specified', async () => {
            await insertCommunities([communityOne, communityTwo, communityThree]);
            await insertUsers([userOne, userTwo]);


            const res = await request(app)
                .get('/api/v1/communities')
                .set('Authorization', `Bearer ${userOneAccessToken}`)
                .query({ sortBy: 'name:asc' })
                .send()
                .expect(httpStatus.OK);

            expect(res.body).toEqual({
                results: expect.any(Array),
                page: 1,
                limit: 10,
                totalPages: 1,
                totalResults: 2,
            });
            expect(res.body.results).toHaveLength(2);
            expect(res.body.results[0].id).toBe(communityOne._id.toHexString());
            expect(res.body.results[1].id).toBe(communityTwo._id.toHexString());
        });


        test('should limit returned array if limit param is specified', async () => {
            await insertCommunities([communityOne, communityTwo, communityThree]);
            await insertUsers([userOne, userTwo]);

            const res = await request(app)
                .get('/api/v1/communities')
                .set('Authorization', `Bearer ${userOneAccessToken}`)
                .query({ limit: 1 })
                .send()
                .expect(httpStatus.OK);

            expect(res.body).toEqual({
                results: expect.any(Array),
                page: 1,
                limit: 1,
                totalPages: 2,
                totalResults: 2,
            });
            expect(res.body.results).toHaveLength(1);
            expect(res.body.results[0].id).toBe(communityTwo._id.toHexString());

        });

        test('should return the correct page if page and limit params are specified', async () => {
            await insertCommunities([communityOne, communityTwo, communityThree]);
            await insertUsers([userOne, userTwo]);


            const res = await request(app)
                .get('/api/v1/communities')
                .set('Authorization', `Bearer ${userOneAccessToken}`)
                .query({ page: 2, limit: 1 })
                .send()
                .expect(httpStatus.OK);

            expect(res.body).toEqual({
                results: expect.any(Array),
                page: 2,
                limit: 1,
                totalPages: 2,
                totalResults: 2,
            });
            expect(res.body.results).toHaveLength(1);
            expect(res.body.results[0].id).toBe(communityOne._id.toHexString());

        });
    });



    describe('GET /api/v1/communities/:communityId', () => {
        test('should return 200 and the community object if data is ok', async () => {
            await insertCommunities([communityOne, communityTwo, communityThree]);
            await insertUsers([userOne, userTwo]);


            const res = await request(app)
                .get(`/api/v1/communities/${communityOne._id}`)
                .set('Authorization', `Bearer ${userOneAccessToken}`)
                .send()
                .expect(httpStatus.OK);

            expect(res.body).toEqual({
                id: communityOne._id.toHexString(),
                name: communityOne.name,
                avatarURL: communityOne.avatarURL,
                users: [userOne._id.toHexString()],
                platforms: []
            });
        });

        test('should return 401 error if access token is missing', async () => {
            await insertUsers([userOne]);

            await request(app)
                .get(`/api/v1/communities/${communityOne._id}`)
                .send()
                .expect(httpStatus.UNAUTHORIZED);
        });

        test('should return 404 when user trys to access community they don not belong to', async () => {
            await insertCommunities([communityOne, communityTwo, communityThree]);
            await insertUsers([userOne, userTwo]);
            await request(app)
                .get(`/api/v1/communities/${communityThree._id}`)
                .set('Authorization', `Bearer ${userOneAccessToken}`)
                .send()
                .expect(httpStatus.NOT_FOUND);
        });


        test('should return 400 error if communityId is not a valid mongo id', async () => {
            await insertUsers([userOne]);
            await request(app)
                .get(`/api/v1/communities/invalid`)
                .set('Authorization', `Bearer ${userOneAccessToken}`)
                .send()
                .expect(httpStatus.BAD_REQUEST);
        });

        test('should return 404 error if community is not found', async () => {
            await insertUsers([userOne]);
            await request(app)
                .get(`/api/v1/communities/${communityOne._id}`)
                .set('Authorization', `Bearer ${userOneAccessToken}`)
                .send()
                .expect(httpStatus.NOT_FOUND);
        });
    });



    describe('PATCH /api/v1/communities/:communityId', () => {
        let updateBody: ICommunityUpdateBody;
        const currentDate = new Date();

        beforeEach(() => {
            updateBody = {
                name: 'Community A',
                avatarURL: 'path',
                tcaAt: currentDate

            };
        });
        test('should return 200 and successfully update community if data is ok', async () => {
            await insertCommunities([communityOne, communityTwo, communityThree]);
            await insertUsers([userOne, userTwo]);
            const res = await request(app)
                .patch(`/api/v1/communities/${communityOne._id}`)
                .set('Authorization', `Bearer ${userOneAccessToken}`)
                .send(updateBody)
                .expect(httpStatus.OK);

            expect(res.body).toMatchObject({
                id: communityOne._id.toHexString(),
                name: updateBody.name,
                avatarURL: updateBody.avatarURL,
                tcaAt: currentDate.toISOString()
            });

            const dbCommunity = await Community.findById(communityOne._id);
            expect(dbCommunity).toBeDefined();
            expect(dbCommunity).toMatchObject({
                name: updateBody.name, avatarURL: updateBody.avatarURL, tcaAt: updateBody.tcaAt
            });
        });

        test('should return 401 error if access token is missing', async () => {
            await insertUsers([userOne]);

            await request(app)
                .patch(`/api/v1/communities/${communityOne._id}`)
                .send(updateBody)
                .expect(httpStatus.UNAUTHORIZED);
        });

        test('should return 404 when user trys to update community they don not belong to', async () => {
            await insertCommunities([communityOne, communityTwo, communityThree]);
            await insertUsers([userOne, userTwo]);

            await request(app)
                .patch(`/api/v1/communities/${communityThree._id}`)
                .set('Authorization', `Bearer ${userOneAccessToken}`)
                .send(updateBody)
                .expect(httpStatus.NOT_FOUND);
        });



        test('should return 400 error if communityId is not a valid mongo id', async () => {
            await insertUsers([userOne]);

            await request(app)
                .patch(`/api/v1/communities/invalid`)
                .set('Authorization', `Bearer ${userOneAccessToken}`)
                .send(updateBody)
                .expect(httpStatus.BAD_REQUEST);
        });
        test('should return 400 error if name is invalid', async () => {
            await insertUsers([userOne]);
            await request(app)
                .patch(`/api/v1/communities/${communityOne._id}`)
                .set('Authorization', `Bearer ${userOneAccessToken}`)
                .send({ name: 1 })
                .expect(httpStatus.BAD_REQUEST);
        });

        test('should return 400 error if avatarURL is invalid', async () => {
            await insertUsers([userOne]);
            await request(app)
                .patch(`/api/v1/communities/${communityOne._id}`)
                .set('Authorization', `Bearer ${userOneAccessToken}`)
                .send({ name: "1", avatarURL: 1 })
                .expect(httpStatus.BAD_REQUEST);
        });

        test('should return 400 error if tcaAt is invalid', async () => {
            await insertUsers([userOne]);
            await request(app)
                .patch(`/api/v1/communities/${communityOne._id}`)
                .set('Authorization', `Bearer ${userOneAccessToken}`)
                .send({ name: "1", tcaAt: "tcaAt" })
                .expect(httpStatus.BAD_REQUEST);
        });

    });
    describe('DELETE /api/v1/communities/:communityId', () => {
        test('should return 204 if data is ok', async () => {
            await insertCommunities([communityOne, communityTwo, communityThree]);
            await insertUsers([userOne, userTwo]);


            await request(app)
                .delete(`/api/v1/communities/${communityOne._id}`)
                .set('Authorization', `Bearer ${userOneAccessToken}`)
                .send()
                .expect(httpStatus.NO_CONTENT);

            const dbCommunity = await Community.findById(communityOne._id);
            expect(dbCommunity).toBeNull();
        });

        test('should return 401 error if access token is missing', async () => {
            await insertUsers([userOne]);

            await request(app)
                .delete(`/api/v1/communities/${communityOne._id}`)
                .send()
                .expect(httpStatus.UNAUTHORIZED);
        });

        test('should return 404 when user trys to delete community they don not belong to', async () => {
            await insertCommunities([communityOne, communityTwo, communityThree]);
            await insertUsers([userOne, userTwo]);

            await request(app)
                .delete(`/api/v1/communities/${communityThree._id}`)
                .set('Authorization', `Bearer ${userOneAccessToken}`)
                .send()
                .expect(httpStatus.NOT_FOUND);
        });


        test('should return 400 error if communityId is not a valid mongo id', async () => {
            await insertUsers([userOne]);

            await request(app)
                .delete(`/api/v1/communities/invalid`)
                .set('Authorization', `Bearer ${userOneAccessToken}`)
                .send()
                .expect(httpStatus.BAD_REQUEST);
        });

        test('should return 404 error if community already is not found', async () => {
            await insertUsers([userOne]);

            await request(app)
                .delete(`/api/v1/communities/${communityOne._id}`)
                .set('Authorization', `Bearer ${userOneAccessToken}`)
                .send()
                .expect(httpStatus.NOT_FOUND);
        });
    });
});