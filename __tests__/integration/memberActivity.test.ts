import request from 'supertest';
import httpStatus from 'http-status';
import app from '../../src/app';
import setupTestDB from '../utils/setupTestDB';
import { userOne, insertUsers, userTwo } from '../fixtures/user.fixture';
import { userOneAccessToken } from '../fixtures/token.fixture';
import { memberActivityOne, memberActivityTwo, memberActivityThree, memberActivityFour, insertMemberActivities } from '../fixtures/memberActivity.fixture';
import { guildMemberOne, guildMemberTwo, guildMemberThree, guildMemberFour, insertGuildMembers } from '../fixtures/guildMember.fixture';
import { guildOne, guildTwo, insertGuilds } from '../fixtures/guilds.fixture';
import { databaseService } from '@togethercrew.dev/db';
import { role1, role2, role3, insertRoles } from '../fixtures/discord.roles.fixture';
import config from '../../src/config';
import * as Neo4j from '../../src/neo4j';



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
            await insertRoles([role1, role2, role3], connection);

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

    describe('POST /api/v1/member-activity/:guildId/members-interactions-network-graph', () => {
        beforeEach(async () => {
            await connection.dropDatabase();
        });

        test('should return 200 and member interaction graph data if req data is ok', async () => {
            await insertUsers([userOne]);
            await insertGuilds([guildOne]);
            await insertGuildMembers([guildMemberOne, guildMemberTwo, guildMemberThree, guildMemberFour], connection);

            const twoDaysMilliseconds = 2 * 24 * 60 * 60 * 1000; // Number of milliseconds in a week
            const currentDate = new Date();
            const twoDaysAgo = new Date(currentDate.getTime() - twoDaysMilliseconds);
            const twoDaysAgoEpoch = Math.floor(twoDaysAgo.getTime() / 1000); // Convert to seconds

            await Neo4j.write("match (n) detach delete (n);")
            await Neo4j.write(`MERGE (a:DiscordAccount {userId: "${guildMemberOne.discordId}"}) -[r:INTERACTED] -> (b:DiscordAccount {userId: "${guildMemberTwo.discordId}"})
                                SET r.weights = [3444.0]
                                SET a.stats = ["R", "R"]
                                SET r.dates = [${twoDaysAgoEpoch}]
                                SET r.createdAt = ${twoDaysAgoEpoch}
                                MERGE (a) <-[r2:INTERACTED]-(b)
                                SET r2.weights = [1.0]
                                SET b.stats = ["B", "S"]
                                SET r2.dates = [${twoDaysAgoEpoch}]
                                SET r.createdAt = ${twoDaysAgoEpoch}
                                WITH a, b
                                CREATE (g:Guild {guildId: "${guildOne.guildId}"})
                                MERGE (a) -[:IS_MEMBER]->(g)
                                MERGE (b) -[:IS_MEMBER] ->(g)`)


            const res = await request(app)
                .post(`/api/v1/member-activity/${guildOne.guildId}/members-interactions-network-graph`)
                .set('Authorization', `Bearer ${userOneAccessToken}`)
                // .expect(httpStatus.OK);

            expect(Array.isArray(res.body)).toBe(true);
            expect(res.body).toHaveLength(2)
            expect(res.body).toEqual(expect.arrayContaining([({
                from: { id: '123456789', radius: 3444, username: 'Behzad', stats: "RECEIVER" },
                to: { id: '987654321', radius: 1, username: 'Bi#1234', stats: "SENDER" },
                width: 3444
            })
            ]))
            expect(res.body).toEqual(expect.arrayContaining([({
                from: { id: '987654321', radius: 1, username: 'Bi#1234', stats: "SENDER" },
                to: { id: '123456789', radius: 3444, username: 'Behzad', stats: "RECEIVER" },
                width: 1
            })
            ]))

        })
        test('should return 401 if access token is missing', async () => {
            await request(app)
                .post(`/api/v1/member-activity/${guildOne.guildId}/members-interactions-network-graph`)
                .send({ startDate: new Date(), endDate: new Date() })
                .expect(httpStatus.UNAUTHORIZED);
        })
        test('should return 404 if guild not found', async () => {
            await insertUsers([userOne]);
            await request(app)

                .post(`/api/v1/member-activity/${guildOne.guildId}/members-interactions-network-graph`)
                .set('Authorization', `Bearer ${userOneAccessToken}`)
                .expect(httpStatus.NOT_FOUND);
        })
    })

    describe('GET /api/v1/member-activity/:guildId/fragmentation-score', () => {
        beforeEach(async () => {
            await connection.dropDatabase();
        });

        test('should return 200 and fragmentation score if req data is ok', async () => {
            await insertUsers([userOne]);
            await insertGuilds([guildOne]);
            await insertGuildMembers([guildMemberOne, guildMemberTwo, guildMemberThree, guildMemberFour], connection);

            await Neo4j.write("match (n) detach delete (n);")
            await Neo4j.write(`CREATE (a:DiscordAccount) -[:IS_MEMBER]->(g:Guild {guildId: "${guildOne.guildId}"})
                CREATE (b:DiscordAccount) -[:IS_MEMBER]->(g)
                CREATE (c:DiscordAccount) -[:IS_MEMBER]->(g)
                CREATE (d:DiscordAccount) -[:IS_MEMBER]->(g)
                CREATE (e:DiscordAccount) -[:IS_MEMBER]->(g)
                SET a.userId = "1000"
                SET b.userId = "1001"
                SET c.userId = "1002"
                SET d.userId = "1003"
                SET e.userId = "1004"
                MERGE (a) -[r:INTERACTED]->(b)
                MERGE (a) -[r2:INTERACTED]->(d)
                MERGE (c) -[r3:INTERACTED]->(b)
                MERGE (c) -[r4:INTERACTED]->(d)
                MERGE (d) -[r5:INTERACTED]->(b)
                MERGE (c) -[r6:INTERACTED]->(a)
                MERGE (d) -[r7:INTERACTED]->(c)
                MERGE (b) -[r8:INTERACTED]->(d)
                MERGE (d) -[r9:INTERACTED]->(c)
                MERGE (e) -[r10:INTERACTED]->(b)
                MERGE (a) -[r11:INTERACTED]->(c)
                SET r.dates = [166, 167]
                SET r2.dates = [166]
                SET r3.dates = [166, 167]
                SET r4.dates = [166]
                SET r5.dates = [166]
                SET r6.dates = [167]
                SET r7.dates = [167]
                SET r8.dates = [167]
                SET r9.dates = [167]
                SET r10.dates = [167]
                SET r11.dates = [167]
                SET r.weights = [1, 2]
                SET r2.weights = [3]
                SET r3.weights = [2, 1]
                SET r4.weights = [2]
                SET r5.weights = [1]
                SET r6.weights = [2]
                SET r7.weights = [1]
                SET r8.weights = [2]
                SET r9.weights = [1]
                SET r10.weights = [3]
                SET r11.weights = [2]`)
            await Neo4j.write(`MATCH (a: DiscordAccount {userId: "1000"})
                MATCH (b:DiscordAccount {userId: "1001"})
                MATCH (c:DiscordAccount {userId: "1002"})
                MATCH (d:DiscordAccount {userId: "1003"})
                MATCH (e:DiscordAccount {userId: "1004"})
                MATCH (g:Guild {guildId: "${guildOne.guildId}"})
                
                SET a.localClusteringCoeff = [1.0, 1.0]
                SET b.localClusteringCoeff = [0.66666, 0.33333]
                SET c.localClusteringCoeff = [1.0, 0.66666]
                SET d.localClusteringCoeff = [0.66666, 1.0]
                SET e.localClusteringCoeff = [0.0, 0.0]
                SET a.localClusteringCoeffDates = [166, 167]
                SET b.localClusteringCoeffDates = [166, 167]
                SET c.localClusteringCoeffDates = [166, 167]
                SET d.localClusteringCoeffDates = [166, 167]
                SET e.localClusteringCoeffDates = [166, 167]
                SET g.avgClusteringCoeff = [0.8, 0.733333]
                SET g.decentralityScores = [133.333, 66.666]
                SET g.resultDates = [166, 167]`)

            const res = await request(app)
                .get(`/api/v1/member-activity/${guildOne.guildId}/fragmentation-score`)
                .set('Authorization', `Bearer ${userOneAccessToken}`)
                .expect(httpStatus.OK);
            
            expect(res.body.fragmentationScore).toBe(0.733333);
            expect(res.body.fragmentationScoreDate).toBe(167);
            expect(res.body.scoreStatus).toBe(-2);
            expect(res.body.fragmentationScoreRange).toHaveProperty("minimumFragmentationScore", 0);
            expect(res.body.fragmentationScoreRange).toHaveProperty("maximumFragmentationScore", 200);
        })

        test('should return 200 with "null" fragmentation score if there is not interaction or data', async () => {
            await insertUsers([userOne]);
            await insertGuilds([guildOne]);
            await insertGuilds([guildTwo]);
            await insertGuildMembers([guildMemberOne, guildMemberTwo, guildMemberThree, guildMemberFour], connection);

            await Neo4j.write("match (n) detach delete (n);")
            await Neo4j.write(`CREATE (a:DiscordAccount) -[:IS_MEMBER]->(g:Guild {guildId: "${guildOne.guildId}"})
                CREATE (b:DiscordAccount) -[:IS_MEMBER]->(g)
                CREATE (c:DiscordAccount) -[:IS_MEMBER]->(g)
                CREATE (d:DiscordAccount) -[:IS_MEMBER]->(g)
                CREATE (e:DiscordAccount) -[:IS_MEMBER]->(g)
                SET a.userId = "1000"
                SET b.userId = "1001"
                SET c.userId = "1002"
                SET d.userId = "1003"
                SET e.userId = "1004"
                MERGE (a) -[r:INTERACTED]->(b)
                MERGE (a) -[r2:INTERACTED]->(d)
                MERGE (c) -[r3:INTERACTED]->(b)
                MERGE (c) -[r4:INTERACTED]->(d)
                MERGE (d) -[r5:INTERACTED]->(b)
                MERGE (c) -[r6:INTERACTED]->(a)
                MERGE (d) -[r7:INTERACTED]->(c)
                MERGE (b) -[r8:INTERACTED]->(d)
                MERGE (d) -[r9:INTERACTED]->(c)
                MERGE (e) -[r10:INTERACTED]->(b)
                MERGE (a) -[r11:INTERACTED]->(c)
                SET r.dates = [166, 167]
                SET r2.dates = [166]
                SET r3.dates = [166, 167]
                SET r4.dates = [166]
                SET r5.dates = [166]
                SET r6.dates = [167]
                SET r7.dates = [167]
                SET r8.dates = [167]
                SET r9.dates = [167]
                SET r10.dates = [167]
                SET r11.dates = [167]
                SET r.weights = [1, 2]
                SET r2.weights = [3]
                SET r3.weights = [2, 1]
                SET r4.weights = [2]
                SET r5.weights = [1]
                SET r6.weights = [2]
                SET r7.weights = [1]
                SET r8.weights = [2]
                SET r9.weights = [1]
                SET r10.weights = [3]
                SET r11.weights = [2]`)
            await Neo4j.write(`MATCH (a: DiscordAccount {userId: "1000"})
                MATCH (b:DiscordAccount {userId: "1001"})
                MATCH (c:DiscordAccount {userId: "1002"})
                MATCH (d:DiscordAccount {userId: "1003"})
                MATCH (e:DiscordAccount {userId: "1004"})
                MATCH (g:Guild {guildId: "${guildOne.guildId}"})
                
                SET a.localClusteringCoeff = [1.0, 1.0]
                SET b.localClusteringCoeff = [0.66666, 0.33333]
                SET c.localClusteringCoeff = [1.0, 0.66666]
                SET d.localClusteringCoeff = [0.66666, 1.0]
                SET e.localClusteringCoeff = [0.0, 0.0]
                SET a.localClusteringCoeffDates = [166, 167]
                SET b.localClusteringCoeffDates = [166, 167]
                SET c.localClusteringCoeffDates = [166, 167]
                SET d.localClusteringCoeffDates = [166, 167]
                SET e.localClusteringCoeffDates = [166, 167]
                SET g.avgClusteringCoeff = [0.8, 0.733333]
                SET g.decentralityScores = [133.333, 66.666]
                SET g.resultDates = [166, 167]`)

            const res = await request(app)
                .get(`/api/v1/member-activity/${guildTwo.guildId}/fragmentation-score`)
                .set('Authorization', `Bearer ${userOneAccessToken}`)
                .expect(httpStatus.OK);
            
            expect(res.body.fragmentationScore).toBe(null);
            expect(res.body.fragmentationScoreDate).toBe(null);
        })

        test('should return 401 if access token is missing', async () => {
            await request(app)
                .get(`/api/v1/member-activity/${guildOne.guildId}/fragmentation-score`)
                .send({ startDate: new Date(), endDate: new Date() })
                .expect(httpStatus.UNAUTHORIZED);
        })

        test('should return 404 if guild not found', async () => {
            await insertUsers([userOne]);
            await request(app)

                .get(`/api/v1/member-activity/${guildOne.guildId}/fragmentation-score`)
                .set('Authorization', `Bearer ${userOneAccessToken}`)
                .expect(httpStatus.NOT_FOUND);
        })
    })

    describe('GET /api/v1/member-activity/:guildId/decentralisation-score', () => {
        beforeEach(async () => {
            await connection.dropDatabase();
        });

        test('should return 200 and decentralisation score if req data is ok', async () => {
            await insertUsers([userOne]);
            await insertGuilds([guildOne]);
            await insertGuildMembers([guildMemberOne, guildMemberTwo, guildMemberThree, guildMemberFour], connection);

            // TODO: write neo4j queries in other file
            await Neo4j.write("match (n) detach delete (n);")
            await Neo4j.write(`CREATE (a:DiscordAccount) -[:IS_MEMBER]->(g:Guild {guildId: "${guildOne.guildId}"})
                CREATE (b:DiscordAccount) -[:IS_MEMBER]->(g)
                CREATE (c:DiscordAccount) -[:IS_MEMBER]->(g)
                CREATE (d:DiscordAccount) -[:IS_MEMBER]->(g)
                CREATE (e:DiscordAccount) -[:IS_MEMBER]->(g)
                SET a.userId = "1000"
                SET b.userId = "1001"
                SET c.userId = "1002"
                SET d.userId = "1003"
                SET e.userId = "1004"
                MERGE (a) -[r:INTERACTED]->(b)
                MERGE (a) -[r2:INTERACTED]->(d)
                MERGE (c) -[r3:INTERACTED]->(b)
                MERGE (c) -[r4:INTERACTED]->(d)
                MERGE (d) -[r5:INTERACTED]->(b)
                MERGE (c) -[r6:INTERACTED]->(a)
                MERGE (d) -[r7:INTERACTED]->(c)
                MERGE (b) -[r8:INTERACTED]->(d)
                MERGE (d) -[r9:INTERACTED]->(c)
                MERGE (e) -[r10:INTERACTED]->(b)
                MERGE (a) -[r11:INTERACTED]->(c)
                SET r.dates = [166, 167]
                SET r2.dates = [166]
                SET r3.dates = [166, 167]
                SET r4.dates = [166]
                SET r5.dates = [166]
                SET r6.dates = [167]
                SET r7.dates = [167]
                SET r8.dates = [167]
                SET r9.dates = [167]
                SET r10.dates = [167]
                SET r11.dates = [167]
                SET r.weights = [1, 2]
                SET r2.weights = [3]
                SET r3.weights = [2, 1]
                SET r4.weights = [2]
                SET r5.weights = [1]
                SET r6.weights = [2]
                SET r7.weights = [1]
                SET r8.weights = [2]
                SET r9.weights = [1]
                SET r10.weights = [3]
                SET r11.weights = [2]`)
            await Neo4j.write(`MATCH (a: DiscordAccount {userId: "1000"})
                MATCH (b:DiscordAccount {userId: "1001"})
                MATCH (c:DiscordAccount {userId: "1002"})
                MATCH (d:DiscordAccount {userId: "1003"})
                MATCH (e:DiscordAccount {userId: "1004"})
                MATCH (g:Guild {guildId: "${guildOne.guildId}"})
                
                SET a.localClusteringCoeff = [1.0, 1.0]
                SET b.localClusteringCoeff = [0.66666, 0.33333]
                SET c.localClusteringCoeff = [1.0, 0.66666]
                SET d.localClusteringCoeff = [0.66666, 1.0]
                SET e.localClusteringCoeff = [0.0, 0.0]
                SET a.localClusteringCoeffDates = [166, 167]
                SET b.localClusteringCoeffDates = [166, 167]
                SET c.localClusteringCoeffDates = [166, 167]
                SET d.localClusteringCoeffDates = [166, 167]
                SET e.localClusteringCoeffDates = [166, 167]
                SET g.avgClusteringCoeff = [0.8, 0.733333]
                SET g.decentralityScores = [133.333, 66.666]
                SET g.resultDates = [166, 167]`)

            const res = await request(app)
                .get(`/api/v1/member-activity/${guildOne.guildId}/decentralisation-score`)
                .set('Authorization', `Bearer ${userOneAccessToken}`)
                .expect(httpStatus.OK);
            
            expect(res.body.decentralisationScore).toBe(66.666);
            expect(res.body.decentralisationScoreDate).toBe(167);
            expect(res.body.scoreStatus).toBe(-1);
            expect(res.body.decentralisationScoreRange).toHaveProperty("minimumDecentralisationScore", 0);
            expect(res.body.decentralisationScoreRange).toHaveProperty("maximumDecentralisationScore", 200);

        })

        test('should return 200 with "null" decentralisation score if there is not interaction or data', async () => {
            await insertUsers([userOne]);
            await insertGuilds([guildOne]);
            await insertGuilds([guildTwo]);
            await insertGuildMembers([guildMemberOne, guildMemberTwo, guildMemberThree, guildMemberFour], connection);

            // TODO: write neo4j queries in other file
            await Neo4j.write("match (n) detach delete (n);")
            await Neo4j.write(`CREATE (a:DiscordAccount) -[:IS_MEMBER]->(g:Guild {guildId: "${guildOne.guildId}"})
                CREATE (b:DiscordAccount) -[:IS_MEMBER]->(g)
                CREATE (c:DiscordAccount) -[:IS_MEMBER]->(g)
                CREATE (d:DiscordAccount) -[:IS_MEMBER]->(g)
                CREATE (e:DiscordAccount) -[:IS_MEMBER]->(g)
                SET a.userId = "1000"
                SET b.userId = "1001"
                SET c.userId = "1002"
                SET d.userId = "1003"
                SET e.userId = "1004"
                MERGE (a) -[r:INTERACTED]->(b)
                MERGE (a) -[r2:INTERACTED]->(d)
                MERGE (c) -[r3:INTERACTED]->(b)
                MERGE (c) -[r4:INTERACTED]->(d)
                MERGE (d) -[r5:INTERACTED]->(b)
                MERGE (c) -[r6:INTERACTED]->(a)
                MERGE (d) -[r7:INTERACTED]->(c)
                MERGE (b) -[r8:INTERACTED]->(d)
                MERGE (d) -[r9:INTERACTED]->(c)
                MERGE (e) -[r10:INTERACTED]->(b)
                MERGE (a) -[r11:INTERACTED]->(c)
                SET r.dates = [166, 167]
                SET r2.dates = [166]
                SET r3.dates = [166, 167]
                SET r4.dates = [166]
                SET r5.dates = [166]
                SET r6.dates = [167]
                SET r7.dates = [167]
                SET r8.dates = [167]
                SET r9.dates = [167]
                SET r10.dates = [167]
                SET r11.dates = [167]
                SET r.weights = [1, 2]
                SET r2.weights = [3]
                SET r3.weights = [2, 1]
                SET r4.weights = [2]
                SET r5.weights = [1]
                SET r6.weights = [2]
                SET r7.weights = [1]
                SET r8.weights = [2]
                SET r9.weights = [1]
                SET r10.weights = [3]
                SET r11.weights = [2]`)
            await Neo4j.write(`MATCH (a: DiscordAccount {userId: "1000"})
                MATCH (b:DiscordAccount {userId: "1001"})
                MATCH (c:DiscordAccount {userId: "1002"})
                MATCH (d:DiscordAccount {userId: "1003"})
                MATCH (e:DiscordAccount {userId: "1004"})
                MATCH (g:Guild {guildId: "${guildOne.guildId}"})
                
                SET a.localClusteringCoeff = [1.0, 1.0]
                SET b.localClusteringCoeff = [0.66666, 0.33333]
                SET c.localClusteringCoeff = [1.0, 0.66666]
                SET d.localClusteringCoeff = [0.66666, 1.0]
                SET e.localClusteringCoeff = [0.0, 0.0]
                SET a.localClusteringCoeffDates = [166, 167]
                SET b.localClusteringCoeffDates = [166, 167]
                SET c.localClusteringCoeffDates = [166, 167]
                SET d.localClusteringCoeffDates = [166, 167]
                SET e.localClusteringCoeffDates = [166, 167]
                SET g.avgClusteringCoeff = [0.8, 0.733333]
                SET g.decentralityScores = [133.333, 66.666]
                SET g.resultDates = [166, 167]`)

            const res = await request(app)
                .get(`/api/v1/member-activity/${guildTwo.guildId}/decentralisation-score`)
                .set('Authorization', `Bearer ${userOneAccessToken}`)
                .expect(httpStatus.OK);
            
            expect(res.body.decentralisationScore).toBe(null);
            expect(res.body.decentralisationScoreDate).toBe(null);
        })

        test('should return 401 if access token is missing', async () => {
            await request(app)
                .get(`/api/v1/member-activity/${guildOne.guildId}/decentralisation-score`)
                .send({ startDate: new Date(), endDate: new Date() })
                .expect(httpStatus.UNAUTHORIZED);
        })

        test('should return 404 if guild not found', async () => {
            await insertUsers([userOne]);
            await request(app)

                .get(`/api/v1/member-activity/${guildOne.guildId}/decentralisation-score`)
                .set('Authorization', `Bearer ${userOneAccessToken}`)
                .expect(httpStatus.NOT_FOUND);
        })
    })
    
    describe('GET /api/v1/member-activity/:guildId/active-members-composition-table', () => {
        beforeEach(async () => {
            await connection.dropDatabase();
        });
        test('should return 200 and apply the default query options', async () => {
            await insertUsers([userOne]);
            await insertGuilds([guildOne]);
            await insertMemberActivities([memberActivityOne, memberActivityTwo], connection);
            await insertGuildMembers([guildMemberOne, guildMemberTwo, guildMemberThree, guildMemberFour], connection);
            await insertRoles([role1, role2, role3], connection);
            const res = await request(app)
                .get(`/api/v1/member-activity/${guildOne.guildId}/active-members-composition-table`)
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
                    { roleId: role2.roleId, name: role2.name, color: role2.color }
                ],
                joinedAt: guildMemberThree.joinedAt.toISOString(),
                discriminator: guildMemberThree.discriminator,
                activityComposition: ['Newly active']
            });

            expect(res.body.results[1]).toEqual({
                discordId: guildMemberOne.discordId,
                username: guildMemberOne.username,
                avatar: guildMemberOne.avatar,
                roles: [
                    { roleId: role2.roleId, name: role2.name, color: role2.color },
                    { roleId: role3.roleId, name: role3.name, color: role3.color }

                ],
                joinedAt: guildMemberOne.joinedAt.toISOString(),
                discriminator: guildMemberOne.discriminator,
                activityComposition: ['Newly active', 'Became disengaged', 'Active members']
            });

            expect(res.body.results[2]).toEqual({
                discordId: guildMemberTwo.discordId,
                username: guildMemberTwo.username + "#" + guildMemberTwo.discriminator,
                avatar: guildMemberTwo.avatar,
                roles: [
                    { roleId: role1.roleId, name: role1.name, color: role1.color },
                    { roleId: role3.roleId, name: role3.name, color: role3.color }
                ],
                joinedAt: guildMemberTwo.joinedAt.toISOString(),
                discriminator: guildMemberTwo.discriminator,
                activityComposition: ['Newly active']
            });
        })

        test('should return 401 if access token is missing', async () => {
            await request(app)
                .get(`/api/v1/member-activity/${guildOne.guildId}/active-members-composition-table`)
                .send()
                .expect(httpStatus.UNAUTHORIZED);
        })

        test('should return 404 if guild not found', async () => {
            await insertUsers([userOne]);
            await request(app)
                .get(`/api/v1/member-activity/${guildOne.guildId}/active-members-composition-table`)
                .set('Authorization', `Bearer ${userOneAccessToken}`)
                .send()
                .expect(httpStatus.NOT_FOUND);
        })

        test('should correctly apply filter on activityComposition field', async () => {
            await insertUsers([userOne]);
            await insertGuilds([guildOne]);
            await insertMemberActivities([memberActivityOne, memberActivityTwo, memberActivityThree, memberActivityFour], connection);
            await insertGuildMembers([guildMemberOne, guildMemberTwo, guildMemberThree, guildMemberFour], connection);
            await insertRoles([role1, role2, role3], connection);

            let res = await request(app)
                .get(`/api/v1/member-activity/${guildOne.guildId}/active-members-composition-table`)
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




            res = await request(app)
                .get(`/api/v1/member-activity/${guildOne.guildId}/active-members-composition-table`)
                .set('Authorization', `Bearer ${userOneAccessToken}`)
                .query({ activityComposition: ["others", "all_new_disengaged"] })
                .send()
                .expect(httpStatus.OK);

            expect(res.body).toEqual({
                results: expect.any(Array),
                page: 1,
                limit: 10,
                totalPages: 1,
                totalResults: 4,
            });

            expect(res.body.results).toHaveLength(4);
            expect(res.body.results[0].discordId).toBe(guildMemberThree.discordId);
            expect(res.body.results[0].activityComposition).toEqual(['Others']);
            expect(res.body.results[1].discordId).toBe(guildMemberOne.discordId);
            expect(res.body.results[1].activityComposition).toEqual(['Became disengaged']);
            expect(res.body.results[2].discordId).toBe(guildMemberTwo.discordId);
            expect(res.body.results[2].activityComposition).toEqual(['Others']);
            expect(res.body.results[3].discordId).toBe(guildMemberFour.discordId);
            expect(res.body.results[3].activityComposition).toEqual(['Others']);


        })

        test('should correctly apply filter on roles field', async () => {
            await insertUsers([userOne]);
            await insertGuilds([guildOne]);
            await insertMemberActivities([memberActivityOne, memberActivityTwo, memberActivityThree, memberActivityFour], connection);
            await insertGuildMembers([guildMemberOne, guildMemberTwo, guildMemberThree, guildMemberFour], connection);
            await insertRoles([role1, role2, role3], connection);

            const res = await request(app)
                .get(`/api/v1/member-activity/${guildOne.guildId}/active-members-composition-table`)
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
            await insertRoles([role1, role2, role3], connection);

            const res = await request(app)
                .get(`/api/v1/member-activity/${guildOne.guildId}/active-members-composition-table`)
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
            await insertRoles([role1, role2, role3], connection);

            const res = await request(app)
                .get(`/api/v1/member-activity/${guildOne.guildId}/active-members-composition-table`)
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
            await insertRoles([role1, role2, role3], connection);

            const res = await request(app)
                .get(`/api/v1/member-activity/${guildOne.guildId}/active-members-composition-table`)
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
            await insertRoles([role1, role2, role3], connection);

            const res = await request(app)
                .get(`/api/v1/member-activity/${guildOne.guildId}/active-members-composition-table`)
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
            await insertRoles([role1, role2, role3], connection);

            const res = await request(app)
                .get(`/api/v1/member-activity/${guildOne.guildId}/active-members-composition-table`)
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

        test('should correctly sort the returned array if page and limit are  specified', async () => {
            await insertUsers([userOne]);
            await insertGuilds([guildOne]);
            await insertMemberActivities([memberActivityOne, memberActivityTwo, memberActivityThree, memberActivityFour], connection);
            await insertGuildMembers([guildMemberOne, guildMemberTwo, guildMemberThree, guildMemberFour], connection);
            await insertRoles([role1, role2, role3], connection);

            const res = await request(app)
                .get(`/api/v1/member-activity/${guildOne.guildId}/active-members-composition-table`)
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

    describe('GET /api/v1/member-activity/:guildId/active-members-onboarding-table', () => {
        beforeEach(async () => {
            await connection.dropDatabase();
        });
        test('should return 200 and apply the default query options', async () => {
            await insertUsers([userOne]);
            await insertGuilds([guildOne]);
            await insertMemberActivities([memberActivityOne, memberActivityTwo], connection);
            await insertGuildMembers([guildMemberOne, guildMemberTwo, guildMemberThree, guildMemberFour], connection);
            await insertRoles([role1, role2, role3], connection);
            const res = await request(app)
                .get(`/api/v1/member-activity/${guildOne.guildId}/active-members-onboarding-table`)
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
                    { roleId: role2.roleId, name: role2.name, color: role2.color }
                ],
                joinedAt: guildMemberThree.joinedAt.toISOString(),
                discriminator: guildMemberThree.discriminator,
                activityComposition: ['Newly active', 'Dropped']
            });

            expect(res.body.results[1]).toEqual({
                discordId: guildMemberOne.discordId,
                username: guildMemberOne.username,
                avatar: guildMemberOne.avatar,
                roles: [
                    { roleId: role2.roleId, name: role2.name, color: role2.color },
                    { roleId: role3.roleId, name: role3.name, color: role3.color }

                ],
                joinedAt: guildMemberOne.joinedAt.toISOString(),
                discriminator: guildMemberOne.discriminator,
                activityComposition: ['Newly active', 'Joined', 'Dropped', 'Still active']
            });

            expect(res.body.results[2]).toEqual({
                discordId: guildMemberTwo.discordId,
                username: guildMemberTwo.username + "#" + guildMemberTwo.discriminator,
                avatar: guildMemberTwo.avatar,
                roles: [
                    { roleId: role1.roleId, name: role1.name, color: role1.color },
                    { roleId: role3.roleId, name: role3.name, color: role3.color }
                ],
                joinedAt: guildMemberTwo.joinedAt.toISOString(),
                discriminator: guildMemberTwo.discriminator,
                activityComposition: ['Newly active', 'Dropped']
            });
        })

        test('should return 401 if access token is missing', async () => {
            await request(app)
                .get(`/api/v1/member-activity/${guildOne.guildId}/active-members-onboarding-table`)
                .send()
                .expect(httpStatus.UNAUTHORIZED);
        })

        test('should return 404 if guild not found', async () => {
            await insertUsers([userOne]);
            await request(app)
                .get(`/api/v1/member-activity/${guildOne.guildId}/active-members-onboarding-table`)
                .set('Authorization', `Bearer ${userOneAccessToken}`)
                .send()
                .expect(httpStatus.NOT_FOUND);
        })

        test('should correctly apply filter on activityComposition field', async () => {
            await insertUsers([userOne]);
            await insertGuilds([guildOne]);
            await insertMemberActivities([memberActivityOne, memberActivityTwo, memberActivityThree, memberActivityFour], connection);
            await insertGuildMembers([guildMemberOne, guildMemberTwo, guildMemberThree, guildMemberFour], connection);
            await insertRoles([role1, role2, role3], connection);

            let res = await request(app)
                .get(`/api/v1/member-activity/${guildOne.guildId}/active-members-onboarding-table`)
                .set('Authorization', `Bearer ${userOneAccessToken}`)
                .query({ activityComposition: ["all_joined"] })
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

            res = await request(app)
                .get(`/api/v1/member-activity/${guildOne.guildId}/active-members-onboarding-table`)
                .set('Authorization', `Bearer ${userOneAccessToken}`)
                .query({ activityComposition: ["others", "all_joined"] })
                .send()
                .expect(httpStatus.OK);

            expect(res.body).toEqual({
                results: expect.any(Array),
                page: 1,
                limit: 10,
                totalPages: 1,
                totalResults: 4,
            });

            expect(res.body.results).toHaveLength(4);
            expect(res.body.results[0].discordId).toBe(guildMemberThree.discordId);
            expect(res.body.results[0].activityComposition).toEqual(['Others']);
            expect(res.body.results[1].discordId).toBe(guildMemberOne.discordId);
            expect(res.body.results[1].activityComposition).toEqual(['Joined']);
            expect(res.body.results[2].discordId).toBe(guildMemberTwo.discordId);
            expect(res.body.results[2].activityComposition).toEqual(['Others']);
            expect(res.body.results[3].discordId).toBe(guildMemberFour.discordId);
            expect(res.body.results[3].activityComposition).toEqual(['Others']);

        })

        test('should correctly apply filter on roles field', async () => {
            await insertUsers([userOne]);
            await insertGuilds([guildOne]);
            await insertMemberActivities([memberActivityOne, memberActivityTwo, memberActivityThree, memberActivityFour], connection);
            await insertGuildMembers([guildMemberOne, guildMemberTwo, guildMemberThree, guildMemberFour], connection);
            await insertRoles([role1, role2, role3], connection);

            const res = await request(app)
                .get(`/api/v1/member-activity/${guildOne.guildId}/active-members-onboarding-table`)
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
            await insertRoles([role1, role2, role3], connection);

            const res = await request(app)
                .get(`/api/v1/member-activity/${guildOne.guildId}/active-members-onboarding-table`)
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
            await insertRoles([role1, role2, role3], connection);

            const res = await request(app)
                .get(`/api/v1/member-activity/${guildOne.guildId}/active-members-onboarding-table`)
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
            await insertRoles([role1, role2, role3], connection);

            const res = await request(app)
                .get(`/api/v1/member-activity/${guildOne.guildId}/active-members-onboarding-table`)
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
            await insertRoles([role1, role2, role3], connection);

            const res = await request(app)
                .get(`/api/v1/member-activity/${guildOne.guildId}/active-members-onboarding-table`)
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
            await insertRoles([role1, role2, role3], connection);

            const res = await request(app)
                .get(`/api/v1/member-activity/${guildOne.guildId}/active-members-onboarding-table`)
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

        test('should correctly sort the returned array if page and limit are specified', async () => {
            await insertUsers([userOne]);
            await insertGuilds([guildOne]);
            await insertMemberActivities([memberActivityOne, memberActivityTwo, memberActivityThree, memberActivityFour], connection);
            await insertGuildMembers([guildMemberOne, guildMemberTwo, guildMemberThree, guildMemberFour], connection);
            await insertRoles([role1, role2, role3], connection);

            const res = await request(app)
                .get(`/api/v1/member-activity/${guildOne.guildId}/active-members-onboarding-table`)
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

    describe('GET /api/v1/member-activity/:guildId/disengaged-members-composition-table', () => {
        beforeEach(async () => {
            await connection.dropDatabase();
        });
        test('should return 200 and apply the default query options', async () => {
            await insertUsers([userOne]);
            await insertGuilds([guildOne]);
            await insertMemberActivities([memberActivityOne, memberActivityTwo], connection);
            await insertGuildMembers([guildMemberOne, guildMemberTwo, guildMemberThree, guildMemberFour], connection);
            await insertRoles([role1, role2, role3], connection);
            const res = await request(app)
                .get(`/api/v1/member-activity/${guildOne.guildId}/disengaged-members-composition-table`)
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
                    { roleId: role2.roleId, name: role2.name, color: role2.color }
                ],
                joinedAt: guildMemberThree.joinedAt.toISOString(),
                discriminator: guildMemberThree.discriminator,
                activityComposition: ['Were newly active']
            });

            expect(res.body.results[1]).toEqual({
                discordId: guildMemberOne.discordId,
                username: guildMemberOne.username,
                avatar: guildMemberOne.avatar,
                roles: [
                    { roleId: role2.roleId, name: role2.name, color: role2.color },
                    { roleId: role3.roleId, name: role3.name, color: role3.color }

                ],
                joinedAt: guildMemberOne.joinedAt.toISOString(),
                discriminator: guildMemberOne.discriminator,
                activityComposition: ['Became disengaged', 'Were newly active', 'Were consistenly active', 'Were vital members']
            });

            expect(res.body.results[2]).toEqual({
                discordId: guildMemberTwo.discordId,
                username: guildMemberTwo.username + "#" + guildMemberTwo.discriminator,
                avatar: guildMemberTwo.avatar,
                roles: [
                    { roleId: role1.roleId, name: role1.name, color: role1.color },
                    { roleId: role3.roleId, name: role3.name, color: role3.color }
                ],
                joinedAt: guildMemberTwo.joinedAt.toISOString(),
                discriminator: guildMemberTwo.discriminator,
                activityComposition: ['Were newly active']
            });
        })

        test('should return 401 if access token is missing', async () => {
            await request(app)
                .get(`/api/v1/member-activity/${guildOne.guildId}/disengaged-members-composition-table`)
                .send()
                .expect(httpStatus.UNAUTHORIZED);
        })

        test('should return 404 if guild not found', async () => {
            await insertUsers([userOne]);
            await request(app)
                .get(`/api/v1/member-activity/${guildOne.guildId}/disengaged-members-composition-table`)
                .set('Authorization', `Bearer ${userOneAccessToken}`)
                .send()
                .expect(httpStatus.NOT_FOUND);
        })

        test('should correctly apply filter on activityComposition field', async () => {
            await insertUsers([userOne]);
            await insertGuilds([guildOne]);
            await insertMemberActivities([memberActivityOne, memberActivityTwo, memberActivityThree, memberActivityFour], connection);
            await insertGuildMembers([guildMemberOne, guildMemberTwo, guildMemberThree, guildMemberFour], connection);
            await insertRoles([role1, role2, role3], connection);

            let res = await request(app)
                .get(`/api/v1/member-activity/${guildOne.guildId}/disengaged-members-composition-table`)
                .set('Authorization', `Bearer ${userOneAccessToken}`)
                .query({ activityComposition: ["all_disengaged_were_vital"] })
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

            res = await request(app)
                .get(`/api/v1/member-activity/${guildOne.guildId}/disengaged-members-composition-table`)
                .set('Authorization', `Bearer ${userOneAccessToken}`)
                .query({ activityComposition: ["others", "all_disengaged_were_vital"] })
                .send()
                .expect(httpStatus.OK);

            expect(res.body).toEqual({
                results: expect.any(Array),
                page: 1,
                limit: 10,
                totalPages: 1,
                totalResults: 4,
            });

            expect(res.body.results).toHaveLength(4);
            expect(res.body.results[0].discordId).toBe(guildMemberThree.discordId);
            expect(res.body.results[0].activityComposition).toEqual(['Others']);
            expect(res.body.results[1].discordId).toBe(guildMemberOne.discordId);
            expect(res.body.results[1].activityComposition).toEqual(['Were vital members']);
            expect(res.body.results[2].discordId).toBe(guildMemberTwo.discordId);
            expect(res.body.results[2].activityComposition).toEqual(['Others']);
            expect(res.body.results[3].discordId).toBe(guildMemberFour.discordId);
            expect(res.body.results[3].activityComposition).toEqual(['Others']);

        })

        test('should correctly apply filter on roles field', async () => {
            await insertUsers([userOne]);
            await insertGuilds([guildOne]);
            await insertMemberActivities([memberActivityOne, memberActivityTwo, memberActivityThree, memberActivityFour], connection);
            await insertGuildMembers([guildMemberOne, guildMemberTwo, guildMemberThree, guildMemberFour], connection);
            await insertRoles([role1, role2, role3], connection);

            const res = await request(app)
                .get(`/api/v1/member-activity/${guildOne.guildId}/disengaged-members-composition-table`)
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
            await insertRoles([role1, role2, role3], connection);

            const res = await request(app)
                .get(`/api/v1/member-activity/${guildOne.guildId}/disengaged-members-composition-table`)
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
            await insertRoles([role1, role2, role3], connection);

            const res = await request(app)
                .get(`/api/v1/member-activity/${guildOne.guildId}/disengaged-members-composition-table`)
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
            await insertRoles([role1, role2, role3], connection);

            const res = await request(app)
                .get(`/api/v1/member-activity/${guildOne.guildId}/disengaged-members-composition-table`)
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
            await insertRoles([role1, role2, role3], connection);

            const res = await request(app)
                .get(`/api/v1/member-activity/${guildOne.guildId}/disengaged-members-composition-table`)
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
            await insertRoles([role1, role2, role3], connection);

            const res = await request(app)
                .get(`/api/v1/member-activity/${guildOne.guildId}/disengaged-members-composition-table`)
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

        test('should correctly sort the returned array if page and limit are specified', async () => {
            await insertUsers([userOne]);
            await insertGuilds([guildOne]);
            await insertMemberActivities([memberActivityOne, memberActivityTwo, memberActivityThree, memberActivityFour], connection);
            await insertGuildMembers([guildMemberOne, guildMemberTwo, guildMemberThree, guildMemberFour], connection);
            await insertRoles([role1, role2, role3], connection);

            const res = await request(app)
                .get(`/api/v1/member-activity/${guildOne.guildId}/disengaged-members-composition-table`)
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