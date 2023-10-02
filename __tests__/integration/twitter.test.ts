import request from 'supertest';
import httpStatus from 'http-status';
import app from '../../src/app';
import setupTestDB from '../utils/setupTestDB';
import config from '../../src/config';
import * as Neo4j from '../../src/neo4j';
import { userOneAccessToken, userTwoAccessToken } from '../fixtures/token.fixture';
import dateUtils from '../../src/utils/date';
import { insertUsers, userOne, userTwo } from '../fixtures/user.fixture';
setupTestDB();

describe('Twitter routes', () => {
    describe('GET /api/v1/twitter/metrics/activity', () => {

        test('should return 200 and Activity Metrics data if req data is ok', async () => {
            const oneDaysAgoTimestamp = dateUtils.getXDaysAgoUTCtimestamp(1);
            const twoDaysAgoTimestamp = dateUtils.getXDaysAgoUTCtimestamp(2);
            const threeDaysAgoTimestamp = dateUtils.getXDaysAgoUTCtimestamp(3);
            const fourDaysAgoTimestamp = dateUtils.getXDaysAgoUTCtimestamp(4);
            const fiveDaysAgoTimestamp = dateUtils.getXDaysAgoUTCtimestamp(5);
            const sevenDaysAgoTimestamp = dateUtils.getXDaysAgoUTCtimestamp(7);
            const eightDaysAgoTimestamp = dateUtils.getXDaysAgoUTCtimestamp(8);

            const numberOfPostsMockData = `
                MERGE (a:TwitterAccount {userId: "${userOne.twitterId}"})
                MERGE (a2:TwitterAccount {userId: "1112"})
                MERGE (t:Tweet {tweetId: "123", authorId: "${userOne.twitterId}"})
                MERGE (t2:Tweet {tweetId: '124', authorId: "${userOne.twitterId}"})
                MERGE (t3:Tweet {tweetId: '125', authorId: "1112"})
                MERGE (t4:Tweet {tweetId: '126', authorId: "${userOne.twitterId}"})
                
                MERGE (a)-[:TWEETED {createdAt: ${twoDaysAgoTimestamp}}]->(t)
                MERGE (a)-[:TWEETED {createdAt: ${eightDaysAgoTimestamp}}]->(t2)
                MERGE (a2)-[:TWEETED {createdAt: ${fiveDaysAgoTimestamp}}]->(t3)
                MERGE (a)-[:TWEETED {createdAt: ${threeDaysAgoTimestamp}}]->(t4)
            `
            const numberOfRepliesMockData = `
                MERGE (a:TwitterAccount {userId: "${userOne.twitterId}"})
                MERGE (a2:TwitterAccount {userId: "1112"})
                MERGE (t:Tweet {tweetId: "123", authorId: "${userOne.twitterId}"})
                MERGE (t2:Tweet {tweetId: '124', authorId: "${userOne.twitterId}"})
                MERGE (t3:Tweet {tweetId: '125', authorId: "1112"})
                MERGE (t4:Tweet {tweetId: '126', authorId: "${userOne.twitterId}"})
                MERGE (t5:Tweet {tweetId: '127', authorId: "1112"})

                MERGE (a)-[:TWEETED {createdAt: ${twoDaysAgoTimestamp}}]->(t)
                MERGE (a)-[:TWEETED {createdAt: ${oneDaysAgoTimestamp}}]->(t4)

                MERGE (t2)-[:REPLIED {createdAt: ${oneDaysAgoTimestamp}}]->(t)
                MERGE (t3)-[:REPLIED {createdAt: ${twoDaysAgoTimestamp}}]->(t)
                MERGE (t5)-[:REPLIED {createdAt: ${fourDaysAgoTimestamp}}]->(t4)
            `
            const numberOfRetweetsMockData = `
                MERGE (a:TwitterAccount {userId: "${userOne.twitterId}"})
                MERGE (a2:TwitterAccount {userId: "1112"})
                MERGE (t:Tweet {tweetId: "123", authorId: "${userOne.twitterId}"})
                MERGE (t2:Tweet {tweetId: '124', authorId: "${userOne.twitterId}"})
                MERGE (t3:Tweet {tweetId: '125', authorId: "1112"})
                MERGE (t4:Tweet {tweetId: '126', authorId: "${userOne.twitterId}"})
                MERGE (t5:Tweet {tweetId: '127', authorId: "1112"})
                
                MERGE (a)-[:TWEETED {createdAt: ${twoDaysAgoTimestamp}}]->(t)
                MERGE (a)-[:TWEETED {createdAt: ${oneDaysAgoTimestamp}}]->(t4)
                
                MERGE (t2)-[:RETWEETED {createdAt: ${oneDaysAgoTimestamp}}]->(t)
                MERGE (t3)-[:REPLIED {createdAt: ${twoDaysAgoTimestamp}}]->(t)
                MERGE (t5)-[:RETWEETED {createdAt: ${fourDaysAgoTimestamp}}]->(t4)
            `
            const numberOfLikesMockData = `
                MERGE (a:TwitterAccount {userId: "${userOne.twitterId}"})
                MERGE (a2:TwitterAccount {userId: "1112"})
                MERGE (t:Tweet {tweetId: "123", authorId: "${userOne.twitterId}", createdAt: ${fiveDaysAgoTimestamp}})
                MERGE (t2:Tweet {tweetId: '124', authorId: "${userOne.twitterId}", createdAt: ${fourDaysAgoTimestamp}})
                MERGE (t3:Tweet {tweetId: '125', authorId: "1112", createdAt: ${sevenDaysAgoTimestamp}})
                MERGE (t4:Tweet {tweetId: '126', authorId: "${userOne.twitterId}", createdAt: ${threeDaysAgoTimestamp}})
                MERGE (t5:Tweet {tweetId: '127', authorId: "1112", createdAt: ${eightDaysAgoTimestamp}})
                
                MERGE (a)-[:TWEETED {createdAt: ${twoDaysAgoTimestamp}}]->(t)
                MERGE (a)-[:TWEETED {createdAt: ${threeDaysAgoTimestamp}}]->(t2)
                MERGE (a)-[:TWEETED {createdAt: ${fiveDaysAgoTimestamp}}]->(t4)
                MERGE (a2)-[:TWEETED {createdAt: ${fourDaysAgoTimestamp}}]->(t3)
                MERGE (a2)-[:TWEETED {createdAt: ${threeDaysAgoTimestamp}}]->(t5)
                
                MERGE (a)-[:LIKED {latestSavedAt: ${oneDaysAgoTimestamp}}]->(t)
                MERGE (a)-[:LIKED {latestSavedAt: ${oneDaysAgoTimestamp}}]->(t2)
                MERGE (a)-[:LIKED {latestSavedAt: ${oneDaysAgoTimestamp}}]->(t3)
                MERGE (a)-[:LIKED {latestSavedAt: ${oneDaysAgoTimestamp}}]->(t5)
                
                MERGE (a2)-[:LIKED {latestSavedAt: ${oneDaysAgoTimestamp}}]->(t)
                MERGE (a2)-[:LIKED {latestSavedAt: ${oneDaysAgoTimestamp}}]->(t3)
                MERGE (a2)-[:LIKED {latestSavedAt: ${oneDaysAgoTimestamp}}]->(t5)
            `
            const numberOfMentionsMockData = `
                MERGE (a:TwitterAccount {userId: "${userOne.twitterId}"})
                MERGE (a2:TwitterAccount {userId: "1112"})
                MERGE (t:Tweet {tweetId: "123", authorId: "${userOne.twitterId}", createdAt: ${fiveDaysAgoTimestamp}})
                MERGE (t2:Tweet {tweetId: '124', authorId: "${userOne.twitterId}", createdAt: ${fourDaysAgoTimestamp}})
                MERGE (t3:Tweet {tweetId: '125', authorId: "1112", createdAt: ${sevenDaysAgoTimestamp}})
                MERGE (t4:Tweet {tweetId: '126', authorId: "${userOne.twitterId}", createdAt: ${threeDaysAgoTimestamp}})
                MERGE (t5:Tweet {tweetId: '127', authorId: "1112", createdAt: ${eightDaysAgoTimestamp}})
                
                MERGE (a)-[:TWEETED {createdAt: ${twoDaysAgoTimestamp}}]->(t)
                MERGE (a)-[:TWEETED {createdAt: ${threeDaysAgoTimestamp}}]->(t2)
                MERGE (a)-[:TWEETED {createdAt: ${fourDaysAgoTimestamp}}]->(t4)
                MERGE (a2)-[:TWEETED {createdAt: ${fourDaysAgoTimestamp}}]->(t3)
                MERGE (a2)-[:TWEETED {createdAt: ${threeDaysAgoTimestamp}}]->(t5)
                
                MERGE (t) -[:MENTIONED {createdAt: ${twoDaysAgoTimestamp}}] -> (a)
                MERGE (t) -[:MENTIONED {createdAt: ${twoDaysAgoTimestamp}}] -> (a2)
                MERGE (t2) -[:MENTIONED {createdAt: ${threeDaysAgoTimestamp}}] -> (a2)
                MERGE (t3) -[:MENTIONED {createdAt: ${fourDaysAgoTimestamp}}] -> (a2)
            `
            
            await insertUsers([userOne]);
            await Neo4j.write("match (n) detach delete (n);")
            await Neo4j.write(numberOfPostsMockData)
            await Neo4j.write(numberOfRepliesMockData)
            await Neo4j.write(numberOfRetweetsMockData)
            await Neo4j.write(numberOfLikesMockData)
            await Neo4j.write(numberOfMentionsMockData)

            const res = await request(app)
                .get(`/api/v1/twitter/metrics/activity`)
                .set('Authorization', `Bearer ${userOneAccessToken}`)
                .expect(httpStatus.OK);
                
            expect(res.body.posts).toEqual(7)
            expect(res.body.replies).toEqual(0)
            expect(res.body.retweets).toEqual(0)
            expect(res.body.likes).toEqual(1)
            expect(res.body.mentions).toEqual(2)
        })
        
        test("should return 400 if user has not connected his Twitter account yet!", async () => {
            await insertUsers([userTwo]);
            const res = await request(app)
                .get(`/api/v1/twitter/metrics/activity`)
                .set('Authorization', `Bearer ${userTwoAccessToken}`)
                .expect(httpStatus.BAD_REQUEST);
        })

        test('should return 401 if access token is missing', async () => {
            await request(app)
                .get(`/api/v1/twitter/metrics/activity`)
                .send()
                .expect(httpStatus.UNAUTHORIZED);
        })
    })

    describe('GET /api/v1/twitter/metrics/audience', () => {

        test('should return 200 and Audience Metrics data if req data is ok', async () => {
            const oneDaysAgoTimestamp = dateUtils.getXDaysAgoUTCtimestamp(1);
            const twoDaysAgoTimestamp = dateUtils.getXDaysAgoUTCtimestamp(2);
            const threeDaysAgoTimestamp = dateUtils.getXDaysAgoUTCtimestamp(3);
            const fourDaysAgoTimestamp = dateUtils.getXDaysAgoUTCtimestamp(4);
            const fiveDaysAgoTimestamp = dateUtils.getXDaysAgoUTCtimestamp(5);
            const sevenDaysAgoTimestamp = dateUtils.getXDaysAgoUTCtimestamp(7);
            const eightDaysAgoTimestamp = dateUtils.getXDaysAgoUTCtimestamp(8);

            const NumberOfRepliesOthersMackMockData = `
                MERGE (a:TwitterAccount {userId: "${userOne.twitterId}"})
                MERGE (a2:TwitterAccount {userId: "1112"})
                MERGE (t:Tweet {tweetId: "123", authorId: "${userOne.twitterId}"})
                MERGE (t2:Tweet {tweetId: '124', authorId: "${userOne.twitterId}"})
                MERGE (t3:Tweet {tweetId: '125', authorId: "1112"})
                MERGE (t4:Tweet {tweetId: '126', authorId: "${userOne.twitterId}"})
                MERGE (t5:Tweet {tweetId: '127', authorId: "1112"})
                
                MERGE (a)-[:TWEETED {createdAt: ${twoDaysAgoTimestamp}}]->(t)
                MERGE (a)-[:TWEETED {createdAt: ${oneDaysAgoTimestamp}}]->(t4)
                
                MERGE (t2)-[:REPLIED {createdAt: ${oneDaysAgoTimestamp}}]->(t)
                MERGE (t3)-[:REPLIED {createdAt: ${twoDaysAgoTimestamp}}]->(t)
                MERGE (t5)-[:REPLIED {createdAt: ${fourDaysAgoTimestamp}}]->(t4)
            `
            const NumberOfRetweetsOthersMackMockData = `
                MERGE (a:TwitterAccount {userId: "${userOne.twitterId}"})
                MERGE (a2:TwitterAccount {userId: "1112"})
                MERGE (t:Tweet {tweetId: "123", authorId: "${userOne.twitterId}"})
                MERGE (t2:Tweet {tweetId: '124', authorId: "${userOne.twitterId}"})
                MERGE (t3:Tweet {tweetId: '125', authorId: "1112"})
                MERGE (t4:Tweet {tweetId: '126', authorId: "${userOne.twitterId}"})
                MERGE (t5:Tweet {tweetId: '127', authorId: "1112"})
                
                MERGE (a)-[:TWEETED {createdAt: ${twoDaysAgoTimestamp}}]->(t)
                MERGE (a)-[:TWEETED {createdAt: ${oneDaysAgoTimestamp}}]->(t4)
                
                MERGE (t2)-[:RETWEETED {createdAt: ${oneDaysAgoTimestamp}}]->(t)
                MERGE (t3)-[:REPLIED {createdAt: ${twoDaysAgoTimestamp}}]->(t)
                MERGE (t5)-[:RETWEETED {createdAt: ${fourDaysAgoTimestamp}}]->(t4)
            `
            const NumberOfLikesOthersMackMockData = `
                MERGE (a:TwitterAccount {userId: "${userOne.twitterId}"})
                MERGE (a2:TwitterAccount {userId: "1112"})
                MERGE (t:Tweet {tweetId: "123", authorId: "${userOne.twitterId}", createdAt: ${fiveDaysAgoTimestamp}})
                MERGE (t2:Tweet {tweetId: '124', authorId: "${userOne.twitterId}", createdAt: ${fourDaysAgoTimestamp}})
                MERGE (t3:Tweet {tweetId: '125', authorId: "1112", createdAt: ${sevenDaysAgoTimestamp}})
                MERGE (t4:Tweet {tweetId: '126', authorId: "${userOne.twitterId}", createdAt: ${threeDaysAgoTimestamp}})
                MERGE (t5:Tweet {tweetId: '127', authorId: "1112", createdAt: ${eightDaysAgoTimestamp}})
                
                MERGE (a)-[:TWEETED {createdAt: ${twoDaysAgoTimestamp}}]->(t)
                MERGE (a)-[:TWEETED {createdAt: ${threeDaysAgoTimestamp}}]->(t2)
                MERGE (a)-[:TWEETED {createdAt: ${fiveDaysAgoTimestamp}}]->(t4)
                MERGE (a2)-[:TWEETED {createdAt: ${fourDaysAgoTimestamp}}]->(t3)
                MERGE (a2)-[:TWEETED {createdAt: ${threeDaysAgoTimestamp}}]->(t5)
                
                MERGE (a)-[:LIKED {latestSavedAt: ${oneDaysAgoTimestamp}}]->(t)
                MERGE (a)-[:LIKED {latestSavedAt: ${oneDaysAgoTimestamp}}]->(t2)
                MERGE (a)-[:LIKED {latestSavedAt: ${oneDaysAgoTimestamp}}]->(t3)
                MERGE (a)-[:LIKED {latestSavedAt: ${oneDaysAgoTimestamp}}]->(t5)
                
                MERGE (a2)-[:LIKED {latestSavedAt: ${oneDaysAgoTimestamp}}]->(t3)
                MERGE (a2)-[:LIKED {latestSavedAt: ${oneDaysAgoTimestamp}}]->(t5)
            `
            const NumberOfMentionsOthersMackMockData = `
                MERGE (a:TwitterAccount {userId: "${userOne.twitterId}"})
                MERGE (a2:TwitterAccount {userId: "1112"})
                MERGE (t:Tweet {tweetId: "123", authorId: "${userOne.twitterId}", createdAt: ${fiveDaysAgoTimestamp}})
                MERGE (t2:Tweet {tweetId: '124', authorId: "${userOne.twitterId}", createdAt: ${fourDaysAgoTimestamp}})
                MERGE (t3:Tweet {tweetId: '125', authorId: "1112", createdAt: ${sevenDaysAgoTimestamp}})
                MERGE (t4:Tweet {tweetId: '126', authorId: "${userOne.twitterId}", createdAt: ${threeDaysAgoTimestamp}})
                MERGE (t5:Tweet {tweetId: '127', authorId: "1112", createdAt: "{Epoch8dayAgo}"})
                
                MERGE (a)-[:TWEETED {createdAt: ${twoDaysAgoTimestamp}}]->(t)
                MERGE (a)-[:TWEETED {createdAt: ${threeDaysAgoTimestamp}}]->(t2)
                MERGE (a)-[:TWEETED {createdAt: ${fourDaysAgoTimestamp}}]->(t4)
                MERGE (a2)-[:TWEETED {createdAt: ${fourDaysAgoTimestamp}}]->(t3)
                MERGE (a2)-[:TWEETED {createdAt: ${threeDaysAgoTimestamp}}]->(t5)
                
                MERGE (t) -[:MENTIONED {createdAt: ${twoDaysAgoTimestamp}}] -> (a)
                MERGE (t) -[:MENTIONED {createdAt: ${twoDaysAgoTimestamp}}] -> (a2)
                MERGE (t2) -[:MENTIONED {createdAt: ${threeDaysAgoTimestamp}}] -> (a2)
                MERGE (t3) -[:MENTIONED {createdAt: ${fourDaysAgoTimestamp}}] -> (a2)
            `

            await insertUsers([userOne]);
            await Neo4j.write("match (n) detach delete (n);")
            await Neo4j.write(NumberOfRepliesOthersMackMockData)
            await Neo4j.write(NumberOfRetweetsOthersMackMockData)
            await Neo4j.write(NumberOfLikesOthersMackMockData)
            await Neo4j.write(NumberOfMentionsOthersMackMockData)

            const res = await request(app)
                .get(`/api/v1/twitter/metrics/audience`)
                .set('Authorization', `Bearer ${userOneAccessToken}`)
                .expect(httpStatus.OK);

            expect(res.body.replies).toEqual(2)
            expect(res.body.retweets).toEqual(1)
            expect(res.body.likes).toEqual(0)
            expect(res.body.mentions).toEqual(0)
        })

        test("should return 400 if user has not connected his Twitter account yet!", async () => {
            await insertUsers([userTwo]);
            const res = await request(app)
                .get(`/api/v1/twitter/metrics/audience`)
                .set('Authorization', `Bearer ${userTwoAccessToken}`)
                .expect(httpStatus.BAD_REQUEST);
        })

        test('should return 401 if access token is missing', async () => {
            config.notion.apiKey = 'invalid'
            await request(app)
                .get(`/api/v1/twitter/metrics/audience`)
                .send()
                .expect(httpStatus.UNAUTHORIZED);
        })
    })

    describe('GET /api/v1/twitter/metrics/engagement', () => {

        test('should return 200 and Engagement Metrics data if req data is ok (1)', async () => {
            const oneDaysAgoTimestamp = dateUtils.getXDaysAgoUTCtimestamp(1);
            const twoDaysAgoTimestamp = dateUtils.getXDaysAgoUTCtimestamp(2);
            const fourDaysAgoTimestamp = dateUtils.getXDaysAgoUTCtimestamp(4);

            const mockQuery = `
                MERGE (a:TwitterAccount {userId: "1111"})
                MERGE (a2:TwitterAccount {userId: "1112"})
                MERGE (a3:TwitterAccount {userId: "1113"})
                MERGE (a4:TwitterAccount {userId: "${userOne.twitterId}"})
                MERGE (t:Tweet {tweetId: "123", authorId: "1111"})
                MERGE (t2:Tweet {tweetId: '124', authorId: "1111"})
                MERGE (t3:Tweet {tweetId: '125', authorId: "1112"})
                MERGE (t4:Tweet {tweetId: '126', authorId: "1111"})
                MERGE (t5:Tweet {tweetId: '127', authorId: "1112"})
                MERGE (t6:Tweet {tweetId: '128', authorId: "1113"})
                MERGE (t7:Tweet {tweetId: '129', authorId: "1113"})
                MERGE (t8:Tweet {tweetId: '130', authorId: "${userOne.twitterId}"})
                MERGE (t9:Tweet {tweetId: '131', authorId: "${userOne.twitterId}"})
                MERGE (t10:Tweet {tweetId: '132', authorId: "${userOne.twitterId}"})
                MERGE (t11:Tweet {tweetId: '133', authorId: "${userOne.twitterId}"})
                
                
                MERGE (a)-[:TWEETED {createdAt: ${twoDaysAgoTimestamp}}]->(t)
                MERGE (a)-[:TWEETED {createdAt: ${oneDaysAgoTimestamp}}]->(t4)
                
                MERGE (t2)-[:QUOTED {createdAt: ${oneDaysAgoTimestamp}}]->(t9)
                MERGE (t)-[:QUOTED {createdAt: ${oneDaysAgoTimestamp}}]->(t11)
                MERGE (t4)-[:QUOTED {createdAt: ${oneDaysAgoTimestamp}}]->(t8)
                
                MERGE (t3)-[:REPLIED {createdAt: ${twoDaysAgoTimestamp}}]->(t8)
                MERGE (t5)-[:REPLIED {createdAt: ${fourDaysAgoTimestamp} }]->(t9)
                MERGE (t5)-[:MENTIONED {createdAt: ${fourDaysAgoTimestamp} }]->(a4)
                MERGE (t6)-[:MENTIONED {createdAt: ${fourDaysAgoTimestamp} }]->(a4)
                MERGE (t6)-[:REPLIED {createdAt: ${fourDaysAgoTimestamp} }]->(t11)
                MERGE (t7)-[:REPLIED {createdAt: ${fourDaysAgoTimestamp} }]->(t)
                MERGE (t7)-[:MENTIONED {createdAt: ${fourDaysAgoTimestamp} }]->(a2)
                MERGE (t8)-[:MENTIONED {createdAt: ${fourDaysAgoTimestamp} }]->(a3)
                MERGE (t9)-[:REPLIED {createdAt: ${fourDaysAgoTimestamp} }]->(t2)
                MERGE (t10)-[:REPLIED {createdAt: ${fourDaysAgoTimestamp} }]->(t9)
                MERGE (t11)-[:QUOTED {createdAt: ${fourDaysAgoTimestamp} }]->(t3)
            `

            await insertUsers([userOne]);
            await Neo4j.write("match (n) detach delete (n);")
            await Neo4j.write(mockQuery)

            const res = await request(app)
                .get(`/api/v1/twitter/metrics/engagement`)
                .set('Authorization', `Bearer ${userOneAccessToken}`)
                .expect(httpStatus.OK);

            expect(res.body.hqla).toEqual(1)
            expect(res.body.hqhe).toEqual(2)
            expect(res.body.lqla).toEqual(0)
            expect(res.body.lqhe).toEqual(0)
        })

        test('should return 200 and Engagement Metrics data if req data is ok (2)', async () => {
            const oneDaysAgoTimestamp = dateUtils.getXDaysAgoUTCtimestamp(1);
            const twoDaysAgoTimestamp = dateUtils.getXDaysAgoUTCtimestamp(2);
            const fourDaysAgoTimestamp = dateUtils.getXDaysAgoUTCtimestamp(4);

            const mockQuery = `
                MERGE (a:TwitterAccount {userId: "1111"})
                MERGE (a2:TwitterAccount {userId: "1112"})
                MERGE (a3:TwitterAccount {userId: "1113"})
                MERGE (a4:TwitterAccount {userId: "${userOne.twitterId}"})
                MERGE (t:Tweet {tweetId: "123", authorId: "1111"})
                MERGE (t2:Tweet {tweetId: '124', authorId: "1111"})
                MERGE (t3:Tweet {tweetId: '125', authorId: "1112"})
                MERGE (t4:Tweet {tweetId: '126', authorId: "1111"})
                MERGE (t5:Tweet {tweetId: '127', authorId: "1112"})
                MERGE (t6:Tweet {tweetId: '128', authorId: "1113"})
                MERGE (t7:Tweet {tweetId: '129', authorId: "${userOne.twitterId}"})
                MERGE (t8:Tweet {tweetId: '130', authorId: "${userOne.twitterId}"})
                MERGE (t9:Tweet {tweetId: '131', authorId: "${userOne.twitterId}"})
                MERGE (t10:Tweet {tweetId: '132', authorId: "${userOne.twitterId}"})
                MERGE (t11:Tweet {tweetId: '133', authorId: "${userOne.twitterId}"})
                
                
                MERGE (a)-[:TWEETED {createdAt: ${twoDaysAgoTimestamp}}]->(t)
                MERGE (a)-[:TWEETED {createdAt: ${oneDaysAgoTimestamp}}]->(t4)
                
                MERGE (t2)-[:REPLIED {createdAt: ${oneDaysAgoTimestamp}}]->(t)
                MERGE (t3)-[:REPLIED {createdAt: ${twoDaysAgoTimestamp}}]->(t8)
                MERGE (t5)-[:REPLIED {createdAt: ${fourDaysAgoTimestamp}}]->(t9)
                MERGE (t6)-[:MENTIONED {createdAt: ${fourDaysAgoTimestamp}}]->(a4)
                MERGE (t6)-[:REPLIED {createdAt: ${fourDaysAgoTimestamp}}]->(t11)
                MERGE (t7)-[:REPLIED {createdAt: ${fourDaysAgoTimestamp}}]->(t)
                MERGE (t7)-[:MENTIONED {createdAt: ${fourDaysAgoTimestamp}}]->(a2)
                MERGE (t8)-[:MENTIONED {createdAt: ${fourDaysAgoTimestamp}}]->(a3)
                MERGE (t8)-[:QUOTED {createdAt: ${fourDaysAgoTimestamp}}]->(t4)
                MERGE (t9)-[:REPLIED {createdAt: ${fourDaysAgoTimestamp}}]->(t2)
                MERGE (t10)-[:REPLIED {createdAt: ${fourDaysAgoTimestamp}}]->(t9)
                MERGE (t11)-[:QUOTED {createdAt: ${fourDaysAgoTimestamp}}]->(t3)
            `

            await insertUsers([userOne]);
            await Neo4j.write("match (n) detach delete (n);")
            await Neo4j.write(mockQuery)

            const res = await request(app)
                .get(`/api/v1/twitter/metrics/engagement`)
                .set('Authorization', `Bearer ${userOneAccessToken}`)
                .expect(httpStatus.OK);

            console.log(res.body)
            expect(res.body.hqla).toEqual(2)
            expect(res.body.hqhe).toEqual(0)
            expect(res.body.lqla).toEqual(0)
            expect(res.body.lqhe).toEqual(0)
        })

        test("should return 400 if user has not connected his Twitter account yet!", async () => {
            await insertUsers([userTwo]);
            const res = await request(app)
                .get(`/api/v1/twitter/metrics/engagement`)
                .set('Authorization', `Bearer ${userTwoAccessToken}`)
                .expect(httpStatus.BAD_REQUEST);
        })

        test('should return 401 if access token is missing', async () => {
            config.notion.apiKey = 'invalid'
            await request(app)
                .get(`/api/v1/twitter/metrics/engagement`)
                .send()
                .expect(httpStatus.UNAUTHORIZED);
        })
    })
});