import request from 'supertest';
import httpStatus from 'http-status';
import app from '../../src/app';
import setupTestDB from '../utils/setupTestDB';
import { userOne, insertUsers } from '../fixtures/user.fixture';
import { userOneAccessToken } from '../fixtures/token.fixture';
import { memberActivityOne, memberActivityTwo, memberActivityThree, memberActivityFour, memberActivityFive } from '../fixtures/memberActivity.fixture';
import { guildOne, insertGuilds } from '../fixtures/guilds.fixture';
import { memberActivityService, databaseService } from 'tc_dbcomm';
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

            await memberActivityService.createMemberActivities(connection, [memberActivityOne, memberActivityTwo, memberActivityFive]);
            const res = await request(app)
                .post(`/api/v1/member-activity/${guildOne.guildId}/active-members-composition-line-graph`)
                .set('Authorization', `Bearer ${userOneAccessToken}`)
                .send({ startDate: new Date("2023-01-21"), endDate: new Date("2023-01-24") })
                .expect(httpStatus.OK);

            expect(res.body).toMatchObject({
                totActiveMembers: 6,
                newlyActive: 2,
                consistentlyActive: 0,
                vitalMembers: 2,
                becameDisengaged: 2,
                totActiveMembersPercentageChange: 0,
                newlyActivePercentageChange: 0,
                consistentlyActivePercentageChange: 0,
                vitalMembersPercentageChange: 0,
                becameDisengagedPercentageChange: 0,
            });
        })

        test('should return 200 and active members composition line graph data (testing percentage change) if req data is ok', async () => {
            await insertUsers([userOne]);
            await insertGuilds([guildOne]);

            await memberActivityService.createMemberActivities(connection, [memberActivityOne, memberActivityTwo, memberActivityThree, memberActivityFour, memberActivityFive]);
            const res = await request(app)
                .post(`/api/v1/member-activity/${guildOne.guildId}/active-members-composition-line-graph`)
                .set('Authorization', `Bearer ${userOneAccessToken}`)
                .send({ startDate: new Date("2023-01-21"), endDate: new Date("2023-01-24") })
                .expect(httpStatus.OK);

            expect(res.body).toMatchObject({
                totActiveMembers: 6,
                newlyActive: 2,
                consistentlyActive: 0,
                vitalMembers: 2,
                becameDisengaged: 2,
                totActiveMembersPercentageChange: 100,
                newlyActivePercentageChange: 0,
                consistentlyActivePercentageChange: 0,
                vitalMembersPercentageChange: -66.66666666666666,
                becameDisengagedPercentageChange: 0,
            });
        })

        test('should return 200 and active members composition line graph data (testing for empty data) if req data is ok', async () => {
            await insertUsers([userOne]);
            await insertGuilds([guildOne]);

            await memberActivityService.createMemberActivities(connection, [memberActivityOne]);
            const res = await request(app)
                .post(`/api/v1/member-activity/${guildOne.guildId}/active-members-composition-line-graph`)
                .set('Authorization', `Bearer ${userOneAccessToken}`)
                .send({ startDate: new Date("2023-02-21"), endDate: new Date("2023-02-24") })
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

            await memberActivityService.createMemberActivities(connection, [memberActivityOne, memberActivityTwo, memberActivityFive]);
            const res = await request(app)
                .post(`/api/v1/member-activity/${guildOne.guildId}/disengaged-members-composition-line-graph`)
                .set('Authorization', `Bearer ${userOneAccessToken}`)
                .send({ startDate: new Date("2023-01-21"), endDate: new Date("2023-01-24") })
                .expect(httpStatus.OK);

            expect(res.body).toMatchObject({
                becameDisengaged: 2,
                wereNewlyActive: 6,
                wereConsistentlyActive: 0,
                wereVitalMembers: 2,
                becameDisengagedPercentageChange: 0,
                wereNewlyActivePercentageChange: 0,
                wereConsistentlyActivePercentageChange: 0,
                wereVitalMembersPercentageChange: 0,
            });
        })


        test('should return 200 and  disengaged members composition line graph data (testing percentage change) if req data is ok', async () => {
            await insertUsers([userOne]);
            await insertGuilds([guildOne]);

            await memberActivityService.createMemberActivities(connection, [memberActivityOne, memberActivityTwo, memberActivityThree, memberActivityFour, memberActivityFive]);
            const res = await request(app)
                .post(`/api/v1/member-activity/${guildOne.guildId}/disengaged-members-composition-line-graph`)
                .set('Authorization', `Bearer ${userOneAccessToken}`)
                .send({ startDate: new Date("2023-01-21"), endDate: new Date("2023-01-24") })
                .expect(httpStatus.OK);

            expect(res.body).toMatchObject({
                becameDisengaged: 2,
                wereNewlyActive: 6,
                wereConsistentlyActive: 0,
                wereVitalMembers: 2,
                becameDisengagedPercentageChange: 0,
                wereNewlyActivePercentageChange: 100,
                wereConsistentlyActivePercentageChange: 0,
                wereVitalMembersPercentageChange: -66.66666666666666,
            });
        })

        test('should return 200 and  disengaged members composition line graph data (testing for empty data) if req data is ok', async () => {
            await insertUsers([userOne]);
            await insertGuilds([guildOne]);

            await memberActivityService.createMemberActivities(connection, [memberActivityOne]);
            const res = await request(app)
                .post(`/api/v1/member-activity/${guildOne.guildId}/disengaged-members-composition-line-graph`)
                .set('Authorization', `Bearer ${userOneAccessToken}`)
                .send({ startDate: new Date("2023-02-21"), endDate: new Date("2023-02-24") })
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

    describe('POST /api/v1/member-activity/:guildId/inactive-members-line-graph', () => {
        beforeEach(async () => {
            await connection.dropDatabase();
        });
        test('should return 200 and disengaged members composition line graph data if req data is ok', async () => {
            await insertUsers([userOne]);
            await insertGuilds([guildOne]);

            await memberActivityService.createMemberActivities(connection, [memberActivityOne, memberActivityTwo, memberActivityFive]);
            const res = await request(app)
                .post(`/api/v1/member-activity/${guildOne.guildId}/inactive-members-line-graph`)
                .set('Authorization', `Bearer ${userOneAccessToken}`)
                .send({ startDate: new Date("2023-01-21"), endDate: new Date("2023-01-24") })
                .expect(httpStatus.OK);

            expect(res.body).toMatchObject({
                returned: 6,
                returnedPercentageChange: 0
            });
        })


        test('should return 200 and  disengaged members composition line graph data (testing percentage change) if req data is ok', async () => {
            await insertUsers([userOne]);
            await insertGuilds([guildOne]);

            await memberActivityService.createMemberActivities(connection, [memberActivityOne, memberActivityTwo, memberActivityThree, memberActivityFour, memberActivityFive]);
            const res = await request(app)
                .post(`/api/v1/member-activity/${guildOne.guildId}/inactive-members-line-graph`)
                .set('Authorization', `Bearer ${userOneAccessToken}`)
                .send({ startDate: new Date("2023-01-21"), endDate: new Date("2023-01-24") })
                .expect(httpStatus.OK);

            expect(res.body).toMatchObject({
                returned: 6,
                returnedPercentageChange: 100
            });
        })

        test('should return 200 and  disengaged members composition line graph data (testing for empty data) if req data is ok', async () => {
            await insertUsers([userOne]);
            await insertGuilds([guildOne]);

            await memberActivityService.createMemberActivities(connection, [memberActivityOne]);
            const res = await request(app)
                .post(`/api/v1/member-activity/${guildOne.guildId}/inactive-members-line-graph`)
                .set('Authorization', `Bearer ${userOneAccessToken}`)
                .send({ startDate: new Date("2023-02-21"), endDate: new Date("2023-02-24") })
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

});