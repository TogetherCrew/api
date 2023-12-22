import request from 'supertest';
import httpStatus from 'http-status';
import app from '../../src/app';
import setupTestDB from '../utils/setupTestDB';
import { userOne, insertUsers } from '../fixtures/user.fixture';
import { userOneAccessToken } from '../fixtures/token.fixture';
import { heatmap1, heatmap2, heatmap3, heatmap4, heatmap5, heatmap6, heatmap7, heatmap8, insertHeatmaps } from '../fixtures/heatmap.fixture';
import { communityOne, insertCommunities } from '../fixtures/community.fixture';
import { platformOne, insertPlatforms } from '../fixtures/platform.fixture';
import { DatabaseManager } from '@togethercrew.dev/db';


setupTestDB();

describe('Heatmap routes', () => {
    beforeEach(() => {
        userOne.communities = [communityOne._id];
        communityOne.users = [userOne._id];
        communityOne.platforms = [platformOne._id]
        platformOne.community = communityOne._id
    });
    const connection = DatabaseManager.getInstance().getTenantDb(platformOne.metadata?.id);
    describe('POST /api/v1/heatmaps/:platformId/heatmap-chart', () => {
        let requestBody: {
            startDate: Date,
            endDate: Date,
            timeZone: string,
            channelIds: Array<string>
        };
        beforeEach(async () => {
            await connection.dropDatabase();
            requestBody = {
                startDate: new Date("2023-01-01"),
                endDate: new Date("2023-01-31"),
                timeZone: "Universal", // 0
                channelIds: ["1012430565959553148", "1012430565959553211", "1012430565959553149"]

            };
        });

        test('should return 200 and filter heatmap chart base on date (universal timezone offset) if req data is ok', async () => {
            await insertCommunities([communityOne]);
            await insertUsers([userOne]);
            await insertPlatforms([platformOne]);
            await insertHeatmaps([heatmap1, heatmap2, heatmap5], connection);
            const res = await request(app)
                .post(`/api/v1/heatmaps/${platformOne._id}/heatmap-chart`)
                .set('Authorization', `Bearer ${userOneAccessToken}`)
                .send(requestBody)
                .expect(httpStatus.OK);

            expect(res.body.length).toBe(168);
            expect(res.body[0]).toEqual([0, 1, 18])
            expect(res.body[1]).toEqual([0, 2, 5])
            expect(res.body[23]).toEqual([0, 24, 6])

            expect(res.body[27]).toEqual([1, 4, 12])
            expect(res.body[47]).toEqual([1, 24, 9])
        })

        test('should return 200 and filter heatmap chart base on date (positive timezone offset) if req data is ok', async () => {
            await insertCommunities([communityOne]);
            await insertUsers([userOne]);
            await insertPlatforms([platformOne]);
            await insertHeatmaps([heatmap1, heatmap2, heatmap5], connection);
            requestBody.timeZone = 'Asia/Tehran'; // +3:30

            const res = await request(app)
                .post(`/api/v1/heatmaps/${platformOne._id}/heatmap-chart`)
                .set('Authorization', `Bearer ${userOneAccessToken}`)
                .send(requestBody)
                .expect(httpStatus.OK);

            expect(res.body.length).toBe(168);
            expect(res.body[3]).toEqual([0, 4, 18])
            expect(res.body[4]).toEqual([0, 5, 5])
            expect(res.body[26]).toEqual([1, 3, 6])

            expect(res.body[30]).toEqual([1, 7, 12])
            expect(res.body[50]).toEqual([2, 3, 9])
        })

        test('should return 200 and filter heatmap chart base on date (negative timezone offset) if req data is ok', async () => {
            await insertCommunities([communityOne]);
            await insertUsers([userOne]);
            await insertPlatforms([platformOne]);
            await insertHeatmaps([heatmap1, heatmap2, heatmap5], connection);
            requestBody.timeZone = 'Brazil/East'; // -3:30

            const res = await request(app)
                .post(`/api/v1/heatmaps/${platformOne._id}/heatmap-chart`)
                .set('Authorization', `Bearer ${userOneAccessToken}`)
                .send(requestBody)
                .expect(httpStatus.OK);

            expect(res.body.length).toBe(168);
            expect(res.body[165]).toEqual([6, 22, 18])
            expect(res.body[166]).toEqual([6, 23, 5])
            expect(res.body[20]).toEqual([0, 21, 6])

            expect(res.body[24]).toEqual([1, 1, 12])
            expect(res.body[44]).toEqual([1, 21, 9])

        })

        test('should return 200 and filter heatmap chart base on date and channelId if req data is ok', async () => {
            await insertCommunities([communityOne]);
            await insertUsers([userOne]);
            await insertPlatforms([platformOne]);
            await insertHeatmaps([heatmap1, heatmap2, heatmap5], connection);
            requestBody.startDate = new Date("2023-01-20");
            requestBody.endDate = new Date("2023-01-22");
            requestBody.channelIds = ["1012430565959553148"]
            const res = await request(app)
                .post(`/api/v1/heatmaps/${platformOne._id}/heatmap-chart`)
                .set('Authorization', `Bearer ${userOneAccessToken}`)
                .send(requestBody)
                .expect(httpStatus.OK);

            expect(res.body.length).toBe(168);
            expect(res.body[0]).toEqual([0, 1, 3])
            expect(res.body[1]).toEqual([0, 2, 5])
            expect(res.body[23]).toEqual([0, 24, 6])

            expect(res.body[27]).toEqual([1, 4, 0])
            expect(res.body[47]).toEqual([1, 24, 0])
        })

        test('should return 200 and empty chart data if channelIds is empty req data is ok', async () => {
            await insertCommunities([communityOne]);
            await insertUsers([userOne]);
            await insertPlatforms([platformOne]);
            await insertHeatmaps([heatmap1, heatmap2, heatmap5], connection);
            requestBody.startDate = new Date("2023-01-20");
            requestBody.endDate = new Date("2023-01-22");
            requestBody.channelIds = []
            const res = await request(app)
                .post(`/api/v1/heatmaps/${platformOne._id}/heatmap-chart`)
                .set('Authorization', `Bearer ${userOneAccessToken}`)
                .send(requestBody)
                .expect(httpStatus.OK);

            expect(res.body.length).toBe(168);

            const valuePattern = expect.arrayContaining([expect.anything(), expect.anything(), 0]);
            expect(res.body).toEqual(expect.arrayContaining(Array(168).fill(valuePattern)));
        })

        test('should return 401 if access token is missing', async () => {
            await request(app)
                .post(`/api/v1/heatmaps/${platformOne._id}/heatmap-chart`)
                .send(requestBody)
                .expect(httpStatus.UNAUTHORIZED);
        })

        test('should return 404 if guild not found', async () => {
            await insertUsers([userOne]);
            await request(app)
                .post(`/api/v1/heatmaps/${platformOne._id}/heatmap-chart`)
                .set('Authorization', `Bearer ${userOneAccessToken}`)
                .send(requestBody)
                .expect(httpStatus.NOT_FOUND);
        })
    })

    describe('POST /api/v1/heatmaps/:platformId/line-graph', () => {
        beforeEach(async () => {
            await connection.dropDatabase();
        });
        test('should return 200 and line graph data if req data is ok', async () => {
            await insertCommunities([communityOne]);
            await insertUsers([userOne]);
            await insertPlatforms([platformOne]);
            await insertHeatmaps([heatmap3, heatmap4, heatmap5, heatmap6, heatmap7, heatmap8], connection);

            const res = await request(app)
                .post(`/api/v1/heatmaps/${platformOne._id}/line-graph`)
                .set('Authorization', `Bearer ${userOneAccessToken}`)
                .send({ startDate: new Date("2023-04-01"), endDate: new Date("2023-04-07") })
                .expect(httpStatus.OK);

            expect(res.body).toMatchObject({
                messages: 200,
                emojis: 100,
                msgPercentageChange: 100,
                emojiPercentageChange: 100
            });

            expect(res.body.categories).toEqual(['01 Apr', '02 Apr', '03 Apr', '04 Apr', '05 Apr', '06 Apr', '07 Apr']);
            expect(res.body.series[0].name).toBe('emojis');
            expect(res.body.series[1].name).toBe('messages');
            expect(res.body.series[0].data).toEqual([888, 0, 0, 0, 0, 0, 100]);
            expect(res.body.series[1].data).toEqual([777, 0, 0, 0, 0, 0, 200]);
        })

        test('should return 200 and line graph data (testing for empty data) if req data is ok', async () => {
            await insertCommunities([communityOne]);
            await insertUsers([userOne]);
            await insertPlatforms([platformOne]);

            const res = await request(app)
                .post(`/api/v1/heatmaps/${platformOne._id}/line-graph`)
                .set('Authorization', `Bearer ${userOneAccessToken}`)
                .send({ startDate: new Date("2021-02-21"), endDate: new Date("2022-02-24") })
                .expect(httpStatus.OK);

            expect(res.body).toMatchObject({
                emojis: 0,
                messages: 0,
                msgPercentageChange: 0,
                emojiPercentageChange: 0
            });
        })

        test('should return 401 if access token is missing', async () => {
            await request(app)
                .post(`/api/v1/heatmaps/${platformOne._id}/line-graph`)
                .send({ startDate: new Date(), endDate: new Date() })
                .expect(httpStatus.UNAUTHORIZED);
        })

        test('should return 404 if guild not found', async () => {
            await insertUsers([userOne]);
            await request(app)
                .post(`/api/v1/heatmaps/${platformOne._id}/line-graph`)
                .set('Authorization', `Bearer ${userOneAccessToken}`)
                .send({ startDate: new Date(), endDate: new Date() })
                .expect(httpStatus.NOT_FOUND);
        })
    })

});