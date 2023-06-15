import request from 'supertest';
import httpStatus from 'http-status';
import app from '../../src/app';
import setupTestDB from '../utils/setupTestDB';
import { userOne, insertUsers } from '../fixtures/user.fixture';
import { userOneAccessToken } from '../fixtures/token.fixture';
import { memberActivityOne, memberActivityTwo, memberActivityThree, memberActivityFour, insertMemberActivities } from '../fixtures/memberActivity.fixture';
import { guildOne, insertGuilds } from '../fixtures/guilds.fixture';
import { databaseService } from '@togethercrew.dev/db';
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
                newlyActive: 2,
                consistentlyActive: 0,
                vitalMembers: 0,
                becameDisengaged: 1,
                totActiveMembersPercentageChange: "N/A",
                newlyActivePercentageChange: 100,
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
            expect(res.body.series[1].data).toEqual([1, 0, 0, 0, 0, 0, 2]);
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
                newlyActive: 2,
                stillActive: 1,
                dropped: 3,
                joined: 1,
                newlyActivePercentageChange: 100,
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
            expect(res.body.series[1].data).toEqual([1, 0, 0, 0, 0, 0, 2]);
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
        });
        test('should return 200 and inactive members line graph data if req data is ok', async () => {
            await insertUsers([userOne]);
            await insertGuilds([guildOne]);

            await insertMemberActivities([memberActivityOne, memberActivityTwo, memberActivityThree, memberActivityFour], connection);
            const res = await request(app)
                .post(`/api/v1/member-activity/${guildOne.guildId}/active-members-composition-table`)
                // .set('Authorization', `Bearer ${userOneAccessToken}`)
                .send()
                .expect(httpStatus.OK);

            console.log(res.body)
            expect(true).toBe(true)


        })

    })
});