import request from 'supertest';
import httpStatus from 'http-status';
import moment from 'moment';
import app from '../../src/app';
import setupTestDB from '../utils/setupTestDB';
import { userOne, userTwo, insertUsers } from '../fixtures/user.fixture';
import { userOneAccessToken, userTwoAccessToken } from '../fixtures/token.fixture';
import { discordResponseGuildOne, guildOne, insertGuilds } from '../fixtures/guilds.fixture';
import { discordResponseChannelOne } from '../fixtures/channels.fixture';
import { IGuildUpdateBody } from '../../src/interfaces/guild.interface';
import { guildService } from '../../src/services';
import { Guild } from 'tc-dbcomm';
setupTestDB();

describe('Guild routes', () => {


    describe('GET /api/v1/guilds/:guildId/channels', () => {
        guildService.getGuildChannels = jest.fn().mockReturnValue([discordResponseChannelOne]);
        guildService.isBotAddedToGuild = jest.fn().mockReturnValue(true);
        test('should return 200 and array of channels of guild', async () => {
            await insertUsers([userOne]);
            const res = await request(app)
                .get(`/api/v1/guilds/${discordResponseGuildOne.id}/channels`)
                .set('Authorization', `Bearer ${userOneAccessToken}`)
                .send()
                .expect(httpStatus.OK);

            expect(res.body).toHaveLength(1);
            expect(res.body[0].name).toBe(discordResponseChannelOne.name);
        })
        test('should return 400 if bot is not added to guild', async () => {
            guildService.isBotAddedToGuild = jest.fn().mockReturnValue(false);
            await insertUsers([userOne]);
            await request(app)
                .get(`/api/v1/guilds/${discordResponseGuildOne.id}/channels`)
                .set('Authorization', `Bearer ${userOneAccessToken}`)
                .send()
                .expect(httpStatus.BAD_REQUEST);
        })
        test('should return 401 if access token is missing', async () => {
            await insertUsers([userOne]);
            await request(app)
                .get(`/api/v1/guilds/${discordResponseGuildOne.id}/channels`)
                .send()
                .expect(httpStatus.UNAUTHORIZED);
        })
        test('should return 401 if can not fetch guild channels', async () => {
            guildService.isBotAddedToGuild = jest.fn().mockReturnValue(true);
            await insertUsers([userOne]);
            await request(app)
                .get(`/api/v1/guilds/${discordResponseGuildOne.id}/channels`)
                .send()
                .expect(httpStatus.UNAUTHORIZED);

        })
    })



    describe('PATCH /api/v1/users/@me', () => {
        let updateBody: IGuildUpdateBody;

        beforeEach(() => {
            updateBody = {
                period: moment("2022-02-01 08:30:26.127Z").toDate(),
                selectedChannels: [
                    {
                        channelId: discordResponseChannelOne.id,
                        channelName: discordResponseChannelOne.name
                    }
                ]
            };
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

        test('should return 400 if guild not found', async () => {
            await insertUsers([userOne]);

            await request(app)
                .patch(`/api/v1/guilds/${guildOne.guildId}`)
                .set('Authorization', `Bearer ${userOneAccessToken}`)
                .send(updateBody)
                .expect(httpStatus.BAD_REQUEST);
        })

        test('should return 400 if another user want to update not owned guild', async () => {
            await insertUsers([userTwo]);

            await request(app)
                .patch(`/api/v1/guilds/${guildOne.guildId}`)
                .set('Authorization', `Bearer ${userTwoAccessToken}`)
                .send(updateBody)
                .expect(httpStatus.BAD_REQUEST);
        })

        test('should return 400 if period is invalid', async () => {
            await insertUsers([userOne]);
            const updateBody = { period: 10 };

            await request(app)
                .patch(`/api/v1/guilds/${guildOne.guildId}`)
                .set('Authorization', `Bearer ${userOneAccessToken}`)
                .send(updateBody)
                .expect(httpStatus.BAD_REQUEST);
        });

        test('should return 400 if selectedChannels is invalid', async () => {
            await insertUsers([userOne]);
            const updateBody = { selectedChannels: ':(' };

            await request(app)
                .patch(`/api/v1/guilds/${guildOne.guildId}`)
                .set('Authorization', `Bearer ${userOneAccessToken}`)
                .send(updateBody)
                .expect(httpStatus.BAD_REQUEST);
        });
    })

});