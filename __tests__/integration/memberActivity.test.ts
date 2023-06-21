import request from 'supertest';
import httpStatus from 'http-status';
import app from '../../src/app';
import setupTestDB from '../utils/setupTestDB';
import { userOne, insertUsers } from '../fixtures/user.fixture';
import { userOneAccessToken } from '../fixtures/token.fixture';
import { memberActivityOne, memberActivityTwo, memberActivityThree, memberActivityFour, insertMemberActivities } from '../fixtures/memberActivity.fixture';
import { guildMemberOne, guildMemberTwo, guildMemberThree, guildMemberFour, insertGuildMembers } from '../fixtures/guildMember.fixture';
import { guildOne, insertGuilds } from '../fixtures/guilds.fixture';
import { databaseService } from '@togethercrew.dev/db';
import { discordRoleOne, discordRoleTwo, discordRoleThree } from '../fixtures/discord.roles.fixture';
import { guildService } from '../../src/services';
import config from '../../src/config';


setupTestDB();

describe('member-activity routes', () => {
    const connection = databaseService.connectionFactory(guildOne.guildId, config.mongoose.botURL);
    describe('POST /api/v1/member-activity/:guildId/active-members-composition-line-graph', () => {
        beforeEach(async () => {
            await connection.dropDatabase();
        });
        test('should return 200 and active members composition line graph data if req data is ok', async () => {
            await insertUsers([userOne]);
            await insertGuilds([guildOne]);

            await insertMemberActivities([memberActivityOne, memberActivityTwo, memberActivityThree, memberActivityFour], connection);
            const res = await request(app)
                .post(`/api/v1/member-activity/${guildOne.guildId}/active-members-composition-line-graph`)
                .set('Authorization', `Bearer ${userOneAccessToken}`)
                .send({ startDate: new Date("2023-04-01"), endDate: new Date("2023-04-07") })
                .expect(httpStatus.OK);

            expect(res.body).toMatchObject({
                totActiveMembers: 1,
                newlyActive: 3,
                consistentlyActive: 0,
                vitalMembers: 0,
                becameDisengaged: 1,
                totActiveMembersPercentageChange: "N/A",
                newlyActivePercentageChange: 200,
                consistentlyActivePercentageChange: "N/A",
                vitalMembersPercentageChange: -100,
                becameDisengagedPercentageChange: 0,
            });

            expect(res.body.categories).toEqual(['01 Apr', '02 Apr', '03 Apr', '04 Apr', '05 Apr', '06 Apr', '07 Apr']);
            expect(res.body.series[0].name).toBe('totActiveMembers');
            expect(res.body.series[1].name).toBe('newlyActive');
            expect(res.body.series[2].name).toBe('consistentlyActive');
            expect(res.body.series[3].name).toBe('vitalMembers');
            expect(res.body.series[4].name).toBe('becameDisengaged');

            expect(res.body.series[0].data).toEqual([0, 0, 0, 0, 0, 0, 1]);
            expect(res.body.series[1].data).toEqual([1, 0, 0, 0, 0, 0, 3]);
            expect(res.body.series[2].data).toEqual([0, 0, 0, 0, 0, 0, 0]);
            expect(res.body.series[3].data).toEqual([1, 0, 0, 0, 0, 0, 0]);
            expect(res.body.series[4].data).toEqual([1, 0, 0, 0, 0, 0, 1]);

        })

        test('should return 200 and active members composition line graph data (testing for empty data) if req data is ok', async () => {
            await insertUsers([userOne]);
            await insertGuilds([guildOne]);

            const res = await request(app)
                .post(`/api/v1/member-activity/${guildOne.guildId}/active-members-composition-line-graph`)
                .set('Authorization', `Bearer ${userOneAccessToken}`)
                .send({ startDate: new Date("2021-02-21"), endDate: new Date("2022-02-24") })
                .expect(httpStatus.OK);

            expect(res.body).toMatchObject({
                totActiveMembers: 0,
                newlyActive: 0,
                consistentlyActive: 0,
                vitalMembers: 0,
                becameDisengaged: 0,
                totActiveMembersPercentageChange: 0,
                newlyActivePercentageChange: 0,
                consistentlyActivePercentageChange: 0,
                vitalMembersPercentageChange: 0,
                becameDisengagedPercentageChange: 0,
            });
        })

        test('should return 401 if access token is missing', async () => {
            await request(app)
                .post(`/api/v1/member-activity/${guildOne.guildId}/active-members-composition-line-graph`)
                .send({ startDate: new Date(), endDate: new Date() })
                .expect(httpStatus.UNAUTHORIZED);
        })

        test('should return 404 if guild not found', async () => {
            await insertUsers([userOne]);
            await request(app)
                .post(`/api/v1/member-activity/${guildOne.guildId}/active-members-composition-line-graph`)
                .set('Authorization', `Bearer ${userOneAccessToken}`)
                .send({ startDate: new Date(), endDate: new Date() })
                .expect(httpStatus.NOT_FOUND);
        })
    })

    describe('POST /api/v1/member-activity/:guildId/disengaged-members-composition-line-graph', () => {
        beforeEach(async () => {
            await connection.dropDatabase();
        });
        test('should return 200 and disengaged members composition line graph data if req data is ok', async () => {
            await insertUsers([userOne]);
            await insertGuilds([guildOne]);

            await insertMemberActivities([memberActivityOne, memberActivityTwo, memberActivityThree, memberActivityFour], connection);
            const res = await request(app)
                .post(`/api/v1/member-activity/${guildOne.guildId}/disengaged-members-composition-line-graph`)
                .set('Authorization', `Bearer ${userOneAccessToken}`)
                .send({ startDate: new Date("2023-04-01"), endDate: new Date("2023-04-07") })
                .expect(httpStatus.OK);


            expect(res.body).toMatchObject({
                becameDisengaged: 1,
                wereNewlyActive: 3,
                wereConsistentlyActive: 1,
                wereVitalMembers: 1,
                becameDisengagedPercentageChange: 0,
                wereNewlyActivePercentageChange: 200,
                wereConsistentlyActivePercentageChange: "N/A",
                wereVitalMembersPercentageChange: -75,
            });


            expect(res.body.categories).toEqual(['01 Apr', '02 Apr', '03 Apr', '04 Apr', '05 Apr', '06 Apr', '07 Apr']);
            expect(res.body.series[0].name).toBe('becameDisengaged');
            expect(res.body.series[1].name).toBe('wereNewlyActive');
            expect(res.body.series[2].name).toBe('wereConsistentlyActive');
            expect(res.body.series[3].name).toBe('wereVitalMembers');

            expect(res.body.series[0].data).toEqual([1, 0, 0, 0, 0, 0, 1]);
            expect(res.body.series[1].data).toEqual([1, 0, 0, 0, 0, 0, 3]);
            expect(res.body.series[2].data).toEqual([0, 0, 0, 0, 0, 0, 1]);
            expect(res.body.series[3].data).toEqual([1, 0, 0, 0, 0, 0, 1]);
        })

        test('should return 200 and disengaged members composition line graph data (testing for empty data) if req data is ok', async () => {
            await insertUsers([userOne]);
            await insertGuilds([guildOne]);
            const res = await request(app)
                .post(`/api/v1/member-activity/${guildOne.guildId}/disengaged-members-composition-line-graph`)
                .set('Authorization', `Bearer ${userOneAccessToken}`)
                .send({ startDate: new Date("2023-04-01"), endDate: new Date("2023-04-07") })
                .expect(httpStatus.OK);


            expect(res.body).toMatchObject({
                becameDisengaged: 0,
                wereNewlyActive: 0,
                wereConsistentlyActive: 0,
                wereVitalMembers: 0,
                becameDisengagedPercentageChange: 0,
                wereNewlyActivePercentageChange: 0,
                wereConsistentlyActivePercentageChange: 0,
                wereVitalMembersPercentageChange: 0,
            });
        })

        test('should return 401 if access token is missing', async () => {
            await request(app)
                .post(`/api/v1/member-activity/${guildOne.guildId}/disengaged-members-composition-line-graph`)
                .send({ startDate: new Date(), endDate: new Date() })
                .expect(httpStatus.UNAUTHORIZED);
        })

        test('should return 404 if guild not found', async () => {
            await insertUsers([userOne]);
            await request(app)
                .post(`/api/v1/member-activity/${guildOne.guildId}/disengaged-members-composition-line-graph`)
                .set('Authorization', `Bearer ${userOneAccessToken}`)
                .send({ startDate: new Date(), endDate: new Date() })
                .expect(httpStatus.NOT_FOUND);
        })
    })

    describe('POST /api/v1/member-activity/:guildId/active-members-onboarding-line-graph', () => {
        beforeEach(async () => {
            await connection.dropDatabase();
        });
        test('should return 200 and active members onboarding line graph data if req data is ok', async () => {
            await insertUsers([userOne]);
            await insertGuilds([guildOne]);

            await insertMemberActivities([memberActivityOne, memberActivityTwo, memberActivityThree, memberActivityFour], connection);
            const res = await request(app)
                .post(`/api/v1/member-activity/${guildOne.guildId}/active-members-onboarding-line-graph`)
                .set('Authorization', `Bearer ${userOneAccessToken}`)
                .send({ startDate: new Date("2023-04-01"), endDate: new Date("2023-04-07") })
                .expect(httpStatus.OK);

            expect(res.body).toMatchObject({
                newlyActive: 3,
                stillActive: 1,
                dropped: 3,
                joined: 1,
                newlyActivePercentageChange: 200,
                stillActivePercentageChange: 0,
                droppedPercentageChange: "N/A",
                joinedPercentageChange: -50,
            });


            expect(res.body.categories).toEqual(['01 Apr', '02 Apr', '03 Apr', '04 Apr', '05 Apr', '06 Apr', '07 Apr']);
            expect(res.body.series[0].name).toBe('joined');
            expect(res.body.series[1].name).toBe('newlyActive');
            expect(res.body.series[2].name).toBe('stillActive');
            expect(res.body.series[3].name).toBe('dropped');
            expect(res.body.series[0].data).toEqual([1, 0, 0, 0, 0, 0, 1]);
            expect(res.body.series[1].data).toEqual([1, 0, 0, 0, 0, 0, 3]);
            expect(res.body.series[2].data).toEqual([1, 0, 0, 0, 0, 0, 1]);
            expect(res.body.series[3].data).toEqual([0, 0, 0, 0, 0, 0, 3]);
        })

        test('should return 200 and ctive members onboarding line graph data (testing for empty data) if req data is ok', async () => {
            await insertUsers([userOne]);
            await insertGuilds([guildOne]);
            const res = await request(app)
                .post(`/api/v1/member-activity/${guildOne.guildId}/active-members-onboarding-line-graph`)
                .set('Authorization', `Bearer ${userOneAccessToken}`)
                .send({ startDate: new Date("2023-04-01"), endDate: new Date("2023-04-07") })
                .expect(httpStatus.OK);


            expect(res.body).toMatchObject({
                newlyActive: 0,
                stillActive: 0,
                dropped: 0,
                joined: 0,
                newlyActivePercentageChange: 0,
                stillActivePercentageChange: 0,
                droppedPercentageChange: 0,
                joinedPercentageChange: 0,
            });
        })

        test('should return 401 if access token is missing', async () => {
            await request(app)
                .post(`/api/v1/member-activity/${guildOne.guildId}/active-members-onboarding-line-graph`)
                .send({ startDate: new Date(), endDate: new Date() })
                .expect(httpStatus.UNAUTHORIZED);
        })

        test('should return 404 if guild not found', async () => {
            await insertUsers([userOne]);
            await request(app)
                .post(`/api/v1/member-activity/${guildOne.guildId}/active-members-onboarding-line-graph`)
                .set('Authorization', `Bearer ${userOneAccessToken}`)
                .send({ startDate: new Date(), endDate: new Date() })
                .expect(httpStatus.NOT_FOUND);
        })
    })

    describe('POST /api/v1/member-activity/:guildId/inactive-members-line-graph', () => {
        beforeEach(async () => {
            await connection.dropDatabase();
        });
        test('should return 200 and inactive members line graph data if req data is ok', async () => {
            await insertUsers([userOne]);
            await insertGuilds([guildOne]);

            await insertMemberActivities([memberActivityOne, memberActivityTwo, memberActivityThree, memberActivityFour], connection);
            const res = await request(app)
                .post(`/api/v1/member-activity/${guildOne.guildId}/inactive-members-line-graph`)
                .set('Authorization', `Bearer ${userOneAccessToken}`)
                .send({ startDate: new Date("2023-04-01"), endDate: new Date("2023-04-07") })
                .expect(httpStatus.OK);

            expect(res.body).toMatchObject({
                returned: 1,
                returnedPercentageChange: "N/A"
            });

            expect(res.body.categories).toEqual(['01 Apr', '02 Apr', '03 Apr', '04 Apr', '05 Apr', '06 Apr', '07 Apr']);
            expect(res.body.series[0].name).toBe('returned');
            expect(res.body.series[0].data).toEqual([2, 0, 0, 0, 0, 0, 1]);

        })

        test('should return 200 and inactive members line graph data (testing for empty data) if req data is ok', async () => {
            await insertUsers([userOne]);
            await insertGuilds([guildOne]);

            const res = await request(app)
                .post(`/api/v1/member-activity/${guildOne.guildId}/inactive-members-line-graph`)
                .set('Authorization', `Bearer ${userOneAccessToken}`)
                .send({ startDate: new Date("2021-02-21"), endDate: new Date("2022-02-24") })
                .expect(httpStatus.OK);

            expect(res.body).toMatchObject({
                returned: 0,
                returnedPercentageChange: 0
            });
        })

        test('should return 401 if access token is missing', async () => {
            await request(app)
                .post(`/api/v1/member-activity/${guildOne.guildId}/inactive-members-line-graph`)
                .send({ startDate: new Date(), endDate: new Date() })
                .expect(httpStatus.UNAUTHORIZED);
        })

        test('should return 404 if guild not found', async () => {
            await insertUsers([userOne]);
            await request(app)
                .post(`/api/v1/member-activity/${guildOne.guildId}/inactive-members-line-graph`)
                .set('Authorization', `Bearer ${userOneAccessToken}`)
                .send({ startDate: new Date(), endDate: new Date() })
                .expect(httpStatus.NOT_FOUND);
        })
    })


    describe('POST /api/v1/member-activity/:guildId/active-members-composition-table', () => {
        beforeEach(async () => {
            await connection.dropDatabase();
            guildService.getGuildRolesFromDiscordAPI = jest.fn().mockReturnValue([discordRoleOne, discordRoleTwo, discordRoleThree]);
        });
        test('should return 200 and apply the default query options', async () => {
            await insertUsers([userOne]);
            await insertGuilds([guildOne]);
            await insertMemberActivities([memberActivityOne, memberActivityTwo], connection);
            await insertGuildMembers([guildMemberOne, guildMemberTwo, guildMemberThree, guildMemberFour], connection);

            const res = await request(app)
                .post(`/api/v1/member-activity/${guildOne.guildId}/active-members-composition-table`)
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
                discordId: guildMemberThree.discordId,
                username: guildMemberThree.username,
                avatar: guildMemberThree.avatar,
                roles: [
                    { id: discordRoleTwo.id, name: discordRoleTwo.name, color: discordRoleTwo.color }
                ],
                joinedAt: guildMemberThree.joinedAt.toISOString(),
                discriminator: guildMemberThree.discriminator,
                activityComposition: ['newlyActive']
            });

            expect(res.body.results[1]).toEqual({
                discordId: guildMemberOne.discordId,
                username: guildMemberOne.username,
                avatar: guildMemberOne.avatar,
                roles: [
                    { id: discordRoleTwo.id, name: discordRoleTwo.name, color: discordRoleTwo.color },
                    { id: discordRoleThree.id, name: discordRoleThree.name, color: discordRoleThree.color }

                ],
                joinedAt: guildMemberOne.joinedAt.toISOString(),
                discriminator: guildMemberOne.discriminator,
                activityComposition: ['newlyActive', 'becameDisengaged', 'totActiveMembers']
            });

            expect(res.body.results[2]).toEqual({
                discordId: guildMemberTwo.discordId,
                username: guildMemberTwo.username + "#" + guildMemberTwo.discriminator,
                avatar: guildMemberTwo.avatar,
                roles: [
                    { id: discordRoleOne.id, name: discordRoleOne.name, color: discordRoleOne.color },
                    { id: discordRoleThree.id, name: discordRoleThree.name, color: discordRoleThree.color }
                ],
                joinedAt: guildMemberTwo.joinedAt.toISOString(),
                discriminator: guildMemberTwo.discriminator,
                activityComposition: ['newlyActive']
            });
        })

        test('should return 401 if access token is missing', async () => {
            await request(app)
                .post(`/api/v1/member-activity/${guildOne.guildId}/active-members-composition-table`)
                .send()
                .expect(httpStatus.UNAUTHORIZED);
        })

        test('should return 404 if guild not found', async () => {
            await insertUsers([userOne]);
            await request(app)
                .post(`/api/v1/member-activity/${guildOne.guildId}/active-members-composition-table`)
                .set('Authorization', `Bearer ${userOneAccessToken}`)
                .send()
                .expect(httpStatus.NOT_FOUND);
        })

        test('should correctly apply filter on activityComposition field', async () => {
            await insertUsers([userOne]);
            await insertGuilds([guildOne]);
            await insertMemberActivities([memberActivityOne, memberActivityTwo, memberActivityThree, memberActivityFour], connection);
            await insertGuildMembers([guildMemberOne, guildMemberTwo, guildMemberThree, guildMemberFour], connection);

            const res = await request(app)
                .post(`/api/v1/member-activity/${guildOne.guildId}/active-members-composition-table`)
                .set('Authorization', `Bearer ${userOneAccessToken}`)
                .query({ activityComposition: ["all_new_disengaged"] })
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
            expect(res.body.results[0].discordId).toBe(guildMemberOne.discordId);
        })

        test('should correctly apply filter on roles field', async () => {
            await insertUsers([userOne]);
            await insertGuilds([guildOne]);
            await insertMemberActivities([memberActivityOne, memberActivityTwo, memberActivityThree, memberActivityFour], connection);
            await insertGuildMembers([guildMemberOne, guildMemberTwo, guildMemberThree, guildMemberFour], connection);

            const res = await request(app)
                .post(`/api/v1/member-activity/${guildOne.guildId}/active-members-composition-table`)
                .set('Authorization', `Bearer ${userOneAccessToken}`)
                .query({ roles: ["987654321123456789"] })
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
            expect(res.body.results[0].discordId).toBe(guildMemberThree.discordId);
            expect(res.body.results[1].discordId).toBe(guildMemberOne.discordId);
        })

        test('should correctly apply filter on username field', async () => {
            await insertUsers([userOne]);
            await insertGuilds([guildOne]);
            await insertMemberActivities([memberActivityOne, memberActivityTwo, memberActivityThree, memberActivityFour], connection);
            await insertGuildMembers([guildMemberOne, guildMemberTwo, guildMemberThree, guildMemberFour], connection);

            const res = await request(app)
                .post(`/api/v1/member-activity/${guildOne.guildId}/active-members-composition-table`)
                .set('Authorization', `Bearer ${userOneAccessToken}`)
                .query({ username: "B" })
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
            expect(res.body.results[0].discordId).toBe(guildMemberOne.discordId);
            expect(res.body.results[1].discordId).toBe(guildMemberTwo.discordId);

        })
        test('should correctly sort the returned array if descending sort param is specified', async () => {
            await insertUsers([userOne]);
            await insertGuilds([guildOne]);
            await insertMemberActivities([memberActivityOne, memberActivityTwo, memberActivityThree, memberActivityFour], connection);
            await insertGuildMembers([guildMemberOne, guildMemberTwo, guildMemberThree, guildMemberFour], connection);

            const res = await request(app)
                .post(`/api/v1/member-activity/${guildOne.guildId}/active-members-composition-table`)
                .set('Authorization', `Bearer ${userOneAccessToken}`)
                .query({ sortBy: 'joinedAt:desc' })
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
            expect(res.body.results[0].discordId).toBe(guildMemberTwo.discordId);
            expect(res.body.results[1].discordId).toBe(guildMemberOne.discordId);
            expect(res.body.results[2].discordId).toBe(guildMemberThree.discordId);
        })

        test('should correctly sort the returned array if ascending  sort param is specified', async () => {
            await insertUsers([userOne]);
            await insertGuilds([guildOne]);
            await insertMemberActivities([memberActivityOne, memberActivityTwo, memberActivityThree, memberActivityFour], connection);
            await insertGuildMembers([guildMemberOne, guildMemberTwo, guildMemberThree, guildMemberFour], connection);

            const res = await request(app)
                .post(`/api/v1/member-activity/${guildOne.guildId}/active-members-composition-table`)
                .set('Authorization', `Bearer ${userOneAccessToken}`)
                .query({ sortBy: 'joinedAt:asc' })
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
            expect(res.body.results[0].discordId).toBe(guildMemberThree.discordId);
            expect(res.body.results[1].discordId).toBe(guildMemberOne.discordId);
            expect(res.body.results[2].discordId).toBe(guildMemberTwo.discordId);
        })

        test('should correctly sort the returned array if multiple sorting criteria are specified', async () => {
            await insertUsers([userOne]);
            await insertGuilds([guildOne]);
            await insertMemberActivities([memberActivityOne, memberActivityTwo, memberActivityThree, memberActivityFour], connection);
            await insertGuildMembers([guildMemberOne, guildMemberTwo, guildMemberThree, guildMemberFour], connection);

            const res = await request(app)
                .post(`/api/v1/member-activity/${guildOne.guildId}/active-members-composition-table`)
                .set('Authorization', `Bearer ${userOneAccessToken}`)
                .query({ sortBy: 'joinedAt:desc,username:asc' })
                .send()
                .expect(httpStatus.OK);

            expect(res.body).toEqual({
                results: expect.any(Array),
                page: 1,
                limit: 10,
                totalPages: 1,
                totalResults: 3,
            });

            const expectedOrder = [guildMemberOne, guildMemberTwo, guildMemberThree,].sort((a, b) => {
                if (a.joinedAt < b.joinedAt) {
                    return 1;
                }
                if (a.joinedAt > b.joinedAt) {
                    return -1;
                }
                return a.username < b.username ? -1 : 1;
            });

            expectedOrder.forEach((user, index) => {
                expect(res.body.results[index].discordId).toBe(user.discordId);
            });
        })

        test('should limit returned array if limit param is specified', async () => {
            await insertUsers([userOne]);
            await insertGuilds([guildOne]);
            await insertMemberActivities([memberActivityOne, memberActivityTwo, memberActivityThree, memberActivityFour], connection);
            await insertGuildMembers([guildMemberOne, guildMemberTwo, guildMemberThree, guildMemberFour], connection);

            const res = await request(app)
                .post(`/api/v1/member-activity/${guildOne.guildId}/active-members-composition-table`)
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
            expect(res.body.results[0].discordId).toBe(guildMemberThree.discordId);
            expect(res.body.results[1].discordId).toBe(guildMemberOne.discordId);
        })

        test('should correctly sort the returned array if multiple sorting criteria are specified', async () => {
            await insertUsers([userOne]);
            await insertGuilds([guildOne]);
            await insertMemberActivities([memberActivityOne, memberActivityTwo, memberActivityThree, memberActivityFour], connection);
            await insertGuildMembers([guildMemberOne, guildMemberTwo, guildMemberThree, guildMemberFour], connection);

            const res = await request(app)
                .post(`/api/v1/member-activity/${guildOne.guildId}/active-members-composition-table`)
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
            expect(res.body.results[0].discordId).toBe(guildMemberTwo.discordId);
        })

    })
});