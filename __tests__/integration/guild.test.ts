import request from 'supertest';
import httpStatus from 'http-status';
import moment from 'moment';
import app from '../../src/app';
import setupTestDB from '../utils/setupTestDB';
import { userOne, insertUsers } from '../fixtures/user.fixture';
import { userOneAccessToken } from '../fixtures/token.fixture';
import { discordResponseGuildOne, guildOne, guildTwo, guildThree, guildFour, guildFive, insertGuilds } from '../fixtures/guilds.fixture';
import { channel1, channel2, channel3, channel4, channel5, insertChannels } from '../fixtures/channels.fixture';
import { role1, role2, role3, role4, insertRoles } from '../fixtures/discord.roles.fixture';
import { IGuildUpdateBody } from '../../src/interfaces/guild.interface';
import { guildService, authService, userService, sagaService } from '../../src/services';
import { Guild, databaseService } from '@togethercrew.dev/db';
import config from '../../src/config';

setupTestDB();

describe('Guild routes', () => {

    const connection = databaseService.connectionFactory(guildFive.guildId, config.mongoose.botURL);

    describe('GET /api/v1/guilds/:guildId/channels', () => {
        beforeEach(async () => {
            await connection.dropDatabase();
        });
        test('should return 200 and array of channels of the guild', async () => {
            await insertUsers([userOne]);
            await insertGuilds([guildFive]);
            await insertChannels([channel1, channel2, channel3, channel4, channel5], connection);
            const res = await request(app)
                .get(`/api/v1/guilds/${guildFive.guildId}/channels`)
                .set('Authorization', `Bearer ${userOneAccessToken}`)
                .send()
                .expect(httpStatus.OK);

            expect(res.body).toHaveLength(2);
            expect(res.body[0].subChannels).toHaveLength(2);
            expect(res.body[1].subChannels).toHaveLength(1);


            expect(res.body[0]).toMatchObject({
                channelId: "987654321098765432",
                title: "Channel 1",
                subChannels: [{
                    channelId: "234567890123456789",
                    name: "Channel 2",
                    parentId: "987654321098765432",
                    canReadMessageHistoryAndViewChannel: false
                },
                {
                    channelId: "345678901234567890",
                    name: "Channel 3",
                    parentId: "987654321098765432",
                    canReadMessageHistoryAndViewChannel: true
                }]
            });
            expect(res.body[1]).toMatchObject({
                channelId: "0",
                title: "unCategorized",
                subChannels: [{
                    channelId: "345678901234567000",
                    name: "Channel 4",
                    parentId: "345678901234567000",
                    canReadMessageHistoryAndViewChannel: true
                }]
            });
        })
        test('should return 440 if did not find guild with guildId and relative user', async () => {
            await insertUsers([userOne]);
            await request(app)
                .get(`/api/v1/guilds/${guildFive.guildId}/channels`)
                .set('Authorization', `Bearer ${userOneAccessToken}`)
                .send()
                .expect(440);

        })
        test('should return 401 if access token is missing', async () => {
            await insertUsers([userOne]);
            await request(app)
                .get(`/api/v1/guilds/${guildFive.guildId}/channels`)
                .send()
                .expect(httpStatus.UNAUTHORIZED);
        })
    })

    describe('GET /api/v1/guilds/:guildId/selected-channels', () => {
        beforeEach(async () => {
            await connection.dropDatabase();
        });
        test('should return 200 and array of selected channels of the guild', async () => {
            await insertUsers([userOne]);
            await insertGuilds([guildFive]);
            await insertChannels([channel1, channel2, channel3, channel4, channel5], connection);
            const res = await request(app)
                .get(`/api/v1/guilds/${guildFive.guildId}/selected-channels`)
                .set('Authorization', `Bearer ${userOneAccessToken}`)
                .send()
                .expect(httpStatus.OK);

            expect(res.body).toHaveLength(2);
            expect(res.body[0].subChannels).toHaveLength(1);
            expect(res.body[1].subChannels).toHaveLength(1);


            expect(res.body[0]).toMatchObject({
                channelId: "987654321098765432",
                title: "Channel 1",
                subChannels: [{
                    channelId: "234567890123456789",
                    name: "Channel 2",
                    parentId: "987654321098765432",
                }]
            });
            expect(res.body[1]).toMatchObject({
                channelId: "0",
                title: "unCategorized",
                subChannels: [{
                    channelId: "345678901234567000",
                    name: "Channel 4",
                    parentId: "345678901234567000",
                }]
            });
        })

        test('should return 200 and empty array if selected channels of the guild is empty', async () => {
            await insertUsers([userOne]);
            await insertGuilds([guildOne]);
            const res = await request(app)
                .get(`/api/v1/guilds/${guildOne.guildId}/selected-channels`)
                .set('Authorization', `Bearer ${userOneAccessToken}`)
                .send()
                .expect(httpStatus.OK);

            expect(res.body).toHaveLength(0);
        })

        test('should return 440 if did not find guild with guildId and relative user', async () => {
            await insertUsers([userOne]);
            await request(app)
                .get(`/api/v1/guilds/${guildFive.guildId}/selected-channels`)
                .set('Authorization', `Bearer ${userOneAccessToken}`)
                .send()
                .expect(440);
        })
        test('should return 401 if access token is missing', async () => {
            await insertUsers([userOne]);
            await request(app)
                .get(`/api/v1/guilds/${guildFive.guildId}/selected-channels`)
                .send()
                .expect(httpStatus.UNAUTHORIZED);
        })
    })

    describe('GET /api/v1/guilds/:guildId', () => {
        test('should return 200 and the guild object if data is ok', async () => {
            await insertUsers([userOne]);
            await insertGuilds([guildOne]);

            const res = await request(app)
                .get(`/api/v1/guilds/${guildOne.guildId}`)
                .set('Authorization', `Bearer ${userOneAccessToken}`)
                .expect(httpStatus.OK);

            expect(res.body).toMatchObject({
                id: guildOne._id.toHexString(),
                guildId: guildOne.guildId,
                user: userOne.discordId,
                name: guildOne.name,
                selectedChannels: [],
                isInProgress: guildOne.isInProgress,
                isDisconnected: guildOne.isDisconnected,
                connectedAt: expect.anything(),
                icon: guildOne.icon,
                action: [1, 1, 1, 4, 3, 5, 5, 4, 3, 2, 2, 2, 1],
                window: [7, 1]
            });
        })

        test('should return 401 if access token is missing', async () => {
            await insertUsers([userOne]);
            await insertGuilds([guildOne]);

            await request(app)
                .get(`/api/v1/guilds/${guildOne.guildId}`)
                .expect(httpStatus.UNAUTHORIZED);
        })
        test('should return 440 if did not find guild with guildId and relative user', async () => {
            await insertUsers([userOne]);
            await request(app)
                .get(`/api/v1/guilds/${guildOne.guildId}`)
                .set('Authorization', `Bearer ${userOneAccessToken}`)
                .send()
                .expect(440);
        })
    })

    describe('POST /api/v1/guilds/connect', () => {
        test('should return 302 when redirect correctly if req data is ok', async () => {
            await insertUsers([userOne]);
            await request(app)
                .get(`/api/v1/guilds/connect`)
                .set('Authorization', `Bearer ${userOneAccessToken}`)
                .expect(httpStatus.FOUND)
        })
    })

    describe('GET /api/v1/guilds/connect/callback', () => {
        userService.getUserFromDiscordAPI = jest.fn().mockReturnValue({
            id: '681946187490000900',
            username: 'Behzad',
            avatar: '947f3e19e6e36a2679c6fe854b79a699',
            email: 'gmail@yaoo.com',
            verified: true
        })
        authService.exchangeCode = jest.fn().mockReturnValue({
            access_token: 'mockAccess',
            expires_in: 604800,
            refresh_token: 'mockRefresh',
            scope: 'some scope',
            token_type: 'Bearer',
            guild: {
                id: '681946187490000803',
            }
        });
        test('should return 302 and successfully create guild', async () => {
            await insertUsers([userOne]);
            await request(app)
                .get('/api/v1/guilds/connect/callback')
                .query({ code: 'code' })
                .send()
                .expect(httpStatus.FOUND);

            const dbGuild = await Guild.findById(guildTwo._id);
            expect(dbGuild).toBeDefined();
        })
        test('should return 302 and set guild isDisconnected filed to false if the guild is exist in db', async () => {
            await insertUsers([userOne]);
            await insertGuilds([guildTwo]);
            await request(app)
                .get('/api/v1/guilds/connect/callback')
                .query({ code: 'code' })
                .send()
                .expect(httpStatus.FOUND);


            const dbGuild = await Guild.findById(guildTwo._id);
            expect(dbGuild).toBeDefined();
            expect(dbGuild).toMatchObject({ isDisconnected: false });

        })

        test('should return 302 if user is not in db', async () => {
            await request(app)
                .get('/api/v1/guilds/connect/callback')
                .query({ code: 'code' })
                .send()
                .expect(httpStatus.FOUND);

        })
        test('should return 302 if code does not provided', async () => {
            await request(app)
                .get('/api/v1/guilds/connect/callback')
                .send()
                .expect(httpStatus.FOUND);
        })
    })

    describe('POST /api/v1/guilds/:guildId/disconnect', () => {
        test('should return 200 and soft disconnect the guild if req data is ok', async () => {
            await insertUsers([userOne]);
            await insertGuilds([guildOne]);
            await request(app)
                .post(`/api/v1/guilds/${guildOne.guildId}/disconnect`)
                .set('Authorization', `Bearer ${userOneAccessToken}`)
                .send({ disconnectType: 'soft' })
                .expect(httpStatus.NO_CONTENT);


            const dbGuild = await Guild.findById(guildOne._id);
            expect(dbGuild).toBeDefined();
            expect(dbGuild).toMatchObject({ isDisconnected: true });
        })

        test('should return 200 and hard disconnect the guild if req data is ok', async () => {
            await insertUsers([userOne]);
            await insertGuilds([guildOne]);
            await request(app)
                .post(`/api/v1/guilds/${guildOne.guildId}/disconnect`)
                .set('Authorization', `Bearer ${userOneAccessToken}`)
                .send({ disconnectType: 'hard' })
                .expect(httpStatus.NO_CONTENT);

            const dbGuild = await Guild.findById(guildOne._id);
            expect(dbGuild).toBe(null);
        })


        test('should return 401 if access token is missing', async () => {
            await insertUsers([userOne]);
            await insertGuilds([guildOne]);
            await request(app)
                .post(`/api/v1/guilds/${guildOne.guildId}/disconnect`)
                .send({ disconnectType: 'soft' })
                .expect(httpStatus.UNAUTHORIZED);
        })

        test('should return 440 if did not find guild with guildId and relative user', async () => {
            await insertUsers([userOne]);
            await request(app)
                .post(`/api/v1/guilds/${guildOne.guildId}/disconnect`)
                .set('Authorization', `Bearer ${userOneAccessToken}`)
                .send({ disconnectType: 'soft' })
                .expect(440);
        })
        test('should return 400 if disconnectType is invalid', async () => {
            await insertUsers([userOne]);
            await request(app)
                .post(`/api/v1/guilds/${guildOne.guildId}/disconnect`)
                .set('Authorization', `Bearer ${userOneAccessToken}`)
                .send({ disconnectType: ':/' })
                .expect(httpStatus.BAD_REQUEST);
        });
    })

    describe('PATCH /api/v1/guilds/:guildId', () => {
        let updateBody: IGuildUpdateBody;
        beforeEach(() => {
            updateBody = {
                period: moment("2022-02-01 08:30:26.127Z").toDate(),
                selectedChannels: [
                    {
                        channelId: channel1.channelId,
                        channelName: 'Name'
                    }
                ],
                isDisconnected: false
            };
            sagaService.createAndStartGuildSaga = jest.fn().mockReturnValue({});

        });
        test('should return 200 and successfully update guild if data is ok', async () => {
            await insertUsers([userOne]);
            await insertGuilds([guildOne]);

            const res = await request(app)
                .patch(`/api/v1/guilds/${guildOne.guildId}`)
                .set('Authorization', `Bearer ${userOneAccessToken}`)
                .send(updateBody)
                .expect(httpStatus.OK);

            expect(res.body).toMatchObject({
                id: guildOne._id.toHexString(),
                guildId: guildOne.guildId,
                user: userOne.discordId,
                name: guildOne.name,
                selectedChannels: updateBody.selectedChannels
            });

            const dbGuild = await Guild.findById(guildOne._id);
            expect(dbGuild).toBeDefined();
            expect(dbGuild).toMatchObject({ period: updateBody.period, selectedChannels: updateBody.selectedChannels });
        })

        test('should return 401 if access token is missing', async () => {
            await insertUsers([userOne]);
            await insertGuilds([guildOne]);

            await request(app)
                .patch(`/api/v1/guilds/${guildOne.guildId}`)
                .send(updateBody)
                .expect(httpStatus.UNAUTHORIZED);
        })

        test('should return 440 if did not find guild with guildId and relative user', async () => {
            await insertUsers([userOne]);

            await request(app)
                .patch(`/api/v1/guilds/${guildOne.guildId}`)
                .set('Authorization', `Bearer ${userOneAccessToken}`)
                .send(updateBody)
                .expect(440);
        })


        test('should return 400 if selectedChannels is invalid', async () => {
            await insertUsers([userOne]);
            const updateBody = { selectedChannels: ':(' };

            await request(app)
                .patch(`/api/v1/guilds/${guildOne.guildId}`)
                .set('Authorization', `Bearer ${userOneAccessToken}`)
                .send(updateBody)
                .expect(httpStatus.BAD_REQUEST);
        });

        test('should return 400 if isDisconnected is invalid', async () => {
            await insertUsers([userOne]);
            const updateBody = { isDisconnected: ':(' };

            await request(app)
                .patch(`/api/v1/guilds/${guildOne.guildId}`)
                .set('Authorization', `Bearer ${userOneAccessToken}`)
                .send(updateBody)
                .expect(httpStatus.BAD_REQUEST);
        });
    })

    describe('GET /api/v1/guilds/discord-api/:guildId', () => {
        beforeEach(() => {
            guildService.getGuildFromDiscordAPI = jest.fn().mockReturnValue(discordResponseGuildOne);
        });

        test('should return 200 and the guild object (from Discord API) if data is ok', async () => {
            await insertUsers([userOne]);
            await insertGuilds([guildOne]);

            const res = await request(app)
                .get(`/api/v1/guilds/discord-api/${guildOne.guildId}`)
                .set('Authorization', `Bearer ${userOneAccessToken}`)
                .expect(httpStatus.OK);

            expect(res.body).toEqual(discordResponseGuildOne);
        })

        test('should return 401 if access token is missing', async () => {
            await insertUsers([userOne]);
            await insertGuilds([guildOne]);

            await request(app)
                .get(`/api/v1/guilds/discord-api/${guildOne.guildId}`)
                .expect(httpStatus.UNAUTHORIZED);
        })

        test('should return 440 if did not find guild with guildId and relative user', async () => {
            await insertUsers([userOne]);
            await request(app)
                .get(`/api/v1/guilds/discord-api/${guildOne.guildId}`)
                .set('Authorization', `Bearer ${userOneAccessToken}`)
                .send()
                .expect(440);

        })
    })

    describe('GET /api/v1/guilds', () => {
        test('should return 200 and apply the default query options', async () => {
            await insertUsers([userOne]);
            await insertGuilds([guildOne, guildTwo, guildThree, guildFour]);
            const res = await request(app)
                .get('/api/v1/guilds')
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
                id: guildOne._id.toHexString(),
                guildId: guildOne.guildId,
                user: userOne.discordId,
                name: guildOne.name,
                selectedChannels: [],
                isInProgress: guildOne.isInProgress,
                isDisconnected: guildOne.isDisconnected,
                connectedAt: expect.anything(),
                icon: guildOne.icon,
                action: [1, 1, 1, 4, 3, 5, 5, 4, 3, 2, 2, 2, 1],
                window: [7, 1]
            });
        });

        test('should return 401 if access token is missing', async () => {
            await insertUsers([userOne]);

            await request(app)
                .get('/api/v1/guilds')
                .send()
                .expect(httpStatus.UNAUTHORIZED);
        });

        test('should correctly apply filter on isInProgress field', async () => {
            await insertUsers([userOne]);
            await insertGuilds([guildOne, guildTwo, guildThree, guildFour]);

            const res = await request(app)
                .get('/api/v1/guilds')
                .set('Authorization', `Bearer ${userOneAccessToken}`)
                .query({ isInProgress: guildOne.isInProgress })
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
            expect(res.body.results[0].id).toBe(guildOne._id.toHexString());
        });

        test('should correctly apply filter on isDisconnected field', async () => {
            await insertUsers([userOne]);
            await insertGuilds([guildOne, guildTwo, guildThree, guildFour]);

            const res = await request(app)
                .get('/api/v1/guilds')
                .set('Authorization', `Bearer ${userOneAccessToken}`)
                .query({ isDisconnected: guildTwo.isDisconnected })
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
            expect(res.body.results[0].id).toBe(guildTwo._id.toHexString());
        });

        test('should correctly sort the returned array if descending sort param is specified', async () => {
            await insertUsers([userOne]);
            await insertGuilds([guildOne, guildTwo, guildThree, guildFour]);

            const res = await request(app)
                .get('/api/v1/guilds')
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
            expect(res.body.results[0].id).toBe(guildTwo._id.toHexString());
            expect(res.body.results[1].id).toBe(guildOne._id.toHexString());
        });

        test('should correctly sort the returned array if ascending sort param is specified', async () => {
            await insertUsers([userOne]);
            await insertGuilds([guildOne, guildTwo, guildThree, guildFour]);

            const res = await request(app)
                .get('/api/v1/guilds')
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
            expect(res.body.results[0].id).toBe(guildOne._id.toHexString());
            expect(res.body.results[1].id).toBe(guildTwo._id.toHexString());
        });

        test('should correctly sort the returned array if multiple sorting criteria are specified', async () => {
            await insertUsers([userOne]);
            await insertGuilds([guildOne, guildTwo, guildThree, guildFour]);

            const res = await request(app)
                .get('/api/v1/guilds')
                .set('Authorization', `Bearer ${userOneAccessToken}`)
                .query({ sortBy: 'isInProgress:desc,name:asc' })
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

            expect(res.body.results[0].id).toBe(guildOne._id.toHexString());
            expect(res.body.results[1].id).toBe(guildTwo._id.toHexString());
        });

        test('should limit returned array if limit param is specified', async () => {
            await insertUsers([userOne]);
            await insertGuilds([guildOne, guildTwo, guildThree, guildFour]);

            const res = await request(app)
                .get('/api/v1/guilds')
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
            expect(res.body.results[0].id).toBe(guildOne._id.toHexString());
        });

        test('should return the correct page if page and limit params are specified', async () => {
            await insertUsers([userOne]);
            await insertGuilds([guildOne, guildTwo, guildThree, guildFour]);

            const res = await request(app)
                .get('/api/v1/guilds')
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
            expect(res.body.results[0].id).toBe(guildTwo._id.toHexString());
        });
    });

    describe('GET /api/v1/guilds/:guildId/roles', () => {
        beforeEach(async () => {
            await connection.dropDatabase();
        });
        test('should return 200 and apply the default query options', async () => {
            await insertUsers([userOne]);
            await insertGuilds([guildFive]);
            await insertRoles([role1, role2, role3, role4], connection);

            const res = await request(app)
                .get(`/api/v1/guilds/${guildFive.guildId}/roles`)
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

            expect(res.body.results[0]).toEqual({
                roleId: role1.roleId,
                name: role1.name,
                color: role1.color,
            });
            expect(res.body.results[1]).toEqual({
                roleId: role3.roleId,
                name: role3.name,
                color: role3.color,
            });

            expect(res.body.results[2]).toEqual({
                roleId: role2.roleId,
                name: role2.name,
                color: role2.color,
            });
        })

        test('should return 401 if access token is missing', async () => {
            await insertUsers([userOne]);
            await request(app)
                .get(`/api/v1/guilds/${guildFive.guildId}/roles`)
                .send()
                .expect(httpStatus.UNAUTHORIZED);
        })
        test('should return 400 if guild id is not valid', async () => {
            await insertUsers([userOne]);
            await request(app)
                .get(`/api/v1/guilds/1234/roles`)
                .expect(httpStatus.UNAUTHORIZED);
        })

        test('should return 440 if did not find guild with guildId and relative user', async () => {
            await insertUsers([userOne]);
            await request(app)
                .get(`/api/v1/guilds/${guildFive.guildId}/roles`)
                .set('Authorization', `Bearer ${userOneAccessToken}`)
                .send()
                .expect(440);
        })

        test('should correctly apply filter on name field', async () => {
            await insertUsers([userOne]);
            await insertGuilds([guildFive]);
            await insertRoles([role1, role2, role3, role4], connection);

            const res = await request(app)
                .get(`/api/v1/guilds/${guildFive.guildId}/roles`)
                .set('Authorization', `Bearer ${userOneAccessToken}`)
                .query({ name: "Member" })
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
            expect(res.body.results[0].roleId).toBe(role3.roleId);

        })

        test('should correctly sort the returned array if descending sort param is specified', async () => {
            await insertUsers([userOne]);
            await insertGuilds([guildFive]);
            await insertRoles([role1, role2, role3, role4], connection);

            const res = await request(app)
                .get(`/api/v1/guilds/${guildFive.guildId}/roles`)
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
            expect(res.body.results[0].roleId).toBe(role2.roleId);
            expect(res.body.results[1].roleId).toBe(role3.roleId);
            expect(res.body.results[2].roleId).toBe(role1.roleId);
        })

        test('should correctly sort the returned array if ascending  sort param is specified', async () => {
            await insertUsers([userOne]);
            await insertGuilds([guildFive]);
            await insertRoles([role1, role2, role3, role4], connection);

            const res = await request(app)
                .get(`/api/v1/guilds/${guildFive.guildId}/roles`)
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
            expect(res.body.results[0].roleId).toBe(role1.roleId);
            expect(res.body.results[1].roleId).toBe(role3.roleId);
            expect(res.body.results[2].roleId).toBe(role2.roleId);
        })

        test('should limit returned array if limit param is specified', async () => {
            await insertUsers([userOne]);
            await insertGuilds([guildFive]);
            await insertRoles([role1, role2, role3, role4], connection);

            const res = await request(app)
                .get(`/api/v1/guilds/${guildFive.guildId}/roles`)
                .set('Authorization', `Bearer ${userOneAccessToken}`)
                .query({ limit: 2 })
                .send()
                .expect(httpStatus.OK);


            expect(res.body).toEqual({
                results: expect.any(Array),
                page: 1,
                limit: 2,
                totalPages: 2,
                totalResults: 3,
            });
            expect(res.body.results).toHaveLength(2);
            expect(res.body.results[0].roleId).toBe(role1.roleId);
            expect(res.body.results[1].roleId).toBe(role3.roleId);
        })

        test('should correctly sort the returned array if page and limit are  specified', async () => {
            await insertUsers([userOne]);
            await insertGuilds([guildFive]);
            await insertRoles([role1, role2, role3, role4], connection);

            const res = await request(app)
                .get(`/api/v1/guilds/${guildFive.guildId}/roles`)
                .set('Authorization', `Bearer ${userOneAccessToken}`)
                .query({ page: 2, limit: 2 })
                .send()
                .expect(httpStatus.OK);


            expect(res.body).toEqual({
                results: expect.any(Array),
                page: 2,
                limit: 2,
                totalPages: 2,
                totalResults: 3,
            });
            expect(res.body.results).toHaveLength(1);
            expect(res.body.results[0].roleId).toBe(role2.roleId);
        })
    })

});