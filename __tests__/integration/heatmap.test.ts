import request from 'supertest';
import httpStatus from 'http-status';
import app from '../../src/app';
import setupTestDB from '../utils/setupTestDB';
import { userOne, insertUsers } from '../fixtures/user.fixture';
import { userOneAccessToken } from '../fixtures/token.fixture';
import { heatmapOne, heatmapTwo, heatmapThree, heatmapFour, heatmapFive, heatmapSix, heatmapSeven, heatmapEight, heatmapNine, heatmapTen, heatmapEleven, heatmapTwelve, heatmapThirteen } from '../fixtures/heatmap.fixture';
import { guildOne, insertGuilds } from '../fixtures/guilds.fixture';
import { heatmapService, databaseService } from 'tc_dbcomm';
import config from '../../src/config';


setupTestDB();

describe('Heatmap routes', () => {
    const connection = databaseService.connectionFactory(guildOne.guildId, config.mongoose.botURL);
    describe('POST /api/v1/heatmaps/:guildId/heatmap-chart', () => {
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
            await insertUsers([userOne]);
            await insertGuilds([guildOne]);

            await heatmapService.createHeatMaps(connection, [heatmapOne, heatmapTwo, heatmapThirteen]);
            const res = await request(app)
                .post(`/api/v1/heatmaps/${guildOne.guildId}/heatmap-chart`)
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
            await insertUsers([userOne]);
            await insertGuilds([guildOne]);
            requestBody.timeZone = 'Asia/Tehran'; // +3:30 

            await heatmapService.createHeatMaps(connection, [heatmapOne, heatmapTwo, heatmapThirteen]);
            const res = await request(app)
                .post(`/api/v1/heatmaps/${guildOne.guildId}/heatmap-chart`)
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
            await insertUsers([userOne]);
            await insertGuilds([guildOne]);
            requestBody.timeZone = 'Brazil/East'; // -3:30 
            await heatmapService.createHeatMaps(connection, [heatmapOne, heatmapTwo, heatmapThirteen]);
            const res = await request(app)
                .post(`/api/v1/heatmaps/${guildOne.guildId}/heatmap-chart`)
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
            await insertUsers([userOne]);
            await insertGuilds([guildOne]);

            await heatmapService.createHeatMaps(connection, [heatmapOne, heatmapTwo, heatmapThirteen]);
            requestBody.startDate = new Date("2023-01-20");
            requestBody.endDate = new Date("2023-01-22");
            requestBody.channelIds = ["1012430565959553148"]
            const res = await request(app)
                .post(`/api/v1/heatmaps/${guildOne.guildId}/heatmap-chart`)
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
            await insertUsers([userOne]);
            await insertGuilds([guildOne]);

            await heatmapService.createHeatMaps(connection, [heatmapOne, heatmapTwo, heatmapThirteen]);
            requestBody.startDate = new Date("2023-01-20");
            requestBody.endDate = new Date("2023-01-22");
            requestBody.channelIds = []
            const res = await request(app)
                .post(`/api/v1/heatmaps/${guildOne.guildId}/heatmap-chart`)
                .set('Authorization', `Bearer ${userOneAccessToken}`)
                .send(requestBody)
                .expect(httpStatus.OK);

            expect(res.body.length).toBe(168);

            const valuePattern = expect.arrayContaining([expect.anything(), expect.anything(), 0]);
            expect(res.body).toEqual(expect.arrayContaining(Array(168).fill(valuePattern)));
        })

        test('should return 401 if access token is missing', async () => {
            await request(app)
                .post(`/api/v1/heatmaps/${guildOne.guildId}/heatmap-chart`)
                .send(requestBody)
                .expect(httpStatus.UNAUTHORIZED);
        })

        test('should return 404 if guild not found', async () => {
            await insertUsers([userOne]);
            await request(app)
                .post(`/api/v1/heatmaps/${guildOne.guildId}/heatmap-chart`)
                .set('Authorization', `Bearer ${userOneAccessToken}`)
                .send(requestBody)
                .expect(httpStatus.NOT_FOUND);
        })
    })

    describe('POST /api/v1/heatmaps/:guildId/line-graph', () => {
        beforeEach(async () => {
            await connection.dropDatabase();
        });
        test('should return 200 and line graph data for last seven days period if req data is ok', async () => {
            await insertUsers([userOne]);
            await insertGuilds([guildOne]);

            await heatmapService.createHeatMaps(connection, [heatmapThree, heatmapFour, heatmapTen]);
            const res = await request(app)
                .post(`/api/v1/heatmaps/${guildOne.guildId}/line-graph`)
                .set('Authorization', `Bearer ${userOneAccessToken}`)
                .send({ startDate: new Date("2023-04-01"), endDate: new Date("2023-04-07") })
                .expect(httpStatus.OK);

            expect(res.body).toMatchObject({
                messages: 0,
                emojis: 0,
                msgPercentageChange: 0,
                emojiPercentageChange: 0
            });
        })

        test('should return 200 and line graph data for one month period if req data is ok', async () => {
            await insertUsers([userOne]);
            await insertGuilds([guildOne]);

            await heatmapService.createHeatMaps(connection, [heatmapFive, heatmapSix]);
            const res = await request(app)
                .post(`/api/v1/heatmaps/${guildOne.guildId}/line-graph`)
                .set('Authorization', `Bearer ${userOneAccessToken}`)
                .send({ startDate: new Date("2023-02-28"), endDate: new Date("2023-03-31") })
                .expect(httpStatus.OK);

            expect(res.body).toMatchObject({
                messages: 6,
                emojis: 6,
                msgPercentageChange: 0,
                emojiPercentageChange: 0
            });
        })

        test('should return 200 and line graph data for three month period if req data is ok', async () => {
            await insertUsers([userOne]);
            await insertGuilds([guildOne]);

            await heatmapService.createHeatMaps(connection, [heatmapSeven, heatmapEight]);
            const res = await request(app)
                .post(`/api/v1/heatmaps/${guildOne.guildId}/line-graph`)
                .set('Authorization', `Bearer ${userOneAccessToken}`)
                .send({ startDate: new Date("2023-01-01"), endDate: new Date("2023-04-01") })
                .expect(httpStatus.OK);

            expect(res.body).toMatchObject({
                messages: 6,
                emojis: 6,
                msgPercentageChange: 200,
                emojiPercentageChange: 200
            });
        })

        test('should return 200 and line graph data for last six month period if req data is ok', async () => {
            await insertUsers([userOne]);
            await insertGuilds([guildOne]);

            await heatmapService.createHeatMaps(connection, [heatmapNine, heatmapTen]);
            const res = await request(app)
                .post(`/api/v1/heatmaps/${guildOne.guildId}/line-graph`)
                .set('Authorization', `Bearer ${userOneAccessToken}`)
                .send({ startDate: new Date("2023-01-01"), endDate: new Date("2023-07-01") })
                .expect(httpStatus.OK);

            expect(res.body).toMatchObject({
                messages: 6,
                emojis: 6,
                msgPercentageChange: 0,
                emojiPercentageChange: 0
            });
        })

        test('should return 200 and line graph data for last seven days period if req data is ok', async () => {
            await insertUsers([userOne]);
            await insertGuilds([guildOne]);

            await heatmapService.createHeatMaps(connection, [heatmapEleven, heatmapTwelve]);
            const res = await request(app)
                .post(`/api/v1/heatmaps/${guildOne.guildId}/line-graph`)
                .set('Authorization', `Bearer ${userOneAccessToken}`)
                .send({ startDate: new Date("2022-06-01"), endDate: new Date("2023-06-01") })
                .expect(httpStatus.OK);

            expect(res.body).toMatchObject({
                messages: 3,
                emojis: 3,
                msgPercentageChange: -50,
                emojiPercentageChange: -50
            });
        })

        test('should return 200 and line graph data (testing for empty data) if req data is ok', async () => {
            await insertUsers([userOne]);
            await insertGuilds([guildOne]);

            await heatmapService.createHeatMaps(connection, [heatmapThree]);
            const res = await request(app)
                .post(`/api/v1/heatmaps/${guildOne.guildId}/line-graph`)
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

        test('should return 200 and line graph data (testing for empty adjustedDate document) if req data is ok', async () => {
            await insertUsers([userOne]);
            await insertGuilds([guildOne]);

            await heatmapService.createHeatMaps(connection, [heatmapFive]);
            const res = await request(app)
                .post(`/api/v1/heatmaps/${guildOne.guildId}/line-graph`)
                .set('Authorization', `Bearer ${userOneAccessToken}`)
                .send({ startDate: new Date("2023-03-01"), endDate: new Date("2023-04-01") })
                .expect(httpStatus.OK);

            expect(res.body).toMatchObject({
                emojis: 6,
                messages: 6,
                msgPercentageChange: 0,
                emojiPercentageChange: 0
            });
        })

        test('should return 401 if access token is missing', async () => {
            await request(app)
                .post(`/api/v1/heatmaps/${guildOne.guildId}/line-graph`)
                .send({ startDate: new Date(), endDate: new Date() })
                .expect(httpStatus.UNAUTHORIZED);
        })

        test('should return 404 if guild not found', async () => {
            await insertUsers([userOne]);
            await request(app)
                .post(`/api/v1/heatmaps/${guildOne.guildId}/line-graph`)
                .set('Authorization', `Bearer ${userOneAccessToken}`)
                .send({ startDate: new Date(), endDate: new Date() })
                .expect(httpStatus.NOT_FOUND);
        })
    })

});