import request from 'supertest';
import httpStatus from 'http-status';
import app from '../../src/app';
import setupTestDB from '../utils/setupTestDB';
import { userOne, insertUsers, userTwo } from '../fixtures/user.fixture';
import { userOneAccessToken } from '../fixtures/token.fixture';
import { Platform, IPlatformUpdateBody } from '@togethercrew.dev/db';
import { communityOne, communityTwo, communityThree, insertCommunities } from '../fixtures/community.fixture';
import { platformOne, platformTwo, platformThree, platformFour, insertPlatforms, } from '../fixtures/platform.fixture';

setupTestDB();

describe('Platform routes', () => {
    beforeEach(() => {
        userOne.communities = [communityOne._id, communityTwo._id];
        userTwo.communities = [communityThree._id];

        communityOne.users = [userOne._id];
        communityTwo.users = [userOne._id];
        communityThree.users = [userTwo._id];

        communityOne.platforms = [platformOne._id, platformTwo._id]
        communityTwo.platforms = [platformThree._id];
        communityThree.platforms = [platformFour._id];

        platformOne.community = communityOne._id
        platformTwo.community = communityOne._id
        platformThree.community = communityTwo._id
        platformFour.community = communityThree._id
    });

    describe('POST api/v1/platforms', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let newPlatform: any;

        beforeEach(() => {
            newPlatform = {
                name: 'discord',
                community: communityOne._id,
                metadata: {
                    id: "1234"
                }
            };
        });

        test('should return 201 and successfully create new platform if data is ok', async () => {
            userOne.communities = [communityOne._id];
            communityOne.users = [userOne._id]
            await insertCommunities([communityOne]);
            await insertUsers([userOne]);

            const res = await request(app)
                .post(`/api/v1/platforms`)
                .set('Authorization', `Bearer ${userOneAccessToken}`)
                .send(newPlatform)
                .expect(httpStatus.CREATED);

            expect(res.body).toEqual({
                id: expect.anything(),
                name: newPlatform.name,
                metadata: newPlatform.metadata,
                community: communityOne._id.toHexString(),
                disconnectedAt: null,
                isInProgress: true
            });


            const dbPlatform = await Platform.findById(res.body.id);
            expect(dbPlatform).toBeDefined();
            expect(dbPlatform).toMatchObject({
                name: newPlatform.name, metadata: newPlatform.metadata, isInProgress: true

            });

            // const dbCommunity = await Community.findById(res.body.community);
            // expect(dbCommunity).toMatchObject({ id: communityOne._id.toHexString(), platforms: [res.body.id], name: communityOne.name, avatarURL: communityOne.avatarURL, users: [userOne._id], });

        });


        test('should return 401 error if access token is missing', async () => {
            await request(app)
                .post(`/api/v1/platforms`)
                .send(newPlatform)
                .expect(httpStatus.UNAUTHORIZED);
        });


        test('should return 400 error if name is invalid', async () => {
            await insertUsers([userOne]);
            newPlatform.name = 'invalid'
            await request(app)
                .post(`/api/v1/platforms`)
                .set('Authorization', `Bearer ${userOneAccessToken}`)
                .send(newPlatform)
                .expect(httpStatus.BAD_REQUEST);
        });

        test('should return 400 error if community is invalid', async () => {
            await insertUsers([userOne]);
            newPlatform.community = 'invalid'

            await request(app)
                .post(`/api/v1/platforms`)
                .set('Authorization', `Bearer ${userOneAccessToken}`)
                .send(newPlatform)
                .expect(httpStatus.BAD_REQUEST);
        });
    });

    describe('GET /api/v1/platforms', () => {
        test('should return 200 and apply the default query options', async () => {
            await insertCommunities([communityOne, communityTwo, communityThree]);
            await insertUsers([userOne, userTwo]);
            await insertPlatforms([platformOne, platformTwo, platformThree, platformFour]);
            const res = await request(app)
                .get('/api/v1/platforms')
                .set('Authorization', `Bearer ${userOneAccessToken}`)
                .send()
                .expect(httpStatus.OK);

            expect(res.body).toEqual({
                results: expect.any(Array),
                page: 1,
                limit: 10,
                totalPages: 1,
                totalResults: 3,
            });
            expect(res.body.results).toHaveLength(3);





            expect(res.body.results[0]).toMatchObject({
                id: platformThree._id.toHexString(),
                name: platformThree.name,
                metadata: platformThree.metadata,
                community: communityTwo._id.toHexString(),
                isInProgress: true
            });

            expect(res.body.results[1]).toMatchObject({
                id: platformTwo._id.toHexString(),
                name: platformTwo.name,
                metadata: platformTwo.metadata,
                community: communityOne._id.toHexString(),
                isInProgress: true
            });

            expect(res.body.results[2]).toMatchObject({
                id: platformOne._id.toHexString(),
                name: platformOne.name,
                metadata: platformOne.metadata,
                community: communityOne._id.toHexString(),
                isInProgress: true
            });



        });

        test('should return 401 if access token is missing', async () => {
            await insertCommunities([communityOne, communityTwo, communityThree]);
            await insertUsers([userOne, userTwo]);
            await insertPlatforms([platformOne, platformTwo, platformThree, platformFour]);
            await request(app)
                .get('/api/v1/platforms')
                .send()
                .expect(httpStatus.UNAUTHORIZED);
        });

        test('should correctly apply filter on name field', async () => {
            await insertCommunities([communityOne, communityTwo, communityThree]);
            await insertUsers([userOne, userTwo]);
            await insertPlatforms([platformOne, platformTwo, platformThree, platformFour]);
            const res = await request(app)
                .get('/api/v1/platforms')
                .set('Authorization', `Bearer ${userOneAccessToken}`)
                .query({ name: platformOne.name })
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
            expect(res.body.results[0].id).toBe(platformThree._id.toHexString());
            expect(res.body.results[1].id).toBe(platformOne._id.toHexString());

        });

        test('should correctly apply filter on community field', async () => {
            await insertCommunities([communityOne, communityTwo, communityThree]);
            await insertUsers([userOne, userTwo]);
            await insertPlatforms([platformOne, platformTwo, platformThree, platformFour]);

            const res = await request(app)
                .get('/api/v1/platforms')
                .set('Authorization', `Bearer ${userOneAccessToken}`)
                .query({ community: communityOne._id.toHexString() })
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
            expect(res.body.results[0].id).toBe(platformTwo._id.toHexString());
            expect(res.body.results[1].id).toBe(platformOne._id.toHexString());

        });


        test('should correctly sort the returned array if descending sort param is specified', async () => {
            await insertCommunities([communityOne, communityTwo, communityThree]);
            await insertUsers([userOne, userTwo]);
            await insertPlatforms([platformOne, platformTwo, platformThree, platformFour]);
            const res = await request(app)
                .get('/api/v1/platforms')
                .set('Authorization', `Bearer ${userOneAccessToken}`)
                .query({ sortBy: 'name:desc' })
                .send()
                .expect(httpStatus.OK);

            expect(res.body).toEqual({
                results: expect.any(Array),
                page: 1,
                limit: 10,
                totalPages: 1,
                totalResults: 3,
            });
            expect(res.body.results).toHaveLength(3);
            expect(res.body.results[0].id).toBe(platformTwo._id.toHexString());
            expect(res.body.results[1].id).toBe(platformOne._id.toHexString());
            expect(res.body.results[2].id).toBe(platformThree._id.toHexString());

        });

        test('should correctly sort the returned array if ascending sort param is specified', async () => {
            await insertCommunities([communityOne, communityTwo, communityThree]);
            await insertUsers([userOne, userTwo]);
            await insertPlatforms([platformOne, platformTwo, platformThree, platformFour]);
            const res = await request(app)
                .get('/api/v1/platforms')
                .set('Authorization', `Bearer ${userOneAccessToken}`)
                .query({ sortBy: 'name:asc' })
                .send()
                .expect(httpStatus.OK);

            expect(res.body).toEqual({
                results: expect.any(Array),
                page: 1,
                limit: 10,
                totalPages: 1,
                totalResults: 3,
            });
            expect(res.body.results).toHaveLength(3);
            expect(res.body.results[0].id).toBe(platformOne._id.toHexString());
            expect(res.body.results[1].id).toBe(platformThree._id.toHexString());
            expect(res.body.results[2].id).toBe(platformTwo._id.toHexString());


        });


        test('should limit returned array if limit param is specified', async () => {
            await insertCommunities([communityOne, communityTwo, communityThree]);
            await insertUsers([userOne, userTwo]);
            await insertPlatforms([platformOne, platformTwo, platformThree, platformFour]);
            const res = await request(app)
                .get('/api/v1/platforms')
                .set('Authorization', `Bearer ${userOneAccessToken}`)
                .query({ limit: 1 })
                .send()
                .expect(httpStatus.OK);

            expect(res.body).toEqual({
                results: expect.any(Array),
                page: 1,
                limit: 1,
                totalPages: 3,
                totalResults: 3,
            });
            expect(res.body.results).toHaveLength(1);
            expect(res.body.results[0].id).toBe(platformThree._id.toHexString());
        });

        test('should return the correct page if page and limit params are specified', async () => {
            await insertCommunities([communityOne, communityTwo, communityThree]);
            await insertUsers([userOne, userTwo]);
            await insertPlatforms([platformOne, platformTwo, platformThree, platformFour]);
            const res = await request(app)
                .get('/api/v1/platforms')
                .set('Authorization', `Bearer ${userOneAccessToken}`)
                .query({ page: 2, limit: 1 })
                .send()
                .expect(httpStatus.OK);

            expect(res.body).toEqual({
                results: expect.any(Array),
                page: 2,
                limit: 1,
                totalPages: 3,
                totalResults: 3,
            });
            expect(res.body.results).toHaveLength(1);
            expect(res.body.results[0].id).toBe(platformTwo._id.toHexString());
        });
    });



    describe('GET /api/v1/platforms/:platformId', () => {
        test('should return 200 and the community object if data is ok', async () => {
            await insertCommunities([communityOne, communityTwo, communityThree]);
            await insertUsers([userOne, userTwo]);
            await insertPlatforms([platformOne, platformTwo, platformThree, platformFour]);
            const res = await request(app)
                .get(`/api/v1/platforms/${platformOne._id}`)
                .set('Authorization', `Bearer ${userOneAccessToken}`)
                .send()
                .expect(httpStatus.OK);

            expect(res.body).toEqual({
                id: expect.anything(),
                name: platformOne.name,
                metadata: platformOne.metadata,
                community: communityOne._id.toHexString(),
                disconnectedAt: null,
                isInProgress: true

            });
        });

        test('should return 401 error if access token is missing', async () => {
            await insertUsers([userOne]);

            await request(app)
                .get(`/api/v1/platforms/${platformOne._id}`)
                .send()
                .expect(httpStatus.UNAUTHORIZED);
        });

        test('should return 404 when user trys to access platoform they don not belong to', async () => {
            await insertCommunities([communityOne, communityTwo, communityThree]);
            await insertUsers([userOne, userTwo]);
            await insertPlatforms([platformOne, platformTwo, platformThree, platformFour]);

            await request(app)
                .get(`/api/v1/platforms/${platformFour._id}`)
                .set('Authorization', `Bearer ${userOneAccessToken}`)
                .send()
                .expect(httpStatus.NOT_FOUND);
        });


        test('should return 400 error if platformId is not a valid mongo id', async () => {
            await insertUsers([userOne, userTwo]);
            await request(app)
                .get(`/api/v1/platforms/invalid`)
                .set('Authorization', `Bearer ${userOneAccessToken}`)
                .send()
                .expect(httpStatus.BAD_REQUEST);
        });

        test('should return 404 error if platoform is not found', async () => {
            await insertUsers([userOne]);

            await request(app)
                .get(`/api/v1/platforms/${platformOne._id}`)
                .set('Authorization', `Bearer ${userOneAccessToken}`)
                .send()
                .expect(httpStatus.NOT_FOUND);
        });
    });



    describe('PATCH /api/v1/platforms/:platformId', () => {
        let updateBody: IPlatformUpdateBody;

        beforeEach(() => {
            updateBody = {
                name: 'twitter',
                metadata: {
                    id: "8765"
                }
            };
        });
        test('should return 200 and successfully update platform if data is ok', async () => {
            await insertCommunities([communityOne, communityTwo, communityThree]);
            await insertUsers([userOne, userTwo]);
            await insertPlatforms([platformOne, platformTwo, platformThree, platformFour]);

            const res = await request(app)
                .patch(`/api/v1/platforms/${platformOne._id}`)
                .set('Authorization', `Bearer ${userOneAccessToken}`)
                .send(updateBody)
                .expect(httpStatus.OK);

            expect(res.body).toEqual({
                id: expect.anything(),
                name: updateBody.name,
                metadata: updateBody.metadata,
                community: communityOne._id.toHexString(),
                disconnectedAt: null,
                isInProgress: true
            });

            const dbPlatform = await Platform.findById(res.body.id);
            expect(dbPlatform).toBeDefined();
            expect(dbPlatform).toMatchObject({
                name: updateBody.name, metadata: updateBody.metadata, isInProgress: true

            });
        });

        test('should return 401 error if access token is missing', async () => {
            await insertUsers([userOne]);

            await request(app)
                .patch(`/api/v1/platforms/${platformOne._id}`)
                .send(updateBody)
                .expect(httpStatus.UNAUTHORIZED);
        });

        test('should return 404 when user trys to update platform they don not belong to', async () => {
            await insertCommunities([communityOne, communityTwo, communityThree]);
            await insertUsers([userOne, userTwo]);
            await insertPlatforms([platformOne, platformTwo, platformThree, platformFour]);


            await request(app)
                .patch(`/api/v1/platforms/${platformFour._id}`)
                .set('Authorization', `Bearer ${userOneAccessToken}`)
                .send(updateBody)
                .expect(httpStatus.NOT_FOUND);
        });



        test('should return 400 error if platformId is not a valid mongo id', async () => {
            await insertUsers([userOne]);

            await request(app)
                .patch(`/api/v1/platforms/invalid`)
                .set('Authorization', `Bearer ${userOneAccessToken}`)
                .send(updateBody)
                .expect(httpStatus.BAD_REQUEST);
        });
        test('should return 400 error if name is invalid', async () => {
            await insertUsers([userOne]);
            updateBody.name = 'invalid'
            await request(app)
                .patch(`/api/v1/platforms/${platformOne._id}`)
                .set('Authorization', `Bearer ${userOneAccessToken}`)
                .send(updateBody)
                .expect(httpStatus.BAD_REQUEST);
        });
    });
    describe('DELETE /api/v1/platforms/:platformId', () => {
        test('should return 204 if data is ok', async () => {
            await insertCommunities([communityOne, communityTwo, communityThree]);
            await insertUsers([userOne, userTwo]);
            await insertPlatforms([platformOne, platformTwo, platformThree, platformFour]);

            const res = await request(app)
                .delete(`/api/v1/platforms/${platformOne._id}`)
                .set('Authorization', `Bearer ${userOneAccessToken}`)
                .send()
                .expect(httpStatus.NO_CONTENT);

            const dbPlatform = await Platform.findById(res.body.id);
            expect(dbPlatform).toBeNull();
        });

        test('should return 401 error if access token is missing', async () => {
            await insertUsers([userOne]);

            await request(app)
                .delete(`/api/v1/platforms/${platformOne._id}`)
                .send()
                .expect(httpStatus.UNAUTHORIZED);
        });

        test('should return 404 when user trys to delete platform they don not belong to', async () => {
            await insertCommunities([communityOne, communityTwo, communityThree]);
            await insertUsers([userOne, userTwo]);
            await insertPlatforms([platformOne, platformTwo, platformThree, platformFour]);

            await request(app)
                .delete(`/api/v1/platforms/${platformFour._id}`)
                .set('Authorization', `Bearer ${userOneAccessToken}`)
                .send()
                .expect(httpStatus.NOT_FOUND);
        });


        test('should return 400 error if platformId is not a valid mongo id', async () => {
            await insertUsers([userOne]);

            await request(app)
                .delete(`/api/v1/platforms/invalid`)
                .set('Authorization', `Bearer ${userOneAccessToken}`)
                .send()
                .expect(httpStatus.BAD_REQUEST);
        });

        test('should return 404 error if platform already is not found', async () => {
            await insertUsers([userOne]);

            await request(app)
                .delete(`/api/v1/platforms/${platformOne._id}`)
                .set('Authorization', `Bearer ${userOneAccessToken}`)
                .send()
                .expect(httpStatus.NOT_FOUND);
        });
    });
});