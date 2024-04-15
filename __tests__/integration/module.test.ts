import request from 'supertest';
import httpStatus from 'http-status';
import app from '../../src/app';
import setupTestDB, { cleanUpTenantDatabases } from '../utils/setupTestDB';
import { userOne, insertUsers, userTwo } from '../fixtures/user.fixture';
import { userOneAccessToken, userTwoAccessToken } from '../fixtures/token.fixture';
import { Platform, Community, IPlatformUpdateBody, DatabaseManager, IModule, Module, IModuleUpdateBody } from '@togethercrew.dev/db';
import { communityOne, communityTwo, communityThree, insertCommunities } from '../fixtures/community.fixture';
import { moduleOne, moduleTwo, moduleThree, insertModules } from '../fixtures/module.fixture';

import {
    platformOne,
    platformTwo,
    platformThree,
    platformFour,
    platformFive,
    insertPlatforms,
} from '../fixtures/platform.fixture';
import { discordRole1, discordRole2, discordRole3, discordRole4, insertRoles } from '../fixtures/discord/roles.fixture';
import {
    discordChannel1,
    discordChannel2,
    discordChannel3,
    discordChannel4,
    discordChannel5,
    insertChannels,
} from '../fixtures/discord/channels.fixture';
import {
    discordGuildMember1,
    discordGuildMember2,
    discordGuildMember3,
    discordGuildMember4,
    insertGuildMembers,
} from '../fixtures/discord/guildMember.fixture';
import { discordServices } from '../../src/services';
import { analyzerAction, analyzerWindow } from '../../src/config/analyzer.statics';
import { Connection, Types } from 'mongoose';
import mongoose from 'mongoose';

setupTestDB();

describe('Module routes', () => {
    beforeAll(async () => {
    });
    beforeEach(async () => {
        userOne.communities = [communityOne._id, communityTwo._id];
        userTwo.communities = [communityThree._id];

        communityOne.users = [userOne._id];
        communityTwo.users = [userOne._id];
        communityThree.users = [userTwo._id];

        communityOne.platforms = [platformOne._id, platformTwo._id, platformFive._id];
        communityTwo.platforms = [platformThree._id];
        communityThree.platforms = [platformFour._id];

        platformOne.community = communityOne._id;
        platformTwo.community = communityOne._id;
        platformThree.community = communityTwo._id;
        platformFour.community = communityThree._id;
        platformFive.community = communityOne._id;

        moduleOne.community = communityOne._id;
        moduleTwo.community = communityTwo._id;
        moduleThree.community = communityThree._id;

    });
    // describe('POST api/v1/modules', () => {
    //     // eslint-disable-next-line @typescript-eslint/no-explicit-any
    //     let newModule: IModule;

    //     beforeEach(async () => {
    //         newModule = {
    //             name: 'hivemind',
    //             community: communityOne._id,
    //         };
    //     });

    //     test('should return 201 and successfully create new hivemind module if data is ok', async () => {
    //         userOne.communities = [communityOne._id];
    //         communityOne.users = [userOne._id];
    //         await insertCommunities([communityOne]);
    //         await insertUsers([userOne]);

    //         const res = await request(app)
    //             .post(`/api/v1/modules`)
    //             .set('Authorization', `Bearer ${userOneAccessToken}`)
    //             .send(newModule)
    //             .expect(httpStatus.CREATED);

    //         expect(res.body).toEqual({
    //             id: expect.anything(),
    //             name: newModule.name,
    //             community: communityOne._id.toHexString(),
    //             options: {
    //                 platforms: []
    //             }
    //         });

    //         const dbModule = await Module.findById(res.body.id);
    //         expect(dbModule).toBeDefined();
    //         expect(dbModule).toMatchObject({
    //             name: newModule.name,
    //             community: newModule.community,
    //             options: {
    //                 platforms: []
    //             }
    //         });
    //     });

    //     test('should return 401 error if access token is missing', async () => {
    //         await request(app).post(`/api/v1/modules`).send(newModule).expect(httpStatus.UNAUTHORIZED);
    //     });

    //     test('should return 400 error if there is a module with same name already for community', async () => {
    //         await insertCommunities([communityOne]);
    //         await insertModules([moduleOne])
    //         await insertUsers([userOne]);
    //         newModule.community = communityOne._id;
    //         await request(app)
    //             .post(`/api/v1/modules`)
    //             .set('Authorization', `Bearer ${userOneAccessToken}`)
    //             .send(newModule)
    //             .expect(httpStatus.BAD_REQUEST);

    //     });

    //     test('should return 400 error if name is invalid', async () => {
    //         await insertCommunities([communityOne]);
    //         await insertUsers([userOne]);
    //         await request(app)
    //             .post(`/api/v1/modules`)
    //             .set('Authorization', `Bearer ${userOneAccessToken}`)
    //             .send({ name: 'invalid', community: communityOne._id })
    //             .expect(httpStatus.BAD_REQUEST);
    //     });

    //     test('should return 404 error if community doesn not exist', async () => {
    //         await insertCommunities([communityOne]);
    //         await insertUsers([userOne]);
    //         newModule.community = new Types.ObjectId();
    //         await request(app)
    //             .post(`/api/v1/modules`)
    //             .set('Authorization', `Bearer ${userOneAccessToken}`)
    //             .send(newModule)
    //             .expect(httpStatus.NOT_FOUND);
    //     });
    //     test('should return 400 error if community is invalid', async () => {
    //         await insertCommunities([communityOne]);
    //         await insertUsers([userOne]);
    //         await request(app)
    //             .post(`/api/v1/platforms`)
    //             .set('Authorization', `Bearer ${userOneAccessToken}`)
    //             .send({ name: 'hivemind', community: 'invalid' })
    //             .expect(httpStatus.BAD_REQUEST);
    //     });

    // });
    // describe('GET /api/v1/modules', () => {
    //     test('should return 200 and apply the default query options', async () => {
    //         await insertCommunities([communityOne, communityTwo, communityThree]);
    //         await insertUsers([userOne, userTwo]);
    //         await insertModules([moduleOne, moduleTwo]);
    //         const res = await request(app)
    //             .get('/api/v1/modules')
    //             .set('Authorization', `Bearer ${userOneAccessToken}`)
    //             .query({ community: communityOne._id.toHexString() })
    //             .send()
    //             .expect(httpStatus.OK);

    //         expect(res.body).toEqual({
    //             results: expect.any(Array),
    //             page: 1,
    //             limit: 10,
    //             totalPages: 1,
    //             totalResults: 1,
    //         });
    //         expect(res.body.results).toHaveLength(1);

    //         expect(res.body.results[0]).toMatchObject({
    //             id: expect.anything(),
    //             name: moduleOne.name,
    //             community: communityOne._id.toHexString(),
    //             options: {
    //                 platforms: []
    //             }
    //         });
    //     });

    //     test('should return 401 if access token is missing', async () => {
    //         await insertCommunities([communityOne, communityTwo, communityThree]);
    //         await insertUsers([userOne, userTwo]);
    //         await insertModules([moduleOne, moduleTwo]);
    //         await request(app)
    //             .get('/api/v1/modules')
    //             .query({ community: communityOne._id.toHexString() })
    //             .send()
    //             .expect(httpStatus.UNAUTHORIZED);
    //     });

    //     test('should correctly apply filter on name field and return hivemind module', async () => {
    //         await insertCommunities([communityOne, communityTwo, communityThree]);
    //         await insertUsers([userOne, userTwo]);
    //         await insertModules([moduleOne, moduleTwo]);
    //         const res = await request(app)
    //             .get('/api/v1/modules')
    //             .set('Authorization', `Bearer ${userOneAccessToken}`)
    //             .query({ name: 'hivemind', community: communityOne._id.toHexString() })
    //             .send()
    //             .expect(httpStatus.OK);

    //         expect(res.body).toEqual({
    //             results: expect.any(Array),
    //             page: 1,
    //             limit: 10,
    //             totalPages: 1,
    //             totalResults: 1,
    //         });
    //         expect(res.body.results).toHaveLength(1);
    //         expect(res.body.results[0].id).toBe(moduleOne._id.toHexString());
    //     });

    //     test('should correctly sort the returned array if descending sort param is specified', async () => {
    //         await insertCommunities([communityOne, communityTwo, communityThree]);
    //         await insertUsers([userOne, userTwo]);
    //         await insertModules([moduleOne, moduleTwo]);
    //         const res = await request(app)
    //             .get('/api/v1/modules')
    //             .set('Authorization', `Bearer ${userOneAccessToken}`)
    //             .query({ sortBy: 'name:desc', community: communityOne._id.toHexString() })
    //             .send()
    //             .expect(httpStatus.OK);

    //         expect(res.body).toEqual({
    //             results: expect.any(Array),
    //             page: 1,
    //             limit: 10,
    //             totalPages: 1,
    //             totalResults: 1,
    //         });
    //         expect(res.body.results).toHaveLength(1);
    //         expect(res.body.results[0].id).toBe(moduleOne._id.toHexString());
    //     });

    //     test('should correctly sort the returned array if ascending sort param is specified', async () => {
    //         await insertCommunities([communityOne, communityTwo, communityThree]);
    //         await insertUsers([userOne, userTwo]);
    //         await insertModules([moduleOne, moduleTwo]);
    //         const res = await request(app)
    //             .get('/api/v1/modules')
    //             .set('Authorization', `Bearer ${userOneAccessToken}`)
    //             .query({ sortBy: 'name:asc', community: communityOne._id.toHexString() })
    //             .send()
    //             .expect(httpStatus.OK);

    //         expect(res.body).toEqual({
    //             results: expect.any(Array),
    //             page: 1,
    //             limit: 10,
    //             totalPages: 1,
    //             totalResults: 1,
    //         });
    //         expect(res.body.results).toHaveLength(1);
    //         expect(res.body.results[0].id).toBe(moduleOne._id.toHexString());
    //     });

    //     test('should limit returned array if limit param is specified', async () => {
    //         await insertCommunities([communityOne, communityTwo, communityThree]);
    //         await insertUsers([userOne, userTwo]);
    //         await insertModules([moduleOne, moduleTwo]);
    //         const res = await request(app)
    //             .get('/api/v1/modules')
    //             .set('Authorization', `Bearer ${userOneAccessToken}`)
    //             .query({ limit: 1, community: communityOne._id.toHexString() })
    //             .send()
    //             .expect(httpStatus.OK);

    //         expect(res.body).toEqual({
    //             results: expect.any(Array),
    //             page: 1,
    //             limit: 1,
    //             totalPages: 1,
    //             totalResults: 1,
    //         });
    //         expect(res.body.results).toHaveLength(1);
    //         expect(res.body.results[0].id).toBe(moduleOne._id.toHexString());
    //     });

    //     test('should return the correct page if page and limit params are specified', async () => {
    //         await insertCommunities([communityOne, communityTwo, communityThree]);
    //         await insertUsers([userOne, userTwo]);
    //         await insertModules([moduleOne, moduleTwo]);
    //         const res = await request(app)
    //             .get('/api/v1/modules')
    //             .set('Authorization', `Bearer ${userOneAccessToken}`)
    //             .query({ page: 2, limit: 1, community: communityOne._id.toHexString() })
    //             .send()
    //             .expect(httpStatus.OK);

    //         expect(res.body).toEqual({
    //             results: expect.any(Array),
    //             page: 2,
    //             limit: 1,
    //             totalPages: 1,
    //             totalResults: 1,
    //         });
    //         expect(res.body.results).toHaveLength(0);
    //     });
    // });
    describe('GET /api/v1/modules/:moduleId', () => {
        test('should return 200 and the module object if data is ok', async () => {
            await insertCommunities([communityOne, communityTwo, communityThree]);
            await insertUsers([userOne, userTwo]);
            await insertModules([moduleOne, moduleTwo]);
            const res = await request(app)
                .get(`/api/v1/modules/${moduleOne._id}`)
                .set('Authorization', `Bearer ${userOneAccessToken}`)
                .send()
                .expect(httpStatus.OK);
            expect(res.body).toEqual({
                id: expect.anything(),
                name: moduleOne.name,
                community: communityOne._id.toHexString(),
                options: {
                    platforms: []
                }
            });


        });

        test('should return 401 error if access token is missing', async () => {
            await insertUsers([userOne]);

            await request(app).get(`/api/v1/modules/${moduleOne._id}`).send().expect(httpStatus.UNAUTHORIZED);
        });

        test('should return 403 when user trys to access module they does not belong to', async () => {
            await insertCommunities([communityOne, communityTwo, communityThree]);
            await insertUsers([userOne, userTwo]);
            await insertModules([moduleOne, moduleTwo]);

            await request(app)
                .get(`/api/v1/modules/${moduleOne._id}`)
                .set('Authorization', `Bearer ${userTwoAccessToken}`)
                .send()
                .expect(httpStatus.FORBIDDEN);
        });

        test('should return 400 error if module is not a valid mongo id', async () => {
            await insertUsers([userOne, userTwo]);
            await request(app)
                .get(`/api/v1/modules/invalid`)
                .set('Authorization', `Bearer ${userOneAccessToken}`)
                .send()
                .expect(httpStatus.BAD_REQUEST);
        });

        test('should return 404 error if module is not found', async () => {
            await insertUsers([userOne]);

            await request(app)
                .get(`/api/v1/modules/${moduleOne._id}`)
                .set('Authorization', `Bearer ${userOneAccessToken}`)
                .send()
                .expect(httpStatus.NOT_FOUND);
        });
    });
    describe('PATCH /api/v1/modules/:moduleId', () => {
        let updateBody: IModuleUpdateBody;
        beforeEach(() => {
            updateBody = {
                options: {
                    platforms: [{
                        platform: platformOne._id,
                        metadata: {
                            answering: {
                                selectedChannels: ['1234']
                            },
                            learning: {
                                selectedChannels: ['8765', '1234'],
                                fromDate: new Date()
                            }
                        }
                    }]
                },
            };
        });
        test('should return 200 and successfully update hivemind module if data is ok', async () => {
            await insertCommunities([communityOne, communityTwo, communityThree]);
            await insertUsers([userOne, userTwo]);
            await insertModules([moduleOne, moduleTwo]);

            const res = await request(app)
                .patch(`/api/v1/modules/${moduleOne._id}`)
                .set('Authorization', `Bearer ${userOneAccessToken}`)
                .send(updateBody)
                .expect(httpStatus.OK);

            console.log(res.body)
            console.log(res.body.options)
            expect(res.body).toEqual({
                id: moduleOne._id,
                name: moduleOne.name,
                community: communityOne._id.toHexString(),
                options: {
                    platforms: [{
                        platform: platformOne._id,
                        metadata: {
                            answering: {
                                selectedChannels: updateBody.options?.platforms[0].metadata?.answering.selectedChannels,
                            },
                            learning: {
                                selectedChannels: updateBody.options?.platforms[0].metadata?.learning.selectedChannels,
                                fromDate: updateBody.options?.platforms[0].metadata?.learning.fromDate.toISOString()
                            }
                        }
                    }]
                },
            });

            const dbModule = await Module.findById(res.body.id);
            expect(dbModule).toBeDefined();
            expect(dbModule).toMatchObject({
                id: moduleOne._id,
                name: moduleOne.name,
                community: communityOne._id.toHexString(),
                options: updateBody.options
            });
        });

        // test('should return 401 error if access token is missing', async () => {
        //     await insertUsers([userOne]);
        //     await request(app)
        //         .patch(`/api/v1/modules/${moduleOne._id}`)
        //         .send(updateBody)
        //         .expect(httpStatus.UNAUTHORIZED);
        // });

        // test('should return 403 when user trys to update module they does not access to', async () => {
        //     await insertCommunities([communityOne, communityTwo, communityThree]);
        //     await insertUsers([userOne, userTwo]);
        //     await insertModules([moduleOne, moduleTwo]);
        //     await request(app)
        //         .patch(`/api/v1/modules/${moduleOne._id}`)
        //         .set('Authorization', `Bearer ${userTwoAccessToken}`)
        //         .send(updateBody)
        //         .expect(httpStatus.FORBIDDEN);
        // });

        // test('should return 400 error if moduleId is not a valid mongo id', async () => {
        //     await insertCommunities([communityOne, communityTwo, communityThree]);
        //     await insertUsers([userOne, userTwo]);
        //     await insertModules([moduleOne, moduleTwo]);
        //     await request(app)
        //         .patch(`/api/v1/modules/invalid`)
        //         .set('Authorization', `Bearer ${userOneAccessToken}`)
        //         .send(updateBody)
        //         .expect(httpStatus.BAD_REQUEST);
        // });

        // test('should return 400 error if metadata is invalid for the hivemind module', async () => {
        //     await insertCommunities([communityOne, communityTwo, communityThree]);
        //     await insertUsers([userOne, userTwo]);
        //     await insertModules([moduleOne, moduleTwo]);
        //     updateBody.options = {
        //         platforms: [{
        //             platform: platformOne._id,
        //             metadata: {
        //                 invalid: 1234
        //             }
        //         }]
        //     };
        //     await request(app)
        //         .patch(`/api/v1/modules/${platformOne._id}`)
        //         .set('Authorization', `Bearer ${userOneAccessToken}`)
        //         .send(updateBody)
        //         .expect(httpStatus.BAD_REQUEST);
        // });


    });
    describe('DELETE /api/v1/modules/:moduleId', () => {
        test('should return 204 and delete the module', async () => {
            await insertCommunities([communityOne, communityTwo, communityThree]);
            await insertUsers([userOne, userTwo]);
            await insertModules([moduleOne, moduleTwo]);

            await request(app)
                .delete(`/api/v1/modules/${moduleOne._id}`)
                .set('Authorization', `Bearer ${userOneAccessToken}`)
                .send()
                .expect(httpStatus.NO_CONTENT);

            const dbModule = await Module.findById(moduleOne._id);
            expect(dbModule).toBeNull();
        });

        test('should return 401 error if access token is missing', async () => {
            await insertCommunities([communityOne, communityTwo, communityThree]);
            await insertUsers([userOne, userTwo]);
            await insertModules([moduleOne, moduleTwo]);
            await request(app)
                .delete(`/api/v1/modules/${moduleOne._id}`)
                .send()
                .expect(httpStatus.UNAUTHORIZED);
        });

        test('should return 403 when user trys to delete module they does not access to', async () => {
            await insertCommunities([communityOne, communityTwo, communityThree]);
            await insertUsers([userOne, userTwo]);
            await insertModules([moduleOne, moduleTwo]);

            await request(app)
                .delete(`/api/v1/modules/${moduleOne._id}`)
                .set('Authorization', `Bearer ${userTwoAccessToken}`)
                .send()
                .expect(httpStatus.FORBIDDEN);
        });

        test('should return 400 error if moduleId is not a valid mongo id', async () => {
            await insertUsers([userOne]);

            await request(app)
                .delete(`/api/v1/modules/invalid`)
                .set('Authorization', `Bearer ${userOneAccessToken}`)
                .send()
                .expect(httpStatus.BAD_REQUEST);
        });

        test('should return 404 error if module already is not found', async () => {
            await insertUsers([userOne]);

            await request(app)
                .delete(`/api/v1/modules/${moduleOne._id}`)
                .set('Authorization', `Bearer ${userOneAccessToken}`)
                .send()
                .expect(httpStatus.NOT_FOUND);
        });
    });
});

describe('TEST', () => {
    describe('TEST', () => {
        test('TEST', async () => {
            expect(true).toEqual(true);
        });
    });
});
